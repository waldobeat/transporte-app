import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getRpID, getExpectedOrigin } from '@/lib/webauthn';
import { getExpectedChallenge, deleteChallenge } from '@/lib/challenges';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, response } = body;

        const passenger = await prisma.passenger.findUnique({ where: { id } });
        if (!passenger) {
            return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
        }

        const expectedChallenge = getExpectedChallenge(id);
        if (!expectedChallenge) {
            return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
        }

        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge,
            expectedOrigin: getExpectedOrigin(request.url),
            expectedRPID: getRpID(request.url),
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

        // Log the transport (attendance) and update counter
        await prisma.$transaction([
            prisma.passenger.update({
                where: { id },
                data: { counter: BigInt(newCounter) }
            }),
            prisma.transport.create({
                data: { passengerId: id }
            })
        ]);

        deleteChallenge(id);

        return NextResponse.json({ verified: true, message: 'Authentication successful and attendance logged' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
