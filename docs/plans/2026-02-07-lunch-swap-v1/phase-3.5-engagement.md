# Phase 3.5: Engagement & Variable Reinforcement (Server)

Three mechanics that add variable reinforcement to the core game loop.

See `decisions.md` D8, D9, D10 for full design details.

---

## Task 9.5: Mystery Items

**Files:**
- Modify: `shared/types/DataObjects.ts` — add `isMystery: boolean` to `FoodItemAssetData`
- Modify: spawning logic in `handleGetGameState` and `handleAdminSpawnItems`
- Modify: `handlePickupItem` — reveal logic
- Modify: `handleGetNearbyItems` — hide item identity for mystery items
- Test: `server/tests/mystery-items.test.ts`

**Step 1: Write failing tests**

Test scenarios:
- ~15% of spawned items have `isMystery: true`
- Nearby-items response hides name/rarity for mystery items (shows "???" and "mystery")
- Pickup response includes `wasMystery: true` and real item data when picking up mystery item
- Pickup of non-mystery item has `wasMystery: false`

**Step 2: Run tests to verify fail**

**Step 3: Implement mystery item logic**

In spawn logic: `isMystery = Math.random() < 0.15`

In `handleGetNearbyItems`: if `isMystery`, return `{ name: "???", rarity: "mystery", foodGroup: item.foodGroup }` (food group color still visible as a hint)

In `handlePickupItem`: if picked-up item was mystery, add `wasMystery: true` to response for reveal animation

**Step 4: Run tests, verify pass**

**Step 5: Commit**

```bash
git commit -m "feat: add mystery items (~15% of spawns hidden until pickup)"
```

---

## Task 9.6: Reward Tokens & Daily Bonus Wheel

**Files:**
- Create: `server/controllers/handleSpinWheel.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts` — add `POST /api/spin-wheel`
- Modify: `shared/types/DataObjects.ts` — add `dailyBuff` to `VisitorGameData`
- Create: `shared/data/wheelBuffs.ts`
- Modify: `handleGetGameState` — check for Reward Token in inventory, apply active buff
- Test: `server/tests/spin-wheel.test.ts`

**Important:** Reward Tokens are a **universal Topia ecosystem token** — NOT specific to this game. Teachers award them across the entire platform for positive behaviors, learning objectives, etc. Any game can read and consume them. This game:
1. Reads the player's inventory to check if they have a Reward Token
2. Consumes one on wheel spin
3. Does NOT create or define the token — it's a platform-level ecosystem inventory item managed in the Topia dashboard
The token's inventory item ID will be configured via an environment variable or game config (so it's not hardcoded).

**Step 1: Create `shared/data/wheelBuffs.ts`**

```typescript
export interface WheelBuff {
  id: string;
  name: string;
  description: string;
  weight: number;  // Probability weight (higher = more likely)
}

export const WHEEL_BUFFS: WheelBuff[] = [
  { id: "double-xp", name: "Double XP", description: "All XP earned today is 2x!", weight: 30 },
  { id: "rare-start", name: "Rare Start", description: "One bag item upgraded to rare!", weight: 25 },
  { id: "big-bag", name: "Big Bag", description: "+2 bag slots for today!", weight: 20 },
  { id: "combo-finder", name: "Combo Finder", description: "Super combo pairs glow nearby!", weight: 15 },
  { id: "epic-drop", name: "Epic Drop", description: "A random epic item appears in your bag!", weight: 10 },
];

export function spinWheel(): WheelBuff {
  const totalWeight = WHEEL_BUFFS.reduce((sum, b) => sum + b.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const buff of WHEEL_BUFFS) {
    roll -= buff.weight;
    if (roll <= 0) return buff;
  }
  return WHEEL_BUFFS[0]; // fallback
}
```

**Step 2: Write failing tests**

Test scenarios:
- `POST /api/spin-wheel` returns 400 if no Reward Token in inventory
- `POST /api/spin-wheel` returns a buff and consumes 1 Reward Token
- `POST /api/spin-wheel` returns 400 if already spun today (`dailyBuff !== null`)
- `GET /api/game-state` includes `hasRewardToken: true/false` and `dailyBuff`
- Buff effects apply: "double-xp" doubles XP in pickup/submit, "big-bag" increases capacity to 10

**Step 3: Run tests to verify fail**

**Step 4: Implement `handleSpinWheel.ts`**

1. Get credentials, get visitor
2. Check `visitor.dataObject.dailyBuff` — if already set, return 400 "Already spun today"
3. Check inventory for Reward Token — if none, return 400 "No Reward Tokens"
4. Consume 1 Reward Token from inventory
5. Spin wheel (weighted random)
6. Store buff in visitor data: `dailyBuff: buff.id`
7. Apply immediate buffs (e.g., "rare-start" upgrades a bag item, "epic-drop" adds item to bag)
8. Return buff details for wheel animation

**Step 5: Update `handleGetGameState`**

Add to response: `hasRewardToken` (check inventory), `dailyBuff` (from visitor data)

**Step 6: Wire buff effects into existing controllers**

- `handlePickupItem`: if `dailyBuff === "double-xp"`, multiply XP by 2
- `handlePickupItem`: if `dailyBuff === "big-bag"`, use capacity 10 instead of 8
- `handleSubmitMeal`: if `dailyBuff === "double-xp"`, multiply all XP by 2
- `handleGetNearbyItems`: if `dailyBuff === "combo-finder"`, flag combo-pair items

**Step 7: Add route**

```typescript
router.post("/spin-wheel", handleSpinWheel);
```

**Step 8: Run tests, verify pass**

**Step 9: Commit**

```bash
git commit -m "feat: add Reward Token / Daily Bonus Wheel with weighted buffs"
```

---

## Task 9.7: Hot Streaks

**Files:**
- Modify: `shared/types/DataObjects.ts` — add `idealPickupStreak: number`, `hotStreakActive: boolean` to `VisitorGameData`
- Modify: `handlePickupItem` — streak tracking + 3x XP on hot streak
- Test: `server/tests/hot-streak.test.ts`

**Step 1: Write failing tests**

Test scenarios:
- Picking up an ideal-meal-matching item increments `idealPickupStreak`
- Picking up a non-matching item resets `idealPickupStreak` to 0
- When `idealPickupStreak` reaches 3, `hotStreakActive` is set to true
- Next pickup (any item) with `hotStreakActive` gets 3x XP, then `hotStreakActive` resets to false
- Dropping an item resets `idealPickupStreak` to 0

**Step 2: Run tests to verify fail**

**Step 3: Implement hot streak logic in `handlePickupItem`**

```typescript
// After determining matchesIdealMeal:
if (hotStreakActive) {
  xpMultiplier = 3;
  updatedVisitorData.hotStreakActive = false;
  updatedVisitorData.idealPickupStreak = 0;
} else if (matchesIdealMeal) {
  updatedVisitorData.idealPickupStreak = (currentStreak + 1);
  if (updatedVisitorData.idealPickupStreak >= 3) {
    updatedVisitorData.hotStreakActive = true;
    // Fire "HOT STREAK!" toast
  }
} else {
  updatedVisitorData.idealPickupStreak = 0;
}
```

**Step 4: Update `handleDropItem` to reset streak**

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git commit -m "feat: add hot streaks (3 ideal pickups in a row -> 3x XP)"
```
