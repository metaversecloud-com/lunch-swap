# User Flows

## Entry Point

- **Trigger type**: CLICK_ASSET
- **Asset/zone name**: "Lunch Swap" key asset (interactive dropped asset in world)
- **What the user sees first**: App iframe opens as side drawer showing either "New Day" state (first join today) or "Resume" state (rejoin same day)

**Secondary entry**: Clicking a dropped food item in the world also opens the app iframe, pre-focused on that item's pickup prompt.

## Primary User Flow

### Start Day & Collect Meal (Primary)

| Step | User Action | What They See | Backend Action |
|------|------------|---------------|----------------|
| 1 | Clicks key asset | Loading spinner, then "New Day!" screen with brown bag (8 items, 1 highlighted as matching ideal meal) and ideal meal target list (5 items) | `GET /api/game-state` — checks if new day, generates brown bag (8 items) + ideal meal (5 items) if first visit today, spawns items into world |
| 2 | Reviews ideal meal | 5-slot ideal meal display: 1 drink, 1 main, 3 from fruit/veggie/snack. Matching items glow. Missing items shown as silhouettes with food group color | None (client rendering from game-state data) |
| 3 | Taps item in bag to drop | Item highlights with "Drop" button. On confirm: item disappears from bag, particle effect plays | `POST /api/drop-item` — removes item from visitor data, creates dropped asset in world with tracking metadata |
| 4 | Walks around world with drawer open | "Nearby" section updates as avatar moves. Items within range appear with name, rarity badge, and food group color | `GET /api/nearby-items` — returns food assets within proximity radius of visitor position |
| 5 | Taps nearby item to pick up | "Grab it!" button on item card. On confirm: item appears in bag, "Did you know?" toast with food fact, pickup particle effect | `POST /api/pickup-item` — validates bag capacity, removes dropped asset, adds to visitor bag, fires toast + particle |
| 6 | Collects all 5 ideal meal items (bag may hold up to 8) | "Submit Meal" button activates with glow animation. Ideal meal display shows all 5 slots filled | None (client state comparison of bag vs ideal meal) |
| 7 | Taps "Submit Meal" | Validation screen → celebration animation → Nutrition Score breakdown → XP earned → badge awarded (if applicable) → remaining non-meal items auto-dropped into world → bag capacity reduced to 3 | `POST /api/submit-meal` — validates meal matches ideal, calculates nutrition score + super combos, grants XP, checks/grants badges, drops remaining items, marks day complete, reduces bag capacity to 3 |
| 8 | Views completion summary | "Meal Complete!" screen with nutrition score (0-100), XP earned, any new badges, super combo bonuses found. "Done for today" message. Can still pick up/drop items with reduced 3-slot bag. | None (rendered from submit-meal response) |

## Secondary User Flows

### Rejoin Same Day

| Step | User Action | What They See | Backend Action |
|------|------------|---------------|----------------|
| 1 | Clicks key asset (same day, already started) | "Welcome back!" screen with current bag contents and ideal meal progress | `GET /api/game-state` — detects same day, returns existing bag + ideal meal + completion status |
| 2 | Continues collecting | Same as primary flow steps 3-8 | Same as primary flow |

### Rejoin After Completion

| Step | User Action | What They See | Backend Action |
|------|------------|---------------|----------------|
| 1 | Clicks key asset (same day, already completed) | "Meal Complete!" summary screen with today's stats. "Come back tomorrow for a new meal!" Bag capacity is 3 — player can still pick up/drop items to help others. | `GET /api/game-state` — detects completion, returns completion data with reduced bag capacity |

### Click Food Item in World (Drawer Closed)

| Step | User Action | What They See | Backend Action |
|------|------------|---------------|----------------|
| 1 | Clicks dropped food asset in world | Drawer opens with item detail at top: name, food group, rarity, nutrition preview, "Grab it!" button | `GET /api/game-state` + item context from clicked asset |
| 2a | Taps "Grab it!" (bag has space) | Item added to bag, toast confirmation, drawer shows updated bag | `POST /api/pickup-item` |
| 2b | Taps "Grab it!" (bag full) | Swap-out flow triggered (see below) | None yet — client shows swap UI |

### Full Bag Swap-Out

| Step | User Action | What They See | Backend Action |
|------|------------|---------------|----------------|
| 1 | Attempts pickup at 8/8 capacity | "Bag is full!" message with current bag items. Each item has a "Drop this instead" button. "Cancel" button at bottom | None (client-side flow) |
| 2a | Selects item to drop | Selected item highlighted red. "Confirm swap?" prompt | None (client-side selection) |
| 3a | Confirms swap | Old item dropped into world (particle effect), new item added to bag (particle effect), bag updates | `POST /api/swap-item` — atomic: drops old item, picks up new item, updates visitor data |
| 2b | Taps "Cancel" | Drawer returns to normal bag view, food item remains in world | None |

### Auto-Grab Mode

| Step | User Action | What They See | Backend Action |
|------|------------|---------------|----------------|
| 1 | Toggles "Auto-Grab" switch in drawer | Magnet icon activates, mode label shows "Auto-Grab ON" | None (client-side toggle, stored in local state) |
| 2 | Walks near a food item | Item auto-added to bag, toast: "Auto-grabbed: [item name]!", pickup particle | `POST /api/pickup-item` (same as manual pickup) |
| 3 | Walks near item when bag is full | Auto-grab pauses, prompt: "Bag full! Drop an item to keep grabbing." Swap-out flow | Client detects full bag, pauses auto-grab, shows swap UI |

## Admin Flow

### Admin Detection

