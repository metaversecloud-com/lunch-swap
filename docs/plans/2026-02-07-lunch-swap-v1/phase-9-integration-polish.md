# Phase 9: Integration & Polish

---

## Task 22: End-to-End Smoke Tests

**Files:**
- Modify: `server/tests/routes.test.ts`
- Possibly new: `server/tests/integration.test.ts`

Run the full test suite. Fix any broken tests from Phase 3-4 changes. Add integration-style tests that exercise the full flow:
1. GET game-state (new day) -> verify response shape matches `GameState` interface
2. POST drop-item -> verify bag shrinks by 1
3. POST pickup-item -> verify bag grows by 1
4. POST submit-meal -> verify completion set, nutrition score returned

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

## Task 23: CSS & Styling Pass

**Files:**
- Create: `client/src/styles/game.css` (if needed for custom game styles beyond SDK classes)
- Modify: various component files as needed

Review all components for:
- SDK CSS class usage (no Tailwind where SDK classes exist — `btn` not `bg-blue-500 px-4 py-2`)
- Food group color consistency (all using `FOOD_GROUP_COLORS` constants)
- Rarity visual indicators (text labels, not just border style)
- Touch targets minimum 44x44px for all interactive elements
- `prefers-reduced-motion` media queries disabling: pulse animations, glow effects, particle shimmer
- WCAG 2.2 AA contrast ratios (4.5:1 text, 3:1 large text/UI)
- No inline styles except dynamic positioning

**Step 1: Audit each component**

**Step 2: Fix issues**

**Step 3: Commit**

```bash
git add client/src/
git commit -m "style: apply SDK CSS classes, food group colors, and accessibility polish"
```

---

## Task 24: Final Accessibility Audit

Run `/accessibility-compliance` against all new components. Check:
- Semantic HTML + proper heading hierarchy (h1 -> h2 -> h3, no skips)
- ARIA labels on all interactive elements
- Keyboard navigation: tab order follows visual order, no keyboard traps
- Focus visible on all focusable elements (never `outline: none` without replacement)
- Color contrast meets AA minimums
- Screen reader announcements for dynamic content: bag changes, nearby item updates, score reveals
- Modals: focus trap, Escape to close, return focus to trigger element
- Progress bars: `aria-valuenow`, `aria-valuemax`, `aria-label`
- Toggle buttons: `aria-pressed`
- Images: alt text "[Item name] — [food group], [rarity]"

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
