'use client'

import { cn } from '@/lib/utils'
import type { TableWithStatus } from '@/lib/types/database'

interface TableNodeProps {
    table: TableWithStatus
    onClick?: (table: TableWithStatus) => void
    isSelected?: boolean
}

export function TableNode({ table, onClick, isSelected }: TableNodeProps) {
    const statusColors = {
        available: 'bg-emerald-500 hover:bg-emerald-600',
        reserved: 'bg-amber-500 hover:bg-amber-600',
        occupied: 'bg-rose-500 hover:bg-rose-600',
    }

    const shapeStyles = {
        rectangle: 'rounded-lg',
        square: 'rounded-lg',
        circle: 'rounded-full',
    }

    return (
        <div
            onClick={() => onClick?.(table)}
            className={cn(
                'absolute flex flex-col items-center justify-center cursor-pointer transition-all duration-200 shadow-lg text-white font-semibold',
                statusColors[table.status],
                shapeStyles[table.shape as keyof typeof shapeStyles] || 'rounded-lg',
                table.isLinked && 'ring-4 ring-purple-400 ring-dashed',
                isSelected && 'ring-4 ring-blue-400 scale-110 z-10',
                'hover:scale-105 hover:shadow-xl hover:z-10'
            )}
            style={{
                left: `${table.position_x}px`,
                top: `${table.position_y}px`,
                width: `${table.width}px`,
                height: `${table.height}px`,
            }}
        >
            <span className="text-lg">{table.table_number}</span>
            <span className="text-xs opacity-80">
                {table.min_capacity}-{table.max_capacity}p
            </span>
            {table.isLinked && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-purple-600 text-[10px] font-bold rounded-md">
                    LIÉ
                </span>
            )}
            {table.reservation && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[var(--color-background)] text-[var(--color-text)] text-[10px] rounded-full shadow-md whitespace-nowrap border border-[var(--color-border)]">
                    {table.reservation.customer_name.split(' ')[0]} • {table.reservation.party_size}p
                </span>
            )}
        </div>
    )
}
