'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Sidebar, Header } from '@/components/layout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { FloorPlanCanvas } from '@/components/floor-plan'
import { ContextSelector, ReservationSidePanel, ReservationForm, ReservationFormData } from '@/components/reservations'
import type { Restaurant, RestaurantSettings, Service, ReservationWithRelations, Table } from '@/lib/types/database'

export default function FloorPlanPage() {
    const params = useParams()
    const restaurantSlug = params.restaurantSlug as string

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [settings, setSettings] = useState<RestaurantSettings | null>(null)
    const [services, setServices] = useState<Service[]>([])
    const [tables, setTables] = useState<Table[]>([])
    const [reservations, setReservations] = useState<ReservationWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')

    // Context state
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

    // Modal state
    const [showReservationForm, setShowReservationForm] = useState(false)

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

                // Get tables
                const { data: tablesData } = await supabase
                    .from('tables')
                    .select('*')
                    .eq('restaurant_id', restaurantData.id)
                    .eq('is_active', true)

                setTables(tablesData || [])
            }

            setLoading(false)
        }

        fetchData()
    }, [restaurantSlug])

    // Fetch reservations when context changes
    useEffect(() => {
        async function fetchReservations() {
            if (!restaurant?.id || !selectedServiceId) return

            const response = await fetch(
                `/api/reservations?restaurantId=${restaurant.id}&date=${format(selectedDate, 'yyyy-MM-dd')}&serviceId=${selectedServiceId}${selectedShiftId ? `&shiftId=${selectedShiftId}` : ''}`
            )
            const data = await response.json()
            setReservations(data.reservations || [])
        }

        fetchReservations()
    }, [restaurant?.id, selectedDate, selectedServiceId, selectedShiftId])

    const handleCreateReservation = async (formData: ReservationFormData) => {
        if (!restaurant?.id) return

        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurantId: restaurant.id,
                date: formData.date,
                serviceId: formData.serviceId,
                shiftId: formData.shiftId,
                time: formData.time,
                partySize: formData.partySize,
                customerName: formData.customerName,
                phone: formData.phone,
                email: formData.email,
                notes: formData.notes,
                tableId: formData.tableId,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create reservation')
        }

        // Refresh reservations
        const refreshResponse = await fetch(
            `/api/reservations?restaurantId=${restaurant.id}&date=${format(selectedDate, 'yyyy-MM-dd')}&serviceId=${selectedServiceId}`
        )
        const data = await refreshResponse.json()
        setReservations(data.reservations || [])
    }

    const handleStatusChange = async (id: string, status: string) => {
        const response = await fetch(`/api/reservations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })

        if (response.ok) {
            setReservations((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status: status as any } : r))
            )
        }
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

                <div className="lg:ml-72 flex h-screen">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Header
                            title="Plan de salle"
                            onMenuClick={() => setSidebarOpen(true)}
                            userName={userName}
                        />

                        <main className="flex-1 flex flex-col p-6 overflow-hidden">
                            {/* Context Selector */}
                            <div className="mb-6">
                                <ContextSelector
                                    date={selectedDate}
                                    onDateChange={setSelectedDate}
                                    services={services}
                                    selectedServiceId={selectedServiceId}
                                    onServiceChange={setSelectedServiceId}
                                    selectedShiftId={selectedShiftId}
                                    onShiftChange={setSelectedShiftId}
                                />
                            </div>

                            {/* Floor Plan */}
                            <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                                {restaurant && selectedServiceId && (
                                    <FloorPlanCanvas
                                        restaurantId={restaurant.id}
                                        date={format(selectedDate, 'yyyy-MM-dd')}
                                        serviceId={selectedServiceId}
                                        shiftId={selectedShiftId}
                                        onTableClick={(table) => setSelectedTableId(table.id)}
                                        selectedTableId={selectedTableId}
                                    />
                                )}
                            </div>
                        </main>
                    </div>

                    {/* Side Panel */}
                    <div className="w-96 hidden xl:block">
                        <ReservationSidePanel
                            reservations={reservations}
                            onStatusChange={handleStatusChange}
                            onCreateClick={() => setShowReservationForm(true)}
                        />
                    </div>
                </div>

                {/* Reservation Form Modal */}
                <ReservationForm
                    isOpen={showReservationForm}
                    onClose={() => setShowReservationForm(false)}
                    onSubmit={handleCreateReservation}
                    services={services}
                    tables={tables}
                    initialDate={format(selectedDate, 'yyyy-MM-dd')}
                    initialServiceId={selectedServiceId || undefined}
                    initialShiftId={selectedShiftId || undefined}
                />
            </div>
        </ThemeProvider>
    )
}
