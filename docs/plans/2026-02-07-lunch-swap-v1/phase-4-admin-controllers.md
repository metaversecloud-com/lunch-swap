# Phase 4: Admin Controllers

---

## Task 10: Admin Controllers (Remove All, Spawn, Stats)

**Files:**
- Create: `server/controllers/admin/handleAdminRemoveAllItems.ts`
- Create: `server/controllers/admin/handleAdminSpawnItems.ts`
- Create: `server/controllers/admin/handleAdminGetStats.ts`
- Create: `server/controllers/admin/index.ts`
- Modify: `server/controllers/index.ts`
- Modify: `server/routes.ts`
- Test: `server/tests/admin-routes.test.ts`

**Step 1: Write failing tests for all 3 admin endpoints**

Test: admin check (403 if not admin), successful execution, response shape.

**Step 2: Run tests to verify fail**

**Step 3: Implement all 3 admin controllers**

Each starts with: get credentials -> get visitor -> check `isAdmin` -> return 403 if not.

- **Remove All Items**: `world.fetchDroppedAssetsWithUniqueName("lunch-swap-food-*")` -> bulk delete -> return `removedCount`
- **Spawn Items**: generate random items from pool -> spawn at random positions within radius -> return `spawnedCount` + item list
- **Stats**: fetch world data object -> count food items in world -> return aggregated stats

**Step 4: Add routes and exports**

```typescript
// In routes.ts
router.post("/admin/remove-all-items", handleAdminRemoveAllItems);
router.post("/admin/spawn-items", handleAdminSpawnItems);
router.get("/admin/stats", handleAdminGetStats);
```

**Step 5: Run tests, verify pass**

**Step 6: Commit**

```bash
git add server/controllers/admin/ server/controllers/index.ts server/routes.ts server/tests/admin-routes.test.ts
git commit -m "feat: add admin controllers (remove-all, spawn, stats)"
```
