# Implementation Plan: Storage UX Improvements (`storage-ux-improvements`)

## Step 1: Optimistic Updates
- [ ] Update `useWardrobe` to use `onMutate` for instant UI feedback.
- [ ] Add tests for optimistic state changes.

## Step 2: Cloud Sync Visual Indicators
- [ ] Create `SyncStatus` component.
- [ ] Integrate with Header in `App.tsx`.

## Step 3: Smart Offline Queueing
- [ ] Implement local-first write queue.
- [ ] Ensure `loadWardrobe` processes the queue.

## Step 4: Storage Quota Dashboard
- [ ] Create `StorageHealth` progress bar.
- [ ] Add to `ClosetView` and `SettingsView`.

## Step 5: Bulk Management
- [ ] Add "Selection Mode" toggle to `ClosetView`.
- [ ] Implement `bulkDelete` mutation.

## Step 6: Progressive Image Loading
- [ ] Generate tiny blur-placeholders on upload.
- [ ] Update `ClothingCard` to use blur-up technique.
