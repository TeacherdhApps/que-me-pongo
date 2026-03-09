import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
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

// Mock Wardrobe Storage
vi.mock('../lib/wardrobeStorage', () => ({
  loadWardrobe: vi.fn().mockResolvedValue([]),
  addClothingItem: vi.fn().mockImplementation((item) => Promise.resolve({ ...item, id: 'test-id' })),
  updateClothingItem: vi.fn().mockResolvedValue(undefined),
  deleteClothingItem: vi.fn().mockResolvedValue(true),
  loadWeeklyPlan: vi.fn().mockResolvedValue({}),
  saveWeeklyPlan: vi.fn().mockResolvedValue(undefined),
  loadUserProfile: vi.fn().mockResolvedValue({ isPro: false }),
  saveUserProfile: vi.fn().mockResolvedValue(undefined),
  uploadImage: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
  deleteImage: vi.fn().mockResolvedValue(undefined),
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
