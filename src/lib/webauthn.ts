export const rpName = 'Transporte Asistencia App';

// In a real application, these should be environment variables.
export const getRpID = (requestUrl: string) => {
    const url = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : new URL(requestUrl);
    return url.hostname;
};

export const getExpectedOrigin = (requestUrl: string) => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    const url = new URL(requestUrl);
    return url.origin;
};
