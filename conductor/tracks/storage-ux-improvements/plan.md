# Implementation Plan: Storage UX Improvements (`storage-ux-improvements`)

## Step 1: Optimistic Updates
- [x] Update `useWardrobe` to use `onMutate` for instant UI feedback.
- [x] Add tests for optimistic state changes.

## Step 2: Cloud Sync Visual Indicators
- [ ] Create `SyncStatus` component.
- [ ] Integrate with Header in `App.tsx`.

## Step 3: Smart Offline Queueing
- [x] Implement local-first write queue.
- [x] Ensure `loadWardrobe` processes the queue.

## Step 4: Storage Quota Dashboard
- [x] Create `StorageHealth` progress bar.
- [x] Add to `ClosetView` and `SettingsView`.

## Step 5: Bulk Management
- [x] Add "Selection Mode" toggle to `ClosetView`.
- [x] Implement `bulkDelete` mutation.

## Step 6: Progressive Image Loading
- [x] Generate tiny blur-placeholders on upload.
- [x] Update `ClothingCard` to use blur-up technique.
