import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Coins,
  Compass,
  Cpu,
  Factory,
  Globe2,
  GraduationCap,
  Handshake,
  Landmark,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { publicApi } from '@/api/public'
import type { PartnerListing } from '@/types/mentorship'
import {
  COALITION_INTRO,
  INTERNATIONAL_PARTNERS,
  NATIONAL_PARTNERS,
  NATIONAL_PARTNER_GROUPS,
  type CoalitionPartner,
} from '@/data/partners'

const PARTNER_CONTRIBUTIONS = [
  {
    icon: Coins,
    title: 'Funding',
    body: 'National and international organizations provide funding that enables youth research programs, competitions, awards, and platform growth — through grants, donations, sponsorships, and partnerships.',
  },
  {
    icon: Wrench,
    title: 'Technical collaboration',
    body: 'Joint projects, training design, research quality assurance, and shared expertise that strengthen how young researchers learn and publish.',
  },
  {
    icon: Compass,
    title: 'Strategic alignment',
    body: 'Linking youth research to national and global development priorities so outputs serve industry, policy, and community needs.',
  },
  {
    icon: Users,
    title: 'Experts as mentors & judges',
    body: 'Academic and industry professionals serve as mentors, judges, and technical advisors across YRIF programs — a core part of the four-part ecosystem alongside students, institutions, and partners.',
  },
]

const COLLABORATION_AREAS = [
  {
    icon: Award,
    title: 'Annual National Research Competition and Awards',
    body: 'Sponsor or co-host the competition across Natural Sciences, Social Sciences, and Arts & Humanities — from submission and evaluation through the award ceremony and national recognition.',
  },
  {
    icon: Coins,
    title: 'Research grants, projects & innovation competitions',
    body: 'Coordinate and co-fund youth research grants, projects, and innovation competitions that turn ideas into validated work.',
  },
  {
    icon: Factory,
    title: 'Research-to-industry and market linkage',
    body: 'Connect research outputs to industrial and market needs — one of YRIF\'s constitutional objectives and a clear value exchange for private-sector partners.',
  },
  {
    icon: BookOpen,
    title: 'YRIF Journal and national data hub',
    body: 'Support the open-access youth research journal and the digital research repository that functions as a national data hub for youth-generated research.',
  },
  {
    icon: GraduationCap,
    title: 'Seminars, training & scientific writing',
    body: 'Deliver university research awareness seminars, High School Research Clubs (Form V–VI), and scientific writing programs that build research capacity at scale.',
  },
  {
    icon: Cpu,
    title: 'Digital literacy and AI in research',
    body: 'Promote digital literacy and the integration of artificial intelligence in research — aligned with YRIF\'s 4th Industrial Revolution impact focus.',
  },
  {
    icon: Handshake,
    title: 'Mentorship and expert networks',
    body: 'Supply mentors, judges, and technical advisors who guide youth through the Innovation Cycle: Insights → Ideation → Investigation → Implementation → Iteration.',
  },
  {
    icon: Sparkles,
    title: 'Youth Research Bonanza & Creative Innovation',
    body: 'Partner on programs that blend innovation, creativity, competitions, and entertainment to inspire youth engagement.',
  },
]

const FUNDING_PATHWAYS = [
  'Sponsorships and partnerships',
  'Grants and donations',
]

function CoalitionCard({ partner }: { partner: CoalitionPartner }) {
  return (
    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm min-h-[88px]">
      {partner.logo ? (
        <img
          src={partner.logo}
          alt=""
          className="h-14 w-16 object-contain flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-brand-navy/5 flex items-center justify-center flex-shrink-0">
          <Building2 size={18} className="text-brand-navy" />
        </div>
      )}
      <span className="text-sm font-medium text-brand-navy leading-snug">{partner.name}</span>
    </div>
  )
}

