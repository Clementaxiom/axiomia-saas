import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    const shiftId = searchParams.get('shiftId')

    if (!restaurantId || !date || !serviceId) {
        return NextResponse.json(
            { error: 'Missing required params: restaurantId, date, serviceId' },
            { status: 400 }
        )
    }

    try {
        const supabase = await createClient()

        // Get all tables with room info
        const { data: tables, error: tablesError } = await supabase
            .from('tables')
            .select('*, room:rooms(id, name)')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .order('table_number', { ascending: true })

        if (tablesError) throw tablesError

        // Get active table links
        let linksQuery = supabase
            .from('table_links')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('link_date', date)
            .eq('service_id', serviceId)

        if (shiftId) {
            linksQuery = linksQuery.eq('shift_id', shiftId)
        }

        const { data: links, error: linksError } = await linksQuery

        if (linksError) throw linksError

        // Get reservations
        let reservationsQuery = supabase
            .from('reservations')
            .select(`
        *,
        table:tables(id, table_number)
      `)
            .eq('restaurant_id', restaurantId)
            .eq('reservation_date', date)
            .eq('service_id', serviceId)
            .neq('status', 'cancelled')

        if (shiftId) {
            reservationsQuery = reservationsQuery.eq('shift_id', shiftId)
        }

        const { data: reservations, error: reservationsError } = await reservationsQuery

        if (reservationsError) throw reservationsError

        // Calculate status for each table
        const tableStatuses = tables?.map((table) => {
            const reservation = reservations?.find((r) => r.table_id === table.id)
            const isLinked = links?.some(
                (l) => l.primary_table_id === table.id || l.secondary_table_id === table.id
            )
            const linkInfo = links?.find(
                (l) => l.primary_table_id === table.id || l.secondary_table_id === table.id
            )

            let status: 'available' | 'reserved' | 'occupied' = 'available'
            if (reservation) {
                status = reservation.status === 'seated' ? 'occupied' : 'reserved'
            }

            return {
                ...table,
                status,
                reservation: reservation || null,
                isLinked: isLinked || false,
                linkInfo: linkInfo || null,
            }
        })

        return NextResponse.json({
            tables: tableStatuses,
            links,
            reservations,
            context: { date, serviceId, shiftId },
        })
    } catch (error) {
        console.error('Floor plan API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
