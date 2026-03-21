import type { WeatherData } from '../types';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getCurrentWeather(): Promise<WeatherData> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                const response = await fetch(
                    `${OPEN_METEO_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true`
                );
                const data = await response.json();

                if (!data.current_weather) {
                    throw new Error('Weather data not available');
                }

                const weatherCode = data.current_weather.weathercode;
                const condition = getWeatherCondition(weatherCode);

                resolve({
                    temp: Math.round(data.current_weather.temperature),
                    condition: condition,
                    city: 'Tu ubicación', // Open-Meteo doesn't provide city name directly in basic forecast
                    code: weatherCode
                });
            } catch (err) {
                reject(err);
            }
        }, (error) => {
            reject(error);
        });
    });
}

function getWeatherCondition(code: number): string {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return 'Despejado';
    if (code <= 3) return 'Parcialmente nublado';
    if (code <= 48) return 'Neblina';
    if (code <= 57) return 'Llovizna';
    if (code <= 67) return 'Lluvia';
    if (code <= 77) return 'Nieve';
    if (code <= 82) return 'Chubascos';
    if (code <= 86) return 'Nevadas';
    if (code <= 99) return 'Tormenta';
    return 'Variable';
}
