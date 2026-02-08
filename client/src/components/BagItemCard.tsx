import { BagItem, FOOD_GROUP_COLORS, RARITY_CONFIG } from "@shared/types/FoodItem";
import { NutritionPreview } from "@/components/NutritionPreview";

interface BagItemCardProps {
  item: BagItem | null;
  onDrop: (itemId: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export const BagItemCard = ({ item, onDrop, expanded, onToggle }: BagItemCardProps) => {
  if (!item) {
    return (
      <div
        className="flex items-center justify-center w-full h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 text-sm"
        aria-label="Empty bag slot"
      >
        Empty
      </div>
    );
  }

  const borderColor = FOOD_GROUP_COLORS[item.foodGroup];
  const rarityConfig = RARITY_CONFIG[item.rarity];

  return (
    <div
      className={`relative w-full rounded-xl border-2 transition-all duration-200 bg-white cursor-pointer
        ${item.matchesIdealMeal ? "shadow-lg ring-2 ring-green-400 motion-safe:animate-pulse" : "shadow-sm hover:shadow-md"}
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2`}
      style={{ borderColor }}
    >
      <button
        className="w-full text-left p-3 focus:outline-none"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${item.name} - ${item.foodGroup}, ${rarityConfig.label} rarity${item.matchesIdealMeal ? ", matches your ideal meal" : ""}. ${expanded ? "Collapse" : "Tap for details"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: borderColor }}
              aria-hidden="true"
            />
            <span className="font-semibold text-sm text-gray-800 truncate">{item.name}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {item.matchesIdealMeal && (
              <span className="text-green-500 text-base" aria-label="Matches ideal meal" role="img">
                &#9733;
              </span>
            )}
            <span
              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: rarityConfig.color }}
            >
              {rarityConfig.label}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-3 border-t border-gray-100 pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: borderColor }}
              aria-hidden="true"
            />
            <span className="capitalize">{item.foodGroup}</span>
          </div>

          <NutritionPreview itemId={item.itemId} />

          <button
            className="w-full py-2 px-4 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 min-h-[44px]"
            onClick={(e) => {
              e.stopPropagation();
              onDrop(item.itemId);
            }}
            aria-label={`Drop ${item.name} from your bag`}
          >
            Drop
          </button>
        </div>
      )}
    </div>
  );
};
