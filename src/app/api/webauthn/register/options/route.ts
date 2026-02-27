import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getRpID, rpName } from '@/lib/webauthn';
import { saveChallenge } from '@/lib/challenges';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const rpID = getRpID(request);
        const tempId = crypto.randomUUID();

        // Using base64url or just string based on SimpleWebAuthn version
        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userName: `user_${tempId}`,
            userDisplayName: 'Nuevo Pasajero',
            authenticatorSelection: {
                residentKey: 'required',
                userVerification: 'required',
                authenticatorAttachment: 'platform',
            },
            // You could set timeout here
        });

        await saveChallenge(tempId, options.challenge);

        return NextResponse.json({ options, tempId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
