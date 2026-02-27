'use client';

import { useState, useRef, useEffect } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';

type PassengerRecord = {
    id: string;
    timestamp: string;
    name?: string;
};

export default function DriverDashboard() {
    const [loading, setLoading] = useState(false);
    const [passengerId, setPassengerId] = useState('');
    const [records, setRecords] = useState<PassengerRecord[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on load
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleAuthenticate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passengerId.trim()) return;

        setLoading(true);
        setMessage(null);
        try {
            // 1. Get options
            const optResp = await fetch('/api/webauthn/authenticate/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: passengerId }),
            });

            const optData = await optResp.json();

            if (!optResp.ok) throw new Error(optData.error || 'Failed to get authentication options');

            // 2. Pass options to browser WebAuthn API
            let attResp;
            try {
                attResp = await startAuthentication({ optionsJSON: optData });
            } catch (err: any) {
                if (err.name === 'NotAllowedError') {
                    throw new Error('Operación cancelada o denegada.');
                }
                throw new Error('Error al validar la huella.');
            }

            // 3. Verify response
            const verifyResp = await fetch('/api/webauthn/authenticate/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: passengerId,
                    response: attResp,
                }),
            });

            const verifyData = await verifyResp.json();
            if (!verifyResp.ok) throw new Error(verifyData.error || 'Failed to verify authentication');

            // Add to list
            setRecords(prev => [{
                id: passengerId,
                timestamp: new Date().toLocaleTimeString('es-ES'),
                name: 'Pasajero Validado' // Idealmente retornar el nombre desde el backend
            }, ...prev]);

            setMessage({ type: 'success', text: 'Acceso Autorizado.' });
            setPassengerId('');

            // Refocus input for next passenger
            setTimeout(() => inputRef.current?.focus(), 100);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
            setTimeout(() => inputRef.current?.focus(), 100);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center">
            <div className="max-w-md w-full h-screen flex flex-col bg-white dark:bg-zinc-900 shadow-xl overflow-hidden relative">

                {/* Header */}
                <header className="bg-blue-600 text-white p-6 pb-8 flex-shrink-0 shadow-md z-10 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold">Control de Abordaje</h1>
                        <a href="/" className="text-blue-200 hover:text-white text-sm">Salir</a>
                    </div>
                    <form onSubmit={handleAuthenticate} className="relative mt-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={passengerId}
                            onChange={e => setPassengerId(e.target.value)}
                            placeholder="Ingresar ID del pasajero..."
                            className="w-full bg-blue-700/50 text-white placeholder-blue-300 border-none rounded-xl py-4 flex-shrink-0 px-5 focus:ring-2 focus:ring-white outline-none text-lg font-medium shadow-inner"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !passengerId}
                            className="absolute right-2 top-2 bottom-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg px-4 font-semibold disabled:opacity-50 transition-all"
                        >
                            {loading ? '...' : 'Validar'}
                        </button>
                    </form>
                </header>

                {/* Notifications */}
                {message && (
                    <div
                        className={`absolute top-[9rem] left-4 right-4 z-20 p-4 rounded-xl shadow-lg border text-center font-bold animate-in slide-in-from-top-4 fade-in duration-300 ${message.type === 'success'
                                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800'
                                : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'
                            }`}
                        onClick={() => setMessage(null)}
                    >
                        {message.text}
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50">
                    {records.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 space-y-4">
                            <svg className="w-16 h-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p>Esperando pasajeros...</p>
                        </div>
                    ) : (
                        records.map((rec, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                        {rec.id.substring(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{rec.id}</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Validado mediante Passkey</p>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                                    {rec.timestamp}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold py-4 rounded-xl transition-all flex items-center justify-center"
                    >
                        Finalizar Recorrido ({records.length})
                    </button>
                </div>

            </div>
        </div>
    );
}
