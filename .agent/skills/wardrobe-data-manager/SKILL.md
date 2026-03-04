---
name: wardrobe-data-manager
description: Manages clothing items, categories, and Supabase persistence for the wardrobe app. Use when adding, editing, or deleting clothing items or managing wardrobe state.
---

# Wardrobe Data Manager

Handles all data operations for the **¿Qué me pongo?** wardrobe — creating, reading, updating, and deleting clothing items, and persisting the data to **Supabase**.

## When to Use This Skill

- When adding CRUD operations for clothing items
- When changing the data model in `types.ts`
- When implementing wardrobe persistence (save/load) via Supabase
- When managing user profiles and Pro tier status
- When enforcing item limits (50 items for Free Tier)

## Data Model (from `types.ts`)

```typescript
export enum Category {
    TOP = 'Superior',
    BOTTOM = 'Inferior',
    SHOES = 'Calzado',
    ACCESSORY = 'Accesorio'
}

export interface ClothingItem {
    id: string;
    name: string;
    category: Category;
    color: string;
    image: string; // Public URL from Supabase Storage
    created_at?: string;
    user_id?: string;
}

export interface UserProfile {
    id?: string;
    email?: string;
    isPro?: boolean;
}
```

## Supabase Service Logic

```typescript
// src/lib/wardrobeStorage.ts
import { supabase } from './supabase';

export async function loadWardrobe() {
    const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function addClothingItem(item: Omit<ClothingItem, 'id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('clothing_items')
        .insert([{ ...item, user_id: user.id }])
        .select()
        .single();
    if (error) throw error;
    return data;
}
```

## Item Limits Enforcement

The app enforces a **50 item limit** for free users. Always check `profile.isPro` before allowing `addClothingItem`.

```typescript
const isOverLimit = !profile.isPro && wardrobe.length >= 50;
```

## Image Handling

Images are uploaded to Supabase Storage, and the public URL is stored in the database.
1. `imageResizer.ts` compresses the image.
2. `wardrobeStorage.ts` handles the `uploadImage` to Supabase bucket.

## Pitfalls

- **Async Everywhere**: Supabase calls are asynchronous. Handle loading states.
- **Service Role**: Never use the `service_role` key in the frontend. Use the `anon` key and RLS.
- **RLS**: Ensure tables have Row Level Security enabled so users only see their own data.
