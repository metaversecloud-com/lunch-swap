# Decisions & Corrections Log

Captured during plan review on 2026-02-07. All implementing agents MUST read this file before starting any phase.

---

## Design Decisions

### D1: Bag Capacity
- **During play:** 8 items
- **After meal completion:** 3 items (prevents hoarding, sets up V1.5 Helper Mode)
- **Constants:** `BAG_CAPACITY = 8`, `BAG_CAPACITY_POST_COMPLETION = 3`, `IDEAL_MEAL_SIZE = 5`
- Server enforces: pickup checks `completedToday` to determine max capacity (8 or 3)

### D2: Food Items Are Clickable in World
- Clicking a dropped food item in the world opens the app drawer focused on that item
- Need to differentiate key asset click vs food item click
- **How:** When the app loads, check if `assetId` from query params matches a food item (by fetching it and checking `uniqueName` starts with `lunch-swap-food`). If yes, show the pickup prompt for that item. If no, treat as key asset and show normal game state.
- The `handleGetGameState` controller should accept an optional `clickedFoodAssetId` param and return the clicked item's details alongside normal game state

### D3: Badges — Keep, But Rare and Exciting
- Badges are IN scope for V1
- Philosophy: Rare, exciting, based on unique behaviors or play styles. NOT participation trophies.
- Badge definitions (implement 4-5 for V1):
  - **"First Feast"** — Complete your first meal ever
  - **"Nutrition Guru"** — Score 90+ on nutrition (hard to achieve)
  - **"Streak Master"** — 7-day completion streak
  - **"Combo Chef"** — Find 3+ super combos in a single meal
  - **"Generous Chef"** — Drop 20+ items total across sessions (helping others)
- Badges must be created in the Topia dashboard before deploy
- Use `visitor.grantInventoryItem()` with idempotency
- Need `EcosystemFactory` added to `topiaInit.ts`

### D4: Auto-Grab Mode — DEFERRED to V1.1
- Remove from V1 scope
- Remove `AutoGrabToggle` component from plans
- Remove auto-grab client state
- Players pick up items manually via "Grab it!" button (more engaging for kids)

### D5: 60 Food Items
- Full database: 12 items per food group, 3 rarity tiers
- All items need: nutrition data, fun facts, super combo pairs, image URL
- `assetId` field renamed to `imageUrl` (it stores the image URL, not a Topia asset ID)

### D6: Ideal Meal Variety Constraint
- The 3 "other" slots (drawn from fruit/veggie/snack pool) must include at least 2 distinct food groups
- e.g., 2 fruits + 1 veggie = OK, 3 fruits = NOT OK
- Prevents nutrition score penalties from pure RNG

### D7: Include Nearby Items in Initial Game State Response
- `GET /api/game-state` returns `nearbyItems[]` alongside game state
- Client renders immediately instead of waiting 3 seconds for first poll

### D8: Mystery Items (Variable Reinforcement)
- Some food items spawn as "?" mystery bags — player doesn't know what's inside until pickup
- **Spawn rate:** ~15% of spawned items are mystery items
- **Visual:** Show a "?" icon/image instead of the food item image. Food group color still visible (gives a hint).
- **Reveal:** On `POST /api/pickup-item`, if the item was mystery, the response includes `wasMystery: true` and a special reveal toast: "Mystery revealed: [Item Name]!"
- **Implementation:**
  - Add `isMystery: boolean` to `FoodItemAssetData`
  - When spawning, randomly flag ~15% as mystery
  - Nearby-items list shows "???" name, "?" image, but food group color is visible
  - On pickup, server returns the real item data — client plays a reveal animation
- **Why it works:** Every "?" pickup could be a rare/epic item. Creates anticipation and excitement on every mystery grab.

### D9: Meal Tickets & Daily Bonus Wheel (Variable Reinforcement)
- **Meal Tickets** are an inventory-based currency awarded by teachers or earned through learning objectives
- Teachers award Meal Tickets via Topia's inventory system (like badges)
- **Daily Bonus Wheel flow:**
  1. Player opens app for the day
  2. If player has 1+ Meal Tickets in inventory, show "Spin the Wheel?" prompt
  3. Player spends 1 Meal Ticket to spin
  4. Wheel lands on a random daily buff:
     - **"Double XP"** — All XP earned today is 2x (weight: 30%)
     - **"Rare Start"** — One item in your starting bag is upgraded to rare (weight: 25%)
     - **"Big Bag"** — +2 bag capacity for today (10 instead of 8) (weight: 20%)
     - **"Combo Finder"** — Super combo pairs glow in nearby-items list (weight: 15%)
     - **"Epic Drop"** — A random epic item is added to your bag immediately (weight: 10%)
  5. Buff is stored in visitor data for the day, applied to relevant game logic
  6. Player can skip the wheel (save the ticket for another day)
- **Implementation:**
  - Add `dailyBuff: string | null` and `hasMealTicket: boolean` to game state
  - Check inventory for Meal Ticket on `GET /api/game-state`
  - New endpoint: `POST /api/spin-wheel` — consumes ticket, returns random buff
  - Buff logic woven into existing controllers (XP calc, bag capacity, etc.)
  - Wheel UI component (CSS animation, no external library needed)
- **Why it works:** Teachers control the supply. Students want tickets. Creates a bridge between classroom behavior and game rewards. The randomness of the wheel makes each ticket exciting.

