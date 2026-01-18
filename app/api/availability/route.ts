import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    const shiftId = searchParams.get('shiftId')
    const partySize = parseInt(searchParams.get('partySize') || '2')

    // Validation
    if (!restaurantId || !date || !serviceId) {
        return NextResponse.json(
            { error: 'Missing required params: restaurantId, date, serviceId' },
            { status: 400 }
        )
    }

    try {
        const supabase = await createClient()

        // 1. Get all active tables for the restaurant
        const { data: tables, error: tablesError } = await supabase
            .from('tables')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)

        if (tablesError) throw tablesError

        // 2. Get existing reservations for this context
        let reservationsQuery = supabase
            .from('reservations')
            .select('id, table_id, table_link_id')
            .eq('restaurant_id', restaurantId)
            .eq('reservation_date', date)
            .eq('service_id', serviceId)
            .neq('status', 'cancelled')

        if (shiftId) {
            reservationsQuery = reservationsQuery.eq('shift_id', shiftId)
        }

        const { data: reservations, error: reservationsError } = await reservationsQuery

        if (reservationsError) throw reservationsError

        // 3. Get active table links for this context
        let linksQuery = supabase
            .from('table_links')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('link_date', date)
            .eq('service_id', serviceId)

        if (shiftId) {
            linksQuery = linksQuery.eq('shift_id', shiftId)
        }

        const { data: activeLinks, error: linksError } = await linksQuery

        if (linksError) throw linksError

        // 4. Get merge rules for the restaurant
        const { data: mergeRules, error: mergeRulesError } = await supabase
            .from('table_merge_rules')
            .select('*')
            .eq('restaurant_id', restaurantId)

        if (mergeRulesError) throw mergeRulesError

        // 5. Calculate availability
        const occupiedTableIds = new Set(
            reservations?.map((r) => r.table_id).filter(Boolean)
        )
        const linkedTableIds = new Set(
            activeLinks?.flatMap((l) => [l.primary_table_id, l.secondary_table_id]) || []
        )

        const availableOptions: {
            type: 'single' | 'merged'
            tableId?: string
            tableIds?: string[]
            tableNumber: string
            capacity: { min: number; max: number }
            recommendation: 'optimal' | 'tight' | 'spacious'
        }[] = []

        // Available single tables
        tables?.forEach((table) => {
            if (!occupiedTableIds.has(table.id) && !linkedTableIds.has(table.id)) {
                if (partySize >= table.min_capacity && partySize <= table.max_capacity) {
                    const ratio = partySize / table.max_capacity
                    let recommendation: 'optimal' | 'tight' | 'spacious' = 'optimal'

                    if (ratio > 0.9) recommendation = 'tight'
                    else if (ratio < 0.5) recommendation = 'spacious'

                    availableOptions.push({
                        type: 'single',
                        tableId: table.id,
                        tableNumber: table.table_number,
                        capacity: { min: table.min_capacity, max: table.max_capacity },
                        recommendation,
                    })
                }
            }
        })

        // Check merge possibilities if party size exceeds individual table capacity
        if (mergeRules && mergeRules.length > 0) {
            mergeRules.forEach((rule) => {
                const tableA = tables?.find((t) => t.id === rule.table_a_id)
                const tableB = tables?.find((t) => t.id === rule.table_b_id)

                if (
                    tableA &&
                    tableB &&
                    !occupiedTableIds.has(tableA.id) &&
                    !occupiedTableIds.has(tableB.id) &&
                    !linkedTableIds.has(tableA.id) &&
                    !linkedTableIds.has(tableB.id)
                ) {
                    const combinedCapacity = tableA.max_capacity + tableB.max_capacity
                    const combinedMin = tableA.min_capacity + tableB.min_capacity

                    if (partySize >= combinedMin && partySize <= combinedCapacity) {
                        availableOptions.push({
                            type: 'merged',
                            tableIds: [tableA.id, tableB.id],
                            tableNumber: `${tableA.table_number} + ${tableB.table_number}`,
                            capacity: { min: combinedMin, max: combinedCapacity },
                            recommendation: 'optimal',
                        })
                    }
                }
            })
        }

        // Sort by recommendation (optimal first) then by capacity
        availableOptions.sort((a, b) => {
            const order = { optimal: 0, tight: 1, spacious: 2 }
            const orderDiff = order[a.recommendation] - order[b.recommendation]
            if (orderDiff !== 0) return orderDiff
            return a.capacity.max - b.capacity.max
        })

        return NextResponse.json({
            date,
            serviceId,
            shiftId,
            partySize,
            availableOptions,
            totalAvailable: availableOptions.length,
        })
    } catch (error) {
        console.error('Availability API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
