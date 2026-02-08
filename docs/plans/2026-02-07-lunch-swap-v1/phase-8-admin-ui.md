# Phase 8: Admin UI

---

## Task 21: Admin Panel Components

**Files:**
- Modify: `client/src/components/AdminView.tsx`
- Create: `client/src/components/AdminStats.tsx`
- Modify: `client/src/components/index.ts`

Replace the boilerplate `AdminView.tsx` with Lunch Swap admin functionality.

### AdminStats

Fetches `GET /api/admin/stats` on mount. Displays:
- Total food items in world
- Players started today
- Completions today
- Total pickups / drops / meal submissions

Uses SDK CSS classes: `card`, `card-details`, `card-title`, `p1`, `p2`.

Props: `stats: AdminStatsData | null`, `isLoading: boolean`

### AdminView (rewrite)

Panel conditionally rendered when `isAdmin && showAdminPanel` (gear icon toggle in PageContainer header).

Sections:
1. **Stats** — `AdminStats` component
2. **Actions**:
   - "Remove All Items" button (`btn-danger`) -> confirmation via existing `ConfirmationModal` -> `POST /api/admin/remove-all-items` -> toast with count removed -> refresh stats
   - "Spawn Items" button (`btn`) -> confirmation with optional count input (`input`, `label`, default 20) -> `POST /api/admin/spawn-items` -> toast with count spawned -> refresh stats

Each button disabled + spinner while request is in flight (`isSubmitting` local state).

**Step 1: Implement `AdminStats.tsx`**

**Step 2: Rewrite `AdminView.tsx`**

**Step 3: Commit**

```bash
git add client/src/components/AdminView.tsx client/src/components/AdminStats.tsx client/src/components/index.ts
git commit -m "feat: add admin panel with stats, remove-all, and spawn actions"
```
