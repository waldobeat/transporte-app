export const rpName = 'Transporte Asistencia App';

// In a real application, these should be environment variables.
export const getRpID = (request: Request) => {
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    if (host) {
        return host.split(':')[0]; // Return the hostname part
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
        // NEXT_PUBLIC_APP_URL might be 'https://transporte.vercel.app'
        try {
            return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
        } catch (e) {
            // Or it might just be 'transporte.vercel.app'
            return process.env.NEXT_PUBLIC_APP_URL as string;
        }
    }
    const url = new URL(request.url);
    return url.hostname;
};

export const getExpectedOrigin = (request: Request) => {
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');

    if (host) {
        const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
        return `${proto}://${host}`;
    }

    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    const url = new URL(request.url);
    return url.origin;
};
