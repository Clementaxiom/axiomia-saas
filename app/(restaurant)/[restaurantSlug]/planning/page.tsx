'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Sidebar, Header } from '@/components/layout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Button, Card } from '@/components/ui'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Restaurant, RestaurantSettings, Service, Reservation } from '@/lib/types/database'

export default function PlanningPage() {
    const params = useParams()
    const restaurantSlug = params.restaurantSlug as string

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [settings, setSettings] = useState<RestaurantSettings | null>(null)
    const [services, setServices] = useState<Service[]>([])
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')

    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

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
                if (servicesData && servicesData.length > 0) {
                    setSelectedServiceId(servicesData[0].id)
                }
            }

            setLoading(false)
        }

        fetchData()
    }, [restaurantSlug])

    // Fetch reservations for the week
    useEffect(() => {
        async function fetchReservations() {
            if (!restaurant?.id) return

            const weekEnd = addDays(currentWeekStart, 6)
            const startDate = format(currentWeekStart, 'yyyy-MM-dd')
            const endDate = format(weekEnd, 'yyyy-MM-dd')

            const supabase = createClient()
            let query = supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .gte('reservation_date', startDate)
                .lte('reservation_date', endDate)
                .neq('status', 'cancelled')

            if (selectedServiceId) {
                query = query.eq('service_id', selectedServiceId)
            }

            const { data } = await query

            setReservations(data || [])
        }

        fetchReservations()
    }, [restaurant?.id, currentWeekStart, selectedServiceId])

    const getReservationsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return reservations.filter((r) => r.reservation_date === dateStr)
    }

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
                        title="Planning"
                        onMenuClick={() => setSidebarOpen(true)}
                        userName={userName}
                    />

                    <main className="p-6">
                        {/* Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                {/* Week Navigation */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                                        icon={<ChevronLeft className="w-4 h-4" />}
                                    />
                                    <span className="min-w-[200px] text-center font-medium text-[var(--color-text)]">
                                        {format(currentWeekStart, 'd MMM', { locale: fr })} - {format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: fr })}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                                        icon={<ChevronRight className="w-4 h-4" />}
                                    />
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                                >
                                    Aujourd'hui
                                </Button>
                            </div>

                            {/* Service Filter */}
                            <div className="flex items-center gap-2 bg-[var(--color-surface)] rounded-xl p-1">
                                {services.map((service) => (
                                    <button
                                        key={service.id}
                                        onClick={() => setSelectedServiceId(service.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedServiceId === service.id
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                            }`}
                                    >
                                        {service.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-4">
                            {weekDays.map((day) => {
                                const dayReservations = getReservationsForDay(day)
                                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                const totalCovers = dayReservations.reduce((sum, r) => sum + r.party_size, 0)

                                return (
                                    <div key={day.toISOString()} className="min-h-[400px]">
                                        {/* Day Header */}
                                        <div
                                            className={`p-3 rounded-t-xl text-center ${isToday
                                                    ? 'bg-[var(--color-accent)] text-white'
                                                    : 'bg-[var(--color-surface)]'
                                                }`}
                                        >
                                            <p className="text-xs uppercase tracking-wide opacity-80">
                                                {format(day, 'EEEE', { locale: fr })}
                                            </p>
                                            <p className="text-2xl font-bold">{format(day, 'd')}</p>
                                        </div>

                                        {/* Stats */}
                                        <div className="p-2 bg-[var(--color-surface)] border-x border-[var(--color-border)] text-center">
                                            <span className="text-sm text-[var(--color-text-muted)]">
                                                {dayReservations.length} rés. • {totalCovers} couv.
                                            </span>
                                        </div>

                                        {/* Reservations */}
                                        <div className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-b-xl min-h-[300px] space-y-2">
                                            {dayReservations.length === 0 ? (
                                                <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
                                                    Aucune réservation
                                                </p>
                                            ) : (
                                                dayReservations.slice(0, 6).map((reservation) => (
                                                    <div
                                                        key={reservation.id}
                                                        className={`p-2 rounded-lg text-xs ${reservation.status === 'seated'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                            }`}
                                                    >
                                                        <div className="font-semibold">
                                                            {reservation.reservation_time.substring(0, 5)}
                                                        </div>
                                                        <div className="truncate">{reservation.customer_name}</div>
                                                        <div>{reservation.party_size}p</div>
                                                    </div>
                                                ))
                                            )}
                                            {dayReservations.length > 6 && (
                                                <p className="text-xs text-[var(--color-accent)] text-center">
                                                    +{dayReservations.length - 6} autres
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    )
}
