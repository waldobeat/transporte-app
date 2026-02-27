import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getRpID, getExpectedOrigin } from '@/lib/webauthn';
import { getExpectedChallenge, deleteChallenge } from '@/lib/challenges';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, lastName, response, tempId } = body;

        const expectedChallenge = await getExpectedChallenge(tempId);
        if (!expectedChallenge) {
            return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
        }

        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge,
            expectedOrigin: process.env.NEXT_PUBLIC_APP_URL || getExpectedOrigin(request.url),
            expectedRPID: getRpID(request.url),
            requireUserVerification: true,
        });

        const { verified, registrationInfo } = verification;

        if (!verified || !registrationInfo) {
            return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
        }

        const { credential } = registrationInfo;

        // We assume credential.id is already base64url string as per simplewebauthn v10+
        const credentialID = credential.id;
        const credentialPK = Buffer.from(credential.publicKey).toString('base64url');

        // Check if final ID exists
        const existing = await prisma.passenger.findUnique({ where: { id } });
        if (existing) {
            try { await prisma.passenger.delete({ where: { id: tempId } }); } catch (e) { }
            return NextResponse.json({ error: 'La Cédula/ID ya está registrada' }, { status: 400 });
        }

        await prisma.passenger.create({
            data: {
                id,
                name,
                lastName,
                credentialID,
                credentialPK,
                counter: BigInt(credential.counter),
            }
        });

        try { await prisma.passenger.delete({ where: { id: tempId } }); } catch (e) { }

        return NextResponse.json({ verified: true });
    } catch (error: any) {
        console.error('WebAuthn Verify Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
