import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const restaurantId = searchParams.get('restaurantId')

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Missing restaurantId' },
                { status: 400 }
            )
        }

        const supabase = createServiceClient()

        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .order('table_number', { ascending: true })

        if (error) throw error

        return NextResponse.json({ tables: data })
    } catch (error) {
        console.error('Tables GET error:', error)
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
            tableNumber,
            minCapacity = 1,
            maxCapacity = 4,
            positionX = 100,
            positionY = 100,
            width = 80,
            height = 80,
            shape = 'rectangle',
        } = body

        // Validation
        if (!restaurantId || !tableNumber) {
            return NextResponse.json(
                { error: 'Missing required fields: restaurantId, tableNumber' },
                { status: 400 }
            )
        }

        const supabase = createServiceClient()

        // Check if table number already exists
        const { data: existing } = await supabase
            .from('tables')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('table_number', tableNumber)
            .single()

        if (existing) {
            return NextResponse.json(
                { error: 'Ce numéro de table existe déjà' },
                { status: 409 }
            )
        }

        // Create table
        const { data: table, error } = await supabase
            .from('tables')
            .insert({
                restaurant_id: restaurantId,
                table_number: tableNumber,
                min_capacity: minCapacity,
                max_capacity: maxCapacity,
                position_x: positionX,
                position_y: positionY,
                width,
                height,
                shape,
                is_active: true,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, table }, { status: 201 })
    } catch (error) {
        console.error('Tables POST error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const tableId = searchParams.get('id')

        if (!tableId) {
            return NextResponse.json(
                { error: 'Missing table ID' },
                { status: 400 }
            )
        }

        const supabase = createServiceClient()

        const { error } = await supabase
            .from('tables')
            .delete()
            .eq('id', tableId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Tables DELETE error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
