'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            router.push('/hub')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-background)] via-[var(--color-surface)] to-[var(--color-background)] px-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>

            <Card className="relative w-full max-w-md" padding="lg">
                <CardHeader>
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg">
                            A
                        </div>
                        <CardTitle className="text-2xl text-center">AxiomIA</CardTitle>
                        <p className="text-[var(--color-text-muted)] text-center mt-2">
                            Connectez-vous à votre espace
                        </p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            icon={<Mail className="w-5 h-5" />}
                            required
                        />

                        <Input
                            label="Mot de passe"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            icon={<Lock className="w-5 h-5" />}
                            required
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                <input type="checkbox" className="rounded" />
                                Se souvenir de moi
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-[var(--color-accent)] hover:underline"
                            >
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="accent"
                            className="w-full"
                            size="lg"
                            loading={loading}
                            icon={<ArrowRight className="w-5 h-5" />}
                            iconPosition="right"
                        >
                            Se connecter
                        </Button>
                    </form>

                    <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
                        Pas encore de compte ?{' '}
                        <Link href="/register" className="text-[var(--color-accent)] hover:underline font-medium">
                            Créer un compte
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
