# Data Models

## Data Object Scope Decisions

| Data | Entity | Rationale |
|------|--------|-----------|
| Player's brown bag (current items) | Visitor | Per-session, per-player, resets daily |
| Player's ideal meal target | Visitor | Per-session, per-player, unique per day |
| Player's completion status | Visitor | Per-session state |
| Player's XP and level | User | Persists across worlds and sessions |
| Player's daily streak | User | Persists across sessions |
| Player's nutrition score history | User | Cross-session progression tracking |
| Game configuration (spawn rates, rarity weights) | World (keyed by sceneDropId) | Shared across all visitors, admin-configurable |
| World-level spawn tracking | World (keyed by sceneDropId) | Tracks what's been spawned to prevent duplicates |
| Dropped food item metadata | DroppedAsset | Tied to specific asset in world |
| Key asset configuration | DroppedAsset (key asset) | App configuration tied to entry point |
| Badges and achievements | Ecosystem Inventory | Managed via Topia dashboard, granted via SDK |
| Analytics counters | World (keyed by sceneDropId) | Aggregated via analytics piggyback |

## Visitor Data Object

```typescript
interface VisitorDataObject {
  // Daily state
  lastPlayedDate: string;              // "YYYY-MM-DD" in Mountain Time
  brownBag: BagItem[];                 // Current inventory (max 8 items)
  idealMeal: IdealMealItem[];          // Today's target meal (always 5 items)
  completedToday: boolean;             // Whether meal was submitted today
  completionTimestamp: string | null;   // ISO timestamp of today's completion

  // Session stats (reset daily)
  pickupsToday: number;                // Items picked up today
  dropsToday: number;                  // Items dropped today
  itemsMatchedToday: number;           // Ideal meal items collected today

  // Nutrition scoring (daily)
  nutritionScore: number | null;       // 0-100, set on meal submission
  superCombosFound: string[];          // Combo names earned today
}

const visitorDataObjectDefaults: VisitorDataObject = {
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
```

## User Data Object

```typescript
interface UserDataObject {
  // Progression
  totalXp: number;                     // Lifetime XP earned
  level: number;                       // Current level (derived from XP thresholds)

  // Lifetime stats
  totalMealsCompleted: number;         // All-time meal completions
  totalPickups: number;                // All-time items picked up
  totalDrops: number;                  // All-time items dropped
  totalSuperCombos: number;            // All-time super combos found
  bestNutritionScore: number;          // Highest nutrition score ever

  // Streaks
  currentStreak: number;               // Consecutive days with completion
  longestStreak: number;               // Best streak ever
  lastCompletionDate: string;          // "YYYY-MM-DD" MT — for streak calculation

  // Discovery
  uniqueItemsCollected: string[];      // All unique itemIds ever held (sticker book foundation)
}

const userDataObjectDefaults: UserDataObject = {
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
```

## World Data Object

```typescript
interface WorldDataObject {
  [sceneDropId: string]: {
    // Configuration
    gameVersion: number;                // Schema version for migration
    spawnRadiusMin: number;             // Min distance from key asset for spawns
    spawnRadiusMax: number;             // Max distance from key asset for spawns
    proximityRadius: number;            // Distance for "nearby" item detection (pixels)

    // Daily state
    currentDate: string;                // "YYYY-MM-DD" MT — current game day
    totalStartsToday: number;           // Players who started today
    totalCompletionsToday: number;      // Players who completed today

    // Spawn tracking
    spawnedItemsByPlayer: {             // Anti-spam: track what each player spawned
      [profileId: string]: string[];    // Array of itemIds spawned for this player
    };

    // Analytics counters (piggyback on data writes)
    totalPickups: number;
    totalDrops: number;
    totalMealSubmissions: number;
  };
}

const worldDataObjectDefaults: WorldDataObject[string] = {
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
```

## DroppedAsset Data Object

### Key Asset Data Object

```typescript
interface KeyAssetDataObject {
  appVersion: number;                  // Schema version
  appName: string;                     // "lunch-swap"
  initialized: boolean;                // Whether world data has been set up
}

const keyAssetDataObjectDefaults: KeyAssetDataObject = {
  appVersion: 1,
  appName: "lunch-swap",
  initialized: false,
};
```

### Spawned Food Item Data Object

