import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getRpID } from '@/lib/webauthn';
import { saveChallenge } from '@/lib/challenges';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const options = await generateAuthenticationOptions({
            rpID: getRpID(request),
            userVerification: 'required',
            // No allowCredentials array to enable Discoverable Credentials (Passkeys)
        });

        // Save challenge to the new AuthChallenge table
        const authChallenge = await prisma.authChallenge.create({
            data: { challenge: options.challenge }
        });

        return NextResponse.json({ options, challengeId: authChallenge.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
