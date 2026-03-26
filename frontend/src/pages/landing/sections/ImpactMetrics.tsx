import { Users, FileText, Calendar, Handshake } from 'lucide-react'

const METRICS = [
  { icon: Users,     value: '5,000+',  label: 'Youth Members' },
  { icon: FileText,  value: '120+',    label: 'Research Projects' },
  { icon: Calendar,  value: '50+',     label: 'Events Hosted' },
  { icon: Handshake, value: '30+',     label: 'Partner Organizations' },
]

export default function ImpactMetrics() {
  return (
    <section className="py-16 bg-brand-navy relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Our Impact in Numbers
          </h2>
          <p className="mt-2 text-white/60 text-sm">Growing stronger every year across Tanzania</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {METRICS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="group flex flex-col items-center text-center p-6 rounded-2xl border border-white/10 hover:bg-brand-teal/20 transition-colors cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon size={22} className="text-brand-gold" />
              </div>
              <p className="font-display text-3xl font-bold text-white mb-1">{value}</p>
              <p className="text-sm text-white/60">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
