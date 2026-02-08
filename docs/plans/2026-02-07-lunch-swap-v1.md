# Lunch Swap V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a daily social trading game where players collect, swap, and assemble food items to complete their ideal balanced meal, with nutrition scoring, XP progression, and admin controls.

**Architecture:** Server-first Topia SDK app. All game logic and SDK calls happen server-side; the React client communicates exclusively through `backendAPI.ts`. State is persisted in Topia data objects (Visitor, User, World, DroppedAsset). Daily resets at midnight Mountain Time.

**Tech Stack:** TypeScript, Express, React 18, Topia SDK v0.17.7, Jest + supertest for server tests, Vite for client dev.

---

## Phase 1: Shared Types & Food Data

Foundation layer. No server or client changes — just the type system and data that everything else depends on.

---

### Task 1: Shared Type Definitions

**Files:**
- Create: `shared/types/FoodItem.ts`
- Create: `shared/types/GameState.ts`
- Create: `shared/types/NearbyItem.ts`
- Create: `shared/types/NutritionScore.ts`
- Create: `shared/types/DataObjects.ts`
- Modify: `shared/types/VisitorData.ts`

**Step 1: Create `shared/types/FoodItem.ts`**

```typescript
export type FoodGroup = "drink" | "fruit" | "veggie" | "main" | "snack";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  vitamins: string[];
}

export interface FoodItemDefinition {
  itemId: string;
  name: string;
  foodGroup: FoodGroup;
  rarity: Rarity;
  assetId: string;
  nutrition: NutritionInfo;
  funFact: string;
  superComboPairs: string[];
}

export interface BagItem {
  itemId: string;
  name: string;
  foodGroup: FoodGroup;
  rarity: Rarity;
  matchesIdealMeal: boolean;
}

export interface IdealMealItem {
  itemId: string;
  name: string;
  foodGroup: FoodGroup;
  rarity: Rarity;
  collected: boolean;
}

export const FOOD_GROUP_COLORS: Record<FoodGroup, string> = {
  drink: "#4A90D9",
  fruit: "#E8564A",
  veggie: "#5CB85C",
  main: "#F0AD4E",
  snack: "#9B59B6",
};

export const RARITY_CONFIG: Record<Rarity, {
  label: string;
  color: string;
  spawnMultiplier: number;
  xpMultiplier: number;
}> = {
  common:    { label: "Common",    color: "#8E8E93", spawnMultiplier: 3, xpMultiplier: 1.0 },
  rare:      { label: "Rare",      color: "#4A90D9", spawnMultiplier: 2, xpMultiplier: 1.5 },
  epic:      { label: "Epic",      color: "#9B59B6", spawnMultiplier: 1, xpMultiplier: 2.5 },
  legendary: { label: "Legendary", color: "#F5A623", spawnMultiplier: 0, xpMultiplier: 5.0 },
};
```

**Step 2: Create `shared/types/GameState.ts`**

```typescript
import { BagItem, IdealMealItem } from "./FoodItem.js";

export interface GameState {
  isNewDay: boolean;
  brownBag: BagItem[];
  idealMeal: IdealMealItem[];
  completedToday: boolean;
  nutritionScore: number | null;
  superCombosFound: string[];
  xp: number;
  level: number;
  currentStreak: number;
  isAdmin: boolean;
}
```

**Step 3: Create `shared/types/NearbyItem.ts`**

```typescript
import { FoodGroup, Rarity } from "./FoodItem.js";

export interface NearbyItem {
  droppedAssetId: string;
  itemId: string;
  name: string;
  foodGroup: FoodGroup;
  rarity: Rarity;
  distance: number;
  matchesIdealMeal: boolean;
  lastDroppedByName: string;
}
```

**Step 4: Create `shared/types/NutritionScore.ts`**

```typescript
export interface NutritionScoreResult {
  score: number;
  breakdown: {
    proteinScore: number;
    fiberScore: number;
    vitaminDiversity: number;
    balanceScore: number;
  };
  superCombos: SuperCombo[];
  totalXpEarned: number;
  bonusXp: number;
}

export interface SuperCombo {
  name: string;
  items: string[];
  bonusXp: number;
  description: string;
}
```

**Step 5: Create `shared/types/DataObjects.ts`**

All data object interfaces and defaults for Visitor, User, World, KeyAsset, and FoodItem — exactly as specified in `docs/prd/data-models.md`.