export default function PartnersPage() {
  usePageTitle('Partners')

  const { data } = useQuery(
    'landing:partners',
    () => publicApi.getPartners().then((r) => r.data.results ?? r.data),
    { staleTime: 10 * 60_000, retry: false }
  )

  const registeredPartners: string[] = Array.isArray(data)
    ? (data as PartnerListing[]).map((p) => p.org_name ?? p.full_name)
    : (data as unknown as { results?: PartnerListing[] })?.results?.map(
        (p) => p.org_name ?? p.full_name
      ) ?? []

  return (
    <div className="min-h-screen bg-gradient-cream pt-16">
      <div className="bg-brand-navy text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
            <Building2 size={13} /> Partner with YRIF
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Our Partners
          </h1>
          <p className="text-white/70 text-lg max-w-3xl mx-auto">
            {COALITION_INTRO}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Opening narrative */}
        <section className="max-w-3xl mx-auto space-y-4">
          <p className="text-content-secondary leading-relaxed text-lg">
            Partnership is central to YRIF&apos;s mission: to engage and nurture youth potential by
            addressing national and global challenges through research-based, innovative solutions.
            One of our constitutional objectives is to foster partnerships with local and
            international research institutions.
          </p>
          <p className="text-content-secondary leading-relaxed">
            Partners sit alongside students, institutions, and experts. A full partnership
            engagement strategy — including proposed collaboration areas per stakeholder — is
            available in YRIF&apos;s Grant Proposal and Stakeholder Engagement Package.
          </p>
        </section>

        {/* What partners bring */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">
              What Partners Bring
            </h2>
            <p className="text-content-secondary max-w-2xl mx-auto">
              How collaboration with YRIF is described in our Organization Profile and Constitution.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PARTNER_CONTRIBUTIONS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-brand-navy/5 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-brand-teal" />
                </div>
                <h3 className="font-semibold text-brand-navy mb-2">{title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Collaboration areas */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">
              Areas of Collaboration
            </h2>
            <p className="text-content-secondary max-w-2xl mx-auto">
              Concrete programs and objectives where partners can engage — drawn from YRIF&apos;s
              programs and constitutional objectives.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COLLABORATION_AREAS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-brand-navy/5 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-brand-teal" />
                </div>
                <h3 className="font-semibold text-brand-navy mb-2">{title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Funding pathways */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-4">
            How Partnership Supports YRIF
          </h2>
          <p className="text-content-secondary leading-relaxed mb-6 max-w-3xl">
            Sponsorships, grants, and donations are applied solely toward YRIF&apos;s objectives.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FUNDING_PATHWAYS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-content-secondary bg-gradient-cream rounded-xl px-4 py-3"
              >
                <Coins size={16} className="text-brand-teal mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Coalition lists */}
        <section className="space-y-10">
          <div>
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">Our Coalition</h2>
            <p className="text-content-secondary max-w-3xl leading-relaxed">
              {COALITION_INTRO} The organizations named below are those identified in YRIF&apos;s
              Organization Profile as part of this coalition-building agenda. For proposed
              collaboration areas per stakeholder, request the Grant Proposal and Stakeholder
              Engagement Package.
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-teal mb-2">
              <Landmark size={16} /> National
            </h3>
            <p className="text-sm text-content-secondary mb-4 max-w-2xl">
              Government, academia, research institutions, regional administration, and private-sector
              sponsors — including:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {NATIONAL_PARTNERS.map((p) => (
                <CoalitionCard key={p.name} partner={p} />
              ))}
              {NATIONAL_PARTNER_GROUPS.map((group) => (
                <div
                  key={group}
                  className="flex items-center gap-3 bg-white/60 border border-dashed border-brand-navy/15 rounded-xl px-4 py-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-navy/5 flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-brand-navy" />
                  </div>
                  <span className="text-sm text-content-secondary">{group}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-teal mb-2">
              <Globe2 size={16} /> International
            </h3>
            <p className="text-sm text-content-secondary mb-4 max-w-2xl">
              Multilateral, development, and philanthropic institutions named in the Organization Profile:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INTERNATIONAL_PARTNERS.map((p) => (
                <CoalitionCard key={p.name} partner={p} />
              ))}
            </div>
          </div>
        </section>

        {registeredPartners.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold text-brand-navy mb-2">
              Partners on the Platform
            </h2>
            <p className="text-content-secondary mb-6 max-w-2xl">
              Industry and community organizations with verified partner accounts currently listed
              on the YRIF digital platform.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {registeredPartners.map((name) => (
                <div key={name} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                  <span className="text-sm font-medium text-brand-navy">{name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact for partnership */}
        <section className="bg-brand-navy rounded-2xl p-8 sm:p-10 text-center text-white relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Partner with us
          </h2>
          <p className="text-white/70 leading-relaxed mb-6 max-w-xl mx-auto">
            Request the Grant Proposal and Stakeholder Engagement Package, or support YRIF through a donation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-brand-gold text-brand-navy font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors text-sm"
            >
              Request the partnership package <ArrowRight size={16} />
            </Link>
            <Link
              to="/donate"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Donate
            </Link>
          </div>
          </div>
        </section>
      </div>
    </div>
  )
}
