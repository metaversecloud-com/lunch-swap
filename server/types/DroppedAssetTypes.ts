import { DroppedAssetInterface } from "@rtsdk/topia";
import { KeyAssetData, FoodItemAssetData } from "@shared/types/DataObjects.js";

export interface IDroppedAsset extends DroppedAssetInterface {
  dataObject: KeyAssetData | FoodItemAssetData;
}
