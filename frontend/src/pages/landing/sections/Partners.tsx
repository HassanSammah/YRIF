import { useQuery } from 'react-query'
import { Building2 } from 'lucide-react'
import { publicApi } from '@/api/public'
import type { PartnerListing } from '@/types/mentorship'

// Fallback static partner names shown when API has no data
const STATIC_PARTNERS = [
  'University of Dar es Salaam',
  'Ardhi University',
  'Nelson Mandela African Institution',
  'Tanzania Commission for Science & Technology',
  'Sokoine University of Agriculture',
  'COSTECH',
  'IFM Tanzania',
  'Open University of Tanzania',
]

function PartnerBadge({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex-shrink-0 flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3 shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default min-w-max">
      <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <span className="text-sm font-medium text-brand-navy whitespace-nowrap">{name}</span>
    </div>
  )
}

export default function Partners() {
  const { data } = useQuery(
    'landing:partners',
    () => publicApi.getPartners().then((r) => r.data.results ?? r.data),
    { staleTime: 10 * 60_000, retry: false }
  )

  const apiItems: string[] = Array.isArray(data)
    ? (data as PartnerListing[]).map((p) => p.org_name ?? p.full_name)
    : (data as unknown as { results?: PartnerListing[] })?.results?.map((p) => p.org_name ?? p.full_name) ?? []

  const names = apiItems.length > 0 ? apiItems : STATIC_PARTNERS
  const doubled = [...names, ...names] // duplicate for seamless loop

  return (
    <section id="partners" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-navy bg-brand-navy/5 px-3 py-1.5 rounded-full border border-brand-navy/10 mb-4">
            <Building2 size={13} /> Partner Network
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mb-3">
            Trusted by Leading Institutions
          </h2>
          <p className="text-content-secondary max-w-xl mx-auto">
            We collaborate with universities, government bodies, and industry leaders across Tanzania.
          </p>
        </div>

        {/* Scrolling carousel */}
        <div className="relative overflow-hidden">
          {/* Fade overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="flex gap-4 animate-scroll">
            {doubled.map((name, i) => (
              <PartnerBadge key={`${name}-${i}`} name={name} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
