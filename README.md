# ¿Qué me pongo? | Tu armario en tu bolsillo

![App Preview](public/icon-512.png)

_Tu armario al alcance de tu mano. Organiza tu ropa fácilmente, planifica tus outfits.

## Características Principales

- ** Sincronización en la Nube**: Inicia sesión con Google (mediante Supabase) para guardar y mantener sincronizados todos tus outfits en cualquier dispositivo.
- ** Progressive Web App (PWA)**: App instalable de forma nativa en tu teléfono móvil o escritorio. Funciona excepcionalmente rápido gracias a su sistema avanzado de *Service Worker* y cache.
- ** Integración del Clima en Vivo**: Conecta con los datos de **Open-Meteo API** para entender las condiciones meteorológicas y sugerir outfits relevantes y precisos.
- ** Gestión Integral y Carga de Fotos**: Agrega partes superiores, inferiores, calzado y abrigos, previsualización, y eliminación precisa de fotos/ítems. 

##  Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, y Vite
- **Estilos y Componentes**: Tailwind CSS, animaciones fluidas, y sistema de diseño adaptativo responsivo
- **Iconografía**: Lucide React
- **Backend & Auth**: Supabase (PostgreSQL + OAuth de Google)
- **APIs de Terceros**: Google Gemini API, Open-Meteo

##  ¿Cómo empezar a trabajar localmente?

1. **Clona el repositorio** o descarga los archivos.
2. **Instala las dependencias**:
   ```bash
   npm install
   ```
3. **Configura tus credenciales** en un archivo `.env.local` en la raíz de tu proyecto:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   VITE_GEMINI_API_KEY=tu_google_gemini_api_key
   ```
4. **Levanta el entorno de desarrollo**:
   ```bash
   npm run dev
   ```
5. **Abre en tu navegador**: La app suele ejecutarse en [http://localhost:5173](http://localhost:5173).

##  Comandos útiles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la app para producción.
- `npm run preview`: Ejecuta la versión compilada como previsualizaicón local.
- `npm run lint`: Revisa problemas y sugiere mejoras de código usando ESLint.
- `npm run supabase-keep-alive`: Ejecuta una consulta ligera a la base de datos de Supabase para evitar que el proyecto en plan gratuito se pause por inactividad.

##  Supabase Keep-Alive (Evitar pausa del plan gratuito)

Para evitar que Supabase pause tu base de datos gratuita después de 7 días de inactividad, hemos incluido un script que realiza consultas ligeras a las tablas principales.

### Opción A: GitHub Actions (Recomendado)
El proyecto incluye un flujo de trabajo en `.github/workflows/supabase-keep-alive.yml` que se ejecuta automáticamente cada **5 días**. 

Para activarlo:
1. Sube tu código a GitHub.
2. Ve a la configuración de tu repositorio en GitHub: **Settings > Secrets and variables > Actions**.
3. Añade los siguientes secretos:
   - `SUPABASE_URL`: Tu URL del proyecto Supabase (ej. `https://xxx.supabase.co`).
   - `SUPABASE_ANON_KEY`: Tu clave anónima pública (`anon` `public`).

### Opción B: Cron Local (Linux / macOS)
Si prefieres ejecutar el cron en tu máquina local o servidor propio:
1. Abre tu configuración de crontab:
   ```bash
   crontab -e
   ```
2. Añade la siguiente línea para ejecutar el script cada 5 días a medianoche (reemplaza `/absolute/path/to/project` por la ruta absoluta de tu proyecto):
   ```cron
   0 0 */5 * * /usr/bin/node /absolute/path/to/project/supabase-keep-alive.js >> /absolute/path/to/project/keep-alive.log 2>&1
   ```

##  Contribuir

¡Las contribuciones son bienvenidas! Siéntete libre de abrir *Issues* (para fallos o reportes de errores) o *Pull Requests* para proponer nuevas características que hagan esta app más completa. 

---

**© 2026 ¿Qué me pongo? Todos los derechos reservados.**
