import { Request, Response } from "express";
import { errorHandler, getCredentials, Visitor, World, User, Asset, DroppedAsset } from "../utils/index.js";
import { VISITOR_DATA_DEFAULTS } from "@shared/types/DataObjects.js";
import { FOOD_ITEMS_BY_ID } from "@shared/data/foodItems.js";
import { XP_ACTIONS } from "@shared/data/xpConfig.js";

export const handleDropItem = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId, profileId, displayName } = credentials;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Missing itemId" });
    }

    // 1. Fetch visitor data
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    await visitor.fetchDataObject();
    const visitorData = { ...VISITOR_DATA_DEFAULTS, ...visitor.dataObject };

    // 2. Find item in bag
    const bagIndex = visitorData.brownBag.findIndex((i: any) => i.itemId === itemId);
    if (bagIndex === -1) {
      return res.status(400).json({ success: false, message: "Item not found in bag" });
    }

    const droppedItem = visitorData.brownBag[bagIndex];

    // 3. Remove from bag
    const updatedBag = [...visitorData.brownBag];
    updatedBag.splice(bagIndex, 1);

    // 4. B1: Get visitor position via moveTo
    const posX = (visitor as any).moveTo?.x ?? 0;
    const posY = (visitor as any).moveTo?.y ?? 0;

    // 5. Create dropped asset near visitor position (small random offset)
    const offsetX = (Math.random() - 0.5) * 100;
    const offsetY = (Math.random() - 0.5) * 100;

    const asset = await Asset.create("webImageAsset", { credentials });
    const droppedAsset = await DroppedAsset.drop(asset, {
      position: {
        x: posX + offsetX,
        y: posY + offsetY,
      },
      // B2: uniqueName encoding
      uniqueName: `lunch-swap-food|${droppedItem.itemId}|${droppedItem.rarity}|${Date.now()}`,
      urlSlug,
      isInteractive: true,
      interactivePublicKey: credentials.interactivePublicKey,
    });

    // 6. Update visitor data
    await visitor.updateDataObject({ brownBag: updatedBag });

    // B12: Atomic counter increments
    if (visitor.incrementDataObjectValue) {
      await visitor.incrementDataObjectValue("dropsToday", 1);
    }

    // 7. Update user data
    const user = User.create({ credentials, profileId });
    if (user.incrementDataObjectValue) {
      await user.incrementDataObjectValue("totalDrops", 1);
    }

    // 8. XP for dropping
    const xpEarned = XP_ACTIONS.DROP;

    return res.json({
      success: true,
      brownBag: updatedBag,
      droppedItem,
      droppedAssetId: droppedAsset?.id || null,
      xpEarned,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleDropItem",
      message: "Error dropping item",
      req,
      res,
    });
  }
};
