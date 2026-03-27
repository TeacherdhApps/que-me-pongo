import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useQueryClient } from '@tanstack/react-query';
import { ClosetView } from './components/ClosetView';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { MonthlyPlanner } from './components/MonthlyPlanner';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { WeatherIcon } from './components/WeatherIcon';
import { LanguageToggle } from './components/LanguageToggle';
import { useUserProfile } from './hooks/useUserProfile';
import { useI18n } from './i18n/I18nContext';
import { supabase } from './lib/supabase';
import type { WeatherData } from './types';
import type { TranslationKey } from './i18n/translations';

// Map WMO weather codes to translation keys
function wmoCodeToKey(code: number): TranslationKey {
  const map: Record<number, TranslationKey> = {
    0: 'weather.clear', 1: 'weather.mostlyClear', 2: 'weather.partlyCloudy', 3: 'weather.cloudy',
    45: 'weather.fog', 48: 'weather.frostFog',
    51: 'weather.lightDrizzle', 53: 'weather.drizzle', 55: 'weather.heavyDrizzle',
    61: 'weather.lightRain', 63: 'weather.rain', 65: 'weather.heavyRain',
    71: 'weather.lightSnow', 73: 'weather.snow', 75: 'weather.heavySnow',
    80: 'weather.lightShower', 81: 'weather.shower', 82: 'weather.heavyShower',
    95: 'weather.thunderstorm', 96: 'weather.thunderHail', 99: 'weather.thunderHailHeavy',
  };
  return map[code] ?? 'weather.unknown';
}

function App() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const { t, locale } = useI18n();
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'closet' | 'planner' | 'settings' | 'auth'>('closet');
  const [planSubView, setPlanSubView] = useState<'week' | 'month'>('week');
  const [weather, setWeather] = useState<WeatherData & { conditionKey?: TranslationKey }>({
    temp: 0,
    condition: '',
    city: '',
    conditionKey: 'weather.loading',
  });

  // Derive translated weather text from the conditionKey
  const weatherCondition = weather.conditionKey ? t(weather.conditionKey) : weather.condition;
  const weatherCity = weather.city || t('weather.locating');

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('greeting.morning');
    if (hour >= 12 && hour < 20) return t('greeting.afternoon');
    return t('greeting.evening');
  }

  useEffect(() => {
    // Check if we are at a defunct path like /Que-me-pongo/ while base is /
    const base = import.meta.env.BASE_URL;
    if (base === '/' && window.location.pathname.includes('/Que-me-pongo/')) {
      const newUrl = window.location.origin + '/' + window.location.hash;
      window.history.replaceState(null, '', newUrl);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check for demo mode cookie
      const isDemoMode = document.cookie.includes('demo_mode=true');
      
      if (session) {
        setSession(session);
        queryClient.invalidateQueries();
        // Clean URL hash after tokens are consumed into session
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else if (isDemoMode) {
        // Ghost session for demo
        setSession({ user: { id: 'demo-user', email: 'demo@example.com' }, isDemo: true });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        // Clear demo cookie if they officially log in
        document.cookie = "demo_mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        queryClient.invalidateQueries();
        setView('closet');
        // Clean URL hash after tokens are consumed during auth change
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        const isDemoMode = document.cookie.includes('demo_mode=true');
        if (!isDemoMode) setSession(null);
      }
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
        const conditionKey = wmoCodeToKey(weatherData.current.weather_code);

        const acceptLang = locale === 'en' ? 'en' : 'es';
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${acceptLang}`
        );
        const geoData = await geoRes.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.state || t('weather.yourLocation');

        setWeather({ temp, condition: '', city, code: weatherData.current.weather_code, conditionKey });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setWeather({ temp: 0, condition: '', city: '', conditionKey: 'weather.noConnection' });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.error('Geolocation error:', err);
          setWeather({ temp: 0, condition: '', city: '', conditionKey: 'weather.noLocation' });
        }
      );
    }
  }, [locale, t]);

   const logout = async () => {
    await supabase.auth.signOut();
    document.cookie = "demo_mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    queryClient.clear();
    setSession(null);
    setView('auth');
  };

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      <Analytics />
      <header className="glass-nav sticky top-0 z-50 px-4 sm:px-6 py-4 sm:py-6 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
                <img src={`${import.meta.env.BASE_URL}icon-512.svg`} className="w-5 h-5" alt="Q" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">{t('app.title')}</h1>
                <span className="text-[7px] sm:text-[8px] font-medium text-zinc-300 tracking-widest">{t('app.subtitle')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <LanguageToggle />
              <div className="text-[9px] sm:text-[10px] font-bold bg-zinc-100 px-2 sm:px-3 py-1 rounded-full shadow-sm flex flex-col sm:flex-row items-center gap-0 sm:gap-2">
                <span className="text-zinc-500 truncate max-w-[100px] sm:max-w-none">📍 {weatherCity}</span>
                <span className="whitespace-nowrap flex items-center gap-1">
                  <WeatherIcon condition={weatherCondition} code={weather.code} className="w-3 h-3 sm:w-4 sm:h-4" />
                  {weather.temp}°C · {weatherCondition}
                </span>
              </div>
              {session && (
                <button
                  onClick={logout}
                  className="text-[10px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity flex-shrink-0"
                  title={session.isDemo ? t('demo.exitTitle') : t('session.logout')}
                >
                  <i className={`fas ${session.isDemo ? 'fa-times' : 'fa-sign-out-alt'}`}></i>
                </button>
              )}
            </div>
          </div>

          {session?.isDemo && (
            <div className="mt-4 p-3 bg-black text-white rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <p className="text-[9px] font-black uppercase tracking-widest">{t('demo.title')}</p>
              </div>
              <button 
                onClick={() => setView('auth')}
                className="bg-white text-black px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                {t('demo.linkGoogle')}
              </button>
            </div>
          )}

          {session && (
            <nav className="hidden sm:flex gap-8 mt-4">
              {(['closet', 'planner', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setView(tab)}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-opacity relative py-1 ${view === tab ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}
                >
                  {tab === 'closet' ? t('nav.closet') : tab === 'planner' ? t('nav.planner') : t('nav.settings')}
                  {view === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black animate-fade"></span>}
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
              { key: 'closet' as const, label: t('nav.closet'), icon: 'fa-tshirt' },
              { key: 'planner' as const, label: t('nav.planner'), icon: 'fa-calendar-alt' },
              { key: 'settings' as const, label: t('nav.settings'), icon: 'fa-cog' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${view === tab.key ? 'bg-black text-white shadow-lg scale-105' : 'text-zinc-400 hover:text-black'}`}
              >
                <i className={`fas ${tab.icon} text-sm`}></i>
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
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
        {t('app.footer')}
      </footer>
    </div>
  );
}

export default App;
