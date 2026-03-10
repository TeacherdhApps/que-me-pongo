import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

let mockPlan: any = {};

// Mock Wardrobe Storage
vi.mock('../lib/wardrobeStorage', () => ({
  loadWardrobe: vi.fn().mockResolvedValue([]),
  addClothingItem: vi.fn().mockImplementation((item) => Promise.resolve({ ...item, id: 'test-id' })),
  updateClothingItem: vi.fn().mockResolvedValue(undefined),
  deleteClothingItem: vi.fn().mockResolvedValue(true),
  loadWeeklyPlan: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockPlan);
  }),
  saveWeeklyPlan: vi.fn().mockImplementation((plan) => {
    mockPlan = plan;
    return Promise.resolve();
  }),
  loadUserProfile: vi.fn().mockResolvedValue({ isPro: false }),
  saveUserProfile: vi.fn().mockResolvedValue(undefined),
  uploadImage: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
  deleteImage: vi.fn().mockResolvedValue(undefined),
  syncLocalDataToCloud: vi.fn().mockResolvedValue(undefined),
  clearAllData: vi.fn().mockResolvedValue(undefined),
}));

// Mock Background Removal
vi.mock('../lib/backgroundRemoval', () => ({
  processBackgroundRemoval: vi.fn().mockImplementation((file) => Promise.resolve(file)),
  blobToBase64: vi.fn().mockResolvedValue('data:image/jpeg;base64,mock'),
}));

// Mock Image Resizer
vi.mock('../lib/imageResizer', () => ({
  resizeImage: vi.fn().mockResolvedValue('data:image/jpeg;base64,mock-resized'),
}));

// Create a wrapper for tests that use hooks
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false, gcTime: 0 },
    },
});

// Reset query client before each test
if (typeof beforeEach !== 'undefined') {
    beforeEach(() => {
        queryClient.clear();
        mockPlan = {};
    });
}

export const wrapper = ({ children }: { children: React.ReactNode }) => 
    createElement(QueryClientProvider, { client: queryClient }, children);