```typescript
interface FoodItemDataObject {
  // Item identity
  itemId: string;                      // Unique identifier (e.g., "apple", "chicken-tenders")
  itemName: string;                    // Display name (e.g., "Apple", "Chicken Tenders")
  foodGroup: FoodGroup;                // "drink" | "fruit" | "veggie" | "main" | "snack"
  rarity: Rarity;                      // "common" | "rare" | "epic" | "legendary"

  // Tracking
  firstDroppedBy: string;              // profileId of the player whose spawn/drop created this
  firstDroppedByName: string;          // displayName for attribution
  firstDroppedDateTime: string;        // ISO timestamp — when item first entered the world
  lastDroppedBy: string;               // profileId of most recent dropper
  lastDroppedByName: string;           // displayName
  lastDroppedDateTime: string;         // ISO timestamp — 24h TTL anchor

  // Metadata
  spawnedBySystem: boolean;            // true if system-spawned (not player-dropped)
  pickupCount: number;                 // How many times this item has been picked up
}

const foodItemDataObjectDefaults: FoodItemDataObject = {
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

## Shared Types

```typescript
// shared/types/FoodItem.ts

export type FoodGroup = "drink" | "fruit" | "veggie" | "main" | "snack";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface FoodItemDefinition {
  itemId: string;                      // Unique slug (e.g., "peanut-butter-jelly-sandwich")
  name: string;                        // Display name (e.g., "Peanut Butter & Jelly Sandwich")
  foodGroup: FoodGroup;
  rarity: Rarity;
  assetId: string;                     // Topia asset ID for the food image
  nutrition: NutritionInfo;
  funFact: string;                     // "Did you know?" text
  superComboPairs: string[];           // itemIds this pairs with for Super Combos
}

export interface NutritionInfo {
  calories: number;
  protein: number;                     // grams
  carbs: number;                       // grams
  fiber: number;                       // grams
  vitamins: string[];                  // Notable vitamins (e.g., ["A", "C", "K"])
}

export interface BagItem {
  itemId: string;
  name: string;
  foodGroup: FoodGroup;
  rarity: Rarity;
  matchesIdealMeal: boolean;           // Whether this item is in the player's ideal meal
}

export interface IdealMealItem {
  itemId: string;
  name: string;
  foodGroup: FoodGroup;
  rarity: Rarity;
  collected: boolean;                  // Whether player currently has this item in bag
}

// shared/types/GameState.ts

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

// shared/types/NearbyItem.ts

export interface NearbyItem {
  droppedAssetId: string;              // ID of the dropped asset in the world
  itemId: string;
  name: string;
  foodGroup: FoodGroup;
  rarity: Rarity;
  distance: number;                    // Distance from player in pixels
  matchesIdealMeal: boolean;           // Highlight if player needs this
  lastDroppedByName: string;           // Attribution
}

// shared/types/NutritionScore.ts

export interface NutritionScoreResult {
  score: number;                       // 0-100
  breakdown: {
    proteinScore: number;              // 0-25
    fiberScore: number;                // 0-25
    vitaminDiversity: number;          // 0-25
    balanceScore: number;              // 0-25 (food group variety)
  };
  superCombos: SuperCombo[];
  totalXpEarned: number;
  bonusXp: number;                     // Extra XP from high nutrition score
}

export interface SuperCombo {
  name: string;                        // e.g., "Perfect Snack Combo"
  items: string[];                     // itemIds in the combo
  bonusXp: number;
  description: string;                 // e.g., "Hummus + Carrots = Perfect Snack Combo!"
}

// shared/types/FoodGroupColors.ts

export const FOOD_GROUP_COLORS: Record<FoodGroup, string> = {
  drink: "#4A90D9",                    // Blue
  fruit: "#E8564A",                    // Red-orange
  veggie: "#5CB85C",                   // Green
  main: "#F0AD4E",                     // Amber
  snack: "#9B59B6",                    // Purple
};

// shared/types/RarityConfig.ts

