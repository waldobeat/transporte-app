'use client';

import { useState, useEffect } from 'react';

export default function LoginGate({ children, role }: { children: React.ReactNode, role: 'master' | 'driver' }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storedRole = localStorage.getItem(`auth_${role}`);
        if (storedRole === 'true') {
            setIsAuthenticated(true);
        }
    }, [role]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (role === 'master' && username === 'jesus' && password === 'jesus') {
            localStorage.setItem('auth_master', 'true');
            setIsAuthenticated(true);
        } else if (
            role === 'driver' &&
            ((username === 'ruta1' && password === 'ruta1') || (username === 'ruta2' && password === 'ruta2'))
        ) {
            localStorage.setItem('auth_driver', 'true');
            setIsAuthenticated(true);
        } else {
            setError('Usuario o contraseña incorrectos');
        }
    };

    // Prevent hydration mismatch
    if (!mounted) return null;

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Acceso {role === 'master' ? 'Maestro' : 'Conductor'}</h2>
                    <p className="text-sm text-zinc-500 mt-2">Ingrese sus credenciales para continuar</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Usuario"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Contraseña"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-4"
                    >
                        Ingresar al Sistema
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="/" className="text-sm text-zinc-500 hover:text-blue-600 font-medium transition-colors">Volver a Inicio</a>
                </div>
            </div>
        </div>
    );
}
