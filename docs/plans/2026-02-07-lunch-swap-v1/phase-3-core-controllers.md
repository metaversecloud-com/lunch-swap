# Phase 3: Core Server Controllers

Build the game-state, pickup, drop, swap, and submit-meal controllers.

---

## Task 4: Rewrite `handleGetGameState` Controller

**Files:**
- Modify: `server/controllers/handleGetGameState.ts`
- Modify: `server/tests/routes.test.ts`

This is the most complex controller. It handles: new day detection, daily reset, ideal meal + brown bag generation, item spawning, resume, completion check, and streak updates.

**Step 1: Write the failing test**

Add to `server/tests/routes.test.ts` — new describe block for the updated game-state route. Mock the game logic utilities and SDK calls. Test scenarios:
- New day: returns `isNewDay: true`, generates bag + meal, spawns items
- Resume: returns existing state, `isNewDay: false`
- Completed today: returns completion data
- Verifies visitor data object is updated on new day

**Step 2: Run tests to verify they fail**

Run: `cd server && npm test -- --testPathPattern=routes`
Expected: FAIL — new test expectations don't match boilerplate controller.

**Step 3: Rewrite `handleGetGameState.ts`**

Replace the boilerplate controller with the full game-state logic:
1. Get credentials, fetch dropped asset (key asset), get visitor
2. Accept optional `clickedFoodAssetId` query param (D2: food items are clickable in world). If present, check if it matches a food item by fetching the asset and checking `uniqueName` starts with `lunch-swap-food`. If yes, include `clickedItem` details in response for pickup prompt. If no, treat as key asset click.
3. Fetch visitor data object (initialize with defaults if empty)
4. Check `isNewDay` comparing `lastPlayedDate` vs `getCurrentDateMT()`
5. If new day:
   a. Auto-drop all items from yesterday's bag into the world at key asset position (B4)
   b. Generate ideal meal, generate brown bag, reset daily counters
   c. Spawn items into world
   d. Update streak on User data object using detailed streak logic (B5):
      - If `lastCompletionDate === yesterday` → streak continues (don't increment yet — that happens at submit)
      - If `lastCompletionDate < yesterday - 1` or empty → streak will start fresh on next completion
      - Display streak: if `lastCompletionDate < yesterday`, show streak as 0 in response but DON'T write 0 to User data (player might still complete today)
6. If same day: return existing state
7. If completed: return completion summary
8. Fetch nearby items and include as `nearbyItems[]` in response (D7: client renders immediately without waiting for first poll)
9. Include `hasRewardToken` (check inventory) and `dailyBuff` (from visitor data) in response
10. Return `GameState` response (with `clickedItem` if applicable)

Follow the controller template from `CLAUDE.md`. Remove the leaderboard POST and boilerplate toast.

**Step 4: Run tests to verify they pass**

Run: `cd server && npm test`
Expected: All PASS.

**Step 5: Commit**

```bash
git add server/controllers/handleGetGameState.ts server/tests/routes.test.ts
git commit -m "feat: rewrite handleGetGameState with daily reset, meal generation, and spawning"
```

---

## Task 5: `handleGetNearbyItems` Controller

**Files:**
- Create: `server/controllers/handleGetNearbyItems.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts`
- Test: `server/tests/nearby-items.test.ts`

**Step 1: Write the failing test**

```typescript
// server/tests/nearby-items.test.ts
// Test: returns nearby items sorted by distance
// Test: filters out expired items (>24h since lastDroppedDateTime)
// Test: marks items that match ideal meal
// Test: returns 200 with empty array if no items nearby
```

**Step 2: Run test to verify it fails**

**Step 3: Implement `handleGetNearbyItems.ts`**

1. Get credentials, get visitor, fetch visitor data object (ideal meal)
2. Get visitor position via `visitor.moveTo.x` and `visitor.moveTo.y` (B1: NOT `visitor.position`)
3. Fetch all food items: `world.fetchDroppedAssetsWithUniqueName("lunch-swap-food")` with `isPartial: true`
4. Parse `uniqueName` for metadata (`lunch-swap-food|{itemId}|{rarity}|{timestamp}`) — do NOT call `fetchDataObject()` per item (B3: O(1) not O(N) per poll)
5. Check 24h TTL by parsing `timestamp` from `uniqueName`, delete expired items
6. Look up item `name` and `foodGroup` from `FOOD_ITEMS_BY_ID` using `itemId` from `uniqueName` (B3)
7. Calculate distance from visitor `moveTo` coordinates
8. Filter to items within `proximityRadius` (from world data object)
9. Sort by distance ascending
10. Flag `matchesIdealMeal` for each item
11. Return `NearbyItem[]`

**Step 4: Add route and export**

Add `router.get("/nearby-items", handleGetNearbyItems);` to routes.ts.
Add export in `server/controllers/index.ts`.

**Step 5: Run tests to verify they pass**

**Step 6: Commit**

```bash
git add server/controllers/handleGetNearbyItems.ts server/controllers/index.ts server/routes.ts server/tests/nearby-items.test.ts
git commit -m "feat: add GET /api/nearby-items controller"
```

---

## Task 6: `handlePickupItem` Controller

**Files:**
- Create: `server/controllers/handlePickupItem.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts`
- Test: `server/tests/pickup-item.test.ts`

**Step 1: Write failing tests**

Test scenarios:
- Successful pickup: item removed from world, added to bag, returns updated bag + fun fact + XP
- Bag full before completion (8 items): returns 400 with "Bag is full (8/8)"
- Bag full after completion (3 items): returns 400 with "Bag is full (3/3)" (B13)
- Item already gone (409 conflict)
- Item matches ideal meal: returns `matchesIdealMeal: true`
- XP includes rarity multiplier

**Step 2: Run test to verify fail**

**Step 3: Implement `handlePickupItem.ts`**

1. Get credentials, validate `req.body.droppedAssetId`
2. Lock the food asset (time-bucketed lockId)
3. Fetch food asset data object — if asset gone, return 409
4. Fetch visitor data object — check bag size against dynamic capacity: `completedToday ? BAG_CAPACITY_POST_COMPLETION (3) : BAG_CAPACITY (8)`. If full, return 400 with dynamic message: `Bag is full (${bag.length}/${maxCapacity})` (B13)
5. Delete dropped asset from world
6. Add item to bag, update `matchesIdealMeal` flags
7. Use `visitor.incrementDataObjectValue("pickupsToday", 1)` for atomic counter update (B12)
8. Update User data object: use `user.incrementDataObjectValue("totalPickups", 1)` (B12), add to `uniqueItemsCollected`
9. Calculate XP: `PICKUP * rarityMultiplier` + `COLLECT_IDEAL_ITEM` if match
10. Fire toast with fun fact, trigger particle
11. Return response

**Step 4: Add route and export**

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git add server/controllers/handlePickupItem.ts server/controllers/index.ts server/routes.ts server/tests/pickup-item.test.ts
git commit -m "feat: add POST /api/pickup-item controller with locking"
```

---

## Task 7: `handleDropItem` Controller

**Files:**
- Create: `server/controllers/handleDropItem.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts`
- Test: `server/tests/drop-item.test.ts`

**Step 1: Write failing tests**

Test scenarios:
- Successful drop: item removed from bag, placed in world near avatar, returns updated bag
- Item not in bag: returns 400
- Dropped asset created with correct `FoodItemAssetData`

**Step 2: Run test to verify fail**

**Step 3: Implement `handleDropItem.ts`**

1. Get credentials, validate `req.body.itemId`
2. Fetch visitor data object — find item in bag, return 400 if not found
3. Get visitor position via `visitor.moveTo.x` and `visitor.moveTo.y` (B1: NOT `visitor.position`)
4. Remove item from bag
5. Use `visitor.incrementDataObjectValue("dropsToday", 1)` for atomic counter update (B12)
6. Create dropped asset near visitor `moveTo` position (small random offset)
7. Set food item data object on the new dropped asset with `uniqueName: "lunch-swap-food|{itemId}|{rarity}|{Date.now()}"` (B2)
8. Update User: use `user.incrementDataObjectValue("totalDrops", 1)` (B12)
9. Trigger particle effect
10. Return response with `droppedAssetId`

**Step 4: Add route and export**

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git add server/controllers/handleDropItem.ts server/controllers/index.ts server/routes.ts server/tests/drop-item.test.ts
git commit -m "feat: add POST /api/drop-item controller"
```

---

## Task 8: `handleSwapItem` Controller

**Files:**
- Create: `server/controllers/handleSwapItem.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts`
- Test: `server/tests/swap-item.test.ts`

**Step 1: Write failing tests**

Test scenarios:
- Successful swap: old item dropped, new item picked up, bag stays at 8
- Pickup target already gone: returns 409
- Drop item not in bag: returns 400

**Step 2: Run test to verify fail**

**Step 3: Implement `handleSwapItem.ts`**

Atomic combination of drop + pickup. Lock the pickup target first (to prevent race conditions), then update bag atomically.

**Step 4: Add route and export**

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git add server/controllers/handleSwapItem.ts server/controllers/index.ts server/routes.ts server/tests/swap-item.test.ts
git commit -m "feat: add POST /api/swap-item controller (atomic drop + pickup)"
```

---

## Task 9: `handleSubmitMeal` Controller

**Files:**
- Create: `server/controllers/handleSubmitMeal.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts`
- Test: `server/tests/submit-meal.test.ts`

**Step 1: Write failing tests**

Test scenarios:
- Successful submission: meal validates, nutrition score calculated, XP awarded, completion set
- Incomplete meal: returns 400 with missing items list
- Already completed today: returns 400
- Super combos detected and included
- Remaining non-meal items auto-dropped into world
- Streak logic (B5): increment if `lastCompletionDate === yesterday`, start at 1 if gap or empty

**Step 2: Run test to verify fail**

**Step 3: Implement `handleSubmitMeal.ts`**

1. Get credentials, fetch visitor data object
2. Validate: bag contains all 5 ideal meal items. If not, return 400 with missing items.
3. Validate: not already completed today. If yes, return 400.
4. Calculate nutrition score, detect super combos
5. Calculate total XP: base + rarity bonuses + nutrition bonus + combo bonuses + streak bonus
6. Update visitor: `completedToday = true`, `completionTimestamp`, `nutritionScore`, `superCombosFound`
7. Update User streak with detailed logic (B5):
   - Fetch User data object for `lastCompletionDate` and `currentStreak`
   - If `lastCompletionDate === yesterday` → `currentStreak++` (continuing streak)
   - If `lastCompletionDate` is empty or `< yesterday - 1` → `currentStreak = 1` (starting fresh)
   - Update `lastCompletionDate = today`, and `longestStreak = Math.max(longestStreak, currentStreak)`
8. Update User: XP, level, lifetime stats. Use `user.incrementDataObjectValue()` for `totalMealsCompleted`, `totalSuperCombos` (B12)
9. Grant badges via `visitor.grantInventoryItem()` with idempotency (D3). Check each badge:
   - **"First Feast"** — `totalMealsCompleted === 1` (first ever completion)
   - **"Nutrition Guru"** — `nutritionScore >= 90` (hard to achieve)
   - **"Streak Master"** — `currentStreak >= 7` (7-day streak)
   - **"Combo Chef"** — `superCombosFound.length >= 3` in this meal
   - **"Generous Chef"** — `totalDrops >= 20` (checked from User data)
   Before granting, check if badge already granted (idempotent — don't grant twice)
10. Auto-drop remaining non-meal items from bag into world at visitor `moveTo` position, clear bag to empty
11. Fire celebration toast, trigger fireworks particle
12. Use `world.incrementDataObjectValue("totalCompletionsToday", 1)` (B12)
13. Return `SubmitMealResponse` (client uses `BAG_CAPACITY_POST_COMPLETION = 3` for capacity enforcement going forward)

**Step 4: Add route and export**

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git add server/controllers/handleSubmitMeal.ts server/controllers/index.ts server/routes.ts server/tests/submit-meal.test.ts
git commit -m "feat: add POST /api/submit-meal with nutrition scoring, XP, and badges"
```
