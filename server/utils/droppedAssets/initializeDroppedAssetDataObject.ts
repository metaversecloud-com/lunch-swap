import { IDroppedAsset } from "../../types/DroppedAssetTypes.js";
import { KEY_ASSET_DATA_DEFAULTS } from "@shared/types/DataObjects.js";
import { standardizeError } from "../standardizeError.js";

export const initializeDroppedAssetDataObject = async (droppedAsset: IDroppedAsset) => {
  try {
    if (!droppedAsset?.dataObject?.initialized) {
      const lockId = `${droppedAsset.id}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
      await droppedAsset
        .setDataObject({ ...KEY_ASSET_DATA_DEFAULTS, initialized: true }, { lock: { lockId, releaseLock: true } })
        .catch(() => console.warn("Unable to acquire lock, another process may be updating the data object"));
    }
    return;
  } catch (error: any) {
    return standardizeError(error);
  }
};
