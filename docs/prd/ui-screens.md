# UI Screens

## Screen Inventory

### Screen: New Day Welcome

- **Route**: `/` (default view, conditional on `isNewDay === true`)
- **When shown**: First time opening app today (new daily session)
- **Components used**: `NewDayWelcome`, `MealPreview`
- **Data requirements**:
  - On mount: `GET /api/game-state` (triggers daily initialization)
  - Cached from: `GlobalContext.gameState`
- **User actions**:
  - View new ideal meal target: See today's 5 target items
  - View starting bag: See 5 random items, 1 highlighted as matching
  - Tap "Let's Go!": Transitions to Main Game View
- **SDK CSS classes**:
  - Layout: `container`
  - Typography: `h1`, `h2`, `p1`
  - Buttons: `btn`

---

### Screen: Main Game View

- **Route**: `/` (default view, main state)
- **When shown**: After New Day Welcome or on same-day rejoin
- **Components used**: `BrownBag`, `IdealMealTracker`, `NearbyItems`, `SubmitMealButton`
- **Data requirements**:
  - On mount: `GET /api/game-state` (if not already loaded)
  - Polling: `GET /api/nearby-items` every 3 seconds while drawer is open
  - Cached from: `GlobalContext.gameState`
- **User actions**:
  - View Brown Bag: See 8 item slots with food group colors and rarity badges
  - View Ideal Meal: See 5 target items with collected/missing status
  - Tap bag item: Expand item detail (nutrition preview, "Drop" button)
  - Tap "Drop": Drop item from bag into world → `POST /api/drop-item`
  - View Nearby Items: List of food items within proximity radius
  - Tap nearby item: Quick-grab prompt → `POST /api/pickup-item`
  - Tap "Submit Meal" (when eligible): → `POST /api/submit-meal`
- **SDK CSS classes**:
  - Layout: `container`
  - Typography: `h2`, `p1`, `p2`
  - Buttons: `btn`, `btn-outline`, `btn-text`
  - Cards: `card`, `card-details`

---

### Screen: Item Pickup (via world click)

- **Route**: `/` (overlay state on Main Game View)
- **When shown**: Player clicks a food item in the world (drawer opens with item context)
- **Components used**: `ItemPickupPrompt`, `ItemDetail`, `NutritionPreview`
- **Data requirements**:
  - On mount: `GET /api/game-state` (to know bag state)
  - Item data: passed from clicked asset context
- **User actions**:
  - View item details: Name, food group (color-coded), rarity badge, nutrition preview
  - Tap "Grab it!": Pick up item → `POST /api/pickup-item`
  - If bag full: Swap-out flow triggers (see Modal: Bag Full Swap)
  - Tap "Leave it": Close prompt, return to main view
- **SDK CSS classes**:
  - Layout: `container`
  - Typography: `h2`, `p1`, `p2`
  - Buttons: `btn`, `btn-outline`

---

### Screen: Completion Summary

- **Route**: `/` (overlay state)
- **When shown**: After successful meal submission OR on rejoin after completion
- **Components used**: `CompletionSummary`, `NutritionScoreDisplay`, `XpBreakdown`, `BadgeDisplay`, `StreakCounter`
- **Data requirements**:
  - Cached from: `POST /api/submit-meal` response or `GET /api/game-state` (if completed)
- **User actions**:
  - View nutrition score breakdown (4 categories, 0-25 each)
  - View super combos earned
  - View XP earned (base + bonuses itemized)
  - View new badges (if any)
  - View streak info
  - "Done for today!" — informational, no action needed. Player can close drawer.
- **SDK CSS classes**:
  - Layout: `container`
  - Typography: `h1`, `h2`, `p1`, `p2`
  - Buttons: `btn`
  - Cards: `card`, `card-details`, `card-title`

---

## Admin Screens

### Screen: Admin Panel

- **Route**: Conditionally rendered when `isAdmin && showAdminPanel`
- **When shown**: Admin clicks gear icon in PageContainer header
- **Components used**: `AdminPanel`, `AdminStats`, `AdminActions`
- **Data requirements**:
  - On mount: `GET /api/admin/stats`
- **Admin actions**:
  - View stats: Items in world, starts today, completions today, pickups, drops
  - "Remove All Items": Opens confirmation → `POST /api/admin/remove-all-items`
  - "Spawn Items": Opens confirmation with optional count input → `POST /api/admin/spawn-items`
