export const rpName = 'Transporte Asistencia App';

// In a real application, these should be environment variables.
export const getRpID = (requestUrl: string) => {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        // NEXT_PUBLIC_APP_URL might be 'https://transporte.vercel.app'
        try {
            return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
        } catch (e) {
            // Or it might just be 'transporte.vercel.app'
            return process.env.NEXT_PUBLIC_APP_URL;
        }
    }
    const url = new URL(requestUrl);
    return url.hostname;
};

export const getExpectedOrigin = (requestUrl: string) => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    const url = new URL(requestUrl);
    return url.origin;
};
