import { useCallback, useContext, useEffect, useState } from "react";

// components
import { ConfirmationModal } from "@/components";
import { AdminStats, AdminStatsData } from "@/components/AdminStats";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

type ActionStatus = {
  type: "success" | "error";
  message: string;
} | null;

export const AdminView = () => {
  const dispatch = useContext(GlobalDispatchContext);

  // Stats
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Action loading states
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSpawning, setIsSpawning] = useState(false);

  // Confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Spawn input
  const [showSpawnInput, setShowSpawnInput] = useState(false);
  const [spawnCount, setSpawnCount] = useState(20);

  // Status message
  const [actionStatus, setActionStatus] = useState<ActionStatus>(null);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const { data } = await backendAPI.get("/admin/stats");
      if (data.success) {
        setStats({
          totalFoodItems: data.totalFoodItems,
          totalPlayersToday: data.totalPlayersToday,
          totalCompletionsToday: data.totalCompletionsToday,
          totalPickups: data.totalPickups,
          totalDrops: data.totalDrops,
          totalMealSubmissions: data.totalMealSubmissions,
        });
      }
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
      setStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleToggleShowConfirmationModal = () => {
    setShowConfirmationModal((prev) => !prev);
  };

  const handleRemoveAllItems = async () => {
    setIsRemoving(true);
    setActionStatus(null);
    try {
      const { data } = await backendAPI.post("/admin/remove-all-items");
      if (data.success) {
        setActionStatus({
          type: "success",
          message: `Removed ${data.removedCount} item${data.removedCount !== 1 ? "s" : ""}.`,
        });
        await fetchStats();
      }
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
      setActionStatus({
        type: "error",
        message: "Failed to remove items. Please try again.",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSpawnItems = async () => {
    setIsSpawning(true);
    setActionStatus(null);
    try {
      const { data } = await backendAPI.post("/admin/spawn-items", { count: spawnCount });
      if (data.success) {
        setActionStatus({
          type: "success",
          message: `Spawned ${data.spawnedCount} item${data.spawnedCount !== 1 ? "s" : ""}.`,
        });
        setShowSpawnInput(false);
        await fetchStats();
      }
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
      setActionStatus({
        type: "error",
        message: "Failed to spawn items. Please try again.",
      });
    } finally {
      setIsSpawning(false);
    }
  };

  const areButtonsDisabled = isRemoving || isSpawning;

  return (
    <div className="p-4 flex flex-col gap-6 pb-24">
      {/* Stats Section */}
      <AdminStats stats={stats} isLoading={isLoadingStats} />

      {/* Actions Section */}
      <section aria-label="Admin actions">
        <h2 className="h2 mb-3">Actions</h2>

        {/* Status message */}
        {actionStatus && (
          <div
            role="alert"
            className={`mb-3 rounded-lg p-3 text-sm ${
              actionStatus.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {actionStatus.message}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Spawn Items */}
          {!showSpawnInput ? (
            <button
              className="btn"
              disabled={areButtonsDisabled}
              onClick={() => setShowSpawnInput(true)}
              aria-label="Spawn food items into the world"
            >
              Spawn Items
            </button>
          ) : (
            <div className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
              <label htmlFor="spawn-count" className="label text-sm font-medium">
                Number of items to spawn
              </label>
              <input
                id="spawn-count"
                type="number"
                className="input"
                min={1}
                max={50}
                value={spawnCount}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(50, Number(e.target.value)));
                  setSpawnCount(val);
                }}
                disabled={isSpawning}
                aria-describedby="spawn-count-hint"
              />
              <p id="spawn-count-hint" className="p2 text-xs text-gray-500">
                Min 1, max 50
              </p>
              <div className="flex gap-2">
                <button
                  className="btn flex-1 flex items-center justify-center gap-2"
                  disabled={areButtonsDisabled}
                  onClick={handleSpawnItems}
                  aria-label={`Spawn ${spawnCount} food items`}
                >
                  {isSpawning && (
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {isSpawning ? "Spawning..." : `Spawn ${spawnCount} Items`}
                </button>
                <button
                  className="btn btn-outline"
                  disabled={isSpawning}
                  onClick={() => setShowSpawnInput(false)}
                  aria-label="Cancel spawn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Remove All Items */}
          <button
            className="btn btn-danger flex items-center justify-center gap-2"
            disabled={areButtonsDisabled}
            onClick={handleToggleShowConfirmationModal}
            aria-label="Remove all food items from the world"
          >
            {isRemoving && (
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {isRemoving ? "Removing..." : "Remove All Items"}
          </button>
        </div>
      </section>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <ConfirmationModal
          title="Remove All Food Items"
          message="Are you sure you want to remove all food items from the world? This action cannot be undone."
          handleOnConfirm={handleRemoveAllItems}
          handleToggleShowConfirmationModal={handleToggleShowConfirmationModal}
        />
      )}
    </div>
  );
};

export default AdminView;
