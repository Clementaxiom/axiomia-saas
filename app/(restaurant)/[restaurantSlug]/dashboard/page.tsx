'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Sidebar, Header } from '@/components/layout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Users, Calendar, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import type { Restaurant, RestaurantSettings, Service, Reservation } from '@/lib/types/database'

export default function DashboardPage() {
    const params = useParams()
    const restaurantSlug = params.restaurantSlug as string

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [settings, setSettings] = useState<RestaurantSettings | null>(null)
    const [services, setServices] = useState<Service[]>([])
    const [todayReservations, setTodayReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')

    const today = format(new Date(), 'yyyy-MM-dd')

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient()

            // Get user
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single()
                setUserName(userData?.full_name || '')
            }

            // Get restaurant
            const { data: restaurantData } = await supabase
                .from('restaurants')
                .select('*, settings:restaurant_settings(*)')
                .eq('slug', restaurantSlug)
                .single()

            if (restaurantData) {
                setRestaurant(restaurantData)
                setSettings(restaurantData.settings)

                // Get services
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('restaurant_id', restaurantData.id)
                    .eq('is_active', true)

                setServices(servicesData || [])

                // Get today's reservations
                const { data: reservationsData } = await supabase
                    .from('reservations')
                    .select('*')
                    .eq('restaurant_id', restaurantData.id)
                    .eq('reservation_date', today)
                    .neq('status', 'cancelled')
                    .order('reservation_time', { ascending: true })

                setTodayReservations(reservationsData || [])
            }

            setLoading(false)
        }

        fetchData()
    }, [restaurantSlug, today])

    // Calculate stats
    const stats = {
        totalReservations: todayReservations.length,
        totalCovers: todayReservations.reduce((sum, r) => sum + r.party_size, 0),
        confirmed: todayReservations.filter((r) => r.status === 'confirmed').length,
        seated: todayReservations.filter((r) => r.status === 'seated').length,
        upcomingCount: todayReservations.filter((r) => r.status === 'confirmed').length,
    }

    const upcomingReservations = todayReservations
        .filter((r) => r.status === 'confirmed')
        .slice(0, 5)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <ThemeProvider restaurantId={restaurant?.id}>
            <div className="min-h-screen bg-[var(--color-background)]">
                <Sidebar
                    restaurantSlug={restaurantSlug}
                    restaurantName={restaurant?.name}
                    logoUrl={restaurant?.logo_url || undefined}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    enabledModules={{
                        dashboard: settings?.module_dashboard ?? true,
                        floorPlan: settings?.module_floor_plan ?? true,
                        planning: settings?.module_planning ?? true,
                        reservations: settings?.module_reservations ?? true,
                    }}
                />

                <div className="lg:ml-72">
                    <Header
                        title="Tableau de bord"
                        onMenuClick={() => setSidebarOpen(true)}
                        userName={userName}
                    />

                    <main className="p-6">
                        {/* Welcome */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-[var(--color-text)]">
                                Bonjour, {userName?.split(' ')[0] || 'Admin'} 👋
                            </h1>
                            <p className="text-[var(--color-text-muted)]">
                                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-[var(--color-text-muted)]">Réservations</p>
                                            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.totalReservations}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                            <Calendar className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-[var(--color-text-muted)]">Couverts attendus</p>
                                            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.totalCovers}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-emerald-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-[var(--color-text-muted)]">À venir</p>
                                            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.confirmed}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-amber-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-[var(--color-text-muted)]">En salle</p>
                                            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.seated}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main content */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Upcoming Reservations */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prochaines arrivées</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {upcomingReservations.length === 0 ? (
                                        <p className="text-[var(--color-text-muted)] text-center py-8">
                                            Aucune réservation à venir aujourd'hui
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {upcomingReservations.map((reservation) => (
                                                <div
                                                    key={reservation.id}
                                                    className="flex items-center justify-between p-3 bg-[var(--color-surface)] rounded-xl"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-medium">
                                                            {reservation.customer_name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-[var(--color-text)]">
                                                                {reservation.customer_name}
                                                            </p>
                                                            <p className="text-sm text-[var(--color-text-muted)]">
                                                                {reservation.party_size} personnes
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-lg font-semibold text-[var(--color-accent)]">
                                                        {reservation.reservation_time.substring(0, 5)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Alerts */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Alertes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="font-medium text-[var(--color-text)]">Tout est en ordre</p>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            Aucune alerte pour le moment
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    )
}
