import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-background)] via-[var(--color-surface)] to-[var(--color-background)] flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--color-accent)]/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--color-primary)]/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative text-center px-6 max-w-3xl">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white font-bold text-3xl mx-auto mb-8 shadow-2xl">
          A
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-[var(--color-text)] mb-6 font-[var(--font-display)]">
          AxiomIA
        </h1>

        <p className="text-xl text-[var(--color-text-muted)] mb-12 max-w-xl mx-auto">
          Plateforme SaaS moderne pour la gestion des réservations et du plan de salle de vos restaurants
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login" className="px-8 py-4 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-hover)] transition-all hover:translate-y-[-2px] hover:shadow-xl">
            Se connecter
          </Link>
          <Link href="/register" className="px-8 py-4 border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-xl hover:bg-[var(--color-surface)] transition-all">
            Créer un compte
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          {[
            { title: 'Plan de salle', desc: 'Visualisez et gérez vos tables en temps réel' },
            { title: 'Réservations', desc: 'Centralisez toutes vos réservations' },
            { title: 'Multi-tenant', desc: 'Gérez plusieurs restaurants' },
          ].map((f) => (
            <div key={f.title} className="p-6 bg-[var(--color-surface)]/50 backdrop-blur-sm rounded-2xl border border-[var(--color-border)]">
              <h3 className="font-semibold text-[var(--color-text)] mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
