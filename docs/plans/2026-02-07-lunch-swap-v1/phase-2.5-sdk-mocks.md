# Phase 2.5: Expand SDK Mock for Testing

Prerequisite for all Phase 3+ tests. The current mock only covers `WorldFactory.create()`.

---

## Task 3.5: Comprehensive SDK Mock

**Files:**
- Modify: `server/mocks/@rtsdk/topia.ts`
- Modify: `server/jest.config.ts` (add `@shared` path alias)
- Modify: `server/utils/topiaInit.ts` (add `EcosystemFactory`)
- Modify: `server/types/DroppedAssetTypes.ts` (replace boilerplate type)

**Step 1: Add `@shared` path mapping to Jest config**

In `server/jest.config.ts`, add to `moduleNameMapper`:
```typescript
"^@shared/(.*)$": "<rootDir>/../shared/$1"
```

**Step 2: Add `EcosystemFactory` to `topiaInit.ts`**

```typescript
import { ..., EcosystemFactory } from "@rtsdk/topia";
const Ecosystem = new EcosystemFactory(myTopiaInstance);
export { Asset, DroppedAsset, Ecosystem, User, Visitor, World };
```

**Step 3: Replace `IDroppedAsset` type**

Replace the boilerplate `dataObject: { droppedAssetCount?: number }` with the actual game types.

**Step 4: Expand the SDK mock**

Mock all SDK methods needed across Phase 3-9 controllers:

- **Visitor**: `get()`, `fetchDataObject()`, `updateDataObject()`, `setDataObject()`, `fireToast()`, `triggerParticle()`, `grantInventoryItem()`
- **DroppedAsset**: `get()`, `drop()`, `fetchDataObject()`, `setDataObject()`, `deleteDroppedAsset()`
- **World**: `create()`, `fetchDataObject()`, `updateDataObject()`, `fetchDroppedAssetsWithUniqueName()`, `deleteDroppedAssets()` (static)
- **User**: `create()`, `fetchDataObject()`, `updateDataObject()`, `incrementDataObjectValue()`
- **Asset**: `create()`
- **Ecosystem**: `fetchInventoryItems()`

Each mock should: store calls for assertion, return configurable values, support `mockResolvedValue` overrides.

**Step 5: Run existing tests to verify nothing broke**

Run: `cd server && npm test`
Expected: All existing tests PASS.

**Step 6: Commit**

```bash
git add server/mocks/ server/jest.config.ts server/utils/topiaInit.ts server/types/
git commit -m "feat: expand SDK mock, add @shared path alias, add EcosystemFactory"
```
