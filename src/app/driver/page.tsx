'use client';

import { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import LoginGate from '@/components/LoginGate';

type PassengerRecord = {
    id: string;
    timestamp: string;
    name?: string;
};

export default function DriverDashboard() {
    const [isScanning, setIsScanning] = useState(false);
    const [records, setRecords] = useState<PassengerRecord[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const lastScannedIdRef = useRef<string | null>(null);
    const cooldownRef = useRef(false);

    // Load session on mount
    useEffect(() => {
        const savedSession = localStorage.getItem('driver_scan_session');
        if (savedSession) {
            try {
                setRecords(JSON.parse(savedSession));
            } catch (e) {
                console.error("Failed to parse saved session", e);
            }
        }
    }, []);

    const handleScan = async (detectedCodes: any[]) => {
        if (!detectedCodes || detectedCodes.length === 0 || cooldownRef.current) return;

        const rawValue = detectedCodes[0].rawValue;
        if (!rawValue) return;

        // Prevent double scanning the exact same passenger instantly (let's say 3 seconds cooldown)
        if (lastScannedIdRef.current === rawValue) return;

        // Found a code! Start processing.
        cooldownRef.current = true;
        lastScannedIdRef.current = rawValue;

        // Vibrate if supported
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(200);
        }

        try {
            const response = await fetch('/api/attendance/mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: rawValue }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error desconocido');
            }

            // Success
            setRecords(prev => {
                const newRecords = [{
                    id: data.passenger.id,
                    timestamp: new Date().toLocaleTimeString('es-ES'),
                    name: `${data.passenger.name} ${data.passenger.lastName}`
                }, ...prev];

                // Save to local storage to persist across reloads
                localStorage.setItem('driver_scan_session', JSON.stringify(newRecords));
                return newRecords;
            });

            setMessage({ type: 'success', text: `✅ Acceso: ${data.passenger.name}` });

        } catch (error: any) {
            setMessage({ type: 'error', text: `❌ Denegado: ${error.message}` });
        } finally {
            // Reset cooldown after 3 seconds so the same person could scan again (if needed)
            // or someone else can scan immediately
            setTimeout(() => {
                cooldownRef.current = false;
                lastScannedIdRef.current = null;
            }, 3000);

            // Clear message after 3 seconds automatically
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <LoginGate role="driver">
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center">
                <div className="max-w-md w-full h-screen flex flex-col bg-zinc-900 shadow-xl overflow-hidden relative">

                    {/* Header */}
                    <header className="bg-zinc-900 text-white p-4 pb-4 flex-shrink-0 z-10 relative border-b border-zinc-800">
                        <div className="flex justify-between items-center">
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /></svg>
                                Escáner
                            </h1>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        if (window.confirm('¿Está seguro que desea enviar la lista y finalizar el turno?')) {
                                            localStorage.removeItem('driver_scan_session');
                                            window.location.reload();
                                        }
                                    }}
                                    disabled={records.length === 0}
                                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md"
                                >
                                    Enviar Lista
                                </button>
                                <button
                                    onClick={() => { localStorage.removeItem('auth_driver'); window.location.href = '/'; }}
                                    className="text-zinc-400 hover:text-white text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors"
                                >
                                    Salir
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area (Scanner + List) */}
                    <div className="flex-1 overflow-hidden flex flex-col bg-black relative">

                        {/* The Camera Viewport */}
                        <div className="relative w-full aspect-square bg-zinc-950 flex items-center justify-center">
                            {!isScanning ? (
                                <button
                                    onClick={() => setIsScanning(true)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3 shadow-2xl transition-transform active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                                    <span className="font-bold text-lg">Activar Escáner</span>
                                </button>
                            ) : (
                                <div className="w-full h-full relative">
                                    <Scanner
                                        onScan={handleScan}
                                        onError={(e) => console.log('Scanner Error:', e)}
                                        formats={['qr_code']}
                                        components={{
                                            onOff: true, // Flashlight
                                        }}
                                        styles={{
                                            container: { height: '100%', width: '100%' },
                                            video: { objectFit: 'cover' }
                                        }}
                                    />
                                    {/* Custom Overlay Grid for UI aesthetics */}
                                    <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-10">
                                        <div className="w-full h-full border-2 border-green-500/50 rounded-xl relative shadow-[0_0_0_999px_rgba(0,0,0,0.4)]">
                                            {/* Corner brackets */}
                                            <div className="absolute top-[-2px] left-[-2px] w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                                            <div className="absolute top-[-2px] right-[-2px] w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                                            <div className="absolute bottom-[-2px] left-[-2px] w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                                            <div className="absolute bottom-[-2px] right-[-2px] w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>

                                            {/* Scanning Line Animation */}
                                            <div className="w-full h-0.5 bg-green-500 absolute top-1/2 left-0 animate-[scan_2s_ease-in-out_infinite] opacity-70 blur-[1px]"></div>
                                        </div>
                                    </div>
                                    {/* Stop Button Overlay */}
                                    <button
                                        onClick={() => setIsScanning(false)}
                                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white px-6 py-2 rounded-full font-bold shadow-lg z-20 hover:bg-red-500 backdrop-blur"
                                    >
                                        Detener Cámara
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Feedback Messages Layer */}
                        {message && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-3/4 animate-in zoom-in slide-in-from-bottom-4 duration-200">
                                <div className={`p-6 rounded-2xl shadow-2xl text-center font-bold text-lg ${message.type === 'success' ? 'bg-green-500 text-white border-4 border-green-400' : 'bg-red-600 text-white border-4 border-red-500'}`}>
                                    {message.text}
                                </div>
                            </div>
                        )}

                        {/* Historical List */}
                        <div className="flex-1 bg-zinc-950 overflow-y-auto p-4 space-y-3">
                            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Historial de Abordaje ({records.length})
                            </h3>

                            {records.length === 0 ? (
                                <div className="text-center text-zinc-600 mt-10">Esperando escaneos...</div>
                            ) : (
                                records.map((rec, i) => (
                                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold uppercase overflow-hidden">
                                                {rec.name ? rec.name.substring(0, 2) : rec.id.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-lg">{rec.name || rec.id}</p>
                                                <p className="text-xs text-zinc-500">C.I: {rec.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                                            {rec.timestamp}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer Fixed Action removed as it's now in header */}
                    <div className="bg-zinc-950 p-2 relative z-10 w-full">
                        {/* Add keyframes strictly for the scanning line */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                        @keyframes scan {
                            0% { transform: translateY(-100px); }
                            50% { transform: translateY(100px); }
                            100% { transform: translateY(-100px); }
                        }
                    `}} />
                    </div>

                </div>
            </div >
        </LoginGate >
    );
}
