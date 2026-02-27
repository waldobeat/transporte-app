import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: 'Falta el ID del pasajero' }, { status: 400 });

        // Verify passenger exists
        const passenger = await prisma.passenger.findUnique({ where: { id } });

        if (!passenger) {
            return NextResponse.json({ error: 'Pasajero no encontrado en el sistema' }, { status: 404 });
        }

        // Check if already marked today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const alreadyMarked = await prisma.transport.findFirst({
            where: {
                passengerId: id,
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (alreadyMarked) {
            return NextResponse.json({
                error: 'Este pasajero ya marcó asistencia hoy',
                passenger: {
                    id: passenger.id,
                    name: passenger.name,
                    lastName: passenger.lastName
                }
            }, { status: 400 });
        }

        // Register attendance (Transport)
        await prisma.transport.create({
            data: { passengerId: id }
        });

        return NextResponse.json({
            success: true,
            message: 'Asistencia registrada',
            passenger: {
                id: passenger.id,
                name: passenger.name,
                lastName: passenger.lastName
            }
        });
    } catch (error: any) {
        console.error('QR Mark Attendance Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
