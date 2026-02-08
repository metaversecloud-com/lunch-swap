import { useContext, useEffect, useRef } from "react";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { SET_NEARBY_ITEMS } from "@/context/types";
import { backendAPI } from "@/utils";
import { NearbyItemCard } from "@/components/NearbyItemCard";

const POLL_INTERVAL_MS = 3000;

interface NearbyItemsProps {
  onPickup: (droppedAssetId: string) => void;
  bagFull?: boolean;
}

export const NearbyItems = ({ onPickup, bagFull = false }: NearbyItemsProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { nearbyItems } = useContext(GlobalStateContext);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchNearbyItems = async () => {
      try {
        const response = await backendAPI.get("/nearby-items");
        if (dispatch) {
          dispatch({
            type: SET_NEARBY_ITEMS,
            payload: { nearbyItems: response.data.nearbyItems },
          });
        }
      } catch {
        // Silently fail on polling — avoids spamming errors every 3s
      }
    };

    // Fetch immediately on mount
    fetchNearbyItems();

    // Set up polling interval
    intervalRef.current = setInterval(fetchNearbyItems, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch]);

  const items = nearbyItems ?? [];

  return (
    <section aria-label="Nearby food items">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800">Nearby Food</h2>
        {items.length > 0 && (
          <span className="text-sm font-medium text-gray-500">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-8 text-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50"
          role="status"
        >
          <span className="text-2xl mb-2" aria-hidden="true">&#128270;</span>
          <p className="text-sm font-medium text-gray-500">No food nearby. Keep exploring!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2" role="list" aria-label="List of nearby food items">
          {items.map((item) => (
            <div key={item.droppedAssetId} role="listitem">
              <NearbyItemCard
                item={item}
                onPickup={onPickup}
                disabled={bagFull}
              />
            </div>
          ))}
        </div>
      )}

      {bagFull && items.length > 0 && (
        <p className="text-xs text-center text-amber-600 font-medium mt-2" role="alert">
          Your bag is full! Drop an item to pick up more.
        </p>
      )}
    </section>
  );
};
