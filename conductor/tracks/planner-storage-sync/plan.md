# Implementation Plan: Planner Storage Sync Rewrite (`planner-storage-sync`)

## Step 1: Simplify `useWeeklyPlan` Hook
- [x] Remove local `useState` sync logic (it's redundant with TanStack Query's cache).
- [x] Implement `onMutate` for the `updateDayMutation` for robust optimistic updates.
- [x] Ensure `onSettled` correctly invalidates the query to stay in sync.

## Step 2: Refactor `saveWeeklyPlan` Storage Function
- [x] Ensure Dexie write is `await`-ed before anything else.
- [x] Make cloud sync independent or part of the `mutateAsync` flow as it is now.
- [x] Verify that `loadWeeklyPlan` doesn't return stale data after a save.

## Step 3: Verify and Fix State Reversion
- [x] Ensure `useQuery` doesn't overwrite optimistic data while a mutation is in flight.
- [x] Test with simulated slow network to confirm optimistic state holds.
- [x] Implemented SerialQueue and functional updates to prevent race conditions during rapid clicks.

## Step 4: Add Verification Tests
- [x] Update `src/test/outfit_selection.test.tsx` to use more realistic mocks.
- [x] Add a test case for simulated slow cloud responses.
