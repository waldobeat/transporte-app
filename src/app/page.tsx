import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <main className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Asistencia de Transporte
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium text-lg">
            Control de código seguro.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Link
            href="/driver"
            className="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-6 text-lg font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Terminal de Conductor
          </Link>

          <Link
            href="/master"
            className="group relative flex w-full justify-center rounded-xl bg-zinc-800 px-4 py-6 text-lg font-semibold text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus:ring-offset-zinc-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Panel de Administración
          </Link>
        </div>
      </main>
    </div>
  );
}
