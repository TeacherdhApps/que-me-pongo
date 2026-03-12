import { describe, it, expect } from 'vitest';
import { calculateItemLimit, FREE_ITEM_LIMIT } from '../lib/pricing';

describe('Simple Free Tier Pricing', () => {
    describe('FREE_ITEM_LIMIT', () => {
        it('should be 200 items', () => {
            expect(FREE_ITEM_LIMIT).toBe(200);
        });
    });

    describe('calculateItemLimit', () => {
        it('should return 200 for all users', () => {
            expect(calculateItemLimit()).toBe(200);
        });
    });
});