### D10: Hot Streaks (Variable Reinforcement)
- After picking up 3 items in a row that match your ideal meal, trigger a "Hot Streak!"
- **During Hot Streak:** Next pickup gives 3x XP (whether it matches ideal meal or not)
- **Visual:** Flame border on bag, "HOT STREAK!" toast, streak counter in header
- **Reset:** Hot Streak counter resets when you pick up a non-matching item or drop an item
- **Implementation:**
  - Add `idealPickupStreak: number` to visitor data (daily, resets with day)
  - In `handlePickupItem`: if item matches ideal meal, increment streak. If streak hits 3, set `hotStreakActive: true`. If item doesn't match, reset to 0.
  - In XP calculation: if `hotStreakActive`, apply 3x multiplier for that pickup, then reset `hotStreakActive`
  - Client reads `hotStreakActive` and `idealPickupStreak` from game state
- **Why it works:** Rewards strategic play. Players learn to prioritize ideal meal items. The 3x XP moment feels like a jackpot.

---

## Bug Fixes (Must Apply During Implementation)

### B1: Visitor Position is `moveTo`, NOT `position`
- SDK uses `visitor.moveTo.x` and `visitor.moveTo.y`
- Applies to: `handleGetNearbyItems` (distance calc), `handleDropItem` (place item near avatar)

### B2: `uniqueName` Pattern for Food Items
- **Pattern:** `lunch-swap-food|{itemId}|{rarity}|{lastDroppedTimestamp}`
- Encode metadata in uniqueName to avoid per-item `fetchDataObject()` on every poll
- Parse uniqueName to get basic info for nearby-items list
- Only fetch full data object when player actually picks up an item
- Use `isPartial: true` with `fetchDroppedAssetsWithUniqueName("lunch-swap-food")`

### B3: Nearby-Items Polling Performance
- DO NOT call `fetchDataObject()` on every food item every 3 seconds
- Instead: parse `uniqueName` for basic metadata (itemId, rarity)
- Look up item name and foodGroup from `FOOD_ITEMS_BY_ID` using the itemId from uniqueName
- Only call `fetchDataObject()` for: TTL checks (parse timestamp from uniqueName instead), actual pickup
- This reduces SDK calls from O(N) to O(1) per poll

### B4: Old Bag Items on Daily Reset
- When daily reset triggers (new day detected in `handleGetGameState`):
  1. Auto-drop all items from yesterday's bag into the world at the key asset position
  2. THEN generate new ideal meal and new brown bag
- This adds item liquidity and prevents items from vanishing

### B5: Streak Break Logic
- **Increment:** During `submit-meal`, if `lastCompletionDate === yesterday` -> `currentStreak++`
- **Start:** During `submit-meal`, if `lastCompletionDate` is empty or `< yesterday - 1` -> `currentStreak = 1`
- **Break (reset):** During `game-state` load, if `lastCompletionDate < yesterday` -> display streak as 0 (but don't write 0 yet — only reset on next completion)
- **Display logic:** Show the streak from User data object. If `lastCompletionDate < yesterday`, show "Streak: 0" in the UI but don't write to User data yet (player might still complete today and continue the streak)

### B6: `World.deleteDroppedAssets` is a Static Factory Method
- Admin "Remove All" must call: `World.deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET!, credentials)`
- NOT `world.deleteDroppedAssets()` (instance method doesn't exist for bulk delete)

### B7: SDK Mock Expansion (New Task)
- Add as Task 3.5 (between Phase 2 and Phase 3)
- Must mock: Visitor (get, fetchDataObject, updateDataObject, setDataObject, fireToast, triggerParticle, grantInventoryItem), DroppedAsset (get, drop, fetchDataObject, setDataObject, deleteDroppedAsset), World (create, fetchDataObject, updateDataObject, fetchDroppedAssetsWithUniqueName, deleteDroppedAssets), User (create, fetchDataObject, updateDataObject, incrementDataObjectValue), Asset (create)

### B8: `@shared` Path Alias in Jest Config
- Jest `moduleNameMapper` needs entry for `@shared/(.*)` -> `<rootDir>/../shared/$1`
- Without this, all imports from `@shared/` will fail in tests

### B9: `IDroppedAsset` Type Needs Replacement
- Current type has `dataObject: { droppedAssetCount?: number }` (boilerplate)
- Replace with `dataObject: KeyAssetData | FoodItemAssetData`
- Also update `initializeDroppedAssetDataObject.ts` for key asset initialization

### B10: Add `EcosystemFactory` to `topiaInit.ts`
- Required for badge operations: `visitor.grantInventoryItem()`
- Add: `import { EcosystemFactory } from "@rtsdk/topia"` and `const Ecosystem = new EcosystemFactory(myTopiaInstance)`

### B11: Brown Bag Size Inconsistencies in PRD
- `user-flows.md` Edge Case 1 still says "5 items" — change to 8
- `ui-screens.md` component tree says `BagItem (repeated, max 5)` — change to max 8

### B12: Use `incrementDataObjectValue` for Counters
- SDK has `incrementDataObjectValue(path, amount, options)` for atomic increments
- Use for: `pickupsToday`, `dropsToday`, `totalPickups`, `totalDrops`, `totalMealSubmissions`, `totalStartsToday`
- Avoids read-modify-write race conditions

### B13: Post-Completion Capacity Error Message
- When bag is full after completion, error should say "Bag is full (3/3)" not "Bag is full (8/8)"
- Dynamic: `Bag is full (${currentBag.length}/${completedToday ? BAG_CAPACITY_POST_COMPLETION : BAG_CAPACITY})`

### B14: Rename `assetId` to `imageUrl` in `FoodItemDefinition`
- The field stores a URL for the food item image, not a Topia asset ID
- When dropping: `Asset.create("webImageAsset", { credentials })` then `DroppedAsset.drop(asset, { layer0: foodItem.imageUrl, ... })`
