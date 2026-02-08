# Phase 1: Shared Types & Food Data

Foundation layer. No server or client changes — just the type system and data that everything else depends on.

---

## Task 1: Shared Type Definitions

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

## Task 2: Food Item Database

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
export const BAG_CAPACITY = 8;
export const IDEAL_MEAL_SIZE = 5;

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