```typescript
import { BagItem, FoodGroup, IdealMealItem, Rarity } from "./FoodItem.js";

// --- Visitor Data Object ---
export interface VisitorGameData {
  lastPlayedDate: string;
  brownBag: BagItem[];
  idealMeal: IdealMealItem[];
  completedToday: boolean;
  completionTimestamp: string | null;
  pickupsToday: number;
  dropsToday: number;
  itemsMatchedToday: number;
  nutritionScore: number | null;
  superCombosFound: string[];
}

export const VISITOR_DATA_DEFAULTS: VisitorGameData = {
  lastPlayedDate: "",
  brownBag: [],
  idealMeal: [],
  completedToday: false,
  completionTimestamp: null,
  pickupsToday: 0,
  dropsToday: 0,
  itemsMatchedToday: 0,
  nutritionScore: null,
  superCombosFound: [],
};

// --- User Data Object ---
export interface UserGameData {
  totalXp: number;
  level: number;
  totalMealsCompleted: number;
  totalPickups: number;
  totalDrops: number;
  totalSuperCombos: number;
  bestNutritionScore: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string;
  uniqueItemsCollected: string[];
}

export const USER_DATA_DEFAULTS: UserGameData = {
  totalXp: 0,
  level: 1,
  totalMealsCompleted: 0,
  totalPickups: 0,
  totalDrops: 0,
  totalSuperCombos: 0,
  bestNutritionScore: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletionDate: "",
  uniqueItemsCollected: [],
};

// --- World Data Object ---
export interface WorldGameData {
  gameVersion: number;
  spawnRadiusMin: number;
  spawnRadiusMax: number;
  proximityRadius: number;
  currentDate: string;
  totalStartsToday: number;
  totalCompletionsToday: number;
  spawnedItemsByPlayer: Record<string, string[]>;
  totalPickups: number;
  totalDrops: number;
  totalMealSubmissions: number;
}

export const WORLD_DATA_DEFAULTS: WorldGameData = {
  gameVersion: 1,
  spawnRadiusMin: 200,
  spawnRadiusMax: 2000,
  proximityRadius: 150,
  currentDate: "",
  totalStartsToday: 0,
  totalCompletionsToday: 0,
  spawnedItemsByPlayer: {},
  totalPickups: 0,
  totalDrops: 0,
  totalMealSubmissions: 0,
};

// --- Key Asset Data Object ---
export interface KeyAssetData {
  appVersion: number;
  appName: string;
  initialized: boolean;
}

export const KEY_ASSET_DATA_DEFAULTS: KeyAssetData = {
  appVersion: 1,
  appName: "lunch-swap",
  initialized: false,
};

// --- Food Item Data Object (on dropped assets) ---
export interface FoodItemAssetData {
  itemId: string;
  itemName: string;
  foodGroup: FoodGroup;
  rarity: Rarity;
  firstDroppedBy: string;
  firstDroppedByName: string;
  firstDroppedDateTime: string;
  lastDroppedBy: string;
  lastDroppedByName: string;
  lastDroppedDateTime: string;
  spawnedBySystem: boolean;
  pickupCount: number;
}

export const FOOD_ITEM_ASSET_DATA_DEFAULTS: FoodItemAssetData = {
  itemId: "",
  itemName: "",
  foodGroup: "snack",
  rarity: "common",
  firstDroppedBy: "",
  firstDroppedByName: "",
  firstDroppedDateTime: "",
  lastDroppedBy: "",
  lastDroppedByName: "",
  lastDroppedDateTime: "",
  spawnedBySystem: false,
  pickupCount: 0,
};
```

**Step 6: Replace `shared/types/VisitorData.ts`**

```typescript
export { VisitorGameData as VisitorDataObject } from "./DataObjects.js";
```

This keeps backward compat with the existing `VisitorDataObject` import used in `client/src/context/types.ts`.

**Step 7: Commit**

```bash
git add shared/types/
git commit -m "feat: add shared type definitions for Lunch Swap game"
```

---

### Task 2: Food Item Database

**Files:**
- Create: `shared/data/foodItems.ts`
- Create: `shared/data/superCombos.ts`
- Create: `shared/data/xpConfig.ts`

**Step 1: Create `shared/data/foodItems.ts`**

Create the full food item database — approximately 60 items across all 5 food groups and 3 active rarities (common, rare, epic). Each item needs: `itemId`, `name`, `foodGroup`, `rarity`, `assetId` (placeholder `""` for now — populated when assets are uploaded), `nutrition`, `funFact`, `superComboPairs`.

Distribution target:
- **Drinks** (12 items): 7 common, 3 rare, 2 epic
- **Fruits** (12 items): 7 common, 3 rare, 2 epic
- **Veggies** (12 items): 7 common, 3 rare, 2 epic
- **Mains** (12 items): 7 common, 3 rare, 2 epic
- **Snacks** (12 items): 7 common, 3 rare, 2 epic

```typescript
import { FoodItemDefinition } from "../types/FoodItem.js";

export const FOOD_ITEMS: FoodItemDefinition[] = [
  // === DRINKS ===
  {
    itemId: "water",
    name: "Water Bottle",
    foodGroup: "drink",
    rarity: "common",
    assetId: "",
    nutrition: { calories: 0, protein: 0, carbs: 0, fiber: 0, vitamins: [] },
    funFact: "Your brain is about 75% water! Staying hydrated helps you think faster.",
    superComboPairs: [],
  },
  {
    itemId: "milk",
    name: "Milk",
    foodGroup: "drink",
    rarity: "common",
    assetId: "",
    nutrition: { calories: 150, protein: 8, carbs: 12, fiber: 0, vitamins: ["D", "B12"] },
    funFact: "One glass of milk has as much calcium as 7 cups of broccoli!",
    superComboPairs: ["cereal"],
  },
  // ... (remaining items follow the same pattern)
  // The implementation should create all ~60 items.
  // For brevity, the plan shows the pattern. The implementing agent
  // should generate a complete, well-researched list of kid-friendly foods.
];

export const FOOD_ITEMS_BY_ID = new Map(FOOD_ITEMS.map(item => [item.itemId, item]));

export const FOOD_ITEMS_BY_GROUP = {
  drink: FOOD_ITEMS.filter(i => i.foodGroup === "drink"),
  fruit: FOOD_ITEMS.filter(i => i.foodGroup === "fruit"),
  veggie: FOOD_ITEMS.filter(i => i.foodGroup === "veggie"),
  main: FOOD_ITEMS.filter(i => i.foodGroup === "main"),
  snack: FOOD_ITEMS.filter(i => i.foodGroup === "snack"),
};
```

