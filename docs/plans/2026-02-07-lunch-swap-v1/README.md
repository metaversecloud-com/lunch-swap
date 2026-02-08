# Lunch Swap V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a daily social trading game where players collect, swap, and assemble food items to complete their ideal balanced meal, with nutrition scoring, XP progression, and admin controls.

**Architecture:** Server-first Topia SDK app. All game logic and SDK calls happen server-side; the React client communicates exclusively through `backendAPI.ts`. State is persisted in Topia data objects (Visitor, User, World, DroppedAsset). Daily resets at midnight Mountain Time.

**Tech Stack:** TypeScript, Express, React 18, Topia SDK v0.17.7, Jest + supertest for server tests, Vite for client dev.

---

## Phases

| Phase | File | Tasks | What's Built |
|-------|------|-------|-------------|
| 1 | [phase-1-shared-types.md](./phase-1-shared-types.md) | 1-2 | Shared types, food database, XP config |
| 2 | [phase-2-game-logic.md](./phase-2-game-logic.md) | 3 | Game logic utilities (meal gen, nutrition, combos, dates) |
| 3 | [phase-3-core-controllers.md](./phase-3-core-controllers.md) | 4-9 | Core controllers (game-state, nearby, pickup, drop, swap, submit) |
| 4 | [phase-4-admin-controllers.md](./phase-4-admin-controllers.md) | 10 | Admin controllers (remove-all, spawn, stats) |
| 5 | [phase-5-client-state.md](./phase-5-client-state.md) | 11 | Client state management expansion |
| 6 | [phase-6-core-ui.md](./phase-6-core-ui.md) | 12-18 | Core game UI (GameView, NewDay, BrownBag, NearbyItems, etc.) |
| 7 | [phase-7-modals-completion.md](./phase-7-modals-completion.md) | 19-20 | Modals + CompletionSummary |
| 8 | [phase-8-admin-ui.md](./phase-8-admin-ui.md) | 21 | Admin UI |
| 9 | [phase-9-integration-polish.md](./phase-9-integration-polish.md) | 22-24 | Integration tests, styling, accessibility |

**Total: 24 tasks, 9 phases, TDD throughout.**

Each phase builds on the previous. Server-first: phases 1-4 are fully testable without the client. Phases 5-8 wire up the UI. Phase 9 polishes everything.

## Key References

- PRD: `docs/prd/` (overview, user-flows, data-models, api-endpoints, ui-screens)
- SDK Reference: `.ai/apps/sdk-reference.md`
- Controller Template: `.ai/templates/controller.md`
- Component Template: `.ai/templates/component.tsx`
- Style Guide: `.ai/style-guide.md`
