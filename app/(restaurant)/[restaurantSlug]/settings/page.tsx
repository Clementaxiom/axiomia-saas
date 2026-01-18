'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar, Header } from '@/components/layout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Save } from 'lucide-react'
import type { Restaurant, RestaurantSettings } from '@/lib/types/database'

export default function SettingsPage() {
    const params = useParams()
    const restaurantSlug = params.restaurantSlug as string

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [settings, setSettings] = useState<RestaurantSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userName, setUserName] = useState('')
    const [activeTab, setActiveTab] = useState('general')

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
            }
            setLoading(false)
        }
        fetchData()
    }, [restaurantSlug])

    const handleSave = async () => {
        if (!restaurant?.id || !settings) return
        setSaving(true)
        const supabase = createClient()
        await supabase.from('restaurant_settings').update(settings).eq('restaurant_id', restaurant.id)
        setSaving(false)
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>

    const tabs = [
        { id: 'general', label: 'Général' },
        { id: 'theme', label: 'Apparence' },
        { id: 'modules', label: 'Modules' },
    ]

    return (
        <ThemeProvider restaurantId={restaurant?.id}>
            <div className="min-h-screen bg-[var(--color-background)]">
                <Sidebar restaurantSlug={restaurantSlug} restaurantName={restaurant?.name} logoUrl={restaurant?.logo_url || undefined} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} enabledModules={{ dashboard: settings?.module_dashboard ?? true, floorPlan: settings?.module_floor_plan ?? true, planning: settings?.module_planning ?? true, reservations: settings?.module_reservations ?? true }} />
                <div className="lg:ml-72">
                    <Header title="Paramètres" onMenuClick={() => setSidebarOpen(true)} userName={userName} />
                    <main className="p-6">
                        <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
                            {tabs.map((tab) => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>{tab.label}</button>
                            ))}
                        </div>

                        {activeTab === 'general' && (
                            <Card><CardHeader><CardTitle>Informations générales</CardTitle></CardHeader><CardContent className="space-y-4">
                                <Input label="Nom du restaurant" value={restaurant?.name || ''} disabled />
                                <Input label="Slug (URL)" value={restaurant?.slug || ''} disabled />
                                <Input label="Durée par défaut (minutes)" type="number" value={settings?.default_reservation_duration || 90} onChange={(e) => setSettings(s => s ? { ...s, default_reservation_duration: parseInt(e.target.value) } : s)} />
                                <Input label="Taille max. groupe" type="number" value={settings?.max_party_size || 12} onChange={(e) => setSettings(s => s ? { ...s, max_party_size: parseInt(e.target.value) } : s)} />
                            </CardContent></Card>
                        )}

                        {activeTab === 'theme' && settings && (
                            <Card><CardHeader><CardTitle>Apparence</CardTitle></CardHeader><CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium mb-2">Couleur primaire</label><div className="flex gap-2"><input type="color" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="w-12 h-10 rounded" /><Input value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} /></div></div>
                                    <div><label className="block text-sm font-medium mb-2">Couleur accent</label><div className="flex gap-2"><input type="color" value={settings.accent_color} onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })} className="w-12 h-10 rounded" /><Input value={settings.accent_color} onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })} /></div></div>
                                </div>
                            </CardContent></Card>
                        )}

                        {activeTab === 'modules' && settings && (
                            <Card><CardHeader><CardTitle>Modules</CardTitle></CardHeader><CardContent className="space-y-4">
                                {[{ key: 'module_dashboard', label: 'Tableau de bord' }, { key: 'module_floor_plan', label: 'Plan de salle' }, { key: 'module_planning', label: 'Planning' }, { key: 'module_reservations', label: 'Réservations' }].map((m) => (
                                    <label key={m.key} className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-[var(--color-surface)]"><span className="font-medium">{m.label}</span><input type="checkbox" checked={settings[m.key as keyof RestaurantSettings] as boolean} onChange={(e) => setSettings({ ...settings, [m.key]: e.target.checked })} className="w-5 h-5" /></label>
                                ))}
                            </CardContent></Card>
                        )}

                        <div className="mt-6 flex justify-end">
                            <Button variant="accent" icon={<Save className="w-4 h-4" />} loading={saving} onClick={handleSave}>Enregistrer</Button>
                        </div>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    )
}
