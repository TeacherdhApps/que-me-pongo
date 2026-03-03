
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
