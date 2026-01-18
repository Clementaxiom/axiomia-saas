import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    try {
        const supabase = createServiceClient()

        const { data, error } = await supabase
            .from('restaurants')
            .select(`
        *,
        settings:restaurant_settings(*)
      `)
            .order('name', { ascending: true })

        if (error) throw error

        return NextResponse.json({ restaurants: data })
    } catch (error) {
        console.error('Restaurants GET error:', error)
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
            name,
            slug,
            logoUrl,
            settings,
        } = body

        // Validation
        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Missing required fields: name, slug' },
                { status: 400 }
            )
        }

        const supabase = createServiceClient()

        // Check if slug is already taken
        const { data: existing } = await supabase
            .from('restaurants')
            .select('id')
            .eq('slug', slug)
            .single()

        if (existing) {
            return NextResponse.json(
                { error: 'Slug already exists' },
                { status: 409 }
            )
        }

        // Create restaurant
        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
                name,
                slug,
                logo_url: logoUrl || null,
            })
            .select()
            .single()

        if (restaurantError) throw restaurantError

        // Update settings if provided (settings are auto-created via trigger)
        if (settings && restaurant) {
            const { error: settingsError } = await supabase
                .from('restaurant_settings')
                .update(settings)
                .eq('restaurant_id', restaurant.id)

            if (settingsError) {
                console.error('Failed to update settings:', settingsError)
            }
        }

        // Create default services
        const { error: servicesError } = await supabase
            .from('services')
            .insert([
                {
                    restaurant_id: restaurant.id,
                    name: 'Déjeuner',
                    type: 'lunch',
                    start_time: '12:00',
                    end_time: '14:30',
                    is_active: true,
                },
                {
                    restaurant_id: restaurant.id,
                    name: 'Dîner',
                    type: 'dinner',
                    start_time: '19:00',
                    end_time: '22:30',
                    is_active: true,
                },
            ])

        if (servicesError) {
            console.error('Failed to create default services:', servicesError)
        }

        // Fetch complete restaurant with settings
        const { data: completeRestaurant } = await supabase
            .from('restaurants')
            .select(`
        *,
        settings:restaurant_settings(*)
      `)
            .eq('id', restaurant.id)
            .single()

        return NextResponse.json(
            { success: true, restaurant: completeRestaurant },
            { status: 201 }
        )
    } catch (error) {
        console.error('Restaurants POST error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
