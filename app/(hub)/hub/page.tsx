'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RestaurantCard } from '@/components/hub'
import { Header } from '@/components/layout'
import { Plus, Building2, Search } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import type { RestaurantWithSettings } from '@/lib/types/database'

export default function HubPage() {
    const [restaurants, setRestaurants] = useState<RestaurantWithSettings[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [userName, setUserName] = useState<string>('')

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient()

            // Get user info
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single()
                setUserName(userData?.full_name || user.email || '')
            }

            // Fetch restaurants
            const response = await fetch('/api/restaurants')
            const data = await response.json()
            setRestaurants(data.restaurants || [])
            setLoading(false)
        }

        fetchData()
    }, [])

    const filteredRestaurants = restaurants.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <Header title="Hub" showMenuButton={false} userName={userName} />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text)] font-[var(--font-display)]">
                            Mes Restaurants
                        </h1>
                        <p className="text-[var(--color-text-muted)] mt-1">
                            Gérez tous vos établissements depuis un seul endroit
                        </p>
                    </div>
                    <Link href="/hub/create">
                        <Button variant="accent" size="lg" icon={<Plus className="w-5 h-5" />}>
                            Nouveau restaurant
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="mb-8 max-w-md">
                    <Input
                        placeholder="Rechercher un restaurant..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={<Search className="w-5 h-5" />}
                    />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="spinner" />
                            <p className="text-[var(--color-text-muted)]">Chargement...</p>
                        </div>
                    </div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
                            <Building2 className="w-10 h-10 text-[var(--color-text-muted)]" />
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                            {searchQuery ? 'Aucun résultat' : 'Aucun restaurant'}
                        </h3>
                        <p className="text-[var(--color-text-muted)] mb-6 max-w-md">
                            {searchQuery
                                ? 'Essayez avec d\'autres termes de recherche'
                                : 'Créez votre premier restaurant pour commencer à gérer vos réservations'}
                        </p>
                        {!searchQuery && (
                            <Link href="/hub/create">
                                <Button variant="accent" icon={<Plus className="w-5 h-5" />}>
                                    Créer mon premier restaurant
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRestaurants.map((restaurant) => (
                            <RestaurantCard
                                key={restaurant.id}
                                restaurant={restaurant}
                                onDelete={(id) => setRestaurants((prev) => prev.filter((r) => r.id !== id))}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
