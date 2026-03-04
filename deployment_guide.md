# Guía de Despliegue y Beta Testing 🚀

Para que tú y otros usuarios puedan probar la app en sus móviles, necesitamos subirla a internet. Aquí tienes los pasos recomendados.

## 1. Elegir Plataforma (Recomendado: Vercel)
Vercel es gratuito para proyectos personales y maneja muy bien las PWAs y las rutas de React.

### Pasos en Vercel:
1. Conecta tu repositorio de GitHub a Vercel.
2. En **Environment Variables**, añade:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase.
3. Haz clic en **Deploy**.

---

## 2. Configurar Supabase para Producción
Supabase necesita saber cuál es la URL real de tu app para que el inicio de sesión funcione correctamente.

1. Ve a tu panel de **Supabase > Authentication > Configuration > URL Configuration**.
2. En **Site URL**, pon la URL que te dio Vercel (ej: `https://que-me-pongo.vercel.app`).
3. En **Redirect URLs**, añade también esa misma URL.

---

## 3. Invitar a Usuarios
Como ya tenemos Supabase Auth activo:
1. Cualquier persona con la URL de tu app podrá registrarse.
2. Si quieres limitar quién entra, puedes desactivar el "Allow new users to sign up" en Supabase y crear sus cuentas manualmente desde el panel de **Users**.

---

## 4. Instalar como PWA
Una vez abras la app en tu móvil:
- **iOS (Safari)**: Pulsa el botón "Compartir" y luego "Añadir a pantalla de inicio".
- **Android (Chrome)**: Pulsa los tres puntos y luego "Instalar aplicación".

---

**¿Empezamos con el despliegue a Vercel o GitHub Pages?** He actualizado el `implementation_plan.md` con esta fase previa a la IA.