**Step 2: Create `shared/data/superCombos.ts`**

```typescript
export interface SuperComboDefinition {
  name: string;
  items: string[]; // exactly 2 itemIds
  bonusXp: number;
  description: string;
}

export const SUPER_COMBOS: SuperComboDefinition[] = [
  {
    name: "Classic Combo",
    items: ["milk", "cereal"],
    bonusXp: 30,
    description: "Milk + Cereal = Classic Combo!",
  },
  {
    name: "Perfect Snack",
    items: ["hummus", "carrots"],
    bonusXp: 30,
    description: "Hummus + Carrots = Perfect Snack!",
  },
  // ... 10-15 total combos
];
```

**Step 3: Create `shared/data/xpConfig.ts`**

```typescript
export const XP_ACTIONS = {
  PICKUP: 10,
  DROP: 5,
  COLLECT_IDEAL_ITEM: 25,
  SUBMIT_MEAL: 100,
  BALANCED_MEAL_BONUS: 50,    // score > 80
  SUPER_COMBO: 30,
  STREAK_PER_DAY: 10,         // * streakDay, capped at 100
  STREAK_CAP: 100,
} as const;

export const LEVEL_THRESHOLDS: number[] = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500,
];

export function getLevelForXp(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}
```

**Step 4: Commit**

```bash
git add shared/data/
git commit -m "feat: add food item database, super combos, and XP config"
```

---

## Phase 2: Server Game Logic Utilities

Pure logic functions with no SDK dependencies — fully unit-testable.

---

### Task 3: Meal Generation & Nutrition Scoring Utilities

**Files:**
- Create: `server/utils/gameLogic/generateMeal.ts`
- Create: `server/utils/gameLogic/generateBrownBag.ts`
- Create: `server/utils/gameLogic/calculateNutritionScore.ts`
- Create: `server/utils/gameLogic/detectSuperCombos.ts`
- Create: `server/utils/gameLogic/dateUtils.ts`
- Create: `server/utils/gameLogic/index.ts`
- Modify: `server/utils/index.ts` — add `export * from "./gameLogic/index.js";`
- Test: `server/tests/gameLogic.test.ts`

**Step 1: Write failing tests for meal generation**

```typescript
// server/tests/gameLogic.test.ts
import { generateIdealMeal } from "../utils/gameLogic/generateMeal.js";
import { generateBrownBag } from "../utils/gameLogic/generateBrownBag.js";
import { calculateNutritionScore } from "../utils/gameLogic/calculateNutritionScore.js";
import { detectSuperCombos } from "../utils/gameLogic/detectSuperCombos.js";
import { getCurrentDateMT, isNewDay } from "../utils/gameLogic/dateUtils.js";

describe("generateIdealMeal", () => {
  test("returns 5 items: 1 drink, 1 main, 3 from fruit/veggie/snack", () => {
    const meal = generateIdealMeal();
    expect(meal).toHaveLength(5);
    expect(meal.filter(i => i.foodGroup === "drink")).toHaveLength(1);
    expect(meal.filter(i => i.foodGroup === "main")).toHaveLength(1);
    const others = meal.filter(i => ["fruit", "veggie", "snack"].includes(i.foodGroup));
    expect(others).toHaveLength(3);
  });

  test("all items have collected: false", () => {
    const meal = generateIdealMeal();
    expect(meal.every(i => i.collected === false)).toBe(true);
  });

  test("returns different meals on multiple calls (randomized)", () => {
    const meals = Array.from({ length: 10 }, () => generateIdealMeal());
    const ids = meals.map(m => m.map(i => i.itemId).sort().join(","));
    const unique = new Set(ids);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe("generateBrownBag", () => {
  test("returns 5 items with exactly 1 matching the ideal meal", () => {
    const idealMeal = generateIdealMeal();
    const bag = generateBrownBag(idealMeal);
    expect(bag).toHaveLength(5);
    const matches = bag.filter(i => i.matchesIdealMeal);
    expect(matches).toHaveLength(1);
  });

  test("the matching item is in the ideal meal", () => {
    const idealMeal = generateIdealMeal();
    const bag = generateBrownBag(idealMeal);
    const match = bag.find(i => i.matchesIdealMeal)!;
    expect(idealMeal.some(i => i.itemId === match.itemId)).toBe(true);
  });
});

describe("calculateNutritionScore", () => {
  test("returns score 0-100 with 4 breakdown categories 0-25 each", () => {
    const idealMeal = generateIdealMeal();
    const result = calculateNutritionScore(idealMeal.map(i => i.itemId));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown.proteinScore).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.proteinScore).toBeLessThanOrEqual(25);
    expect(result.breakdown.fiberScore).toBeLessThanOrEqual(25);
    expect(result.breakdown.vitaminDiversity).toBeLessThanOrEqual(25);
    expect(result.breakdown.balanceScore).toBeLessThanOrEqual(25);
  });
});

describe("detectSuperCombos", () => {
  test("returns empty array when no combos match", () => {
    const combos = detectSuperCombos(["water", "apple"]);
    expect(combos).toEqual([]);
  });
});

describe("dateUtils", () => {
  test("getCurrentDateMT returns YYYY-MM-DD format", () => {
    const date = getCurrentDateMT();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("isNewDay returns true when dates differ", () => {
    expect(isNewDay("2026-01-01", "2026-01-02")).toBe(true);
  });

  test("isNewDay returns false when dates match", () => {
    const today = getCurrentDateMT();
    expect(isNewDay(today, today)).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && npm test -- --testPathPattern=gameLogic`
