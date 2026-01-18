'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui'

interface HeaderProps {
    title?: string
    onMenuClick?: () => void
    showMenuButton?: boolean
    userName?: string
}

export function Header({
    title,
    onMenuClick,
    showMenuButton = true,
    userName,
}: HeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className="sticky top-0 z-30 h-16 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between h-full px-6">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    {showMenuButton && (
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}
                    {title && (
                        <h1 className="text-xl font-semibold text-[var(--color-text)] font-[var(--font-display)]">
                            {title}
                        </h1>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button className="relative p-2.5 rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-error)] rounded-full" />
                    </button>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-surface)] transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-medium text-sm">
                                {userName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            {userName && (
                                <span className="hidden sm:block text-sm font-medium text-[var(--color-text)]">
                                    {userName}
                                </span>
                            )}
                        </button>

                        {/* Dropdown */}
                        {showUserMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-lg z-50 py-2 animate-fade-in">
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <User className="w-4 h-4" />
                                        Mon profil
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <Settings className="w-4 h-4" />
                                        Paramètres
                                    </button>
                                    <hr className="my-2 border-[var(--color-border)]" />
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-error)] hover:bg-rose-50 transition-colors"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Déconnexion
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
