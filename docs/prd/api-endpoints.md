# API Endpoints

## Route Table

| Method | Path | Controller | Description | Auth |
|--------|------|-----------|-------------|------|
| GET | `/api/` | (inline) | Health check | None |
| GET | `/api/system/health` | (inline) | System status | None |
| GET | `/api/game-state` | `handleGetGameState` | Get/initialize daily game state (bag, ideal meal, XP, streaks) | Visitor |
| GET | `/api/nearby-items` | `handleGetNearbyItems` | Get food items within proximity radius of player | Visitor |
| POST | `/api/pickup-item` | `handlePickupItem` | Pick up a food item from the world into bag | Visitor |
| POST | `/api/drop-item` | `handleDropItem` | Drop an item from bag into the world | Visitor |
| POST | `/api/swap-item` | `handleSwapItem` | Atomic swap: drop one item and pick up another (full bag) | Visitor |
| POST | `/api/submit-meal` | `handleSubmitMeal` | Validate and submit completed ideal meal for rewards | Visitor |
| POST | `/api/admin/remove-all-items` | `handleAdminRemoveAllItems` | Remove all food items from world | Admin |
| POST | `/api/admin/spawn-items` | `handleAdminSpawnItems` | Spawn random food items across world | Admin |
| GET | `/api/admin/stats` | `handleAdminGetStats` | Get world-level game statistics | Admin |
| GET | `/api/dev/world-info` | `handleDevGetWorldInfo` | Dev: get world details | Dev |
| POST | `/api/dev/drop-asset` | `handleDevDropAsset` | Dev: drop test asset | Dev |

## Endpoint Details

### GET `/api/game-state` - Get or Initialize Daily Game State

**Controller**: `handleGetGameState`
**File**: `server/controllers/handleGetGameState.ts`

**Request**:

```typescript
// Query parameters (via backendAPI interceptor)
// Standard credentials — no additional params needed
```

**Response (success — new day)**:

```typescript
// HTTP 200
interface GameStateNewDayResponse {
  success: true;
  isNewDay: true;
  brownBag: BagItem[];                 // 5 items, 1 matching ideal meal
  idealMeal: IdealMealItem[];          // 5 items: 1 drink, 1 main, 3 from fruit/veggie/snack
  completedToday: false;
  nutritionScore: null;
  superCombosFound: [];
  xp: number;                         // From User data object
  level: number;
  currentStreak: number;
  isAdmin: boolean;
  droppedAsset: DroppedAssetInterface; // Key asset data
}
```

**Response (success — same day, resuming)**:

```typescript
// HTTP 200
interface GameStateResumeResponse {
  success: true;
  isNewDay: false;
  brownBag: BagItem[];
  idealMeal: IdealMealItem[];
  completedToday: boolean;
  nutritionScore: number | null;
  superCombosFound: string[];
  xp: number;
  level: number;
  currentStreak: number;
  isAdmin: boolean;
  droppedAsset: DroppedAssetInterface;
}
```

**SDK Methods Used**:

- `DroppedAsset.get()` - Fetch key asset
- `Visitor.get()` - Get visitor (isAdmin check)
- `visitor.fetchDataObject()` - Get current visitor state
- `visitor.setDataObject()` / `visitor.updateDataObject()` - Initialize or update daily state
- `User.create()` + `user.fetchDataObject()` / `user.updateDataObject()` - XP, level, streak
- `World.create()` + `world.fetchDataObject()` - World config + spawn tracking
- `world.fetchDroppedAssetsWithUniqueName()` - Check for existing spawned items (anti-spam)
- `DroppedAsset.drop()` - Spawn food items (on new day)
- `visitor.triggerParticle()` - Welcome particle
- `visitor.fireToast()` - "New Day!" or "Welcome back!" toast

**Analytics piggyback**: `Starts`, `UniqueStarts`, `Joins`, `UniqueJoins`

---

### GET `/api/nearby-items` - Get Nearby Food Items

**Controller**: `handleGetNearbyItems`
**File**: `server/controllers/handleGetNearbyItems.ts`

**Request**:

```typescript
// Standard credentials — visitor position is read from Visitor.get()
```

**Response (success)**:

```typescript
// HTTP 200
interface NearbyItemsResponse {
  success: true;
  nearbyItems: NearbyItem[];          // Sorted by distance, closest first
  playerPosition: { x: number; y: number };
}
```

**SDK Methods Used**:

- `Visitor.get()` - Get visitor position (x, y)
- `visitor.fetchDataObject()` - Get ideal meal (to flag matchesIdealMeal)
- `world.fetchDroppedAssetsWithUniqueName()` - Get all food items with `uniqueName` pattern
- For each: `droppedAsset.fetchDataObject()` - Get food metadata
- Expired items (>24h since lastDroppedDateTime): `droppedAsset.deleteDroppedAsset()` - Cleanup

---

### POST `/api/pickup-item` - Pick Up Food Item

**Controller**: `handlePickupItem`
**File**: `server/controllers/handlePickupItem.ts`

