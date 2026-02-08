import { useContext } from "react";
import { GlobalStateContext } from "@/context/GlobalContext";
import { FOOD_GROUP_COLORS, RARITY_CONFIG } from "@shared/types/FoodItem";

interface NewDayWelcomeProps {
  onDismiss: () => void;
}

export const NewDayWelcome = ({ onDismiss }: NewDayWelcomeProps) => {
  const { idealMeal, brownBag, currentStreak, level } = useContext(GlobalStateContext);

  const items = idealMeal ?? [];
  const bagItems = brownBag ?? [];

  return (
    <div className="flex flex-col items-center gap-6 py-4" role="region" aria-label="New day welcome">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-1">New Day!</h1>
        <p className="text-sm text-gray-500">
          {currentStreak && currentStreak > 1
            ? `Day ${currentStreak} streak! Level ${level ?? 1}`
            : `Level ${level ?? 1} - Let's go!`}
        </p>
      </div>

      {/* Ideal meal preview */}
      <div className="w-full">
        <h2 className="text-base font-bold text-gray-700 mb-3 text-center">
          Today's Target Meal
        </h2>
        <div className="flex gap-2" role="list" aria-label="Today's ideal meal targets">
          {items.map((item) => {
            const borderColor = FOOD_GROUP_COLORS[item.foodGroup];
            const rarityConfig = RARITY_CONFIG[item.rarity];

            return (
              <div
                key={item.itemId}
                role="listitem"
                className="flex-1 min-w-0 rounded-xl border-3 bg-white shadow-sm p-2 text-center"
                style={{ borderColor, borderWidth: "3px" }}
                aria-label={`${item.name} - ${item.foodGroup}, ${rarityConfig.label} rarity`}
              >
                <div
                  className="w-6 h-6 rounded-full mx-auto mb-1.5"
                  style={{ backgroundColor: borderColor }}
                  aria-hidden="true"
                />
                <p className="text-xs font-bold text-gray-800 leading-tight truncate">
                  {item.name}
                </p>
                <p className="text-[9px] capitalize text-gray-500 mt-0.5">
                  {item.foodGroup}
                </p>
                <p
                  className="text-[9px] font-bold uppercase mt-0.5"
                  style={{ color: rarityConfig.color }}
                >
                  {rarityConfig.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Starting brown bag */}
      {bagItems.length > 0 && (
        <div className="w-full">
          <h2 className="text-base font-bold text-gray-700 mb-2 text-center">
            Your Starting Bag
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {bagItems.map((item) => {
              const borderColor = FOOD_GROUP_COLORS[item.foodGroup];
              return (
                <span
                  key={item.itemId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 bg-white text-xs font-semibold text-gray-700"
                  style={{ borderColor }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: borderColor }}
                    aria-hidden="true"
                  />
                  {item.name}
                  {item.matchesIdealMeal && (
                    <span className="text-green-500" aria-label="matches ideal meal">
                      &#9733;
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Let's Go button */}
      <button
        className="w-full max-w-xs py-3 px-6 rounded-2xl text-lg font-extrabold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:from-green-700 active:to-emerald-800 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 min-h-[44px]"
        onClick={onDismiss}
        aria-label="Dismiss welcome screen and start playing"
      >
        Let's Go!
      </button>
    </div>
  );
};