Expected: FAIL — modules not found.

**Step 3: Implement `dateUtils.ts`**

```typescript
// server/utils/gameLogic/dateUtils.ts
export function getCurrentDateMT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });
}

export function isNewDay(lastPlayedDate: string, currentDate?: string): boolean {
  const today = currentDate ?? getCurrentDateMT();
  return lastPlayedDate !== today;
}
```

**Step 4: Implement `generateMeal.ts`**

```typescript
// server/utils/gameLogic/generateMeal.ts
import { IdealMealItem, FoodGroup } from "@shared/types/FoodItem.js";
import { FOOD_ITEMS_BY_GROUP } from "@shared/data/foodItems.js";

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateIdealMeal(): IdealMealItem[] {
  const drink = pickRandom(FOOD_ITEMS_BY_GROUP.drink, 1)[0];
  const main = pickRandom(FOOD_ITEMS_BY_GROUP.main, 1)[0];

  const otherGroups: FoodGroup[] = ["fruit", "veggie", "snack"];
  const otherPool = otherGroups.flatMap(g => FOOD_ITEMS_BY_GROUP[g]);
  const others = pickRandom(otherPool, 3);

  return [drink, main, ...others].map(item => ({
    itemId: item.itemId,
    name: item.name,
    foodGroup: item.foodGroup,
    rarity: item.rarity,
    collected: false,
  }));
}
```

**Step 5: Implement `generateBrownBag.ts`**

```typescript
// server/utils/gameLogic/generateBrownBag.ts
import { BagItem, IdealMealItem } from "@shared/types/FoodItem.js";
import { FOOD_ITEMS } from "@shared/data/foodItems.js";

export function generateBrownBag(idealMeal: IdealMealItem[]): BagItem[] {
  // Pick 1 random item from ideal meal as the guaranteed match
  const matchIndex = Math.floor(Math.random() * idealMeal.length);
  const matchItem = idealMeal[matchIndex];

  const idealIds = new Set(idealMeal.map(i => i.itemId));
  const nonIdealPool = FOOD_ITEMS.filter(i => !idealIds.has(i.itemId));

  // Pick 4 random non-ideal items
  const shuffled = [...nonIdealPool].sort(() => Math.random() - 0.5);
  const fillers = shuffled.slice(0, 4);

  const bag: BagItem[] = [
    { itemId: matchItem.itemId, name: matchItem.name, foodGroup: matchItem.foodGroup, rarity: matchItem.rarity, matchesIdealMeal: true },
    ...fillers.map(item => ({
      itemId: item.itemId,
      name: item.name,
      foodGroup: item.foodGroup,
      rarity: item.rarity,
      matchesIdealMeal: false,
    })),
  ];

  // Shuffle bag so the match isn't always first
  return bag.sort(() => Math.random() - 0.5);
}
```

**Step 6: Implement `calculateNutritionScore.ts`**

```typescript
// server/utils/gameLogic/calculateNutritionScore.ts
import { NutritionScoreResult } from "@shared/types/NutritionScore.js";
import { FOOD_ITEMS_BY_ID } from "@shared/data/foodItems.js";

export function calculateNutritionScore(itemIds: string[]): NutritionScoreResult {
  const items = itemIds.map(id => FOOD_ITEMS_BY_ID.get(id)).filter(Boolean);

  // Protein score (0-25): based on total protein grams
  const totalProtein = items.reduce((sum, i) => sum + (i?.nutrition.protein ?? 0), 0);
  const proteinScore = Math.min(25, Math.round((totalProtein / 40) * 25));

  // Fiber score (0-25): based on total fiber grams
  const totalFiber = items.reduce((sum, i) => sum + (i?.nutrition.fiber ?? 0), 0);
  const fiberScore = Math.min(25, Math.round((totalFiber / 15) * 25));

  // Vitamin diversity (0-25): based on unique vitamins
  const allVitamins = new Set(items.flatMap(i => i?.nutrition.vitamins ?? []));
  const vitaminDiversity = Math.min(25, Math.round((allVitamins.size / 6) * 25));

  // Balance score (0-25): based on food group variety
  const groups = new Set(items.map(i => i?.foodGroup));
  const balanceScore = Math.min(25, Math.round((groups.size / 5) * 25));

  const score = proteinScore + fiberScore + vitaminDiversity + balanceScore;

  return {
    score,
    breakdown: { proteinScore, fiberScore, vitaminDiversity, balanceScore },
    superCombos: [], // filled in by detectSuperCombos separately
    totalXpEarned: 0, // calculated at submit time
    bonusXp: score > 80 ? 50 : 0,
  };
}
```

