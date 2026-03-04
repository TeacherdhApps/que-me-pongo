# Scalability and Monetization Roadmap: ¿Qué me pongo?

To grow from a personal tool to a scalable PWA with hundreds of items and a monetization model, we need to move beyond `localStorage` and client-side only architecture.

## 1. Technical Scalability
Current `localStorage` is limited to ~5MB. Storing 100-200 high-res images will quickly crash the storage or slow down the app.

### Phase 1: Cloud Backend (Supabase) ✅ 100% Complete
- **Database**: Moved wardrobe data and planning to Supabase (PostgreSQL).
- **Authentication**: Enabled user accounts via Google and Email sign-in.
- **Image Storage**: Implemented image uploads to Supabase Storage (no more base64 inline strings).
- **User Profile**: Profiles migrated to dedicated Supabase table.

### Phase 2: Performance
- **Lazy Loading**: Only load images as the user scrolls.
- **Image Optimization**: Automatically resize and compress uploads to save bandwidth and storage costs.

---

## 2. Monetization Strategy (Freemium Model)

### Free Tier (User Attraction)
- **Limit**: Up to 50 items.
- **Core features**: Basic closet management, weekly view.
- **Goal**: High user retention and "habit" formation.

### Premium Tier (Pro Version)
- **Unlock**: 200+ items or Unlimited.
- **Exclusive Features**:
  - **AI Magic**: Advanced outfit generation using Gemini (beyond basic logic).
  - **Calendar Sync**: Export outfit plans to Google Calendar or iCal.
  - **Insights**: Statistics on "Cost per Wear" (which items you use the most).
  - **Weather Advanced**: Hyper-local weather alerts for outfit planning.

### Payment Integration
- **Platform**: Use **Stripe** or **LemonSqueezy** (handles global taxes easily).
- **Implementation**: A simple "Upgrade to Pro" button in the Settings page that triggers a secure checkout.

---

## 3. Recommended Tech Stack for Growth

| Component | Current | Recommended for Scale |
| :--- | :--- | :--- |
| **Hosting** | GitHub Pages | Vercel (Better for API routes) |
| **Database** | LocalStorage | **Supabase** (PostgreSQL) |
| **Auth** | None | **Supabase Auth** (Social + Email) |
| **Images** | Base64/Local | **Supabase Storage** |
| **Payments** | None | **Stripe** |

## Next Implementation Steps

1.  **Refactor for Supabase**: Prepare the data layer to handle remote fetching.
2.  **Add Auth**: Add a Login/Signup flow.
3.  **Implement Limits**: Add a check in the `addItem` logic to enforce the free tier limit.
4.  **Integrate Stripe**: Connect the upgrade button to a checkout session.
