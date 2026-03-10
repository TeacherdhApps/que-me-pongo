# Implementation Plan: Planner Storage Sync Rewrite (`planner-storage-sync`)

## Step 1: Simplify `useWeeklyPlan` Hook
- [ ] Remove local `useState` sync logic (it's redundant with TanStack Query's cache).
- [ ] Implement `onMutate` for the `updateDayMutation` for robust optimistic updates.
- [ ] Ensure `onSettled` correctly invalidates the query to stay in sync.

## Step 2: Refactor `saveWeeklyPlan` Storage Function
- [ ] Ensure Dexie write is `await`-ed before anything else.
- [ ] Make cloud sync independent or part of the `mutateAsync` flow as it is now.
- [ ] Verify that `loadWeeklyPlan` doesn't return stale data after a save.

## Step 3: Verify and Fix State Reversion
- [ ] Ensure `useQuery` doesn't overwrite optimistic data while a mutation is in flight.
- [ ] Test with simulated slow network to confirm optimistic state holds.

## Step 4: Add Verification Tests
- [ ] Update `src/test/outfit_selection.test.tsx` to use more realistic mocks.
- [ ] Add a test case for simulated slow cloud responses.
