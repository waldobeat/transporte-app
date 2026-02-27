import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getRpID, getExpectedOrigin } from '@/lib/webauthn';
import { getExpectedChallenge, deleteChallenge } from '@/lib/challenges';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { challengeId, response } = body;

        // 1. Get the challenge from the generic table
        const authChallenge = await prisma.authChallenge.findUnique({ where: { id: challengeId } });
        if (!authChallenge) {
            return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
        }

        const expectedChallenge = authChallenge.challenge;

        // 2. Discover the passenger by their credential ID
        const passenger = await prisma.passenger.findFirst({
            where: { credentialID: response.id }
        });

        if (!passenger) {
            // Clean up challenge even on failure
            try { await prisma.authChallenge.delete({ where: { id: challengeId } }); } catch (e) { }
            return NextResponse.json({ error: 'Credencial biométrica no está registrada en el sistema.' }, { status: 404 });
        }

        // 3. Verify the match
        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge,
            expectedOrigin: getExpectedOrigin(request),
            expectedRPID: getRpID(request),
            credential: {
                id: passenger.credentialID,
                publicKey: Buffer.from(passenger.credentialPK, 'base64url'),
                counter: Number(passenger.counter),
            },
            requireUserVerification: true,
        });

        const { verified, authenticationInfo } = verification;

        if (!verified || !authenticationInfo) {
            return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
        }

        const { newCounter } = authenticationInfo;

        // 4. Log the transport (attendance) and update counter
        await prisma.$transaction([
            prisma.passenger.update({
                where: { id: passenger.id },
                data: { counter: BigInt(newCounter) }
            }),
            prisma.transport.create({
                data: { passengerId: passenger.id }
            })
        ]);

        // Clean up challenge
        try { await prisma.authChallenge.delete({ where: { id: challengeId } }); } catch (e) { }

        return NextResponse.json({
            verified: true,
            message: 'Authentication successful and attendance logged',
            passenger: {
                id: passenger.id,
                name: passenger.name,
                lastName: passenger.lastName
            }
        });
    } catch (error: any) {
        console.error('WebAuthn Auth Verify Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