**Step 7: Implement `detectSuperCombos.ts`**

```typescript
// server/utils/gameLogic/detectSuperCombos.ts
import { SuperCombo } from "@shared/types/NutritionScore.js";
import { SUPER_COMBOS } from "@shared/data/superCombos.js";

export function detectSuperCombos(itemIds: string[]): SuperCombo[] {
  const idSet = new Set(itemIds);
  return SUPER_COMBOS
    .filter(combo => combo.items.every(id => idSet.has(id)))
    .map(combo => ({
      name: combo.name,
      items: combo.items,
      bonusXp: combo.bonusXp,
      description: combo.description,
    }));
}
```

**Step 8: Create `index.ts` barrel export**

```typescript
// server/utils/gameLogic/index.ts
export { generateIdealMeal } from "./generateMeal.js";
export { generateBrownBag } from "./generateBrownBag.js";
export { calculateNutritionScore } from "./calculateNutritionScore.js";
export { detectSuperCombos } from "./detectSuperCombos.js";
export { getCurrentDateMT, isNewDay } from "./dateUtils.js";
```

**Step 9: Add export to `server/utils/index.ts`**

Add `export * from "./gameLogic/index.js";` to the existing exports.

**Step 10: Run tests to verify they pass**

Run: `cd server && npm test -- --testPathPattern=gameLogic`
Expected: All PASS.

**Step 11: Commit**

```bash
git add server/utils/gameLogic/ server/tests/gameLogic.test.ts server/utils/index.ts
git commit -m "feat: add game logic utilities (meal generation, nutrition scoring, date utils)"
```

---

## Phase 3: Core Server Controllers

Build the game-state, pickup, drop, swap, and submit-meal controllers.

---

### Task 4: Rewrite `handleGetGameState` Controller

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
2. Fetch visitor data object (initialize with defaults if empty)
3. Check `isNewDay` comparing `lastPlayedDate` vs `getCurrentDateMT()`
4. If new day: generate ideal meal, generate brown bag, reset daily counters, spawn items into world, update streak on User data object
5. If same day: return existing state
6. If completed: return completion summary
7. Return `GameState` response

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

### Task 5: `handleGetNearbyItems` Controller

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

1. Get credentials, get visitor (position), fetch visitor data object (ideal meal)
2. Fetch all food items: `world.fetchDroppedAssetsWithUniqueName("lunch-swap-food-*")`
3. For each: check 24h TTL, delete expired items
4. Calculate distance from visitor position
5. Filter to items within `proximityRadius` (from world data object)
6. Sort by distance ascending
7. Flag `matchesIdealMeal` for each item
8. Return `NearbyItem[]`

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

### Task 6: `handlePickupItem` Controller

**Files:**
- Create: `server/controllers/handlePickupItem.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts`
- Test: `server/tests/pickup-item.test.ts`

**Step 1: Write failing tests**

Test scenarios:
- Successful pickup: item removed from world, added to bag, returns updated bag + fun fact + XP
- Bag full (5 items): returns 400
- Item already gone (409 conflict)
- Item matches ideal meal: returns `matchesIdealMeal: true`
- XP includes rarity multiplier

**Step 2: Run test to verify fail**

**Step 3: Implement `handlePickupItem.ts`**

1. Get credentials, validate `req.body.droppedAssetId`
2. Lock the food asset (time-bucketed lockId)
3. Fetch food asset data object — if asset gone, return 409
4. Fetch visitor data object — check bag size, return 400 if full
5. Delete dropped asset from world
6. Add item to bag, increment `pickupsToday`, update `matchesIdealMeal` flags
7. Update User data object: increment `totalPickups`, add to `uniqueItemsCollected`
8. Calculate XP: `PICKUP * rarityMultiplier` + `COLLECT_IDEAL_ITEM` if match
9. Fire toast with fun fact, trigger particle
10. Return response

**Step 4: Add route and export**

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git add server/controllers/handlePickupItem.ts server/controllers/index.ts server/routes.ts server/tests/pickup-item.test.ts
git commit -m "feat: add POST /api/pickup-item controller with locking"
```

---

### Task 7: `handleDropItem` Controller

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
3. Get visitor position
4. Remove item from bag, increment `dropsToday`
5. Create dropped asset near visitor position (small random offset)
6. Set food item data object on the new dropped asset
7. Update User: increment `totalDrops`
8. Trigger particle effect
9. Return response with `droppedAssetId`

**Step 4: Add route and export**

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git add server/controllers/handleDropItem.ts server/controllers/index.ts server/routes.ts server/tests/drop-item.test.ts
git commit -m "feat: add POST /api/drop-item controller"
```

---

### Task 8: `handleSwapItem` Controller

**Files:**
- Create: `server/controllers/handleSwapItem.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts`
- Test: `server/tests/swap-item.test.ts`

