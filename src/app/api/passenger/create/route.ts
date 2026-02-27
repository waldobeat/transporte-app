import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, lastName } = body;

        if (!id || !name || !lastName) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
        }

        // Check if passenger exists
        const existingPassenger = await prisma.passenger.findUnique({ where: { id } });
        if (existingPassenger) {
            return NextResponse.json({ error: 'La Cédula/ID ya está registrada' }, { status: 400 });
        }

        const newPassenger = await prisma.passenger.create({
            data: {
                id,
                name,
                lastName,
                credentialID: `mock_cred_${id}`, // Keeping this to avoid breaking Prisma schema completely yet
                credentialPK: 'mock_pk'
            }
        });

        return NextResponse.json({ success: true, passenger: newPassenger });
    } catch (error: any) {
        console.error('Create Passenger Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
