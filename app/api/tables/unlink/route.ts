import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { linkId } = body

        if (!linkId) {
            return NextResponse.json(
                { error: 'Missing required field: linkId' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('table_links')
            .delete()
            .eq('id', linkId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Table unlink error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
