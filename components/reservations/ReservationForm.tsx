'use client'

import { useState } from 'react'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { Service, Shift, Table } from '@/lib/types/database'

interface ReservationFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: ReservationFormData) => Promise<void>
    services: Service[]
    shifts?: Shift[]
    tables?: Table[]
    initialDate?: string
    initialServiceId?: string
    initialShiftId?: string
}

export interface ReservationFormData {
    date: string
    serviceId: string
    shiftId?: string
    time: string
    partySize: number
    customerName: string
    phone?: string
    email?: string
    notes?: string
    tableId?: string
}

export function ReservationForm({
    isOpen,
    onClose,
    onSubmit,
    services,
    shifts,
    tables,
    initialDate,
    initialServiceId,
    initialShiftId,
}: ReservationFormProps) {
    const [formData, setFormData] = useState<ReservationFormData>({
        date: initialDate || new Date().toISOString().split('T')[0],
        serviceId: initialServiceId || services[0]?.id || '',
        shiftId: initialShiftId,
        time: '19:00',
        partySize: 2,
        customerName: '',
        phone: '',
        email: '',
        notes: '',
        tableId: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await onSubmit(formData)
            onClose()
            // Reset form
            setFormData({
                date: initialDate || new Date().toISOString().split('T')[0],
                serviceId: initialServiceId || services[0]?.id || '',
                shiftId: initialShiftId,
                time: '19:00',
                partySize: 2,
                customerName: '',
                phone: '',
                email: '',
                notes: '',
                tableId: '',
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        } finally {
            setLoading(false)
        }
    }

    const partySizeOptions = Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: `${i + 1} ${i === 0 ? 'personne' : 'personnes'}`,
    }))

    const serviceOptions = services.map((s) => ({
        value: s.id,
        label: s.name,
    }))

    const shiftOptions = shifts?.map((s) => ({
        value: s.id,
        label: s.name,
    })) || []

    const tableOptions = [
        { value: '', label: 'Attribution automatique' },
        ...(tables?.map((t) => ({
            value: t.id,
            label: `Table ${t.table_number} (${t.min_capacity}-${t.max_capacity}p)`,
        })) || []),
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nouvelle réservation"
            description="Créer une nouvelle réservation"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                    <Input
                        label="Heure"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                    />
                </div>

                {/* Service & Shift Row */}
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Service"
                        options={serviceOptions}
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        required
                    />
                    {shiftOptions.length > 0 && (
                        <Select
                            label="Créneau"
                            options={shiftOptions}
                            value={formData.shiftId || ''}
                            onChange={(e) => setFormData({ ...formData, shiftId: e.target.value || undefined })}
                        />
                    )}
                </div>

                {/* Party Size & Table */}
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Nombre de couverts"
                        options={partySizeOptions}
                        value={String(formData.partySize)}
                        onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                        required
                    />
                    <Select
                        label="Table"
                        options={tableOptions}
                        value={formData.tableId || ''}
                        onChange={(e) => setFormData({ ...formData, tableId: e.target.value || undefined })}
                    />
                </div>

                <hr className="border-[var(--color-border)]" />

                {/* Customer Info */}
                <Input
                    label="Nom du client"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Ex: Martin Dupont"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Téléphone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="06 12 34 56 78"
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="client@email.com"
                    />
                </div>

                <Input
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Allergies, occasion spéciale, préférences..."
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                    <Button variant="ghost" onClick={onClose} type="button">
                        Annuler
                    </Button>
                    <Button variant="accent" type="submit" loading={loading}>
                        Créer la réservation
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
