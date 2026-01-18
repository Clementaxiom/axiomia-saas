'use client'

import { useState } from 'react'
import { Clock, Users, Phone, MoreVertical, Check, X, UserCheck } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { formatTime, getStatusLabel } from '@/lib/utils'
import type { ReservationWithRelations } from '@/lib/types/database'

interface ReservationSidePanelProps {
    reservations: ReservationWithRelations[]
    onStatusChange: (id: string, status: string) => Promise<void>
    onCreateClick: () => void
    loading?: boolean
}

export function ReservationSidePanel({
    reservations,
    onStatusChange,
    onCreateClick,
    loading,
}: ReservationSidePanelProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
        switch (status) {
            case 'confirmed':
                return 'info'
            case 'seated':
                return 'success'
            case 'completed':
                return 'default'
            case 'cancelled':
            case 'no_show':
                return 'error'
            default:
                return 'default'
        }
    }

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] border-l border-[var(--color-border)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <div>
                    <h2 className="font-semibold text-[var(--color-text)]">Réservations</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        {reservations.length} réservation{reservations.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button variant="accent" size="sm" onClick={onCreateClick}>
                    + Nouvelle
                </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="spinner" />
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-[var(--color-text-muted)]">
                            Aucune réservation pour ce service
                        </p>
                    </div>
                ) : (
                    reservations.map((reservation) => (
                        <div
                            key={reservation.id}
                            className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:shadow-md transition-shadow"
                        >
                            {/* Main info */}
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[var(--color-text)]">
                                            {reservation.customer_name}
                                        </span>
                                        <Badge variant={getStatusVariant(reservation.status)} size="sm">
                                            {getStatusLabel(reservation.status)}
                                        </Badge>
                                    </div>
                                    {reservation.table && (
                                        <span className="text-sm text-[var(--color-accent)]">
                                            Table {reservation.table.table_number}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setExpandedId(expandedId === reservation.id ? null : reservation.id)}
                                    className="p-1.5 rounded-lg hover:bg-[var(--color-background)] text-[var(--color-text-muted)]"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Details */}
                            <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {formatTime(reservation.reservation_time)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    {reservation.party_size}p
                                </div>
                                {reservation.customer_phone && (
                                    <div className="flex items-center gap-1.5">
                                        <Phone className="w-4 h-4" />
                                        {reservation.customer_phone}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {reservation.notes && (
                                <p className="mt-2 text-sm text-[var(--color-text-muted)] bg-[var(--color-background)] p-2 rounded-lg">
                                    {reservation.notes}
                                </p>
                            )}

                            {/* Actions (expanded) */}
                            {expandedId === reservation.id && (
                                <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-2">
                                    {reservation.status === 'confirmed' && (
                                        <Button
                                            size="sm"
                                            variant="accent"
                                            icon={<UserCheck className="w-4 h-4" />}
                                            onClick={() => onStatusChange(reservation.id, 'seated')}
                                        >
                                            Marquer arrivé
                                        </Button>
                                    )}
                                    {reservation.status === 'seated' && (
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            icon={<Check className="w-4 h-4" />}
                                            onClick={() => onStatusChange(reservation.id, 'completed')}
                                        >
                                            Terminé
                                        </Button>
                                    )}
                                    {(reservation.status === 'confirmed' || reservation.status === 'seated') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            icon={<X className="w-4 h-4" />}
                                            onClick={() => onStatusChange(reservation.id, 'cancelled')}
                                        >
                                            Annuler
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
