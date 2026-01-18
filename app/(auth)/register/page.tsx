'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            setLoading(false)
            return
        }

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (signUpError) throw signUpError

            if (data.user) {
                // Create user record in users table
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: data.user.id,
                        email: data.user.email,
                        full_name: fullName,
                        role: 'staff',
                        is_super_admin: false,
                    })

                if (insertError) {
                    console.error('Failed to create user record:', insertError)
                }
            }

            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-background)] via-[var(--color-surface)] to-[var(--color-background)] px-4">
                <Card className="w-full max-w-md" padding="lg">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
                            Vérifiez votre email
                        </h2>
                        <p className="text-[var(--color-text-muted)] mb-6">
                            Un lien de confirmation a été envoyé à <strong>{email}</strong>
                        </p>
                        <Link href="/login">
                            <Button variant="accent">
                                Retour à la connexion
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-background)] via-[var(--color-surface)] to-[var(--color-background)] px-4 py-8">
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
                        <CardTitle className="text-2xl text-center">Créer un compte</CardTitle>
                        <p className="text-[var(--color-text-muted)] text-center mt-2">
                            Rejoignez AxiomIA
                        </p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Nom complet"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Jean Dupont"
                            icon={<User className="w-5 h-5" />}
                            required
                        />

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
                            hint="Minimum 6 caractères"
                            required
                        />

                        <Input
                            label="Confirmer le mot de passe"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            icon={<Lock className="w-5 h-5" />}
                            required
                        />

                        <Button
                            type="submit"
                            variant="accent"
                            className="w-full"
                            size="lg"
                            loading={loading}
                            icon={<ArrowRight className="w-5 h-5" />}
                            iconPosition="right"
                        >
                            Créer mon compte
                        </Button>
                    </form>

                    <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
                        Déjà un compte ?{' '}
                        <Link href="/login" className="text-[var(--color-accent)] hover:underline font-medium">
                            Se connecter
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
