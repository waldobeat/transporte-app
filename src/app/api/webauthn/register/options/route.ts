import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getRpID, rpName } from '@/lib/webauthn';
import { saveChallenge } from '@/lib/challenges';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, lastName } = body;

        if (!id || !name || !lastName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existing = await prisma.passenger.findUnique({ where: { id } });
        if (existing) {
            return NextResponse.json({ error: 'Passenger already exists' }, { status: 400 });
        }

        const rpID = getRpID(request.url);

        // Using base64url or just string based on SimpleWebAuthn version
        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userName: `${name} ${lastName}`,
            // Optionally provide a user display name
            userDisplayName: `${name} ${lastName}`,
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
            },
            // You could set timeout here
        });

        saveChallenge(id, options.challenge);

        return NextResponse.json(options);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
