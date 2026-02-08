# Phase 6.5: Engagement & Variable Reinforcement (UI)

Client-side components for mystery items, bonus wheel, and hot streaks.

---

## Task 18.5: Mystery Item Reveal

**Files:**
- Modify: `client/src/components/NearbyItemCard.tsx` — show "???" for mystery items
- Create: `client/src/components/MysteryReveal.tsx` — reveal animation on pickup
- Modify: `client/src/components/index.ts`

**MysteryReveal**: Shown when a pickup response has `wasMystery: true`. Animated card flip: "?" on front, actual item on back. Short animation (1.5s), then transitions to normal bag view. Sound-optional (CSS animation only).

**NearbyItemCard changes**: When item `rarity === "mystery"`, show "?" image, "???" name, but food group color border as a hint. "Grab it!" button still works.

**Step 1: Implement components**

**Step 2: Commit**

```bash
git commit -m "feat: add mystery item reveal animation and hidden nearby cards"
```

---

## Task 18.6: Bonus Wheel UI

**Files:**
- Create: `client/src/components/BonusWheel.tsx`
- Create: `client/src/components/BonusWheelPrompt.tsx`
- Create: `client/src/components/ActiveBuff.tsx`
- Modify: `client/src/components/GameView.tsx` — show wheel prompt on new day with ticket
- Modify: `client/src/components/index.ts`

**BonusWheelPrompt**: Shown on new day if `hasMealTicket === true`. "You have a Meal Ticket! Spin the wheel for today's bonus?" with "Spin!" and "Save for later" buttons. Uses SDK classes: `btn`, `btn-outline`, `h2`, `p1`.

**BonusWheel**: CSS-animated spinning wheel with 5 segments (colored by buff). Spins for 2-3 seconds after calling `POST /api/spin-wheel`, lands on the won buff. Celebration animation on land. Respect `prefers-reduced-motion`.

**ActiveBuff**: Small persistent indicator in the game view header showing the active buff icon + name. e.g., "2x XP" with a sparkle icon. Visible throughout the session.

**Step 1: Implement all components**

**Step 2: Commit**

```bash
git commit -m "feat: add bonus wheel UI with spin animation and active buff indicator"
```

---

## Task 18.7: Hot Streak UI

**Files:**
- Create: `client/src/components/HotStreakIndicator.tsx`
- Modify: `client/src/components/MainGameView.tsx` — show streak indicator
- Modify: `client/src/components/index.ts`

**HotStreakIndicator**: Shows in the game view when `idealPickupStreak > 0`.
- 1 matching pickup: 1 flame icon
- 2 matching pickups: 2 flame icons, pulsing
- 3 (hot streak active): "HOT STREAK!" banner with flame animation, "3x XP on next pickup!" text
- After the 3x pickup lands: brief "3x XP!" celebration, then indicator resets

CSS-only animation. Flame icons via CSS shapes or emoji fallback. `prefers-reduced-motion`: static icons, no pulse.

**Step 1: Implement component**

**Step 2: Commit**

```bash
git commit -m "feat: add hot streak indicator with flame animation"
```
