
import { useState, useEffect } from 'react';
import { ClosetView } from './components/ClosetView';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { MonthlyPlanner } from './components/MonthlyPlanner';
import { SettingsView } from './components/SettingsView';
import { useUserProfile } from './hooks/useUserProfile';
import type { WeatherData } from './types';

// Map WMO weather codes to Spanish descriptions
function wmoCodeToCondition(code: number): string {
  const map: Record<number, string> = {
    0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Niebla', 48: 'Niebla helada',
    51: 'Llovizna ligera', 53: 'Llovizna', 55: 'Llovizna intensa',
    61: 'Lluvia ligera', 63: 'Lluvia', 65: 'Lluvia intensa',
    71: 'Nevada ligera', 73: 'Nevada', 75: 'Nevada intensa',
    80: 'Chubascos ligeros', 81: 'Chubascos', 82: 'Chubascos intensos',
    95: 'Tormenta', 96: 'Tormenta con granizo', 99: 'Tormenta con granizo intenso',
  };
  return map[code] ?? 'Desconocido';
}

function App() {
  const { profile } = useUserProfile();
  const [view, setView] = useState<'closet' | 'planner' | 'settings'>('closet');
  const [planSubView, setPlanSubView] = useState<'week' | 'month'>('week');
  const [weather, setWeather] = useState<WeatherData>({
    temp: 0,
    condition: 'Cargando...',
    city: 'Ubicando...'
  });

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        // Fetch weather from Open-Meteo (free, no API key)
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        const weatherData = await weatherRes.json();

        const temp = Math.round(weatherData.current.temperature_2m);
        const condition = wmoCodeToCondition(weatherData.current.weather_code);

        // Reverse geocode for city name via Nominatim (free, no API key)
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`
        );
        const geoData = await geoRes.json();
        const city = geoData.address?.city
          || geoData.address?.town
          || geoData.address?.village
          || geoData.address?.state
          || 'Tu ubicación';

        setWeather({ temp, condition, city });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setWeather({ temp: 0, condition: 'Sin conexión', city: 'Desconocida' });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setWeather({ temp: 0, condition: 'Sin ubicación', city: 'Permiso denegado' });
        }
      );
    } else {
      console.warn('Geolocation not supported by this browser.');
    }
  }, []);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="glass-nav sticky top-0 z-50 px-6 py-6 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden">
              <img src={`${import.meta.env.BASE_URL}icon-192.svg`} className="w-5 h-5" alt="Q" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xs font-black uppercase tracking-[0.4em]">¿Qué me pongo?</h1>
              <span className="text-[8px] font-medium text-zinc-300 tracking-widest">By: TeacherdhApps</span>
            </div>
          </div>
          <nav className="flex gap-8">
            {(['closet', 'planner', 'settings'] as const).map(t => (
              <button
                key={t}
                onClick={() => setView(t)}
                className={`text-[10px] font-bold uppercase tracking-widest transition-opacity relative py-1 ${view === t ? 'opacity-100' : 'opacity-30 hover:opacity-100'
                  }`}
              >
                {t === 'closet' ? 'Armario' : t === 'planner' ? 'Plan' : 'Ajustes'}
                {view === t && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black animate-fade"></span>
                )}
              </button>
            ))}
          </nav>
          <div className="text-[10px] font-bold bg-zinc-100 px-3 py-1 rounded-full shadow-sm flex items-center gap-2">
            <span className="text-zinc-500">📍 {weather.city}</span>
            <span>{weather.temp}°C · {weather.condition}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        {view !== 'settings' && (
          <div className="mb-8 animate-fade">
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-800">
              ¡Buen día! {profile.name && <span className="text-zinc-400">{profile.name}</span>}
            </h2>
          </div>
        )}
        {view === 'closet' && <ClosetView />}
        {view === 'planner' && (
          planSubView === 'week'
            ? <WeeklyPlanner onViewChange={setPlanSubView} />
            : <MonthlyPlanner onViewChange={setPlanSubView} />
        )}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default App;
