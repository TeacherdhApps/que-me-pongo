# Track Specification: Rewrite Storage Logic (`storage-rework`) - REV 2

## Overview
Previous manual synchronization attempts between Supabase and Dexie.js using custom hooks and an event bus have proved brittle (ghost items, deletion failures). We are shifting to **TanStack Query (React Query)** to manage server state, caching, and optimistic updates.

## Objectives
- [ ] **Replace manual state** in `useWardrobe` and `useWeeklyPlan` with `useQuery` and `useMutation`.
- [ ] **Decouple Cloud from Local**: Treat Supabase as the absolute source of truth; use TanStack Query's cache as the primary UI source.
- [ ] **Robust Deletion**: Ensure deletion operations are idempotent and handle "already deleted" states gracefully without rolling back the UI.
- [ ] **Centralized Sync**: Use a clear, unified synchronization strategy for offline support.

## Technical Changes
- Add `@tanstack/react-query`.
- Refactor `wardrobeStorage.ts` to provide clean, promise-based API calls for the mutations.
- Remove `wardrobeEvents` bus (React Query's `invalidateQueries` will replace it).
