'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function MasterDashboard() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        lastName: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [exportDate, setExportDate] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            // 1. Get options
            const optResp = await fetch('/api/webauthn/register/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const optData = await optResp.json();

            if (!optResp.ok) throw new Error(optData.error || 'Failed to get registration options');

            // 2. Pass options to browser WebAuthn API
            let attResp;
            try {
                attResp = await startRegistration({ optionsJSON: optData });
            } catch (err: any) {
                if (err.name === 'InvalidStateError') {
                    throw new Error('El dispositivo ya está registrado para otro usuario (o el mismo).');
                }
                if (err.name === 'NotAllowedError') { // User cancelled
                    throw new Error('Operación cancelada o denegada.');
                }
                // Show the exact error the browser throws to understand why the Android authenticator fails
                throw new Error(`Error del autenticador: ${err.name} - ${err.message}`);
            }

            // 3. Verify response
            const verifyResp = await fetch('/api/webauthn/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    response: attResp,
                }),
            });

            const verifyData = await verifyResp.json();
            if (!verifyResp.ok) throw new Error(verifyData.error || 'Failed to verify registration');

            setMessage({ type: 'success', text: 'Pasajero registrado exitosamente.' });
            setFormData({ id: '', name: '', lastName: '' });

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        let url = '/api/reports/export';
        if (exportDate) {
            url += `?date=${exportDate}`;
        }
        window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col items-center">
            <div className="max-w-3xl w-full space-y-8">
                <header className="flex justify-between items-center pb-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Panel Maestro</h1>
                    <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">Volver</a>
                </header>

                <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold mb-6">Registrar Pasajero</h2>

                    {message && (
                        <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cédula / ID</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: 12345678"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nombres</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Juan"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Apellidos</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Pérez"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : 'Registrar con Huella Biometrica'}
                        </button>
                    </form>
                </section>

                <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold mb-6">Exportar Asistencia (Excel)</h2>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full sm:flex-1">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Filtrar por Fecha (Opcional)</label>
                            <input
                                type="date"
                                value={exportDate}
                                onChange={e => setExportDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-green-500 outline-none transition-all text-zinc-500"
                            />
                        </div>
                        <button
                            onClick={handleExport}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded-xl transition-all whitespace-nowrap h-[42px]"
                        >
                            Descargar Excel
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
