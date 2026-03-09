# Implementation Plan: Rewrite Storage Logic (`storage-rework`)

## Phase 1: Core Storage Refactor (`src/lib/wardrobeStorage.ts`)
Refactor the storage layer to be strictly "Supabase-First" with a local Dexie cache.
- [ ] Implement `ensureUserSession()` to wait for Supabase auth before cloud operations.
- [ ] Rewrite `addClothingItem` to update Supabase FIRST, then Dexie, then emit events.
- [ ] Rewrite `deleteClothingItem` to delete from Supabase FIRST, then Dexie, then emit events.
- [ ] Rewrite `loadWardrobe` to prioritize cloud data and strictly sync to local cache.
- [ ] Simplify `sync` logic to be more transparent and less prone to race conditions.

## Phase 2: Hook Optimization (`src/hooks/useWardrobe.ts`)
Update hooks to handle the async nature of Supabase and storage operations correctly.
- [ ] Ensure `isLoading` states in hooks are accurately reflecting both auth and data fetching status.
- [ ] Standardize event-driven updates for all wardrobe and plan changes.

## Phase 3: UI Feedback & Stability
- [ ] Ensure `ClosetView` and `OutfitEditor` handle empty or loading states gracefully.
- [ ] Provide visual feedback during adding/deleting operations to confirm success.

## Phase 4: Verification & Deployment
- [ ] Perform a full reset of the wardrobe using the new feature.
- [ ] Add 10+ items and verify visibility across all views.
- [ ] Verify deletion permanence.
- [ ] Deploy and verify on the live environment.
