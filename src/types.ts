
export const Categories = {
  OUTERWEAR: 'Prendas de Abrigo',
  TOP: 'Prendas Superiores',
  BOTTOM: 'Prendas Inferiores',
  SHOES: 'Calzado'
} as const;

export type Category = (typeof Categories)[keyof typeof Categories];

export interface ClothingItem {
  id: string;          // UUID or timestamp-based unique ID
  name: string;        // e.g., "Camisa blanca Oxford"
  category: Category;  // OUTERWEAR | TOP | BOTTOM | SHOES
  color: string;       // e.g., "blanco", "azul marino"
  image: string;       // base64 data URL or file path
  thumbnail?: string;  // tiny base64 placeholder for progressive loading
  tags: string[];      // e.g., ["formal", "verano", "casual"]
  created_at?: string;
  user_id?: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  city: string;
}

export interface DailyOutfit {
  day: string;                // e.g., "Lunes"
  date?: string;              // e.g., "2026-02-19" (ISO YYYY-MM-DD)
  items: ClothingItem[];      // selected clothing items
  event?: string;             // e.g., "Reunión de trabajo"
  notes?: string;             // user notes

}

export type WeeklyPlan = Record<string, DailyOutfit>;

export interface UserProfile {
  name?: string;
  sex?: string;
  age?: number;
  weight?: number;    // kg
  height?: number;    // cm
  isPro?: boolean;
}
