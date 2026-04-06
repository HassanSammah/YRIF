import { useQuery } from 'react-query'
import { Users, FileText, Calendar, Handshake } from 'lucide-react'
import { publicApi } from '@/api/public'

const FALLBACK = [
  { icon: Users,     value: '5,000+',  label: 'Youth Members',         key: 'total_members' },
  { icon: FileText,  value: '120+',    label: 'Research Projects',      key: 'research_projects' },
  { icon: Calendar,  value: '50+',     label: 'Events Hosted',          key: 'events_hosted' },
  { icon: Handshake, value: '30+',     label: 'Partner Organizations',  key: 'partner_organizations' },
]

export default function ImpactMetrics() {
  const { data } = useQuery('landing:stats', () =>
    publicApi.getStats().then((r) => r.data),
    { staleTime: 10 * 60_000, retry: false }
  )

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
            Building a legacy of innovation and research excellence across Tanzania aligned with national development priorities.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {FALLBACK.map(({ icon: Icon, value: fallback, label, key }) => {
            const live = data?.[key as keyof typeof data]
            const display = live !== undefined ? `${live}+` : fallback
            return (
              <div
                key={label}
                className="group flex flex-col items-center text-center"
              >
                {/* Icon Container */}
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-brand-teal/20 transition-all duration-300 transform group-hover:scale-110 border border-white/5">
                  <Icon size={32} className="text-brand-gold" />
                </div>

                {/* Metric Value */}
                <p className="font-display text-4xl sm:text-5xl font-bold text-white mb-2 leading-tight">
                  {display}
                </p>

                {/* Label */}
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