**Step 1: Write failing tests**

Test scenarios:
- Successful swap: old item dropped, new item picked up, bag stays at 5
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

### Task 9: `handleSubmitMeal` Controller

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
- Streak incremented if consecutive day

**Step 2: Run test to verify fail**

**Step 3: Implement `handleSubmitMeal.ts`**

1. Get credentials, fetch visitor data object
2. Validate: bag contains all 5 ideal meal items. If not, return 400 with missing items.
3. Validate: not already completed today. If yes, return 400.
4. Calculate nutrition score, detect super combos
5. Calculate total XP: base + rarity bonuses + nutrition bonus + combo bonuses + streak bonus
6. Update visitor: `completedToday = true`, `completionTimestamp`, `nutritionScore`, `superCombosFound`
7. Update User: XP, level, streak, lifetime stats
8. Grant badges via `visitor.grantInventoryItem()` if milestones hit (first completion, streak, etc.)
9. Auto-drop remaining non-meal items from bag into world
10. Fire celebration toast, trigger fireworks particle
11. Increment world `totalCompletionsToday`
12. Return `SubmitMealResponse`

**Step 4: Add route and export**

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git add server/controllers/handleSubmitMeal.ts server/controllers/index.ts server/routes.ts server/tests/submit-meal.test.ts
git commit -m "feat: add POST /api/submit-meal with nutrition scoring, XP, and badges"
```

---

## Phase 4: Admin Controllers

---

### Task 10: Admin Controllers (Remove All, Spawn, Stats)

**Files:**
- Create: `server/controllers/admin/handleAdminRemoveAllItems.ts`
- Create: `server/controllers/admin/handleAdminSpawnItems.ts`
- Create: `server/controllers/admin/handleAdminGetStats.ts`
- Create: `server/controllers/admin/index.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts`
- Test: `server/tests/admin-routes.test.ts`

**Step 1: Write failing tests for all 3 admin endpoints**

Test: admin check (403 if not admin), successful execution, response shape.

**Step 2: Run tests to verify fail**

**Step 3: Implement all 3 admin controllers**

Each starts with: get credentials → get visitor → check `isAdmin` → return 403 if not.

- **Remove All Items**: `world.fetchDroppedAssetsWithUniqueName("lunch-swap-food-*")` → bulk delete → return `removedCount`
- **Spawn Items**: generate random items from pool → spawn at random positions within radius → return `spawnedCount` + item list
- **Stats**: fetch world data object → count food items in world → return aggregated stats

**Step 4: Add routes and exports**

```typescript
// In routes.ts
router.post("/admin/remove-all-items", handleAdminRemoveAllItems);
router.post("/admin/spawn-items", handleAdminSpawnItems);
router.get("/admin/stats", handleAdminGetStats);
```

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git add server/controllers/admin/ server/controllers/index.ts server/routes.ts server/tests/admin-routes.test.ts
git commit -m "feat: add admin controllers (remove-all, spawn, stats)"
```

---

## Phase 5: Client State & Context

Update the client state management to support the full game state.

---

### Task 11: Update Client Context for Game State

**Files:**
- Modify: `client/src/context/types.ts`
- Modify: `client/src/context/reducer.ts`
- Modify: `client/src/context/constants.ts`

**Step 1: Update `types.ts`**

Add new action types and expand `InitialState`:

```typescript
// New action types
export const SET_BROWN_BAG = "SET_BROWN_BAG";
export const SET_IDEAL_MEAL = "SET_IDEAL_MEAL";
export const SET_NEARBY_ITEMS = "SET_NEARBY_ITEMS";
export const SET_COMPLETED = "SET_COMPLETED";

// Expand InitialState to include all game fields from GameState
// + UI-only state: autoGrabEnabled, isNewDay, nearbyItems
```

**Step 2: Update `reducer.ts`**

Add cases for new action types. `SET_GAME_STATE` should spread all game fields from the API response.

**Step 3: Update `constants.ts`**

Set initial values for all new state fields.

**Step 4: Commit**

```bash
git add client/src/context/
git commit -m "feat: expand client state management for game state"
```

---

## Phase 6: Client Components — Core Game UI

Build the main game view components.

---

### Task 12: `GameView` Container Component

