# Implementation Plan: Rewrite Storage Logic (REV 2)

## Phase 1: Dependency Integration
- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`.
- [ ] Initialize `QueryClient` in `main.tsx`.

## Phase 2: Refactor storage API (`src/lib/wardrobeStorage.ts`)
Simplify the API to be purely about data fetching/manipulation (no event emission, no manual cache logic).
- [ ] Simplify `loadWardrobe`, `addClothingItem`, `deleteClothingItem` to return direct results.
- [ ] Fix `deleteClothingItem` to not throw or return `false` if the item is already gone from Supabase (to avoid UI rollback).

## Phase 3: Implement React Query Hooks (`src/hooks/useWardrobe.ts`)
- [ ] Replace `useState`/`useEffect` in `useWardrobe` with `useQuery`.
- [ ] Implement `useMutation` for add/update/delete.
- [ ] Use `onSuccess: () => queryClient.invalidateQueries(['wardrobe'])` for automatic syncing across all views.

## Phase 4: UI Update & Verification
- [ ] Update `ClosetView` and `WeeklyPlanner` to use the new hook returns (`data`, `isLoading`).
- [ ] Perform a full reset and verify item deletion and addition are stable across multiple browsers.
- [ ] Final deployment.