**Request**:

```typescript
interface PickupItemRequest {
  droppedAssetId: string;              // ID of the food asset in the world
}
```

**Response (success)**:

```typescript
// HTTP 200
interface PickupItemResponse {
  success: true;
  pickedUpItem: BagItem;
  updatedBag: BagItem[];
  funFact: string;                     // "Did you know?" text for toast
  matchesIdealMeal: boolean;
  xpEarned: number;
}
```

**Response (error — item already gone)**:

```typescript
// HTTP 409
interface PickupConflictResponse {
  success: false;
  error: "This item was already picked up.";
}
```

**Response (error — bag full)**:

```typescript
// HTTP 400
interface PickupBagFullResponse {
  success: false;
  error: "Bag is full. Drop an item first or use swap.";
}
```

**SDK Methods Used**:

- `DroppedAsset.get()` + `droppedAsset.fetchDataObject()` - Get food item
- `droppedAsset.deleteDroppedAsset()` - Remove from world
- `Visitor.get()` + `visitor.fetchDataObject()` - Get current bag
- `visitor.updateDataObject()` - Add item to bag, increment pickupsToday
- `User.create()` + `user.updateDataObject()` - Add to uniqueItemsCollected, increment totalPickups
- `visitor.fireToast()` - "Did you know?" food fact
- `visitor.triggerParticle()` - Pickup particle effect (Sparkle)

**Analytics piggyback**: `Pickups`, `UniquePickups`

---

### POST `/api/drop-item` - Drop Item from Bag

**Controller**: `handleDropItem`
**File**: `server/controllers/handleDropItem.ts`

**Request**:

```typescript
interface DropItemRequest {
  itemId: string;                      // itemId of the food to drop from bag
}
```

**Response (success)**:

```typescript
// HTTP 200
interface DropItemResponse {
  success: true;
  droppedItem: BagItem;
  updatedBag: BagItem[];
  droppedAssetId: string;              // ID of newly created world asset
}
```

**SDK Methods Used**:

- `Visitor.get()` - Get visitor position (to place item near avatar)
- `visitor.fetchDataObject()` - Get current bag
- `visitor.updateDataObject()` - Remove item from bag, increment dropsToday
- `Asset.create()` + `DroppedAsset.drop()` - Place food item in world near avatar
- `droppedAsset.setDataObject()` - Set food metadata (lastDroppedBy = this player)
- `visitor.triggerParticle()` - Drop particle effect
- `User.create()` + `user.updateDataObject()` - Increment totalDrops

**Analytics piggyback**: `Drops`, `UniqueDrops`

---

### POST `/api/swap-item` - Atomic Drop + Pickup (Full Bag)

**Controller**: `handleSwapItem`
**File**: `server/controllers/handleSwapItem.ts`

**Request**:

```typescript
interface SwapItemRequest {
  dropItemId: string;                  // itemId to drop from bag
  pickupDroppedAssetId: string;        // droppedAssetId of world item to pick up
}
```

**Response (success)**:

```typescript
// HTTP 200
interface SwapItemResponse {
  success: true;
  droppedItem: BagItem;
  pickedUpItem: BagItem;
  updatedBag: BagItem[];
  funFact: string;
  matchesIdealMeal: boolean;
  xpEarned: number;
}
```

**SDK Methods Used**:

- All methods from both `drop-item` and `pickup-item` combined
- Operations are sequential: pickup-asset lock first, then bag update atomically

---

### POST `/api/submit-meal` - Submit Completed Meal

**Controller**: `handleSubmitMeal`
**File**: `server/controllers/handleSubmitMeal.ts`

**Request**:

```typescript
// No body needed — validates from current bag vs ideal meal in visitor data
```

**Response (success)**:

```typescript
// HTTP 200
interface SubmitMealResponse {
  success: true;
  nutritionScore: NutritionScoreResult;
  totalXpEarned: number;              // Base + nutrition bonus + combos + streak
  newLevel: number | null;            // Non-null if leveled up
  badgesEarned: string[];             // Badge names earned from this submission
  remainingItemsDropped: number;      // Count of non-meal items auto-dropped
  streakInfo: {
    currentStreak: number;
    isNewRecord: boolean;
  };
}
```

**Response (error — incomplete meal)**:

```typescript
// HTTP 400
interface SubmitMealErrorResponse {
  success: false;
  error: "Meal is not complete. You still need: [missing items]";
  missingItems: string[];
}
```

**SDK Methods Used**:

- `visitor.fetchDataObject()` - Get bag + ideal meal for validation
- `visitor.updateDataObject()` - Set completedToday, nutritionScore, clear used items
- `User.create()` + `user.fetchDataObject()` + `user.updateDataObject()` - XP, level, streak, lifetime stats
- `visitor.grantInventoryItem()` - Award badges (with idempotency)
- `visitor.triggerParticle()` - Celebration particle (Fireworks)
- `visitor.fireToast()` - "Meal Complete!" with score
- Auto-drop remaining items: `Asset.create()` + `DroppedAsset.drop()` for each non-meal item
- `world.updateDataObject()` - Increment totalCompletionsToday

