# Specification: Planner Storage Sync Rewrite (`planner-storage-sync`)

## Goal
Ensure outfit selections are persisted reliably and instantly in both local storage and the cloud, preventing UI reverts or "lost" selections.

## Requirements
1.  **Immediate Persistence**: The `updateDay` function must save the new state to Dexie *before* attempting a cloud sync.
2.  **Optimistic UI with Robust Refetching**: The hook should use TanStack Query's `onMutate` pattern for optimistic updates, ensuring the cache is correctly updated and rolled back on error.
3.  **No State Reversion**: Prevent the `useEffect` in `useWeeklyPlan` from overwriting the optimistic state with stale data from a background fetch.
4.  **Cloud-First Load with Local Fallback**: `loadWeeklyPlan` should prefer cloud data but gracefully fall back to local if offline or on error.
5.  **Synchronization Traceability**: Add console logging (optional but recommended for debugging) to trace the flow of data during sync.

## Target Components/Hooks
- `src/hooks/useWardrobe.ts` (`useWeeklyPlan` hook)
- `src/lib/wardrobeStorage.ts` (`loadWeeklyPlan` and `saveWeeklyPlan` functions)
