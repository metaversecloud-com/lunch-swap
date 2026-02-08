import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset, Visitor, World, User, DroppedAsset, Asset } from "../utils/index.js";
import { generateIdealMeal, generateBrownBag, getCurrentDateMT, isNewDay } from "../utils/gameLogic/index.js";
import { VISITOR_DATA_DEFAULTS, WORLD_DATA_DEFAULTS, USER_DATA_DEFAULTS } from "@shared/types/DataObjects.js";
import { FOOD_ITEMS_BY_ID } from "@shared/data/foodItems.js";
import { BAG_CAPACITY } from "@shared/data/xpConfig.js";

export const handleGetGameState = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId, profileId } = credentials;

    // 1. Fetch key asset, visitor, world, user
    const droppedAsset = await getDroppedAsset(credentials);
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    const isAdmin = (visitor as any).isAdmin || false;
    const world = World.create(urlSlug, { credentials });
    const user = User.create({ credentials, profileId });

    // 2. Fetch data objects (initialize with defaults if empty)
    await visitor.fetchDataObject();
    const visitorData = { ...VISITOR_DATA_DEFAULTS, ...visitor.dataObject };

    await user.fetchDataObject();
    const userData = { ...USER_DATA_DEFAULTS, ...user.dataObject };

    await world.fetchDataObject();
    const worldData = { ...WORLD_DATA_DEFAULTS, ...world.dataObject };

    // 3. Check for new day
    const currentDate = getCurrentDateMT();
    const newDay = isNewDay(visitorData.lastPlayedDate, currentDate);

    let brownBag = visitorData.brownBag;
    let idealMeal = visitorData.idealMeal;
    let completedToday = visitorData.completedToday;

    if (newDay) {
      // B4: Auto-drop yesterday's bag items into world at key asset position
      if (visitorData.brownBag.length > 0) {
        for (const bagItem of visitorData.brownBag) {
          const foodDef = FOOD_ITEMS_BY_ID.get(bagItem.itemId);
          if (foodDef) {
            try {
              const offsetX = (Math.random() - 0.5) * 200;
              const offsetY = (Math.random() - 0.5) * 200;
              const asset = await Asset.create("webImageAsset", { credentials });
              await DroppedAsset.drop(asset, {
                position: {
                  x: (droppedAsset.position?.x ?? 0) + offsetX,
                  y: (droppedAsset.position?.y ?? 0) + offsetY,
                },
                uniqueName: `lunch-swap-food|${bagItem.itemId}|${bagItem.rarity}|${Date.now()}`,
                urlSlug,
                isInteractive: true,
                interactivePublicKey: credentials.interactivePublicKey,
              });
            } catch (err) {
              // Non-critical: log and continue
              console.warn("Failed to auto-drop bag item:", bagItem.itemId, err);
            }
          }
        }
      }

      // Generate new ideal meal and brown bag
      idealMeal = generateIdealMeal();
      brownBag = generateBrownBag(idealMeal);
      completedToday = false;

      // Update visitor data for new day
      const newVisitorData = {
        ...VISITOR_DATA_DEFAULTS,
        lastPlayedDate: currentDate,
        brownBag,
        idealMeal,
      };
      await visitor.setDataObject(newVisitorData);

      // Spawn items into world for this player (skip if already spawned today)
      const spawnedByPlayer = worldData.spawnedItemsByPlayer || {};
      if (!spawnedByPlayer[profileId]?.length) {
        // Spawn logic: create food items in world near key asset
        const itemsToSpawn = brownBag.filter(item => !item.matchesIdealMeal).slice(0, 3);
        const spawnedIds: string[] = [];
        for (const item of itemsToSpawn) {
          try {
            const offsetX = (Math.random() - 0.5) * (worldData.spawnRadiusMax || 2000);
            const offsetY = (Math.random() - 0.5) * (worldData.spawnRadiusMax || 2000);
            const asset = await Asset.create("webImageAsset", { credentials });
            await DroppedAsset.drop(asset, {
              position: {
                x: (droppedAsset.position?.x ?? 0) + offsetX,
                y: (droppedAsset.position?.y ?? 0) + offsetY,
              },
              uniqueName: `lunch-swap-food|${item.itemId}|${item.rarity}|${Date.now()}`,
              urlSlug,
              isInteractive: true,
              interactivePublicKey: credentials.interactivePublicKey,
            });
            spawnedIds.push(item.itemId);
          } catch (err) {
            console.warn("Failed to spawn item:", item.itemId, err);
          }
        }
        // Track spawned items
        await world.updateDataObject({
          spawnedItemsByPlayer: { ...spawnedByPlayer, [profileId]: spawnedIds },
          currentDate,
        });
      }

      // Increment world totalStartsToday
      if (world.incrementDataObjectValue) {
        await world.incrementDataObjectValue("totalStartsToday", 1);
      }
    }

    // B5: Calculate display streak
    let displayStreak = userData.currentStreak;
    if (userData.lastCompletionDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
      if (userData.lastCompletionDate < yesterdayStr) {
        displayStreak = 0; // Show 0 but don't write to user data
      }
    } else {
      displayStreak = 0;
    }

    // Build response
    return res.json({
      success: true,
      isNewDay: newDay,
      brownBag,
      idealMeal,
      completedToday,
      nutritionScore: visitorData.nutritionScore,
      superCombosFound: visitorData.superCombosFound || [],
      xp: userData.totalXp,
      level: userData.level,
      currentStreak: displayStreak,
      isAdmin,
      hasRewardToken: false, // TODO: check inventory when ecosystem is configured
      dailyBuff: (visitorData as any).dailyBuff || null,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetGameState",
      message: "Error getting game state",
      req,
      res,
    });
  }
};
