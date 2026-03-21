import { Sun, CloudRain, Cloud, CloudSnow, CloudLightning, Loader2, CloudFog } from 'lucide-react';

export function WeatherIcon({ condition, code, className = "w-4 h-4" }: { condition?: string, code?: number, className?: string }) {
  if (condition === 'Cargando...') return <Loader2 className={`animate-spin text-zinc-400 ${className}`} />;
  if (code === undefined) return <Cloud className={`text-zinc-400 ${className}`} />;

  if (code === 0 || code === 1) return <Sun className={`text-orange-500 ${className}`} />;
  if (code === 2 || code === 3) return <Cloud className={`text-gray-500 ${className}`} />;
  if (code === 45 || code === 48) return <CloudFog className={`text-gray-400 ${className}`} />;
  if (code >= 51 && code <= 67) return <CloudRain className={`text-blue-500 ${className}`} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={`text-blue-300 ${className}`} />;
  if (code >= 80 && code <= 82) return <CloudRain className={`text-blue-600 ${className}`} />;
  if (code >= 95) return <CloudLightning className={`text-yellow-500 ${className}`} />;

  return <Cloud className={`text-gray-500 ${className}`} />;
}
