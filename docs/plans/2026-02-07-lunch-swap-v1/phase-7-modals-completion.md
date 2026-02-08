# Phase 7: Client Components — Modals & Completion

---

## Task 19: Game Modals

**Files:**
- Create: `client/src/components/BagFullSwapModal.tsx`
- Create: `client/src/components/DropConfirmModal.tsx`
- Create: `client/src/components/SubmitMealConfirmModal.tsx`
- Modify: `client/src/components/index.ts`

These can leverage the existing `ConfirmationModal.tsx` as a base or build custom modal UI. All modals must: trap focus, close on Escape, have proper ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).

### BagFullSwapModal

Shows current 5 bag items as tappable cards (food group colored). Header: "Bag is full!" Prompt: "Choose an item to drop, or cancel."

Flow:
1. User taps item to drop -> item highlights red
2. "Confirm swap?" prompt appears
3. On confirm: calls `POST /api/swap-item` with `dropItemId` + `pickupDroppedAssetId`
4. On success: both particle effects, bag updates, modal closes
5. Cancel: close modal, food item remains in world

Props: `pickupDroppedAssetId: string`, `onComplete: (response) => void`, `onClose: () => void`

### DropConfirmModal

Item image + name + "Drop this item into the world?" prompt. Warning callout if item matches ideal meal: "This item is part of your ideal meal!"

Props: `itemId: string`, `matchesIdealMeal: boolean`, `onConfirm: () => void`, `onClose: () => void`

### SubmitMealConfirmModal

Preview of the 5 ideal meal items collected (food group colored cards). "Submit your meal?" prompt. Note: "Remaining items in your bag will be dropped into the world for others."

Props: `onConfirm: () => void`, `onClose: () => void`

SDK CSS classes: `btn`, `btn-outline`, `btn-danger`, `h2`, `p1`, `card`

**Step 1: Implement all 3 modals**

**Step 2: Commit**

```bash
git add client/src/components/BagFullSwapModal.tsx client/src/components/DropConfirmModal.tsx client/src/components/SubmitMealConfirmModal.tsx client/src/components/index.ts
git commit -m "feat: add game modals (swap, drop confirm, submit confirm)"
```

---

## Task 20: `CompletionSummary` Component

**Files:**
- Create: `client/src/components/CompletionSummary.tsx`
- Create: `client/src/components/NutritionScoreDisplay.tsx`
- Create: `client/src/components/XpBreakdown.tsx`
- Create: `client/src/components/StreakCounter.tsx`
- Modify: `client/src/components/index.ts`

### NutritionScoreDisplay

Large score number (0-100) centered with circular SVG progress ring. 4-quadrant breakdown below: protein (0-25), fiber (0-25), vitamin diversity (0-25), balance (0-25). Each quadrant labeled, colored, and has a mini progress bar. Letter grade overlay (A+: 90+, A: 80+, B+: 70+, B: 60+, C+: 50+, C: <50). Super Combo callouts with item pair names.

Accessible: score announced via `aria-label`, quadrants via `role="progressbar"`.

### XpBreakdown

Itemized XP list showing how points were earned:
- Base completion: +100 XP
- Rarity bonuses: +X per rare/epic item
- Nutrition bonus: +50 (if score > 80)
- Super Combos: +30 each
- Streak bonus: +X (streakDay * 10, capped 100)
- **Total: X XP**

### StreakCounter

Current streak count with flame/fire icon (CSS, no library). Number animates on mount. Shows "New record!" badge if `currentStreak > longestStreak`.

### CompletionSummary

Composes: `NutritionScoreDisplay` + `XpBreakdown` + `StreakCounter` + any new badges. Header: "Meal Complete!" Footer: "Done for today! Come back tomorrow for a new meal."

Shown when `completedToday === true` (both after submission and on rejoin).

**Step 1: Implement all components**

**Step 2: Commit**

```bash
git add client/src/components/CompletionSummary.tsx client/src/components/NutritionScoreDisplay.tsx client/src/components/XpBreakdown.tsx client/src/components/StreakCounter.tsx client/src/components/index.ts
git commit -m "feat: add CompletionSummary with nutrition score, XP breakdown, and streak"
```