export const RARITY_CONFIG: Record<Rarity, {
  label: string;
  color: string;
  spawnMultiplier: number;             // Per student needing it
  xpMultiplier: number;               // XP bonus for collecting
}> = {
  common:    { label: "Common",    color: "#8E8E93", spawnMultiplier: 3, xpMultiplier: 1.0 },
  rare:      { label: "Rare",      color: "#4A90D9", spawnMultiplier: 2, xpMultiplier: 1.5 },
  epic:      { label: "Epic",      color: "#9B59B6", spawnMultiplier: 1, xpMultiplier: 2.5 },
  legendary: { label: "Legendary", color: "#F5A623", spawnMultiplier: 0, xpMultiplier: 5.0 },
};
```

## Locking Strategy

| Entity | Lock ID Pattern | Lock Window | When Used |
|--------|----------------|-------------|-----------|
| Visitor | `visitor-${visitorId}-${roundedTs1m}` | 1 minute | Updating brown bag (pickup, drop, swap) |
| World | `world-${sceneDropId}-${roundedTs5m}` | 5 minutes | Initialization, spawn tracking, daily reset |
| DroppedAsset (food item) | `food-${droppedAssetId}-${roundedTs1m}` | 1 minute | Pickup (prevent double-pickup race condition) |
| User | `user-${profileId}-${roundedTs1m}` | 1 minute | XP updates, streak updates, stats |

### Lock Usage Example

```typescript
// Picking up an item — lock the food asset to prevent race condition
const roundedTimestamp = Math.round(new Date().getTime() / 60000) * 60000;
const lockId = `food-${droppedAssetId}-${roundedTimestamp}`;

// First, lock and read the food item to confirm it still exists
await droppedAsset.fetchDataObject();
const foodData = droppedAsset.dataObject as FoodItemDataObject;

// Then delete the asset (first-writer-wins via lock)
await droppedAsset.deleteDroppedAsset();

// Then update the visitor's bag (separate lock)
const visitorLockId = `visitor-${visitorId}-${roundedTimestamp}`;
await visitor.updateDataObject(
  { brownBag: [...currentBag, newItem] },
  { lock: { lockId: visitorLockId, releaseLock: true } }
);
```

## XP System

### XP Awards

| Action | Base XP | Rarity Multiplier Applied? |
|--------|---------|---------------------------|
| Pick up an item | 10 | Yes |
| Drop an item | 5 | No |
| Collect an ideal meal item | 25 | Yes |
| Submit completed meal | 100 | No |
| Balanced meal bonus (score > 80) | 50 | No |
| Super Combo found | 30 per combo | No |
| Daily streak bonus | 10 * streakDay (cap 100) | No |

### Level Thresholds (Quadratic)

| Level | Total XP Required |
|-------|------------------|
| 1 | 0 |
| 2 | 100 |
| 3 | 300 |
| 4 | 600 |
| 5 | 1000 |
| 6 | 1500 |
| 7 | 2100 |
| 8 | 2800 |
| 9 | 3600 |
| 10 | 4500 |

Formula: `xpRequired = 50 * level * (level - 1)`

## Daily Reset Logic

```
Timezone: America/Denver (Mountain Time)

On GET /api/game-state:
  1. Get current date in MT: currentDateMT = formatInTimeZone(now, "America/Denver", "yyyy-MM-dd")
  2. Compare to visitor.dataObject.lastPlayedDate
  3. If different:
     a. Generate new ideal meal (1 drink + 1 main + 3 from {fruit, veggie, snack})
     b. Generate new brown bag (8 random items, exactly 1 matching ideal meal)
     c. Reset daily state (completedToday, pickupsToday, dropsToday, etc.)
     d. Update lastPlayedDate = currentDateMT
     e. Spawn items into world (based on rarity multipliers, anti-spam check)
     f. Check/update streak on User data object
  4. If same: return existing state
```

## Item Spawning Logic

```
On player start (new day):
  For each item in player's idealMeal:
    1. Check world for existing ground items with firstDroppedBy === profileId AND itemId === thisItemId
    2. If found: skip (anti-spam)
    3. If not found:
       spawnCount = RARITY_CONFIG[item.rarity].spawnMultiplier
       For each spawn:
         - Generate random position within spawnRadiusMin..spawnRadiusMax of key asset
         - Drop asset with FoodItemDataObject (firstDroppedBy = profileId, spawnedBySystem = true)
         - Record in world.spawnedItemsByPlayer[profileId]

  Additionally: spawn 1-2 random items from the full pool (not tied to this player's meal)
  to ensure item variety and prevent deadlocks.
```

## Item Degradation Logic

```
On GET /api/nearby-items (and periodically on game-state):
  1. Fetch all food dropped assets in world
  2. For each: check (now - lastDroppedDateTime) > 24 hours
  3. If expired: deleteDroppedAsset()
  4. Return only non-expired items
```
