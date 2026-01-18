import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { tableIdA, tableIdB, date, serviceId, shiftId } = body

        // Validation
        if (!tableIdA || !tableIdB || !date || !serviceId) {
            return NextResponse.json(
                { error: 'Missing required fields: tableIdA, tableIdB, date, serviceId' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        // Get table details
        const { data: tables, error: tablesError } = await supabase
            .from('tables')
            .select('id, max_capacity, restaurant_id')
            .in('id', [tableIdA, tableIdB])

        if (tablesError) throw tablesError

        if (!tables || tables.length !== 2) {
            return NextResponse.json(
                { error: 'One or both tables not found' },
                { status: 404 }
            )
        }

        // Verify tables belong to same restaurant
        if (tables[0].restaurant_id !== tables[1].restaurant_id) {
            return NextResponse.json(
                { error: 'Tables must belong to the same restaurant' },
                { status: 400 }
            )
        }

        const combinedCapacity = tables.reduce((sum, t) => sum + t.max_capacity, 0)

        // Create the link
        const { data: link, error: linkError } = await supabase
            .from('table_links')
            .insert({
                restaurant_id: tables[0].restaurant_id,
                primary_table_id: tableIdA,
                secondary_table_id: tableIdB,
                link_date: date,
                service_id: serviceId,
                shift_id: shiftId || null,
                combined_capacity: combinedCapacity,
                created_by: user?.id || null,
            })
            .select()
            .single()

        if (linkError) throw linkError

        return NextResponse.json(
            { success: true, link },
            { status: 201 }
        )
    } catch (error) {
        console.error('Table link error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