- **SDK CSS classes**:
  - Layout: `container`
  - Typography: `h2`, `p1`, `label`
  - Buttons: `btn`, `btn-danger`, `btn-outline`
  - Forms: `input`

---

## Modals & Overlays

### Modal: Bag Full Swap

- **Trigger**: Player attempts pickup when bag is at capacity (8 before completion, 3 after)
- **Content**: "Bag is full!" header. Shows current bag items as tappable cards (food group colored). Prompt: "Choose an item to drop, or cancel."
- **Actions**:
  - Tap item to drop: Highlights item red, shows "Confirm swap?" → `POST /api/swap-item` with dropItemId + pickupDroppedAssetId. On success: both particle effects, bag updates, modal closes.
  - Cancel: Close modal, food item remains in world, bag unchanged.
- **SDK CSS classes**: `btn`, `btn-outline`, `btn-danger`, `h2`, `p1`, `card`

### Modal: Drop Item Confirmation

- **Trigger**: Player taps "Drop" on a bag item
- **Content**: Item image + name + "Drop this item into the world?" prompt. Warning if item matches ideal meal: "This item is part of your ideal meal!"
- **Actions**:
  - Confirm: `POST /api/drop-item` → particle effect, item removed from bag, toast confirmation
  - Cancel: Close modal
- **SDK CSS classes**: `btn`, `btn-outline`, `h2`, `p1`

### Modal: Submit Meal Confirmation

- **Trigger**: Player taps "Submit Meal" button
- **Content**: Preview of the 5 ideal meal items collected. "Submit your meal?" prompt. Note: "Remaining items in your bag will be dropped into the world for others."
- **Actions**:
  - Confirm: `POST /api/submit-meal` → celebration animation, transition to Completion Summary
  - Cancel: Close modal
- **SDK CSS classes**: `btn`, `btn-outline`, `h2`, `p1`

### Modal: Admin Confirm Remove All

- **Trigger**: Admin clicks "Remove All Items"
- **Content**: "Remove all food items from the world? This cannot be undone."
- **Actions**:
  - Confirm: `POST /api/admin/remove-all-items` → toast with count removed
  - Cancel: Close modal
- **SDK CSS classes**: `btn`, `btn-danger`, `p1`

### Modal: Admin Confirm Spawn

- **Trigger**: Admin clicks "Spawn Items"
- **Content**: "Spawn random food items across the world?" Optional count input (default 20).
- **Actions**:
  - Confirm: `POST /api/admin/spawn-items` → toast with count spawned
  - Cancel: Close modal
- **SDK CSS classes**: `btn`, `btn-outline`, `input`, `label`, `p1`

## Loading & Error States

### Loading States

| Context | What User Sees | Implementation |
|---------|---------------|----------------|
| Initial app load | Centered spinner with "Loading your lunch..." text | PageContainer `Loading` component (existing) |
| Nearby items polling | Subtle shimmer on nearby list while refreshing | Inline loading state, no full-screen spinner |
| Picking up item | "Grab it!" button shows spinner, disabled | Local `isSubmitting` state |
| Dropping item | "Drop" button shows spinner, disabled | Local `isSubmitting` state |
| Submitting meal | Full-drawer overlay: "Preparing your meal..." with food animation | Overlay component with Lottie animation |
| Admin actions | Button shows spinner, disabled | Local `isSubmitting` state |

### Error States

| Error Type | What User Sees | Recovery Action |
|-----------|---------------|-----------------|
| Network failure | Error banner: "Something went wrong. Try again!" | Retry button re-fetches game state |
| Invalid credentials | "Session expired. Please reopen the app." | User must click key asset again |
| Item already picked up | Toast: "Someone already grabbed that one!" | Dismiss toast, try another item |
| Bag full (unexpected) | "Bag is full (N/N)! Drop an item first." (dynamic: 8/8 or 3/3) | Shows swap flow |
| Meal validation failure | "Your meal isn't complete yet." + list of missing items | Dismiss, continue collecting |
| Admin action failure | Toast: "Action failed. Please try again." | Retry |

### Empty States

| Context | What User Sees | Call to Action |
|---------|---------------|---------------|
| No nearby items | Illustration + "No food nearby. Keep exploring!" | Encourage walking around the world |
| Bag empty (edge case) | 8 empty slot outlines + "Your bag is empty. Go find some food!" | Encourage exploring |
| No items in world (admin view) | Stats show 0 items + "No food in the world yet." | "Spawn Items" button prominent |

