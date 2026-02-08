import { Request, Response } from "express";
import { errorHandler, getCredentials, Visitor, World, User, DroppedAsset } from "../utils/index.js";
import { VISITOR_DATA_DEFAULTS } from "@shared/types/DataObjects.js";
import { FOOD_ITEMS_BY_ID } from "@shared/data/foodItems.js";
import { BAG_CAPACITY, BAG_CAPACITY_POST_COMPLETION, XP_ACTIONS } from "@shared/data/xpConfig.js";
import { RARITY_CONFIG, Rarity, BagItem } from "@shared/types/FoodItem.js";

export const handlePickupItem = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId, profileId } = credentials;
    const { droppedAssetId } = req.body;

    if (!droppedAssetId) {
      return res.status(400).json({ success: false, message: "Missing droppedAssetId" });
    }

    // 1. Fetch the food asset
    const foodAsset = await DroppedAsset.get(droppedAssetId, urlSlug, { credentials });
    if (!foodAsset) {
      return res.status(409).json({ success: false, message: "This item was already picked up" });
    }

    // Fetch data object for additional metadata
    try {
      await foodAsset.fetchDataObject();
    } catch {
      return res.status(409).json({ success: false, message: "This item was already picked up" });
    }

    // Parse uniqueName for item metadata (pattern: lunch-swap-food|{itemId}|{rarity}|{timestamp}|{mystery})
    const parts = ((foodAsset as any).uniqueName || "").split("|");
    let itemId = "";
    let rarity: Rarity = "common";
    const dataObj = foodAsset.dataObject as Record<string, any> | null | undefined;
    if (parts.length >= 3) {
      itemId = parts[1];
      rarity = parts[2] as Rarity;
    } else if (dataObj?.itemId) {
      itemId = dataObj.itemId;
      rarity = dataObj.rarity || "common";
    }

    // Parse mystery flag from 5th segment (backward-compatible: default to "0")
    const mysteryFlag = parts.length >= 5 ? parts[4] : "0";
    const wasMystery = mysteryFlag === "1";

    const foodDef = FOOD_ITEMS_BY_ID.get(itemId);
    if (!foodDef) {
      return res.status(400).json({ success: false, message: "Unknown food item" });
    }

    // 2. Fetch visitor data
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    await visitor.fetchDataObject();
    const visitorData = { ...VISITOR_DATA_DEFAULTS, ...visitor.dataObject };

    // 3. Check bag capacity (B13: dynamic message, D1: 8 pre-completion, 3 post-completion)
    const maxCapacity = visitorData.completedToday ? BAG_CAPACITY_POST_COMPLETION : BAG_CAPACITY;
    if (visitorData.brownBag.length >= maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Bag is full (${visitorData.brownBag.length}/${maxCapacity})`,
      });
    }

    // 4. Delete the dropped asset from world (race condition guard)
    try {
      await foodAsset.deleteDroppedAsset();
    } catch {
      return res.status(409).json({ success: false, message: "This item was already picked up" });
    }

    // 5. Check if item matches ideal meal
    const idealItemIds = new Set(visitorData.idealMeal?.map((i: any) => i.itemId) || []);
    const matchesIdealMeal = idealItemIds.has(itemId);

    // 6. Add item to bag
    const newBagItem: BagItem = {
      itemId: foodDef.itemId,
      name: foodDef.name,
      foodGroup: foodDef.foodGroup,
      rarity: foodDef.rarity,
      matchesIdealMeal,
    };

    const updatedBag = [...visitorData.brownBag, newBagItem];

    // Update ideal meal collected status
    const updatedIdealMeal = visitorData.idealMeal.map((item: any) => ({
      ...item,
      collected: item.collected || item.itemId === itemId,
    }));

    // 7. Hot streak logic
    let xpMultiplier = 1;
    const currentIdealStreak = visitorData.idealPickupStreak || 0;
    const wasHotStreak = visitorData.hotStreakActive || false;

    if (wasHotStreak) {
      xpMultiplier = 3;
      // Reset hot streak after consuming it
      await visitor.updateDataObject({
        brownBag: updatedBag,
        idealMeal: updatedIdealMeal,
        hotStreakActive: false,
        idealPickupStreak: 0,
      });
    } else if (matchesIdealMeal) {
      const newStreak = currentIdealStreak + 1;
      const hotStreakActivated = newStreak >= 3;
      await visitor.updateDataObject({
        brownBag: updatedBag,
        idealMeal: updatedIdealMeal,
        idealPickupStreak: newStreak,
        hotStreakActive: hotStreakActivated,
      });
      if (hotStreakActivated) {
        // Fire "HOT STREAK!" toast
        const world2 = World.create(urlSlug, { credentials });
        world2.fireToast?.({
          title: "HOT STREAK!",
          text: "Your next pickup gets 3x XP!",
        }).catch(() => {});
      }
    } else {
      await visitor.updateDataObject({
        brownBag: updatedBag,
        idealMeal: updatedIdealMeal,
        idealPickupStreak: 0,
      });
    }

    // B12: Atomic counter increment for pickupsToday
    if (visitor.incrementDataObjectValue) {
      await visitor.incrementDataObjectValue("pickupsToday", 1);
    }

    // 8. Update user data (atomic increment for totalPickups)
    const user = User.create({ credentials, profileId });
    if (user.incrementDataObjectValue) {
      await user.incrementDataObjectValue("totalPickups", 1);
    }

    // 9. Calculate XP earned (with hot streak multiplier)
    const rarityConfig = RARITY_CONFIG[foodDef.rarity] || RARITY_CONFIG.common;
    let xpEarned = Math.round(XP_ACTIONS.PICKUP * rarityConfig.xpMultiplier);
    if (matchesIdealMeal) {
      xpEarned += XP_ACTIONS.COLLECT_IDEAL_ITEM;
    }
    xpEarned = Math.round(xpEarned * xpMultiplier);

    // 10. Fire toast with fun fact
    const world = World.create(urlSlug, { credentials });
    world.fireToast?.({
      title: matchesIdealMeal ? "Great find!" : `Picked up ${foodDef.name}!`,
      text: foodDef.funFact,
    }).catch(() => {});

    return res.json({
      success: true,
      brownBag: updatedBag,
      idealMeal: updatedIdealMeal,
      pickedUpItem: newBagItem,
      matchesIdealMeal,
      xpEarned,
      funFact: foodDef.funFact,
      wasMystery,
      hotStreakActive: wasHotStreak ? false : (matchesIdealMeal && (currentIdealStreak + 1) >= 3),
      idealPickupStreak: wasHotStreak ? 0 : (matchesIdealMeal ? currentIdealStreak + 1 : 0),
      xpMultiplier,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handlePickupItem",
      message: "Error picking up item",
      req,
      res,
    });
  }
};
