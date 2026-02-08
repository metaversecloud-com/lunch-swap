# Phase 6: Client Components — Core Game UI

Build the main game view components. Use SDK CSS classes as the base layer. All components must be accessible (WCAG 2.2 AA) and designed for ages 7-17.

---

## Task 12: `GameView` Container Component

**Files:**
- Create: `client/src/components/GameView.tsx`
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/components/index.ts`

**Step 1: Create `GameView.tsx`**

This is the main routing component that conditionally renders:
- `NewDayWelcome` when `isNewDay && !dismissed`
- `CompletionSummary` when `completedToday`
- `MainGameView` otherwise

Reads state from `GlobalStateContext`. Local state for `dismissed` (NewDayWelcome dismissal).

**Step 2: Update `Home.tsx`**

Replace boilerplate content with `<GameView />` inside `<PageContainer>`. The `useEffect` call to `/api/game-state` stays but dispatches the full game state.

**Step 3: Commit**

```bash
git add client/src/components/GameView.tsx client/src/pages/Home.tsx client/src/components/index.ts
git commit -m "feat: add GameView container with conditional rendering"
```

---

## Task 13: `NewDayWelcome` Component

**Files:**
- Create: `client/src/components/NewDayWelcome.tsx`
- Modify: `client/src/components/index.ts`

Shows: "New Day!" header, today's ideal meal preview (5 target items with food group colors), starting brown bag contents (8 items, matching item highlighted), "Let's Go!" button to dismiss.

Use SDK CSS classes: `container`, `h1`, `h2`, `p1`, `btn`. Food group color borders from `FOOD_GROUP_COLORS`. Accessible: heading hierarchy, button focus, reduced motion support.

Props: `onDismiss: () => void`

**Step 1: Implement component**

**Step 2: Commit**

```bash
git add client/src/components/NewDayWelcome.tsx client/src/components/index.ts
git commit -m "feat: add NewDayWelcome component"
```

---

## Task 14: `IdealMealTracker` Component

**Files:**
- Create: `client/src/components/IdealMealTracker.tsx`
- Modify: `client/src/components/index.ts`

5-slot horizontal display. Collected items: full color + checkmark. Missing items: grayscale/silhouette with food group color border (faded). Progress bar ("3/5 collected") with `aria-valuenow`/`aria-valuemax`. When all 5 collected: glow animation (respect `prefers-reduced-motion`).

Categories labeled: "Drink", "Main", "Fruit/Veggie/Snack" x3.

**Step 1: Implement component**

**Step 2: Commit**

```bash
git add client/src/components/IdealMealTracker.tsx client/src/components/index.ts
git commit -m "feat: add IdealMealTracker component"
```

---

## Task 15: `BrownBag` Component

**Files:**
- Create: `client/src/components/BrownBag.tsx`
- Create: `client/src/components/BagItemCard.tsx`
- Modify: `client/src/components/index.ts`

**BagItemCard**: Single bag slot. Food group colored border, rarity indicator (text label, not just color), ideal meal match glow (green pulse). Tappable — expands to show `NutritionPreview` + "Drop" button. Empty slot: dotted border outline.

Props: `item: BagItem | null`, `onDrop: (itemId: string) => void`, `expanded: boolean`, `onToggle: () => void`

**BrownBag**: 8-slot grid (bag capacity: 8). Maps bag items to `BagItemCard` components. Manages which card is expanded (only one at a time). Empty slots shown for positions < 8.

Props: `onDrop: (itemId: string) => void`

**Step 1: Implement `BagItemCard.tsx`**

**Step 2: Implement `BrownBag.tsx`**

**Step 3: Commit**

```bash
git add client/src/components/BrownBag.tsx client/src/components/BagItemCard.tsx client/src/components/index.ts
git commit -m "feat: add BrownBag and BagItemCard components"
```

---

## Task 16: `NearbyItems` Component

**Files:**
- Create: `client/src/components/NearbyItems.tsx`
- Create: `client/src/components/NearbyItemCard.tsx`
- Create: `client/src/components/AutoGrabToggle.tsx`
- Modify: `client/src/components/index.ts`

**AutoGrabToggle**: Magnet icon, "Auto-Grab" label, toggle switch. `aria-pressed` state. Toggles `autoGrabEnabled` in context.

**NearbyItemCard**: Single nearby item. Name, food group badge (color-coded), rarity badge (text), distance indicator, "Grab it!" button. Items matching ideal meal: highlighted border + star icon. `aria-label` includes all item info.

**NearbyItems**: Scrollable list. Polls `GET /api/nearby-items` every 3 seconds via `useEffect` + `setInterval`. Updates `nearbyItems` in context. Auto-Grab mode: when enabled and item appears nearby, auto-calls `POST /api/pickup-item` (pauses when bag full). Empty state: "No food nearby. Keep exploring!"

Props: `onPickup: (droppedAssetId: string) => void`, `onBagFull: (droppedAssetId: string) => void`

**Step 1: Implement `AutoGrabToggle.tsx`**

**Step 2: Implement `NearbyItemCard.tsx`**

**Step 3: Implement `NearbyItems.tsx`** (with polling logic)

**Step 4: Commit**

```bash
git add client/src/components/NearbyItems.tsx client/src/components/NearbyItemCard.tsx client/src/components/AutoGrabToggle.tsx client/src/components/index.ts
git commit -m "feat: add NearbyItems with polling, AutoGrabToggle, NearbyItemCard"
```

---

## Task 17: `NutritionPreview` Component

**Files:**
- Create: `client/src/components/NutritionPreview.tsx`
- Modify: `client/src/components/index.ts`

Health-bar style breakdown: 4 horizontal bars for protein, carbs, fiber, vitamins. Color-coded, proportional width. Simple and kid-friendly — no numbers, just visual bars with labels. "Did you know?" fact below the bars.

Accessible: each bar has `role="progressbar"`, `aria-valuenow`, `aria-valuemax`, `aria-label`.

Props: `itemId: string` (looks up nutrition from `FOOD_ITEMS_BY_ID`)

**Step 1: Implement component**

**Step 2: Commit**

```bash
git add client/src/components/NutritionPreview.tsx client/src/components/index.ts
git commit -m "feat: add NutritionPreview component"
```

---

## Task 18: `MainGameView` Component

**Files:**
- Create: `client/src/components/MainGameView.tsx`
- Modify: `client/src/components/index.ts`

Composes: `IdealMealTracker` + `BrownBag` + `NearbyItems` + Submit button. Handles drop/pickup callbacks, wires up state updates via `backendAPI` calls.

**Submit button**: Conditional render when all 5 ideal items collected. Glow animation when active (respect `prefers-reduced-motion`). Triggers `SubmitMealConfirmModal`.

Callback handlers:
- `handleDrop(itemId)` -> `POST /api/drop-item` -> update brownBag + idealMeal in context
- `handlePickup(droppedAssetId)` -> `POST /api/pickup-item` -> update brownBag + idealMeal in context
- `handleBagFull(droppedAssetId)` -> open `BagFullSwapModal`
- `handleSubmit()` -> open `SubmitMealConfirmModal`

**Step 1: Implement component**

**Step 2: Commit**

```bash
git add client/src/components/MainGameView.tsx client/src/components/index.ts
git commit -m "feat: add MainGameView composing all game sections"
```
