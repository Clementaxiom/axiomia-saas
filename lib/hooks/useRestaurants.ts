'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Restaurant, RestaurantWithSettings } from '@/lib/types/database'

interface UseRestaurantsReturn {
    restaurants: RestaurantWithSettings[]
    loading: boolean
    error: string | null
    fetchRestaurants: () => Promise<void>
    getRestaurantBySlug: (slug: string) => Promise<RestaurantWithSettings | null>
}

export function useRestaurants(): UseRestaurantsReturn {
    const [restaurants, setRestaurants] = useState<RestaurantWithSettings[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const fetchRestaurants = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from('restaurants')
                .select(`
          *,
          settings:restaurant_settings(*)
        `)
                .order('name', { ascending: true })

            if (fetchError) {
                throw new Error(fetchError.message)
            }

            setRestaurants(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch restaurants')
        } finally {
            setLoading(false)
        }
    }, [])

    const getRestaurantBySlug = useCallback(async (slug: string): Promise<RestaurantWithSettings | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('restaurants')
                .select(`
          *,
          settings:restaurant_settings(*)
        `)
                .eq('slug', slug)
                .single()

            if (fetchError) {
                throw new Error(fetchError.message)
            }

            return data
        } catch (err) {
            console.error('Error fetching restaurant by slug:', err)
            return null
        }
    }, [])

    return {
        restaurants,
        loading,
        error,
        fetchRestaurants,
        getRestaurantBySlug,
    }
}
