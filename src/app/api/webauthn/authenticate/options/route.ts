import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getRpID } from '@/lib/webauthn';
import { saveChallenge } from '@/lib/challenges';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const passenger = await prisma.passenger.findUnique({ where: { id } });
        if (!passenger) {
            return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
        }

        const options = await generateAuthenticationOptions({
            rpID: getRpID(request.url),
            allowCredentials: [{
                id: passenger.credentialID,
                transports: ['internal'], // Prefer built-in scanners
            }],
            userVerification: 'required',
        });

        saveChallenge(id, options.challenge);

        return NextResponse.json(options);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
