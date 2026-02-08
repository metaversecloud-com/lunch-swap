# Phase 5: Client State & Context

Update the client state management to support the full game state.

---

## Task 11: Update Client Context for Game State

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
// + UI-only state: isNewDay, nearbyItems
```

Import types from `@shared/types/FoodItem`, `@shared/types/NearbyItem`, `@shared/types/NutritionScore`.

Expanded `InitialState`:
```typescript
export interface InitialState {
  // Existing
  isAdmin?: boolean;
  error?: string;
  hasInteractiveParams?: boolean;
  visitorData?: VisitorDataObject;
  droppedAsset?: DroppedAssetInterface;
  // Game state (from server)
  isNewDay?: boolean;
  brownBag?: BagItem[];
  idealMeal?: IdealMealItem[];
  completedToday?: boolean;
  nutritionScore?: number | null;
  superCombosFound?: string[];
  xp?: number;
  level?: number;
  currentStreak?: number;
  // Nearby items (from polling)
  nearbyItems?: NearbyItem[];
  // Note: autoGrabEnabled DEFERRED to V1.1 (D4)
}
```

**Step 2: Update `reducer.ts`**

Add cases for new action types. `SET_GAME_STATE` should spread all game fields from the API response. Add:
- `SET_BROWN_BAG`: update brownBag (after pickup/drop/swap)
- `SET_IDEAL_MEAL`: update idealMeal collected flags
- `SET_NEARBY_ITEMS`: update nearbyItems (from polling)
- `SET_COMPLETED`: set completion state (after submit-meal)

**Step 3: Update `constants.ts`**

Set initial values for all new state fields:
```typescript
export const initialState = {
  error: "",
  gameState: {},
  hasInteractiveParams: false,
  isNewDay: false,
  brownBag: [],
  idealMeal: [],
  completedToday: false,
  nutritionScore: null,
  superCombosFound: [],
  xp: 0,
  level: 1,
  currentStreak: 0,
  nearbyItems: [],
  // autoGrabEnabled: DEFERRED to V1.1 (D4)
};
```

**Step 4: Commit**

```bash
git add client/src/context/
git commit -m "feat: expand client state management for game state"
```
