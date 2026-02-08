import { Request, Response } from "express";
import { errorHandler, getCredentials, Visitor, World } from "../../utils/index.js";

export const handleAdminRemoveAllItems = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId } = credentials;

    // Admin check
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    if (!(visitor as any).isAdmin) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    // Fetch all lunch-swap food items
    const world = World.create(urlSlug, { credentials });
    const foodAssets = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "lunch-swap-food",
      isPartial: true,
    });

    // Delete all
    let removedCount = 0;
    for (const asset of foodAssets) {
      try {
        await asset.deleteDroppedAsset();
        removedCount++;
      } catch {
        // Skip already-deleted items
      }
    }

    return res.json({
      success: true,
      removedCount,
      totalFound: foodAssets.length,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleAdminRemoveAllItems",
      message: "Error removing all items",
      req,
      res,
    });
  }
};
