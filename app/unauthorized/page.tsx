'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-background)] via-[var(--color-surface)] to-[var(--color-background)] px-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
                    <ShieldX className="w-10 h-10 text-rose-600" />
                </div>

                <h1 className="text-3xl font-bold text-[var(--color-text)] mb-4 font-[var(--font-display)]">
                    Accès non autorisé
                </h1>

                <p className="text-[var(--color-text-muted)] mb-8">
                    Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                    Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/">
                        <Button variant="outline" icon={<ArrowLeft className="w-5 h-5" />}>
                            Retour à l'accueil
                        </Button>
                    </Link>
                    <Button variant="ghost" icon={<LogOut className="w-5 h-5" />} onClick={handleLogout}>
                        Se déconnecter
                    </Button>
                </div>
            </div>
        </div>
    )
}
