'use client'

import Link from 'next/link'
import { Building2, Settings, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RestaurantWithSettings } from '@/lib/types/database'

interface RestaurantCardProps {
    restaurant: RestaurantWithSettings
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
    const settings = restaurant.settings

    return (
        <Link href={`/${restaurant.slug}/dashboard`}>
            <div className="group relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] cursor-pointer">
                {/* Background accent */}
                <div
                    className="absolute top-0 left-0 right-0 h-24 opacity-10"
                    style={{
                        background: `linear-gradient(135deg, ${settings?.primary_color || '#1a1a1a'}, ${settings?.accent_color || '#3b82f6'})`,
                    }}
                />

                {/* Content */}
                <div className="relative">
                    {/* Logo & Name */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {restaurant.logo_url ? (
                                <img
                                    src={restaurant.logo_url}
                                    alt={restaurant.name}
                                    className="w-14 h-14 rounded-xl object-cover shadow-md"
                                />
                            ) : (
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md"
                                    style={{ backgroundColor: settings?.accent_color || '#3b82f6' }}
                                >
                                    {restaurant.name[0]}
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-lg text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                                    {restaurant.name}
                                </h3>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    /{restaurant.slug}
                                </p>
                            </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Modules indicators */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {settings?.module_dashboard && (
                            <span className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg">
                                Dashboard
                            </span>
                        )}
                        {settings?.module_floor_plan && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg">
                                Plan
                            </span>
                        )}
                        {settings?.module_planning && (
                            <span className="px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg">
                                Planning
                            </span>
                        )}
                        {settings?.module_reservations && (
                            <span className="px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg">
                                Réservations
                            </span>
                        )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                        <Link
                            href={`/${restaurant.slug}/settings`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-[var(--color-background)] text-[var(--color-text-muted)] transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </Link>
    )
}