- Admin status is determined by: `visitor.isAdmin` from `Visitor.get()` in the `GET /api/game-state` response
- Admin UI elements: Gear icon in header (already in PageContainer) toggles admin panel

### Admin Actions

| Step | Admin Action | What They See | Backend Action |
|------|-------------|---------------|----------------|
| 1 | Clicks gear icon | Admin panel slides in with action buttons | None (client-side toggle) |
| 2 | Clicks "Remove All Items" | Confirmation dialog: "Remove all food items from the world?" | `POST /api/admin/remove-all-items` — finds all food dropped assets by uniqueName pattern, bulk deletes |
| 3 | Clicks "Spawn Items" | Confirmation dialog: "Spawn a random set of food items across the world?" | `POST /api/admin/spawn-items` — spawns items across world based on rarity distribution |
| 4 | Views world stats | Panel shows: total items in world, active players today, completions today | `GET /api/admin/stats` — aggregates from world data object |

## Edge Cases

### Edge Case 1: New Day Detection

- **Scenario**: Player last played yesterday (or earlier). Opens app today.
- **Expected behavior**: Old bag items are auto-dropped into world at key asset position. New random bag (8 items, 1 matching) and new ideal meal assigned. Items from previous day that are still on ground may have expired (24h TTL).
- **Handling**: `GET /api/game-state` compares `lastPlayedDate` (stored in visitor data) against current date in Mountain Time. If different day, runs initialization flow. If same day, returns existing state.

### Edge Case 2: Concurrent Pickup Race Condition

- **Scenario**: Two players click the same dropped food item at nearly the same time.
- **Expected behavior**: First player gets the item. Second player sees "This item was already picked up" message.
- **Handling**: `POST /api/pickup-item` uses a lock on the dropped asset data object. First request acquires lock, removes asset, updates bag. Second request finds asset deleted, returns 409 with friendly message.

### Edge Case 3: Network Failure During Pickup

- **Scenario**: Player taps "Grab it!" but network request fails mid-flight.
- **Expected behavior**: Player sees error toast: "Couldn't grab that item. Try again!" Item remains in world, bag unchanged.
- **Handling**: Server operation is atomic — either the full pickup completes (asset removed + bag updated) or nothing happens. Client retries are safe because the pickup is idempotent (if item is already gone, return 409).

### Edge Case 4: Player Disconnects Mid-Session

- **Scenario**: Player closes browser/iframe or loses connection while playing.
- **Expected behavior**: On rejoin (same day), all state is preserved — bag, ideal meal, progress.
- **Handling**: All state is persisted server-side in visitor data object on every action. No client-only state that could be lost.

### Edge Case 5: Item Degradation During Session

- **Scenario**: Player is looking at "Nearby" list and an item's 24h TTL expires.
- **Expected behavior**: Item disappears from nearby list on next poll. If player tries to pick it up, "This item has expired" message.
- **Handling**: Cleanup runs on each `GET /api/nearby-items` call — server checks `lastDroppedDateTime` against current time and removes expired items before returning results.

### Edge Case 6: Spam Prevention — Rapid App Opens

- **Scenario**: Player repeatedly opens/closes the app trying to spawn extra items.
- **Expected behavior**: Items only spawn if no ground items of that type were `firstDroppedBy` this player.
- **Handling**: `GET /api/game-state` checks world for existing items with `firstDroppedBy === profileId` before spawning. Duplicate types are skipped.

### Edge Case 7: No Players in World

- **Scenario**: A single player is the only one in the world. No items from other players exist.
- **Expected behavior**: Player can still play — their initial spawn provides items, and system spawns ensure the item pool has enough variety.
- **Handling**: Spawn logic ensures that for each item in the player's ideal meal, at least one instance exists in the world (may be their own spawned items or system-spawned). Single-player completion is possible but harder — encouraging return visits when more players are online.

## Screen Transitions

```
[Click Key Asset]
    |
    v
[Loading Screen]
    |
    +---(new day)---> [New Day Screen] ---> [Main Game View]
    |                                            |
    +---(same day, in progress)---> [Main Game View]
    |                                    |
    +---(same day, completed)---> [Completion Summary]
                                         |
                                    [Main Game View]
                                         |
                    +--------------------+--------------------+
                    |                    |                    |
              [Brown Bag]         [Ideal Meal]         [Nearby Items]
                    |                                        |
              [Drop Item]                          [Pickup / Grab It!]
                    |                                        |
              [Confirm Drop]                    +------------+
                    |                           |            |
              [Particle Effect]          [Bag has room]  [Bag full]
                                              |            |
                                        [Added to bag]  [Swap-Out Flow]
                                              |            |
                                        ["Did you know?"   [Select item to drop]
                                          toast]           |
                                                     [Confirm swap]
                                                           |
                                                     [Both particles]

[Main Game View] ---(all 5 ideal items collected)---> [Submit Meal Button Activates]
                                                           |
                                                     [Tap Submit]
                                                           |
                                                     [Validation]
                                                           |
                                                  +--------+--------+
                                                  |                 |
                                            [Success]          [Failure]
                                                  |                 |
                                            [Celebration]    [Error message]
                                            [Nutrition Score]
                                            [XP + Badges]
                                            [Remaining items dropped]
                                                  |
                                            [Completion Summary]
                                            ["Done for today!"]

[Admin Gear Icon] ---> [Admin Panel]
                            |
                      +-----+-----+
                      |           |
                [Remove All] [Spawn Items]
                      |           |
                [Confirm]    [Confirm]
                      |           |
                [Bulk delete] [Items spawned]
```
