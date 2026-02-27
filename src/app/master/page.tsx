'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import LoginGate from '@/components/LoginGate';

export default function MasterDashboard() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form data
    const [userData, setUserData] = useState({ id: '', name: '', lastName: '' });

    // Success State
    const [registeredUser, setRegisteredUser] = useState<{ id: string, name: string, lastName: string } | null>(null);

    // Report Filtering State
    const [reportParams, setReportParams] = useState({
        mode: 'today' as 'today' | 'single' | 'range',
        date: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const handleSaveUserData = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Since we don't have biometrics anymore, we just call an API to create the user directly
            // In Prisma, we mapped credentialID to passenger ID as a hack for WebAuthn, we should probably update
            // the schema later, but for now we can mock it to keep DB working without dropping tables immediately.

            const response = await fetch('/api/passenger/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al guardar pasajero');

            setRegisteredUser(userData);
            setMessage({ type: 'success', text: '¡Pasajero registrado exitosamente!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setUserData({ id: '', name: '', lastName: '' });
        setRegisteredUser(null);
        setMessage(null);
    };

    const downloadQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 60;
            if (ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 20, 20);
                ctx.font = "bold 16px sans-serif";
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.fillText(registeredUser?.id || '', canvas.width / 2, canvas.height - 15);
            }
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_${registeredUser?.id}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const getReportUrl = () => {
        const baseUrl = '/api/reports/export';
        if (reportParams.mode === 'today') {
            const today = new Date().toISOString().split('T')[0];
            return `${baseUrl}?date=${today}`;
        }
        if (reportParams.mode === 'single') {
            return `${baseUrl}?date=${reportParams.date}`;
        }
        return `${baseUrl}?startDate=${reportParams.startDate}&endDate=${reportParams.endDate}`;
    };

    return (
        <LoginGate role="master">
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col items-center justify-center">

                <div className="max-w-xl w-full flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Panel Maestro</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => { localStorage.removeItem('auth_master'); window.location.reload(); }}
                            className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                        <a href="/" className="text-zinc-500 hover:text-blue-600 font-medium hidden sm:block">Volver a Inicio</a>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">

                    <div className="bg-blue-600 p-6 flex items-center justify-between text-white">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
                            Registro de Pasajeros
                        </h2>
                    </div>

                    <div className="p-8">
                        {message && (
                            <div className={`mb-6 p-4 rounded-xl border font-medium flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
                                <span>{message.text}</span>
                            </div>
                        )}

                        {!registeredUser ? (
                            <>
                                <p className="text-zinc-600 dark:text-zinc-300 mb-6 text-sm">
                                    Llene los datos del pasajero para generar su credencial de abordaje (Código QR).
                                </p>

                                <form onSubmit={handleSaveUserData} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5 flex items-center gap-2">
                                            Número de Cédula (ID)
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            value={userData.id}
                                            onChange={e => setUserData({ ...userData, id: e.target.value })}
                                            placeholder="Ej. 12345678"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                                                Nombres
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={userData.name}
                                                onChange={e => setUserData({ ...userData, name: e.target.value })}
                                                placeholder="Nombres"
                                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                                                Apellidos
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={userData.lastName}
                                                onChange={e => setUserData({ ...userData, lastName: e.target.value })}
                                                placeholder="Apellidos"
                                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading || !userData.id || !userData.name || !userData.lastName}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : 'Guardar y Generar QR'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300 py-4">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white text-center">
                                    {registeredUser.name} {registeredUser.lastName}
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">C.I: {registeredUser.id}</p>

                                <div className="bg-white p-6 rounded-3xl shadow-lg border border-zinc-100 flex flex-col items-center gap-4">
                                    <QRCodeSVG
                                        id="qr-code-svg"
                                        value={registeredUser.id}
                                        size={256}
                                        level="Q"
                                        includeMargin={true}
                                    />
                                </div>

                                <p className="text-sm text-center text-zinc-500 dark:text-zinc-400 mt-8 mb-6 max-w-sm">
                                    Este es el pase de abordaje del pasajero. Puede tomarle una captura de pantalla o imprimirlo.
                                </p>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={downloadQR}
                                        className="flex-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-4 rounded-xl shadow transition-all flex items-center justify-center gap-2"
                                    >
                                        Descargar QR
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-4 rounded-xl transition-all"
                                    >
                                        Nuevo Registro
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-10 w-full max-w-xl">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <div className="bg-green-600 p-6 text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Gestión de Reportes
                            </h2>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setReportParams({ ...reportParams, mode: 'today' })}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reportParams.mode === 'today' ? 'bg-green-600 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                                >
                                    Hoy
                                </button>
                                <button
                                    onClick={() => setReportParams({ ...reportParams, mode: 'single' })}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reportParams.mode === 'single' ? 'bg-green-600 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                                >
                                    Por Fecha
                                </button>
                                <button
                                    onClick={() => setReportParams({ ...reportParams, mode: 'range' })}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reportParams.mode === 'range' ? 'bg-green-600 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                                >
                                    Rango de Fechas
                                </button>
                            </div>

                            <div className="grid gap-4 pt-2">
                                {reportParams.mode === 'single' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Seleccionar Fecha</label>
                                        <input
                                            type="date"
                                            value={reportParams.date}
                                            onChange={(e) => setReportParams({ ...reportParams, date: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-3 px-4 font-medium outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                )}

                                {reportParams.mode === 'range' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Desde</label>
                                            <input
                                                type="date"
                                                value={reportParams.startDate}
                                                onChange={(e) => setReportParams({ ...reportParams, startDate: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-3 px-4 font-medium outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Hasta</label>
                                            <input
                                                type="date"
                                                value={reportParams.endDate}
                                                onChange={(e) => setReportParams({ ...reportParams, endDate: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-3 px-4 font-medium outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <a
                                href={getReportUrl()}
                                target="_blank"
                                className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-4 rounded-xl shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                {reportParams.mode === 'today' ? 'Descargar Reporte de Hoy' : 'Buscar y Descargar Excel'}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </LoginGate>
    );
}
