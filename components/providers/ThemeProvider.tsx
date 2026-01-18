'use client'

import { useEffect } from 'react'
import { useTheme } from '@/lib/hooks/useTheme'

interface ThemeProviderProps {
    children: React.ReactNode
    restaurantId?: string
}

export function ThemeProvider({ children, restaurantId }: ThemeProviderProps) {
    const { loadTheme } = useTheme()

    useEffect(() => {
        if (restaurantId) {
            loadTheme(restaurantId)
        }
    }, [restaurantId, loadTheme])

    return <>{children}</>
}
