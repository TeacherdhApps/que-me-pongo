
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function AuthView({ onAuthSuccess }: { onAuthSuccess: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onAuthSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/Que-me-pongo/',
            },
        });
        if (error) {
            setError(error.message || 'Error al iniciar con Google');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center animate-fade px-6">
            <div className="bg-white border border-zinc-100 shadow-2xl rounded-[3rem] p-10 w-full max-w-md space-y-10">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                        <img src="/icon-192.svg" className="w-10 h-10" alt="Logo" />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">
                        {isSignUp ? 'Crear Cuenta' : 'Bienvenido'}
                    </h2>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                        Tus outfits sincronizados en la nube
                    </p>
                </div>

                {/* Google OAuth Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full py-4 bg-white border-2 border-zinc-200 rounded-full text-xs font-black uppercase tracking-widest hover:border-zinc-400 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continuar con Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-zinc-200"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">o</span>
                    <div className="flex-1 h-px bg-zinc-200"></div>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-zinc-50 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-black/5"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Contraseña</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-zinc-50 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-black/5"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-[10px] font-bold uppercase text-center bg-red-50 py-3 rounded-xl">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                    >
                        {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                    </button>
                </div>
            </div>
        </div>
    );
}
