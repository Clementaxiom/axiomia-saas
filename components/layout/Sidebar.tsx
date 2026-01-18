'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Map,
    Calendar,
    ClipboardList,
    Settings,
    ChevronLeft,
    X,
} from 'lucide-react'

interface SidebarProps {
    restaurantSlug: string
    restaurantName?: string
    logoUrl?: string
    isOpen: boolean
    onClose: () => void
    enabledModules?: {
        dashboard: boolean
        floorPlan: boolean
        planning: boolean
        reservations: boolean
    }
}

const navigationItems = [
    {
        name: 'Tableau de bord',
        href: '/dashboard',
        icon: LayoutDashboard,
        module: 'dashboard',
    },
    {
        name: 'Plan de salle',
        href: '/floor-plan',
        icon: Map,
        module: 'floorPlan',
    },
    {
        name: 'Planning',
        href: '/planning',
        icon: Calendar,
        module: 'planning',
    },
    {
        name: 'Réservations',
        href: '/reservations',
        icon: ClipboardList,
        module: 'reservations',
    },
    {
        name: 'Paramètres',
        href: '/settings',
        icon: Settings,
        module: null, // Always visible
    },
]

export function Sidebar({
    restaurantSlug,
    restaurantName = 'Restaurant',
    logoUrl,
    isOpen,
    onClose,
    enabledModules = {
        dashboard: true,
        floorPlan: true,
        planning: true,
        reservations: true,
    },
}: SidebarProps) {
    const pathname = usePathname()

    const filteredItems = navigationItems.filter(
        (item) => item.module === null || enabledModules[item.module as keyof typeof enabledModules]
    )

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={cn(
                    'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen w-72 bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-transform lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        {logoUrl ? (
                            <img src={logoUrl} alt={restaurantName} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-bold">
                                {restaurantName[0]}
                            </div>
                        )}
                        <span className="font-semibold text-[var(--color-text)] truncate">
                            {restaurantName}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-background)] text-[var(--color-text-muted)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4">
                    <ul className="space-y-1">
                        {filteredItems.map((item) => {
                            const href = `/${restaurantSlug}${item.href}`
                            const isActive = pathname === href

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={href}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)]'
                                        )}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Back to Hub */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--color-border)]">
                    <Link
                        href="/hub"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)] transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Retour au Hub
                    </Link>
                </div>
            </aside>
        </>
    )
}
