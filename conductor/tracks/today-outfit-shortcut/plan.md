# Implementation Plan: Today's Outfit Shortcut (`today-outfit-shortcut`)

## Step 1: Create Today's Outfit Widget
- [x] Create `TodayOutfitWidget` component.
- [x] Display current day's items.
- [x] Add "EDITAR" button to open `OutfitEditor`.

## Step 2: Integrate into ClosetView
- [x] Add the widget to the top of `ClosetView`.
- [x] Ensure it stays in sync with `useWeeklyPlan` data.

## Step 3: Add Quick Actions
- [x] Add a "Limpiar" (Clear) button to quickly reset today's outfit.
- [x] Add a "Ver" button to open the `OutfitPreview` modal.

## Step 4: Verification & Testing
- [x] Add tests to verify today's outfit editing from the shortcut.
- [x] Verify persistence across refreshes.
