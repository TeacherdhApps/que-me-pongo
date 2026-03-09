# Track Specification: Rewrite Storage Logic (`storage-rework`)

## Overview
The goal of this track is to completely rewrite the storage layer of the "¿Qué me pongo?" application to eliminate data inconsistency, disappearing items, and synchronization bugs. 

## Objectives
- [ ] Implement a **Supabase-First** architecture where cloud operations are the primary source of truth.
- [ ] Use **Dexie.js** as a local, offline-first cache that is strictly kept in sync with Supabase.
- [ ] Eliminate race conditions between auth session loading and data fetching.
- [ ] Ensure item deletions are robust and do not trigger "ghost" item reappearances.
- [ ] Provide clear error handling and user feedback during storage operations.

## Success Criteria
- [ ] A user can add an item, and it is immediately visible in both Closet and Plan views.
- [ ] A user can delete an item, and it is immediately and permanently removed from all views.
- [ ] Data is consistent across different browsers after logging in.
- [ ] The "Reset Wardrobe" feature works reliably across all storage layers.

## Technical Constraints
- Must maintain compatibility with existing Supabase tables (`wardrobe`, `plans`, `profiles`).
- Must continue to support PWA (offline) capabilities via Dexie.js.
- Must use the existing `wardrobeEvents` and `authEvents` bus for cross-component updates.
