import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        let dateFilter = {};
        if (dateParam) {
            const startOfDay = new Date(dateParam);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(dateParam);
            endOfDay.setUTCHours(23, 59, 59, 999);

            dateFilter = {
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                }
            };
        }

        const attendanceRecords = await prisma.transport.findMany({
            where: dateFilter,
            include: {
                passenger: true,
            },
            orderBy: {
                timestamp: 'asc',
            }
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Lista de Asistencia');

        sheet.columns = [
            { header: 'Nro', key: 'nro', width: 5 },
            { header: 'ID', key: 'id', width: 15 },
            { header: 'Nombres', key: 'names', width: 20 },
            { header: 'Apellidos', key: 'lastNames', width: 25 },
            { header: 'Día', key: 'dayName', width: 15 },
            { header: 'Fecha', key: 'dateStr', width: 15 },
            { header: 'Hora', key: 'timeStr', width: 15 },
        ];

        attendanceRecords.forEach((record: any, index: number) => {
            const dateObj = record.timestamp;

            // Format to "Viernes"
            const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone: 'America/Santiago' }).format(dateObj);
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

            // Format to "02-02-2026"
            const dateStr = new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'America/Santiago'
            }).format(dateObj).replace(/\//g, '-');

            // Format to "7:00 AM"
            const timeStr = new Intl.DateTimeFormat('es-ES', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Santiago'
            }).format(dateObj).toUpperCase();

            sheet.addRow({
                nro: index + 1,
                id: record.passenger.id,
                names: record.passenger.name,
                lastNames: record.passenger.lastName,
                dayName: capitalizedDay,
                dateStr: dateStr,
                timeStr: timeStr,
            });
        });

        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).alignment = { horizontal: 'center' };

        const buffer = await workbook.xlsx.writeBuffer();

        // Workaround for NextResponse handling raw buffers returning it correctly as Download
        const response = new NextResponse(buffer);

        // Set proper headers
        response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.headers.set('Content-Disposition', `attachment; filename="asistencia_${dateParam || 'completa'}.xlsx"`);

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
