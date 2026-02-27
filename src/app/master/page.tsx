'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function MasterDashboard() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form data
    const [userData, setUserData] = useState({ id: '', name: '', lastName: '' });

    // Success State
    const [registeredUser, setRegisteredUser] = useState<{ id: string, name: string, lastName: string } | null>(null);

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

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col items-center justify-center">

            <div className="max-w-xl w-full flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Panel Maestro</h1>
                <a href="/" className="text-zinc-500 hover:text-blue-600 font-medium">Volver a Inicio</a>
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

            <div className="mt-8">
                <a href="/api/export" target="_blank" className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 font-semibold bg-white dark:bg-zinc-900 px-6 py-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Descargar Listado de Asistencia (Excel)
                </a>
            </div>
        </div>
    );
}
