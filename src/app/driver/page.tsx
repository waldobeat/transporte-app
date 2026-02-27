'use client';

import { useState, useRef, useEffect } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';

type PassengerRecord = {
    id: string;
    timestamp: string;
    name?: string;
};

export default function DriverDashboard() {
    const [isListening, setIsListening] = useState(false);
    const [records, setRecords] = useState<PassengerRecord[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const stopRef = useRef(false);

    // Stop listening when leaving page
    useEffect(() => {
        return () => { stopRef.current = true; };
    }, []);

    const handleStartListening = async () => {
        setIsListening(true);
        stopRef.current = false;
        setMessage({ type: 'success', text: 'Lector biométrico activado. Esperando huellas...' });

        while (!stopRef.current) {
            try {
                // 1. Get options
                const optResp = await fetch('/api/webauthn/authenticate/options', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });

                const optData = await optResp.json();
                if (!optResp.ok) throw new Error(optData.error || 'Failed to get authentication options');

                // 2. Pass options to browser WebAuthn API
                let attResp;
                try {
                    attResp = await startAuthentication({ optionsJSON: optData.options });
                } catch (err: any) {
                    if (err.name === 'NotAllowedError') {
                        throw new Error('LECTOR_STOPPED');
                    }
                    throw new Error(`Error del autenticador: ${err.message}`);
                }

                // 3. Verify response using the server challenge ID
                const verifyResp = await fetch('/api/webauthn/authenticate/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        challengeId: optData.challengeId,
                        response: attResp,
                    }),
                });

                const verifyData = await verifyResp.json();
                if (!verifyResp.ok) throw new Error(verifyData.error || 'Failed to verify authentication');

                // Add to list
                setRecords(prev => [{
                    id: verifyData.passenger.id,
                    timestamp: new Date().toLocaleTimeString('es-ES'),
                    name: `${verifyData.passenger.name} ${verifyData.passenger.lastName}`
                }, ...prev]);

                setMessage({ type: 'success', text: `✅ Acceso Autorizado: ${verifyData.passenger.name}` });

                // Pequeña pausa para que se vea el mensaje de éxito antes de abrir el modal de nuevo
                await new Promise(r => setTimeout(r, 1500));

            } catch (error: any) {
                if (error.message === 'LECTOR_STOPPED') {
                    stopRef.current = true;
                    setIsListening(false);
                    setMessage({ type: 'error', text: 'Lector detenido.' });
                    break;
                }

                setMessage({ type: 'error', text: error.message });
                // Wait before retrying to avoid spamming the database if there's a persistent error
                await new Promise(r => setTimeout(r, 3000));
            }
        }
    };

    const handleStopListening = () => {
        stopRef.current = true;
        setIsListening(false);
        setMessage(null);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center">
            <div className="max-w-md w-full h-screen flex flex-col bg-white dark:bg-zinc-900 shadow-xl overflow-hidden relative">

                {/* Header */}
                <header className="bg-blue-600 text-white p-6 pb-8 flex-shrink-0 shadow-md z-10 relative">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-bold">Control de Abordaje</h1>
                        <a href="/" className="text-blue-200 hover:text-white text-sm">Salir</a>
                    </div>

                    <div className="flex flex-col gap-3">
                        {!isListening ? (
                            <button
                                onClick={handleStartListening}
                                className="w-full bg-white text-blue-600 hover:bg-zinc-100 py-4 rounded-xl font-bold text-lg shadow flex items-center justify-center gap-2 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11h.01" /><path d="M12 6h.01" /><path d="M12 16h.01" /><path d="M8 11h.01" /><path d="M8 16h.01" /><path d="M16 11h.01" /><path d="M16 16h.01" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 2v9" /><path d="M12 11v8" /><path d="M8 2v9" /><path d="M8 11v8" /><path d="M16 2v9" /><path d="M16 11v8" /></svg>
                                Activar Modo Escucha Continua
                            </button>
                        ) : (
                            <button
                                onClick={handleStopListening}
                                className="w-full bg-red-500 hover:bg-red-400 text-white py-4 rounded-xl font-bold text-lg shadow flex items-center justify-center gap-2 transition-all animate-pulse"
                            >
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                                Lector Activo (Detener)
                            </button>
                        )}
                    </div>
                </header>

                {/* Notifications */}
                {message && (
                    <div
                        className={`absolute top-[10rem] left-4 right-4 z-20 p-4 rounded-xl shadow-lg border text-center font-bold animate-in slide-in-from-top-4 fade-in duration-300 ${message.type === 'success'
                            ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800'
                            : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'
                            }`}
                        onClick={() => setMessage(null)}
                    >
                        {message.text}
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50 mt-12">
                    {records.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 space-y-4">
                            {!isListening ? (
                                <>
                                    <svg className="w-16 h-16 opacity-50 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <p>Toca el botón arriba para iniciar</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                                    <p className="font-medium text-blue-600 dark:text-blue-400">Esperando pasajeros...</p>
                                    <p className="text-sm text-center px-4">El dispositivo pedirá la huella. Solo diles que coloquen su dedo.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        records.map((rec, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold uppercase overflow-hidden">
                                        {rec.name ? rec.name.substring(0, 2) : rec.id.substring(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{rec.name || rec.id}</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">C.I: {rec.id}</p>
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-green-600 dark:text-green-500">
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
