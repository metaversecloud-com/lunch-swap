export interface AdminStatsData {
  totalFoodItems: number;
  totalPlayersToday: number;
  totalCompletionsToday: number;
  totalPickups: number;
  totalDrops: number;
  totalMealSubmissions: number;
}

interface AdminStatsProps {
  stats: AdminStatsData | null;
  isLoading: boolean;
}

const statLabels: { key: keyof AdminStatsData; label: string }[] = [
  { key: "totalFoodItems", label: "Food Items" },
  { key: "totalPlayersToday", label: "Players Today" },
  { key: "totalCompletionsToday", label: "Completions Today" },
  { key: "totalPickups", label: "Total Pickups" },
  { key: "totalDrops", label: "Total Drops" },
  { key: "totalMealSubmissions", label: "Meal Submissions" },
];

const SkeletonCard = () => (
  <div
    className="rounded-lg bg-gray-100 p-3 animate-pulse"
    role="status"
    aria-label="Loading statistic"
  >
    <div className="h-3 w-20 bg-gray-300 rounded mb-2" />
    <div className="h-6 w-12 bg-gray-300 rounded" />
  </div>
);

export const AdminStats = ({ stats, isLoading }: AdminStatsProps) => {
  if (isLoading) {
    return (
      <section aria-label="Game statistics loading">
        <h2 className="h2 mb-3">Game Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          {statLabels.map(({ key }) => (
            <SkeletonCard key={key} />
          ))}
        </div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section aria-label="Game statistics unavailable">
        <h2 className="h2 mb-3">Game Stats</h2>
        <p className="p2 text-gray-500">Unable to load stats.</p>
      </section>
    );
  }

  return (
    <section aria-label="Game statistics">
      <h2 className="h2 mb-3">Game Stats</h2>
      <div className="grid grid-cols-2 gap-3">
        {statLabels.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-lg bg-gray-50 border border-gray-200 p-3"
          >
            <p className="p2 text-gray-600 text-xs mb-1">{label}</p>
            <p className="p1 text-lg font-bold" aria-label={`${label}: ${stats[key]}`}>
              {stats[key].toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminStats;
