import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    const shiftId = searchParams.get('shiftId')
    const status = searchParams.get('status')

    if (!restaurantId) {
        return NextResponse.json(
            { error: 'Missing required param: restaurantId' },
            { status: 400 }
        )
    }

    try {
        const supabase = await createClient()

        let query = supabase
            .from('reservations')
            .select(`
        *,
        table:tables(id, table_number, room_id),
        service:services(id, name, type),
        shift:shifts(id, name)
      `)
            .eq('restaurant_id', restaurantId)
            .order('reservation_time', { ascending: true })

        if (date) query = query.eq('reservation_date', date)
        if (serviceId) query = query.eq('service_id', serviceId)
        if (shiftId) query = query.eq('shift_id', shiftId)
        if (status) query = query.eq('status', status)

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ reservations: data })
    } catch (error) {
        console.error('Reservations GET error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            restaurantId,
            date,
            serviceId,
            shiftId,
            time,
            partySize,
            customerName,
            phone,
            email,
            notes,
            internalNotes,
            source = 'manual',
            tableId,
            tableLinkId,
            durationMinutes = 90,
        } = body

        // Validation
        if (!restaurantId || !date || !serviceId || !time || !partySize || !customerName) {
            return NextResponse.json(
                { error: 'Missing required fields: restaurantId, date, serviceId, time, partySize, customerName' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        // Create the reservation
        const { data: reservation, error } = await supabase
            .from('reservations')
            .insert({
                restaurant_id: restaurantId,
                reservation_date: date,
                service_id: serviceId,
                shift_id: shiftId || null,
                reservation_time: time,
                party_size: partySize,
                customer_name: customerName,
                customer_phone: phone || null,
                customer_email: email || null,
                notes: notes || null,
                internal_notes: internalNotes || null,
                source,
                table_id: tableId || null,
                table_link_id: tableLinkId || null,
                status: 'confirmed',
                duration_minutes: durationMinutes,
                created_by: user?.id || null,
            })
            .select(`
        *,
        table:tables(id, table_number),
        service:services(id, name, type),
        shift:shifts(id, name)
      `)
            .single()

        if (error) throw error

        return NextResponse.json(
            { success: true, reservation },
            { status: 201 }
        )
    } catch (error) {
        console.error('Reservations POST error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