## Key UI Components

### BrownBag

8-slot grid showing current inventory (bag capacity: 8, ideal meal: 5). Each slot:
- Food item image (from asset)
- Item name
- Food group color-coded border/badge
- Rarity indicator (border style: solid = common, dashed = rare, double = epic)
- Ideal meal match glow (green pulse if item is in ideal meal)
- Tap to expand: nutrition preview + drop button
- Empty slot: dotted border outline

### IdealMealTracker

5-slot horizontal display of target meal:
- Collected items: Full color, food group border, checkmark
- Missing items: Silhouette/grayscale, food group color border (faded)
- Categories labeled: "Drink", "Main", "Fruit/Veggie/Snack" x3
- Progress indicator: "3/5 collected" with progress bar
- All 5 collected: glow animation, "Submit Meal" button pulses

### NearbyItems

Scrollable list of food items within proximity radius:
- Each item: image, name, food group badge, rarity badge, distance indicator
- Items matching ideal meal: highlighted with star icon
- Sorted by distance (closest first)
- "Grab it!" button on each item
- Auto-updates every 3 seconds while drawer is open

### NutritionPreview

Health-bar style breakdown shown on item detail:
- 4 horizontal bars: protein, carbs, fiber, vitamins
- Each bar is proportional and color-coded
- Simple enough for ages 7-17 to understand at a glance
- "Did you know?" fact below the bars

### NutritionScoreDisplay

Post-submission score breakdown:
- Large score number (0-100) with circular progress ring
- 4 quadrant breakdown: protein (0-25), fiber (0-25), vitamin diversity (0-25), balance (0-25)
- Each quadrant labeled and colored
- Super Combo callouts with item pair icons
- Letter grade overlay (A+, A, B+, B, C+, C)

## Food Group Color System

All UI consistently uses these colors to reinforce food group learning:

| Food Group | Color | Hex | Usage |
|-----------|-------|-----|-------|
| Drink | Blue | `#4A90D9` | Borders, badges, background tints |
| Fruit | Red-Orange | `#E8564A` | Borders, badges, background tints |
| Veggie | Green | `#5CB85C` | Borders, badges, background tints |
| Main | Amber | `#F0AD4E` | Borders, badges, background tints |
| Snack | Purple | `#9B59B6` | Borders, badges, background tints |

Applied to: bag item borders, ideal meal slot borders, nearby item badges, nutrition preview labels, item detail headers.

## Component Tree

```
App (DO NOT MODIFY)
  PageContainer (DO NOT MODIFY)
    GameView
      NewDayWelcome (conditional: isNewDay && !dismissed)
        MealPreview
      MainGameView (primary state)
        IdealMealTracker
        BrownBag
          BagItem (repeated, max 8; max 3 after completion)
            ItemDetail (expanded state)
              NutritionPreview
        NearbyItems
          NearbyItemCard (repeated)
        SubmitMealButton (conditional: all ideal items collected)
      ItemPickupPrompt (conditional: clicked food asset in world)
        ItemDetail
          NutritionPreview
      CompletionSummary (conditional: completedToday)
        NutritionScoreDisplay
        XpBreakdown
        BadgeDisplay
        StreakCounter
    AdminPanel (conditional: isAdmin && showAdminPanel)
      AdminStats
      AdminActions
    BagFullSwapModal (conditional: swapFlowActive)
    DropConfirmModal (conditional: dropConfirmActive)
    SubmitMealConfirmModal (conditional: submitConfirmActive)
    AdminConfirmModal (conditional: adminConfirmActive)
```

## Accessibility Notes (WCAG 2.2 AA)

- All food group colors meet 4.5:1 contrast ratio against white/dark backgrounds
- Bag items and nearby items are keyboard navigable (tab order, enter to select)
- All modals trap focus and can be closed with Escape
- Item images have alt text: "[Item name] — [food group], [rarity]"
- Progress indicators have aria-valuenow/aria-valuemax
- Rarity is conveyed via text label, not just border style (for color-blind users)
- Touch targets minimum 44x44px for all interactive elements
- `prefers-reduced-motion`: disable pulse animations, glow effects, particle shimmer
- Screen reader: bag items announce "[name], [food group], [rarity], [matches/does not match ideal meal]"