**Analytics piggyback**: `Completions`, `UniqueCompletions`, `MealSubmissions`, `UniqueMealSubmissions`

---

### POST `/api/admin/remove-all-items` - Remove All Food Items

**Controller**: `handleAdminRemoveAllItems`
**File**: `server/controllers/admin/handleAdminRemoveAllItems.ts`

**Request**:

```typescript
// No body — removes all food items from world
```

**Response (success)**:

```typescript
// HTTP 200
interface RemoveAllItemsResponse {
  success: true;
  removedCount: number;
}
```

**SDK Methods Used**:

- `Visitor.get()` - Admin check (`isAdmin`)
- `world.fetchDroppedAssetsWithUniqueName()` - Find all food items (uniqueName pattern: `lunch-swap-food-*`)
- `World.deleteDroppedAssets()` - Bulk delete

---

### POST `/api/admin/spawn-items` - Spawn Random Items

**Controller**: `handleAdminSpawnItems`
**File**: `server/controllers/admin/handleAdminSpawnItems.ts`

**Request**:

```typescript
interface AdminSpawnItemsRequest {
  count?: number;                      // Number of items to spawn (default: 20)
}
```

**Response (success)**:

```typescript
// HTTP 200
interface AdminSpawnItemsResponse {
  success: true;
  spawnedCount: number;
  items: { itemId: string; name: string; rarity: Rarity }[];
}
```

**SDK Methods Used**:

- `Visitor.get()` - Admin check
- `Asset.create()` + `DroppedAsset.drop()` - For each item, random position in spawn radius

---

### GET `/api/admin/stats` - Get World Statistics

**Controller**: `handleAdminGetStats`
**File**: `server/controllers/admin/handleAdminGetStats.ts`

**Request**:

```typescript
// Standard credentials
```

**Response (success)**:

```typescript
// HTTP 200
interface AdminStatsResponse {
  success: true;
  stats: {
    totalItemsInWorld: number;
    totalStartsToday: number;
    totalCompletionsToday: number;
    totalPickups: number;
    totalDrops: number;
    totalMealSubmissions: number;
  };
}
```

**SDK Methods Used**:

- `Visitor.get()` - Admin check
- `world.fetchDataObject()` - Read world stats
- `world.fetchDroppedAssetsWithUniqueName()` - Count current food items

---

## Authentication & Authorization

### Credential Validation

All routes (except health check) require valid interactive credentials passed as query parameters. The `getCredentials()` utility validates their presence and checks `interactivePublicKey` matches `INTERACTIVE_KEY`.

### Admin Authorization

- Admin status is checked via: `const visitor = await Visitor.get(visitorId, urlSlug, { credentials }); const { isAdmin } = visitor;`
- Admin-only routes: `POST /api/admin/remove-all-items`, `POST /api/admin/spawn-items`, `GET /api/admin/stats`
- Admin check happens at the top of each admin controller. Returns 403 if not admin.

## Rate Limiting

| Concern | Mitigation |
|---------|-----------|
| Rapid pickup attempts | Lock on DroppedAsset prevents double-pickup; 409 on conflict |
| Spam app opens for spawning | Anti-spam check: skip spawn if player already has items of that type on ground |
| SDK API rate limits | Cache visitor data in request scope; batch position reads; avoid redundant fetchDataObject calls |
| Concurrent bag updates | Visitor data lock (1-minute window) ensures atomic bag modifications |
| Rapid nearby-items polling | Client debounce (poll every 3 seconds max); server response is lightweight |

## Webhook Endpoints (if applicable)

None for V1. Future consideration: zone-based webhooks for proximity detection (if SDK supports zone enter/exit hooks that could replace polling).

## External Integrations (if applicable)

None for V1. Future: Leaderboard service integration for cross-world rankings.

## Routes File Structure

```typescript
// server/routes.ts
import { Router } from "express";
import {
  handleGetGameState,
  handleGetNearbyItems,
  handlePickupItem,
  handleDropItem,
  handleSwapItem,
  handleSubmitMeal,
  handleAdminRemoveAllItems,
  handleAdminSpawnItems,
  handleAdminGetStats,
} from "./controllers/index.js";

const router = Router();

// Health
router.get("/", (req, res) => res.json({ message: "Lunch Swap API" }));
router.get("/system/health", (req, res) =>
  res.json({ status: "ok", version: getVersion(), timestamp: new Date().toISOString() })
);

// Game
router.get("/game-state", handleGetGameState);
router.get("/nearby-items", handleGetNearbyItems);
router.post("/pickup-item", handlePickupItem);
router.post("/drop-item", handleDropItem);
router.post("/swap-item", handleSwapItem);
router.post("/submit-meal", handleSubmitMeal);

// Admin
router.post("/admin/remove-all-items", handleAdminRemoveAllItems);
router.post("/admin/spawn-items", handleAdminSpawnItems);
router.get("/admin/stats", handleAdminGetStats);

export default router;
```
