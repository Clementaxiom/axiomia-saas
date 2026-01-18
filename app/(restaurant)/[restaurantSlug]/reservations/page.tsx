'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Sidebar, Header } from '@/components/layout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Button, Input, Badge, Card, Select } from '@/components/ui'
import { ReservationForm, ReservationFormData } from '@/components/reservations'
import { Search, Plus, Users, Phone } from 'lucide-react'
import { getStatusLabel, getSourceLabel } from '@/lib/utils'
import type { Restaurant, RestaurantSettings, Service, ReservationWithRelations, Table } from '@/lib/types/database'

export default function ReservationsPage() {
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
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [statusFilter, setStatusFilter] = useState('')
    const [showReservationForm, setShowReservationForm] = useState(false)

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: userData } = await supabase.from('users').select('full_name').eq('id', user.id).single()
                setUserName(userData?.full_name || '')
            }

            const { data: restaurantData } = await supabase
                .from('restaurants')
                .select('*, settings:restaurant_settings(*)')
                .eq('slug', restaurantSlug)
                .single()

            if (restaurantData) {
                setRestaurant(restaurantData)
                setSettings(restaurantData.settings)
                const { data: servicesData } = await supabase.from('services').select('*').eq('restaurant_id', restaurantData.id).eq('is_active', true)
                setServices(servicesData || [])
                const { data: tablesData } = await supabase.from('tables').select('*').eq('restaurant_id', restaurantData.id).eq('is_active', true)
                setTables(tablesData || [])
            }
            setLoading(false)
        }
        fetchData()
    }, [restaurantSlug])

    useEffect(() => {
        async function fetchReservations() {
            if (!restaurant?.id) return
            let url = `/api/reservations?restaurantId=${restaurant.id}&date=${dateFilter}`
            if (statusFilter) url += `&status=${statusFilter}`
            const response = await fetch(url)
            const data = await response.json()
            setReservations(data.reservations || [])
        }
        fetchReservations()
    }, [restaurant?.id, dateFilter, statusFilter])

    const filteredReservations = reservations.filter((r) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return r.customer_name.toLowerCase().includes(query) || r.customer_phone?.toLowerCase().includes(query)
    })

    const handleCreateReservation = async (formData: ReservationFormData) => {
        if (!restaurant?.id) return
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurantId: restaurant.id, ...formData }),
        })
        if (!response.ok) throw new Error('Failed to create reservation')
        const refreshResponse = await fetch(`/api/reservations?restaurantId=${restaurant.id}&date=${dateFilter}`)
        const data = await refreshResponse.json()
        setReservations(data.reservations || [])
    }

    const handleStatusChange = async (id: string, status: string) => {
        await fetch(`/api/reservations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
        setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as any } : r)))
    }

    const getStatusVariant = (status: string) => {
        switch (status) { case 'confirmed': return 'info'; case 'seated': return 'success'; case 'completed': return 'default'; default: return 'error' }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>

    return (
        <ThemeProvider restaurantId={restaurant?.id}>
            <div className="min-h-screen bg-[var(--color-background)]">
                <Sidebar restaurantSlug={restaurantSlug} restaurantName={restaurant?.name} logoUrl={restaurant?.logo_url || undefined} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} enabledModules={{ dashboard: settings?.module_dashboard ?? true, floorPlan: settings?.module_floor_plan ?? true, planning: settings?.module_planning ?? true, reservations: settings?.module_reservations ?? true }} />
                <div className="lg:ml-72">
                    <Header title="Réservations" onMenuClick={() => setSidebarOpen(true)} userName={userName} />
                    <main className="p-6">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="flex-1 min-w-[200px] max-w-md"><Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} icon={<Search className="w-4 h-4" />} /></div>
                            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
                            <Select options={[{ value: '', label: 'Tous' }, { value: 'confirmed', label: 'Confirmé' }, { value: 'seated', label: 'Installé' }, { value: 'completed', label: 'Terminé' }, { value: 'cancelled', label: 'Annulé' }]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto" />
                            <Button variant="accent" icon={<Plus className="w-4 h-4" />} onClick={() => setShowReservationForm(true)}>Nouvelle</Button>
                        </div>
                        <Card padding="none">
                            <table className="w-full">
                                <thead className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                                    <tr><th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Client</th><th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Heure</th><th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Couverts</th><th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Table</th><th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Statut</th><th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Actions</th></tr>
                                </thead>
                                <tbody>
                                    {filteredReservations.length === 0 ? (<tr><td colSpan={6} className="text-center py-12 text-[var(--color-text-muted)]">Aucune réservation</td></tr>) : (
                                        filteredReservations.map((r) => (
                                            <tr key={r.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)]/50">
                                                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-medium">{r.customer_name[0]}</div><div><p className="font-medium text-[var(--color-text)]">{r.customer_name}</p>{r.customer_phone && <p className="text-sm text-[var(--color-text-muted)]">{r.customer_phone}</p>}</div></div></td>
                                                <td className="p-4 font-medium">{r.reservation_time.substring(0, 5)}</td>
                                                <td className="p-4"><div className="flex items-center gap-1"><Users className="w-4 h-4 text-[var(--color-text-muted)]" />{r.party_size}</div></td>
                                                <td className="p-4">{r.table ? `Table ${r.table.table_number}` : '-'}</td>
                                                <td className="p-4"><Badge variant={getStatusVariant(r.status) as any}>{getStatusLabel(r.status)}</Badge></td>
                                                <td className="p-4"><div className="flex gap-1">{r.status === 'confirmed' && <Button size="sm" variant="ghost" onClick={() => handleStatusChange(r.id, 'seated')}>Arrivé</Button>}{r.status === 'seated' && <Button size="sm" variant="ghost" onClick={() => handleStatusChange(r.id, 'completed')}>Terminé</Button>}</div></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </main>
                </div>
                <ReservationForm isOpen={showReservationForm} onClose={() => setShowReservationForm(false)} onSubmit={handleCreateReservation} services={services} tables={tables} initialDate={dateFilter} />
            </div>
        </ThemeProvider>
    )
}
