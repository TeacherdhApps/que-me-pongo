# ¿Qué me pongo? | Tu armario en tu bolsillo

![App Preview](public/icon-512.png)

_Tu armario al alcance de tu mano. Organiza tu ropa fácilmente, planifica tus outfits y recibe recomendaciones usando Inteligencia Artificial._

## Características Principales

- ** Sincronización en la Nube**: Inicia sesión con Google (mediante Supabase) para guardar y mantener sincronizados todos tus outfits en cualquier dispositivo.
- ** Progressive Web App (PWA)**: App instalable de forma nativa en tu teléfono móvil o escritorio. Funciona excepcionalmente rápido gracias a su sistema avanzado de *Service Worker* y cache.
- ** Inteligencia Artificial (Google Gemini)**: Consigue las mejores sugerencias sobre qué ponerte utilizando la API de Google Gemini, basadas en tus prendas guardadas y en el clima local actual.
- ** Integración del Clima en Vivo**: Conecta con los datos de **Open-Meteo API** para entender las condiciones meteorológicas y sugerir outfits relevantes y precisos.
- ** Gestión Integral y Carga de Fotos**: Agrega partes superiores, inferiores, calzado y accesorios. Permite recorte, previsualización, y eliminación precisa de fotos/ítems. 

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

##  Contribuir

¡Las contribuciones son bienvenidas! Siéntete libre de abrir *Issues* (para fallos o reportes de errores) o *Pull Requests* para proponer nuevas características que hagan esta app más completa. 

---

**© 2026 ¿Qué me pongo? Todos los derechos reservados.**
