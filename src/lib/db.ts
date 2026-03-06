import Dexie, { type Table } from 'dexie';
import type { ClothingItem, WeeklyPlan, UserProfile } from '../types';

export class WardrobeDB extends Dexie {
    wardrobe!: Table<ClothingItem, string>;
    plans!: Table<{ id: string; plan_data: WeeklyPlan }, string>;
    profiles!: Table<{ id: string; profile_data: UserProfile }, string>;

    constructor() {
        super('QueMePongoDB');
        this.version(2).stores({
            wardrobe: 'id, category, created_at',
            plans: 'id',
            profiles: 'id'
        });
    }
}

export const db = new WardrobeDB();
