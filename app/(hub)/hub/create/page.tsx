'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card } from '@/components/ui'
import { ArrowLeft, ArrowRight, Check, Building2, Palette, Type, Grid } from 'lucide-react'
import { slugify } from '@/lib/utils'

const STEPS = [
    { id: 1, title: 'Informations', icon: Building2 },
    { id: 2, title: 'Typographie', icon: Type },
    { id: 3, title: 'Couleurs', icon: Palette },
    { id: 4, title: 'Modules', icon: Grid },
]

const FONT_PRESETS = [
    { value: "'DM Sans', sans-serif", label: 'DM Sans' },
    { value: "'Inter', sans-serif", label: 'Inter' },
    { value: "'Outfit', sans-serif", label: 'Outfit' },
    { value: "'Poppins', sans-serif", label: 'Poppins' },
    { value: "'Playfair Display', serif", label: 'Playfair Display' },
    { value: "system-ui", label: 'System Default' },
]

export default function CreateRestaurantPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        logoUrl: '',
        fontDisplay: "'DM Sans', sans-serif",
        fontBody: "'Inter', sans-serif",
        primaryColor: '#1a1a1a',
        primaryHoverColor: '#333333',
        accentColor: '#3b82f6',
        backgroundColor: '#ffffff',
        surfaceColor: '#f8fafc',
        textColor: '#0f172a',
        moduleDashboard: true,
        moduleFloorPlan: true,
        modulePlanning: true,
        moduleReservations: true,
    })

    const handleNameChange = (name: string) => {
        setFormData({
            ...formData,
            name,
            slug: slugify(name),
        })
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/restaurants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    slug: formData.slug,
                    logoUrl: formData.logoUrl || null,
                    settings: {
                        primary_color: formData.primaryColor,
                        primary_hover_color: formData.primaryHoverColor,
                        accent_color: formData.accentColor,
                        background_color: formData.backgroundColor,
                        surface_color: formData.surfaceColor,
                        text_color: formData.textColor,
                        font_display: formData.fontDisplay,
                        font_body: formData.fontBody,
                        module_dashboard: formData.moduleDashboard,
                        module_floor_plan: formData.moduleFloorPlan,
                        module_planning: formData.modulePlanning,
                        module_reservations: formData.moduleReservations,
                    },
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create restaurant')
            }

            router.push('/hub')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        } finally {
            setLoading(false)
        }
    }

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.name.length >= 2 && formData.slug.length >= 2
            default:
                return true
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <Input
                            label="Nom du restaurant"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Ex: La Belle Époque"
                            required
                        />
                        <Input
                            label="Slug (URL)"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="la-belle-epoque"
                            hint="Sera utilisé dans l'URL: /la-belle-epoque/dashboard"
                            required
                        />
                        <Input
                            label="URL du logo (optionnel)"
                            value={formData.logoUrl}
                            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-3">
                                Police des titres
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {FONT_PRESETS.map((font) => (
                                    <button
                                        key={font.value}
                                        onClick={() => setFormData({ ...formData, fontDisplay: font.value })}
                                        className={`p-4 border rounded-xl text-left transition-all ${formData.fontDisplay === font.value
                                                ? 'border-[var(--color-accent)] bg-blue-50'
                                                : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                                            }`}
                                        style={{ fontFamily: font.value }}
                                    >
                                        <span className="text-lg font-semibold">{font.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-3">
                                Police du corps
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {FONT_PRESETS.slice(0, 4).map((font) => (
                                    <button
                                        key={font.value}
                                        onClick={() => setFormData({ ...formData, fontBody: font.value })}
                                        className={`p-4 border rounded-xl text-left transition-all ${formData.fontBody === font.value
                                                ? 'border-[var(--color-accent)] bg-blue-50'
                                                : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                                            }`}
                                        style={{ fontFamily: font.value }}
                                    >
                                        <span className="text-base">{font.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                                    Couleur primaire
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={formData.primaryColor}
                                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                    />
                                    <Input
                                        value={formData.primaryColor}
                                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                                    Couleur accent
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={formData.accentColor}
                                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                    />
                                    <Input
                                        value={formData.accentColor}
                                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="mt-6 p-6 rounded-xl border border-[var(--color-border)]" style={{ backgroundColor: formData.surfaceColor }}>
                            <h4 className="text-lg font-semibold mb-3" style={{ color: formData.textColor }}>
                                Aperçu du thème
                            </h4>
                            <div className="flex gap-3">
                                <button
                                    className="px-4 py-2 rounded-lg text-white font-medium"
                                    style={{ backgroundColor: formData.primaryColor }}
                                >
                                    Bouton primaire
                                </button>
                                <button
                                    className="px-4 py-2 rounded-lg text-white font-medium"
                                    style={{ backgroundColor: formData.accentColor }}
                                >
                                    Bouton accent
                                </button>
                            </div>
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-4">
                        <p className="text-[var(--color-text-muted)] mb-4">
                            Sélectionnez les modules à activer pour ce restaurant
                        </p>
                        {[
                            { key: 'moduleDashboard', label: 'Tableau de bord', desc: 'Vue d\'ensemble et statistiques' },
                            { key: 'moduleFloorPlan', label: 'Plan de salle', desc: 'Gestion visuelle des tables' },
                            { key: 'modulePlanning', label: 'Planning', desc: 'Vue calendrier des réservations' },
                            { key: 'moduleReservations', label: 'Réservations', desc: 'Liste et gestion des réservations' },
                        ].map((module) => (
                            <label
                                key={module.key}
                                className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                            >
                                <div>
                                    <span className="font-medium text-[var(--color-text)]">{module.label}</span>
                                    <p className="text-sm text-[var(--color-text-muted)]">{module.desc}</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData[module.key as keyof typeof formData] as boolean}
                                    onChange={(e) => setFormData({ ...formData, [module.key]: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                            </label>
                        ))}
                    </div>
                )
        }
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => router.push('/hub')}
                    className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour au Hub
                </button>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep >= step.id
                                        ? 'bg-[var(--color-accent)] text-white'
                                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                                    }`}
                            >
                                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`w-16 h-1 mx-2 rounded ${currentStep > step.id
                                            ? 'bg-[var(--color-accent)]'
                                            : 'bg-[var(--color-border)]'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Card */}
                <Card padding="lg">
                    <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
                        {STEPS[currentStep - 1].title}
                    </h2>
                    <p className="text-[var(--color-text-muted)] mb-6">
                        Étape {currentStep} sur {STEPS.length}
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                            {error}
                        </div>
                    )}

                    {renderStepContent()}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            disabled={currentStep === 1}
                            icon={<ArrowLeft className="w-4 h-4" />}
                        >
                            Précédent
                        </Button>

                        {currentStep < STEPS.length ? (
                            <Button
                                variant="accent"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={!canProceed()}
                                icon={<ArrowRight className="w-4 h-4" />}
                                iconPosition="right"
                            >
                                Suivant
                            </Button>
                        ) : (
                            <Button
                                variant="accent"
                                onClick={handleSubmit}
                                loading={loading}
                                icon={<Check className="w-4 h-4" />}
                            >
                                Créer le restaurant
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
