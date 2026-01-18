'use client'

import { useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Service, Shift } from '@/lib/types/database'

interface ContextSelectorProps {
    date: Date
    onDateChange: (date: Date) => void
    services: Service[]
    selectedServiceId: string | null
    onServiceChange: (serviceId: string) => void
    shifts?: Shift[]
    selectedShiftId?: string | null
    onShiftChange?: (shiftId: string | null) => void
}

export function ContextSelector({
    date,
    onDateChange,
    services,
    selectedServiceId,
    onServiceChange,
    shifts,
    selectedShiftId,
    onShiftChange,
}: ContextSelectorProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    const selectedService = services.find((s) => s.id === selectedServiceId)

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
            {/* Date Selector */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onDateChange(subDays(date, 1))}
                    className="p-2 rounded-xl hover:bg-[var(--color-background)] text-[var(--color-text-muted)] transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="px-4 py-2 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-text)] font-medium transition-all min-w-[160px]"
                >
                    {format(date, 'EEEE d MMM', { locale: fr })}
                </button>

                <button
                    onClick={() => onDateChange(addDays(date, 1))}
                    className="p-2 rounded-xl hover:bg-[var(--color-background)] text-[var(--color-text-muted)] transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                <button
                    onClick={() => onDateChange(new Date())}
                    className="px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-accent)] hover:bg-blue-50 transition-colors"
                >
                    Aujourd'hui
                </button>
            </div>

            {/* Service Toggle */}
            <div className="flex items-center bg-[var(--color-background)] rounded-xl p-1">
                {services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => onServiceChange(service.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            selectedServiceId === service.id
                                ? 'bg-[var(--color-primary)] text-white shadow-md'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                        )}
                    >
                        {service.type === 'lunch' ? (
                            <Sun className="w-4 h-4" />
                        ) : (
                            <Moon className="w-4 h-4" />
                        )}
                        {service.name}
                    </button>
                ))}
            </div>

            {/* Shift Selector (if shifts available) */}
            {shifts && shifts.length > 0 && onShiftChange && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--color-text-muted)]">Créneau:</span>
                    <select
                        value={selectedShiftId || ''}
                        onChange={(e) => onShiftChange(e.target.value || null)}
                        className="px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                    >
                        <option value="">Tous les créneaux</option>
                        {shifts.map((shift) => (
                            <option key={shift.id} value={shift.id}>
                                {shift.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    )
}
