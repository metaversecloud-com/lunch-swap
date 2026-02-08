# App Overview

## App Name

Lunch Swap

## One-Line Description

A daily social trading game where players collect, swap, and assemble food items to complete their ideal balanced meal.

## Core Concept

Every day, players receive a randomized "brown bag" of 8 food items and a unique "ideal meal" target (5 items). Only 1 of their starting items matches their ideal meal — so they must explore the world, drop items they don't need, and pick up items others have left behind. The game creates natural social interaction through scarcity: you *need* other players to complete your meal. On submission, meals are scored for nutritional balance, teaching kids about healthy eating through gameplay rather than quizzes. Daily resets keep the loop fresh and create anticipation.

## Target Audience

- **Primary users**: Students ages 7–17 who are visitors in Topia worlds (schools, camps, social spaces)
- **Secondary users (admins)**: Teachers, world creators, and moderators who configure and manage the game

## Key Differentiators

- **Forced social interaction through game mechanics** — Scarcity (8 bag slots, 5-item meal, 1 starting match) means players must engage with each other, not just the system
- **Educational without feeling educational** — Food group color coding, nutrition scoring, "Did you know?" facts, and Super Combos teach healthy eating passively
- **Daily reset with progression** — Each day is a fresh puzzle, but XP, badges, and streaks carry over for long-term engagement
- **Asymmetric knowledge** — Each player's ideal meal is unique, creating natural negotiation and discovery even in worlds without chat

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Daily meal completion rate | > 40% of daily starters | `Completions / UniqueStarts` (analytics) |
| Item interaction rate | > 3 pickups or drops per session | `(Pickups + Drops) / UniqueJoins` (analytics) |
| Return player rate | > 30% return next day | `UniqueStarts[day N]` ∩ `UniqueStarts[day N+1]` (analytics) |
| Avg. nutrition score | Trending upward over 7 days | Mean `nutritionScore` per completion per day |
| Badge earn rate | > 20% earn first badge within 3 days | `UniqueBadgeGrants / UniqueStarts` (analytics) |

## Tech Constraints

| Constraint | Value |
|-----------|-------|
| SDK version | `@rtsdk/topia` v0.17.7 |
| Node.js | >= 18 |
| Additional dependencies | None beyond existing monorepo |
| External services | None for V1 |
| Asset requirements | ~60 food item images (sourced via Nano Banana / Gemini 2.5 Flash), 1 key asset ("Lunch Swap" station) |
| Ecosystem requirements | Badge inventory items must be created in Topia dashboard; food item images uploaded as web image assets |

## Scope Boundaries

### In Scope (V1)

- Daily start/join flow with randomized brown bag (8 items) and ideal meal
- Resume same-day session with preserved state
- Drop items into world (public, anyone can pick up)
- Pick up items from world (click-to-open-drawer or nearby list in drawer)
- ~~Auto-Grab Mode~~ (deferred to V1.1)
- Bag capacity enforcement (8 items during play, reduced to 3 after meal completion) with swap-out flow when full
- Rarity system: Common, Rare, Epic (Legendary teased, not available)
- Meal composition: 1 drink + 1 main + 3 from {fruit, veggie, snack}
- Nutrition scoring on meal submission (bonus XP for balanced meals)
- Super Combo bonuses for specific food pairings
- "Did you know?" toasts with food facts on pickup
- Nutrition preview on items (health-bar style breakdown)
- Food group color coding across all UI
- Random item spawning (quantity by rarity, anti-spam rules)
- 24-hour item degradation (items despawn 24h after last drop)
- Item tracking: firstDroppedBy, firstDroppedDateTime, lastDroppedBy, lastDroppedDateTime
- Mystery Items (~15% of spawns are "?" bags, revealed on pickup)
- Meal Tickets (teacher-awarded currency) & Daily Bonus Wheel (spend ticket to spin for daily buff)
- Hot Streaks (3 ideal-meal pickups in a row triggers 3x XP on next pickup)
- Submit Meal flow with validation, rewards, and auto-drop of remaining items
- Badges via inventory system (first completion, streaks, etc.)
- Particle effects on drop, pickup, and meal submission
- Toast notifications for key actions
- Daily reset at midnight Mountain Time
- One completion per day (done for the day after submission, bag capacity reduced to 3)
- Admin: remove all food items from world
- Admin: spawn new food items
- Analytics tracking for all key events
- XP system with per-action and completion XP

### Out of Scope (V1)

- **V1.5: Helper Mode** — Post-completion role where players help others; breadcrumb trails, visual aura, smart toasts, async helping, XP/unlocks for helping
- **V2: Crafting** — Combine lower-rarity items to create higher-rarity items (e.g., hummus + carrots + celery = hummus cup with dippers)
- **V2.5: Freestyle Mode** — "Build your best meal" scored on nutrition (not prescribed ideal meal)
- **V3: Bazaar & Economy** — Player-run shops, async item listing/purchasing, coins currency
- **V3+: Food Fight** — Daily 20-minute dodgeball mini-game using your completed meal set (Topia Game Engine)
- **Future: NPCs** — Curriculum-aware NPCs that drop Legendary items, problem-solving for rewards
- **Future: Trading UI** — Direct player-to-player trading interface
- **Future: Skill Tree** — Unlock abilities (wayfinding, seeing what nearby players need) via skill points
- **Future: Rarity progression** — Legendary items, dynamic rarity based on player level
- **Future: Calorie/macro tracking** — Detailed nutrition info that fills in as items are collected
- **Future: Parent dashboard** — What their kid learned about nutrition
- **Future: Speed boost / avatar growth** — Pending SDK feature requests
- **Future: WebSocket live-sync** — Real-time UI updates without polling

## Future Roadmap

```
V1:    Collect -> Complete prescribed meal -> Rewards + Nutrition Score
V1.5:  Helper mode -> Async helping -> XP for generosity
V2:    Crafting -> Combine items -> Create higher rarity
V2.5:  "Build best meal" mode -> Scored on balance, not a checklist
V3:    Bazaar -> Shops -> Async commerce -> Player-run economy
V3+:   Coins -> Upgrades -> Accessories -> Food Fight dodgeball at noon
```
