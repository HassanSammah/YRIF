import { Users, FileText, Calendar, Handshake } from 'lucide-react'
import { PUBLIC_STAT_LABELS, usePublicStats, type PublicStatKey } from '@/hooks/usePublicStats'

const ICONS: Record<PublicStatKey, typeof Users> = {
  total_members: Users,
  research_projects: FileText,
  events_hosted: Calendar,
  partner_organizations: Handshake,
}

export default function ImpactMetrics() {
  const { format } = usePublicStats()

  return (
    <section id="impact" className="py-24 bg-brand-navy text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-teal rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-gold rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
            Live platform totals — members, published research, events, and active partner organizations.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {PUBLIC_STAT_LABELS.map(({ key, label }) => {
            const Icon = ICONS[key]
            return (
              <div
                key={key}
                className="group flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-brand-teal/20 transition-all duration-300 transform group-hover:scale-110 border border-white/5">
                  <Icon size={32} className="text-brand-gold" />
                </div>

                <p className="font-display text-4xl sm:text-5xl font-bold text-white mb-2 leading-tight">
                  {format(key)}
                </p>

                <p className="text-white/70 font-medium uppercase tracking-wider text-xs sm:text-sm">
                  {label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
