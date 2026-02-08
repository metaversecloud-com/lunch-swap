# Phase 2: Server Game Logic Utilities

Pure logic functions with no SDK dependencies — fully unit-testable.

---

## Task 3: Meal Generation & Nutrition Scoring Utilities

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

  test("other 3 slots include at least 2 distinct food groups (D6)", () => {
    // Run multiple times to catch randomness
    for (let i = 0; i < 20; i++) {
      const meal = generateIdealMeal();
      const others = meal.filter(i => ["fruit", "veggie", "snack"].includes(i.foodGroup));
      const distinctGroups = new Set(others.map(i => i.foodGroup));
      expect(distinctGroups.size).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("generateBrownBag", () => {
  test("returns 8 items with exactly 1 matching the ideal meal", () => {
    const idealMeal = generateIdealMeal();
    const bag = generateBrownBag(idealMeal);
    expect(bag).toHaveLength(8);
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

  // D6: "other 3" slots must include at least 2 distinct food groups
  // e.g., 2 fruits + 1 veggie = OK, 3 fruits = NOT OK
  const otherGroups: FoodGroup[] = ["fruit", "veggie", "snack"];
  const otherPool = otherGroups.flatMap(g => FOOD_ITEMS_BY_GROUP[g]);
  let others: typeof otherPool;
  do {
    others = pickRandom(otherPool, 3);
  } while (new Set(others.map(i => i.foodGroup)).size < 2);

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

  // Pick 7 random non-ideal items (bag capacity 8, minus 1 match)
  const shuffled = [...nonIdealPool].sort(() => Math.random() - 0.5);
  const fillers = shuffled.slice(0, 7);

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
