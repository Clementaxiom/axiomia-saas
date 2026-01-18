import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('reservations')
            .select(`
        *,
        table:tables(id, table_number, room_id),
        service:services(id, name, type),
        shift:shifts(id, name)
      `)
            .eq('id', id)
            .single()

        if (error) throw error

        return NextResponse.json({ reservation: data })
    } catch (error) {
        console.error('Reservation GET error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const supabase = await createClient()

        // Remove fields that shouldn't be updated directly
        const { id: _, created_at, created_by, restaurant_id, ...updateData } = body

        const { data, error } = await supabase
            .from('reservations')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select(`
        *,
        table:tables(id, table_number, room_id),
        service:services(id, name, type),
        shift:shifts(id, name)
      `)
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, reservation: data })
    } catch (error) {
        console.error('Reservation PATCH error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Reservation DELETE error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
