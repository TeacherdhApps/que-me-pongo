import { describe, it, expect } from 'vitest';
import { calculateItemLimit, FREE_ITEM_LIMIT } from '../lib/pricing';

describe('Simple Free Tier Pricing', () => {
    describe('FREE_ITEM_LIMIT', () => {
        it('should be 300 items', () => {
            expect(FREE_ITEM_LIMIT).toBe(300);
        });
    });

    describe('calculateItemLimit', () => {
        it('should return 300 for all users', () => {
            expect(calculateItemLimit()).toBe(300);
        });
    });
});