**Files:**
- Create: `client/src/components/GameView.tsx`
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/components/index.ts`

**Step 1: Create `GameView.tsx`**

This is the main routing component that conditionally renders:
- `NewDayWelcome` when `isNewDay && !dismissed`
- `CompletionSummary` when `completedToday`
- `MainGameView` otherwise

**Step 2: Update `Home.tsx`**

Replace boilerplate content with `<GameView />` inside `<PageContainer>`. The `useEffect` call to `/api/game-state` stays but dispatches the full game state.

**Step 3: Commit**

```bash
git add client/src/components/GameView.tsx client/src/pages/Home.tsx client/src/components/index.ts
git commit -m "feat: add GameView container with conditional rendering"
```

---

### Task 13: `NewDayWelcome` Component

**Files:**
- Create: `client/src/components/NewDayWelcome.tsx`
- Modify: `client/src/components/index.ts`

Shows: "New Day!" header, today's ideal meal preview (5 items with food group colors), starting brown bag contents (matching item highlighted), "Let's Go!" button to dismiss.

Use SDK CSS classes: `container`, `h1`, `h2`, `p1`, `btn`. Food group color borders. Accessible: heading hierarchy, button focus, reduced motion support.

**Step 1: Implement component**

**Step 2: Commit**

```bash
git add client/src/components/NewDayWelcome.tsx client/src/components/index.ts
git commit -m "feat: add NewDayWelcome component"
```

---

### Task 14: `IdealMealTracker` Component

**Files:**
- Create: `client/src/components/IdealMealTracker.tsx`
- Modify: `client/src/components/index.ts`

5-slot horizontal display. Collected items: full color + checkmark. Missing items: grayscale/silhouette. Progress bar ("3/5 collected"). When all 5 collected: glow animation.

**Step 1: Implement component**

**Step 2: Commit**

```bash
git add client/src/components/IdealMealTracker.tsx client/src/components/index.ts
git commit -m "feat: add IdealMealTracker component"
```

---

### Task 15: `BrownBag` Component

**Files:**
- Create: `client/src/components/BrownBag.tsx`
- Create: `client/src/components/BagItemCard.tsx`
- Modify: `client/src/components/index.ts`

5-slot grid. Each slot: food group colored border, rarity indicator, ideal meal match glow. Tap to expand: shows `NutritionPreview` + "Drop" button. Empty slots: dotted border.

**Step 1: Implement `BagItemCard.tsx`**

**Step 2: Implement `BrownBag.tsx`**

**Step 3: Commit**

```bash
git add client/src/components/BrownBag.tsx client/src/components/BagItemCard.tsx client/src/components/index.ts
git commit -m "feat: add BrownBag and BagItemCard components"
```

---

### Task 16: `NearbyItems` Component

**Files:**
- Create: `client/src/components/NearbyItems.tsx`
- Create: `client/src/components/NearbyItemCard.tsx`
- Create: `client/src/components/AutoGrabToggle.tsx`
- Modify: `client/src/components/index.ts`

Scrollable list. Polls `GET /api/nearby-items` every 3 seconds. Each card: name, food group badge, rarity badge, distance, "Grab it!" button. Items matching ideal meal highlighted with star.

`AutoGrabToggle`: magnet icon, toggle switch, `aria-pressed`. When on, auto-calls pickup for nearby items.

**Step 1: Implement `AutoGrabToggle.tsx`**

**Step 2: Implement `NearbyItemCard.tsx`**

**Step 3: Implement `NearbyItems.tsx`** (with polling logic)

**Step 4: Commit**

```bash
git add client/src/components/NearbyItems.tsx client/src/components/NearbyItemCard.tsx client/src/components/AutoGrabToggle.tsx client/src/components/index.ts
git commit -m "feat: add NearbyItems with polling, AutoGrabToggle, NearbyItemCard"
```

---

### Task 17: `NutritionPreview` Component

**Files:**
- Create: `client/src/components/NutritionPreview.tsx`
- Modify: `client/src/components/index.ts`

Health-bar style breakdown: 4 horizontal bars for protein, carbs, fiber, vitamins. Color-coded, proportional. Simple and kid-friendly. "Did you know?" fact below. Accessible: `aria-valuenow`/`aria-valuemax` on each bar.

**Step 1: Implement component**

**Step 2: Commit**

```bash
git add client/src/components/NutritionPreview.tsx client/src/components/index.ts
git commit -m "feat: add NutritionPreview component"
```

---

### Task 18: `MainGameView` Component

**Files:**
- Create: `client/src/components/MainGameView.tsx`
- Modify: `client/src/components/index.ts`

Composes: `IdealMealTracker` + `BrownBag` + `NearbyItems` + `SubmitMealButton`. Handles drop/pickup callbacks, wires up state updates.

`SubmitMealButton`: Conditional on all 5 ideal items collected. Glow animation when active. Triggers confirmation modal.

**Step 1: Implement component**

**Step 2: Commit**

```bash
git add client/src/components/MainGameView.tsx client/src/components/index.ts
git commit -m "feat: add MainGameView composing all game sections"
```

---

## Phase 7: Client Components — Modals & Completion

---

### Task 19: Game Modals

**Files:**
- Create: `client/src/components/BagFullSwapModal.tsx`
- Create: `client/src/components/DropConfirmModal.tsx`
- Create: `client/src/components/SubmitMealConfirmModal.tsx`
- Modify: `client/src/components/index.ts`

These can leverage the existing `ConfirmationModal.tsx` as a base or build custom modal UI.

**BagFullSwapModal**: Shows current 5 bag items, each tappable. Select one to drop → "Confirm swap?" → calls `POST /api/swap-item`.

**DropConfirmModal**: Item preview + "Drop this item?" + warning if item matches ideal meal.

**SubmitMealConfirmModal**: Preview of 5 collected items + "Submit your meal?" + note about remaining items being dropped.

**Step 1: Implement all 3 modals**

**Step 2: Commit**

```bash
git add client/src/components/BagFullSwapModal.tsx client/src/components/DropConfirmModal.tsx client/src/components/SubmitMealConfirmModal.tsx client/src/components/index.ts
git commit -m "feat: add game modals (swap, drop confirm, submit confirm)"
```

---

### Task 20: `CompletionSummary` Component

**Files:**
- Create: `client/src/components/CompletionSummary.tsx`
- Create: `client/src/components/NutritionScoreDisplay.tsx`
- Create: `client/src/components/XpBreakdown.tsx`
- Create: `client/src/components/StreakCounter.tsx`
- Modify: `client/src/components/index.ts`

**NutritionScoreDisplay**: Large score (0-100) with circular progress ring, 4-quadrant breakdown, letter grade, super combo callouts.

**XpBreakdown**: Itemized XP: base + rarity + nutrition + combos + streak.

**StreakCounter**: Current streak count with flame/fire icon. Shows "New record!" if applicable.

**CompletionSummary**: Composes the above + "Done for today!" message.

**Step 1: Implement all components**

**Step 2: Commit**

```bash
git add client/src/components/CompletionSummary.tsx client/src/components/NutritionScoreDisplay.tsx client/src/components/XpBreakdown.tsx client/src/components/StreakCounter.tsx client/src/components/index.ts
git commit -m "feat: add CompletionSummary with nutrition score, XP breakdown, and streak"
```

---

## Phase 8: Admin UI

---

### Task 21: Admin Panel Components

**Files:**
- Modify: `client/src/components/AdminView.tsx`
- Create: `client/src/components/AdminStats.tsx`
- Modify: `client/src/components/index.ts`

Replace the boilerplate `AdminView.tsx` with Lunch Swap admin functionality:
- **Stats panel**: items in world, starts today, completions today (from `GET /api/admin/stats`)
- **"Remove All Items" button**: confirmation modal → `POST /api/admin/remove-all-items`
- **"Spawn Items" button**: confirmation modal with optional count input → `POST /api/admin/spawn-items`

Use `btn-danger` for remove, `btn` for spawn. Use existing `ConfirmationModal` for confirms.

**Step 1: Implement `AdminStats.tsx`**

**Step 2: Rewrite `AdminView.tsx`**

**Step 3: Commit**

```bash
git add client/src/components/AdminView.tsx client/src/components/AdminStats.tsx client/src/components/index.ts
git commit -m "feat: add admin panel with stats, remove-all, and spawn actions"
```

---

## Phase 9: Integration & Polish

---

### Task 22: End-to-End Smoke Tests

**Files:**
- Modify: `server/tests/routes.test.ts`

Run the full test suite. Fix any broken tests from Phase 3-4 changes. Add integration-style tests that exercise the full flow:
1. GET game-state (new day) → verify response shape
2. POST drop-item → verify bag shrinks
3. POST pickup-item → verify bag grows
4. POST submit-meal → verify completion

**Step 1: Run full test suite**

Run: `cd server && npm test`
Expected: All PASS.

**Step 2: Fix any failures**

**Step 3: Add integration tests if missing**

**Step 4: Commit**

```bash
git add server/tests/
git commit -m "test: add integration tests and fix regressions"
```

---

### Task 23: CSS & Styling Pass

**Files:**
- Create: `client/src/styles/game.css` (or inline in components using SDK classes)

Review all components for:
- SDK CSS class usage (no Tailwind where SDK classes exist)
- Food group color consistency
- Rarity visual indicators
- Touch targets minimum 44x44px
- `prefers-reduced-motion` media queries for animations
- WCAG 2.2 AA contrast ratios

**Step 1: Audit each component**

**Step 2: Fix issues**

**Step 3: Commit**

```bash
git add client/src/
git commit -m "style: apply SDK CSS classes, food group colors, and accessibility polish"
```

---

### Task 24: Final Accessibility Audit

Run `/accessibility-compliance` against all new components. Check:
- Semantic HTML + heading hierarchy
- ARIA labels on all interactive elements
- Keyboard navigation (tab order, no traps)
- Focus visible on all focusable elements
- Color contrast meets AA minimums
- Screen reader announcements for bag changes, nearby items, score

**Step 1: Audit**

**Step 2: Fix issues**

**Step 3: Run server tests one final time**

Run: `cd server && npm test`
Expected: All PASS.

**Step 4: Commit**

```bash
git add .
git commit -m "a11y: WCAG 2.2 AA compliance pass across all game components"
```

---

## Summary

| Phase | Tasks | What's Built |
|-------|-------|-------------|
| 1 | 1-2 | Shared types, food database, XP config |
| 2 | 3 | Game logic utilities (meal gen, nutrition, combos, dates) |
| 3 | 4-9 | Core controllers (game-state, nearby, pickup, drop, swap, submit) |
| 4 | 10 | Admin controllers (remove-all, spawn, stats) |
| 5 | 11 | Client state management expansion |
| 6 | 12-18 | Core game UI (GameView, NewDay, BrownBag, NearbyItems, etc.) |
| 7 | 19-20 | Modals + CompletionSummary |
| 8 | 21 | Admin UI |
| 9 | 22-24 | Integration tests, styling, accessibility |

**Total: 24 tasks, ~9 phases, TDD throughout.**

Each phase builds on the previous. Server-first: phases 1-4 are fully testable without the client. Phases 5-8 wire up the UI. Phase 9 polishes everything.
