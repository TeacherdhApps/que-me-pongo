-- Migration: Update clothing categories to formal names
-- Date: 2026-03-12
-- Description: Transition from informal category names to formal Spanish terms used in the UI refactor

-- Step 1: Update existing items in the wardrobe table
-- Mapping:
-- 'Accesorio' -> 'Prendas de Abrigo'
-- 'Superior'  -> 'Prendas Superiores'
-- 'Inferior'  -> 'Prendas Inferiores'

UPDATE wardrobe 
SET category = 'Prendas de Abrigo' 
WHERE category = 'Accesorio';

UPDATE wardrobe 
SET category = 'Prendas Superiores' 
WHERE category = 'Superior';

UPDATE wardrobe 
SET category = 'Prendas Inferiores' 
WHERE category = 'Inferior';

-- Step 2: Update existing plans to reflect the new category names in the stored JSONB
-- This ensures that already planned outfits show the correct labels and are filtered properly

UPDATE plans
SET plan_data = replace(plan_data::text, '"category": "Accesorio"', '"category": "Prendas de Abrigo"')::jsonb
WHERE plan_data::text LIKE '%"category": "Accesorio"%';

UPDATE plans
SET plan_data = replace(plan_data::text, '"category": "Superior"', '"category": "Prendas Superiores"')::jsonb
WHERE plan_data::text LIKE '%"category": "Superior"%';

UPDATE plans
SET plan_data = replace(plan_data::text, '"category": "Inferior"', '"category": "Prendas Inferiores"')::jsonb
WHERE plan_data::text LIKE '%"category": "Inferior"%';
