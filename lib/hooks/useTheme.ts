'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RestaurantSettings } from '@/lib/types/database'

interface UseThemeReturn {
    settings: RestaurantSettings | null
    loading: boolean
    error: string | null
    loadTheme: (restaurantId: string) => Promise<void>
    applyTheme: (settings: RestaurantSettings) => void
}

export function useTheme(): UseThemeReturn {
    const [settings, setSettings] = useState<RestaurantSettings | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const applyTheme = useCallback((themeSettings: RestaurantSettings) => {
        const root = document.documentElement

        root.style.setProperty('--color-primary', themeSettings.primary_color)
        root.style.setProperty('--color-primary-hover', themeSettings.primary_hover_color)
        root.style.setProperty('--color-accent', themeSettings.accent_color)
        root.style.setProperty('--color-background', themeSettings.background_color)
        root.style.setProperty('--color-surface', themeSettings.surface_color)
        root.style.setProperty('--color-text', themeSettings.text_color)
        root.style.setProperty('--color-text-muted', themeSettings.text_muted_color)
        root.style.setProperty('--color-border', themeSettings.border_color)
        root.style.setProperty('--font-display', themeSettings.font_display)
        root.style.setProperty('--font-body', themeSettings.font_body)
    }, [])

    const loadTheme = useCallback(async (restaurantId: string) => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from('restaurant_settings')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .single()

            if (fetchError) {
                throw new Error(fetchError.message)
            }

            if (data) {
                setSettings(data)
                applyTheme(data)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load theme')
        } finally {
            setLoading(false)
        }
    }, [applyTheme])

    return {
        settings,
        loading,
        error,
        loadTheme,
        applyTheme,
    }
}
