import { NearbyItem } from "@shared/types/NearbyItem";
import { FOOD_GROUP_COLORS, RARITY_CONFIG } from "@shared/types/FoodItem";

interface NearbyItemCardProps {
  item: NearbyItem;
  onPickup: (droppedAssetId: string) => void;
  disabled?: boolean;
}

const formatDistance = (distance: number): string => {
  if (distance < 1) return "Right here!";
  if (distance < 3) return "Very close";
  if (distance < 6) return "Nearby";
  return "A bit far";
};

export const NearbyItemCard = ({ item, onPickup, disabled = false }: NearbyItemCardProps) => {
  const borderColor = FOOD_GROUP_COLORS[item.foodGroup];
  const rarityConfig = RARITY_CONFIG[item.rarity];
  const displayName = item.isMystery ? "???" : item.name;

  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 bg-white transition-all duration-200
        ${item.matchesIdealMeal && !item.isMystery ? "shadow-md ring-2 ring-yellow-400" : "shadow-sm"}
        ${disabled ? "opacity-60" : "hover:shadow-md"}`}
      style={{ borderColor: item.isMystery ? "#6B7280" : borderColor }}
      aria-label={`${displayName}${item.matchesIdealMeal && !item.isMystery ? ", matches your ideal meal" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {item.matchesIdealMeal && !item.isMystery && (
            <span className="text-yellow-500 text-sm" aria-label="Matches ideal meal" role="img">
              &#9733;
            </span>
          )}
          <span className={`font-bold text-sm truncate ${item.isMystery ? "italic text-gray-500" : "text-gray-800"}`}>
            {displayName}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!item.isMystery && (
            <span
              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: borderColor }}
            >
              {item.foodGroup}
            </span>
          )}
          <span
            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: item.isMystery ? "#6B7280" : rarityConfig.color }}
          >
            {item.isMystery ? "Mystery" : rarityConfig.label}
          </span>
          <span className="text-[10px] text-gray-400">{formatDistance(item.distance)}</span>
        </div>

        {item.lastDroppedByName && !item.isMystery && (
          <p className="text-[10px] text-gray-400 mt-1 truncate">
            Dropped by {item.lastDroppedByName}
          </p>
        )}
      </div>

      <button
        className={`flex-shrink-0 py-2 px-4 rounded-lg text-sm font-bold text-white transition-colors min-h-[44px] min-w-[44px]
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${disabled
            ? "bg-gray-400 cursor-not-allowed focus:ring-gray-300"
            : "bg-green-500 hover:bg-green-600 active:bg-green-700 focus:ring-green-400"
          }`}
        onClick={() => onPickup(item.droppedAssetId)}
        disabled={disabled}
        aria-label={`Pick up ${displayName}`}
      >
        {item.isMystery ? "?" : "Grab it!"}
      </button>
    </div>
  );
};
