'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, UserRole } from '@/lib/types/database'

interface UseUserRoleReturn {
    user: User | null
    role: UserRole | null
    loading: boolean
    isSuperAdmin: boolean
    isRestaurantAdmin: boolean
    isStaff: boolean
    restaurantId: string | null
}

export function useUserRole(): UseUserRoleReturn {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchUserRole() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser()

                if (!authUser) {
                    setUser(null)
                    setLoading(false)
                    return
                }

                const { data: userData, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (error) {
                    console.error('Error fetching user:', error)
                    setUser(null)
                } else {
                    setUser(userData)
                }
            } catch (error) {
                console.error('Error in useUserRole:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        fetchUserRole()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchUserRole()
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return {
        user,
        role: user?.is_super_admin ? 'super_admin' : user?.role || null,
        loading,
        isSuperAdmin: user?.is_super_admin ?? false,
        isRestaurantAdmin: user?.role === 'restaurant_admin',
        isStaff: user?.role === 'staff',
        restaurantId: user?.restaurant_id ?? null,
    }
}
