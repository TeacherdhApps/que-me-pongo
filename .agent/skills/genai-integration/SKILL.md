---
name: genai-integration
description: Integrates Google GenAI (Gemini) for outfit recommendations in the wardrobe app. Use when adding or modifying AI-powered features.
---

# Google GenAI Integration

Manages the **Gemini AI** integration in **¿Qué me pongo?** for personalized outfit recommendations, style advice, and wardrobe curation.

## When to Use This Skill

- When adding or modifying AI outfit recommendations
- When designing prompts for Gemini
- When handling streaming AI responses in the UI
- When gating AI features for **Pro users**

## Feature Gating (Pro Only)

AI features are restricted to Pro users. Always check the `isPro` status from `useUserProfile` or `useWardrobe`.

```typescript
const { profile } = useUserProfile();
const canUseAI = profile.isPro;
```

## Package

```json
"@google/genai": "^1.37.0"
```

## Setup

```typescript
// src/lib/genai.ts
import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
export const genai = new GoogleGenAI({ apiKey: API_KEY });
```

## Outfit Recommendation Prompt Pattern

```typescript
export async function getOutfitRecommendation(
  wardrobe: ClothingItem[],
  weather: WeatherData
): Promise<string> {
  const prompt = `Actúa como un estilista personal. El usuario tiene: ${wardrobe.map(i => i.name).join(', ')}. El clima es: ${weather.condition}, ${weather.temp}°C. Sugiere un outfit.`;

  const response = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return response.text ?? '';
}
```

## Pitfalls

- **Usage Limits**: AI generation costs tokens. Avoid unnecessary calls.
- **Spanish First**: Prompts and responses should be in Spanish.
- **Graceful Fallback**: If Gemini fails or the user is not Pro, show a clear message or an upgrade button.
