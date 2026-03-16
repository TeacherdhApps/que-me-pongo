import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClosetView } from './components/ClosetView';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { MonthlyPlanner } from './components/MonthlyPlanner';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { useUserProfile } from './hooks/useUserProfile';
import { supabase } from './lib/supabase';
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '¡Buenos días!';
  if (hour >= 12 && hour < 20) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

function App() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'closet' | 'planner' | 'settings' | 'auth'>('closet');
  const [planSubView, setPlanSubView] = useState<'week' | 'month'>('week');
  const [weather, setWeather] = useState<WeatherData>({
    temp: 0,
    condition: 'Cargando...',
    city: 'Ubicando...'
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) queryClient.invalidateQueries();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      queryClient.invalidateQueries();
      if (session) setView('closet');
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        const weatherData = await weatherRes.json();
        const temp = Math.round(weatherData.current.temperature_2m);
        const condition = wmoCodeToCondition(weatherData.current.weather_code);

        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`
        );
        const geoData = await geoRes.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.state || 'Tu ubicación';

        setWeather({ temp, condition, city });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setWeather({ temp: 0, condition: 'Sin conexión', city: 'Desconocida' });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.error('Geolocation error:', err);
          setWeather({ temp: 0, condition: 'Sin ubicación', city: 'Permiso denegado' });
        }
      );
    }
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setView('auth');
  };

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      <header className="glass-nav sticky top-0 z-50 px-4 sm:px-6 py-4 sm:py-6 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
                <img src={`${import.meta.env.BASE_URL}icon-512.svg`} className="w-5 h-5" alt="Q" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">¿Qué me pongo?</h1>
                <span className="text-[7px] sm:text-[8px] font-medium text-zinc-300 tracking-widest">By: TeacherdhApps</span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="text-[9px] sm:text-[10px] font-bold bg-zinc-100 px-2 sm:px-3 py-1 rounded-full shadow-sm flex flex-col sm:flex-row items-center gap-0 sm:gap-2">
                <span className="text-zinc-500 truncate max-w-[100px] sm:max-w-none">📍 {weather.city}</span>
                <span className="whitespace-nowrap">{weather.temp}°C · {weather.condition}</span>
              </div>
              {session && (
                <button
                  onClick={logout}
                  className="text-[10px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Cerrar Sesión"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              )}
            </div>
          </div>

          {session && (
            <nav className="hidden sm:flex gap-8 mt-4">
              {(['closet', 'planner', 'settings'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setView(t)}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-opacity relative py-1 ${view === t ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}
                >
                  {t === 'closet' ? 'Armario' : t === 'planner' ? 'Plan' : 'Ajustes'}
                  {view === t && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black animate-fade"></span>}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {session && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-zinc-200 px-2 py-2 safe-area-bottom">
          <div className="flex justify-around items-center">
            {([
              { key: 'closet' as const, label: 'Armario', icon: 'fa-tshirt' },
              { key: 'planner' as const, label: 'Plan', icon: 'fa-calendar-alt' },
              { key: 'settings' as const, label: 'Ajustes', icon: 'fa-cog' },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${view === t.key ? 'bg-black text-white shadow-lg scale-105' : 'text-zinc-400 hover:text-black'}`}
              >
                <i className={`fas ${t.icon} text-sm`}></i>
                <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      <main className="max-w-6xl mx-auto px-6 pt-12">
        {!session ? (
          <AuthView />
        ) : (
          <>
            {view !== 'settings' && (
              <div className="mb-8 animate-fade">
                <h2 className="text-xl font-black uppercase tracking-widest text-zinc-800">
                  {getGreeting()} {profile?.name && <span className="text-zinc-400">{profile.name}</span>}
                </h2>
              </div>
            )}
            {view === 'closet' && <ClosetView />}
            {view === 'planner' && (
              planSubView === 'week' ? <WeeklyPlanner onViewChange={setPlanSubView} /> : <MonthlyPlanner onViewChange={setPlanSubView} />
            )}
            {view === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      <footer className="w-full text-center py-8 text-[9px] sm:text-[10px] text-zinc-400 font-medium uppercase tracking-widest px-4 mt-auto">
        &copy; Marca registrada todos los derechos reservados | ¿Qué me pongo? 2026
      </footer>
    </div>
  );
}

export default App;
