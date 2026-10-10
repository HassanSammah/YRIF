import { Link } from 'react-router-dom'
import { ArrowRight, Building2 } from 'lucide-react'
import { ALL_NAMED_PARTNERS, COALITION_INTRO, type CoalitionPartner } from '@/data/partners'

function PartnerBadge({ partner }: { partner: CoalitionPartner }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3 shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default min-w-max">
      {partner.logo ? (
        <img src={partner.logo} alt="" className="h-10 w-12 object-contain flex-shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-brand-navy/5 flex items-center justify-center flex-shrink-0">
          <Building2 size={16} className="text-brand-navy" />
        </div>
      )}
      <span className="text-sm font-medium text-brand-navy whitespace-nowrap">{partner.name}</span>
    </div>
  )
}

export default function Partners() {
  const doubled = [...ALL_NAMED_PARTNERS, ...ALL_NAMED_PARTNERS] // duplicate for seamless loop

  return (
    <section id="partners" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-navy bg-brand-navy/5 px-3 py-1.5 rounded-full border border-brand-navy/10 mb-4">
            <Building2 size={13} /> Partner Network
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mb-3">
            Our Partners
          </h2>
          <p className="text-content-secondary max-w-2xl mx-auto">
            {COALITION_INTRO}
          </p>
          <Link
            to="/partners"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:underline"
          >
            View all partners <ArrowRight size={14} />
          </Link>
        </div>

        {/* Scrolling carousel */}
        <div className="relative overflow-hidden">
          {/* Fade overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="flex gap-4 animate-scroll">
            {doubled.map((partner, i) => (
              <PartnerBadge key={`${partner.name}-${i}`} partner={partner} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
