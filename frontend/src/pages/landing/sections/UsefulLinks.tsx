import { ExternalLink } from 'lucide-react'

const LINKS = [
  {
    abbr: 'MoEST',
    name: 'Ministry of Education, Science & Technology',
    url: 'https://www.moe.go.tz',
    description: 'National education policy and science strategy',
  },
  {
    abbr: 'COSTECH',
    name: 'Commission for Science & Technology',
    url: 'https://www.costech.or.tz',
    description: "Tanzania's national science and technology body",
  },
  {
    abbr: 'TCU',
    name: 'Tanzania Commission for Universities',
    url: 'https://www.tcu.go.tz',
    description: 'Accreditation and regulation of higher education',
  },
  {
    abbr: 'UDSM',
    name: 'University of Dar es Salaam',
    url: 'https://www.udsm.ac.tz',
    description: "Tanzania's premier research university",
  },
]

export default function UsefulLinks() {
  return (
    <section className="py-20 bg-gradient-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block text-xs font-semibold text-brand-navy bg-brand-navy/5 px-3 py-1.5 rounded-full border border-brand-navy/10 mb-4">
            Educational Resources
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mb-3">
            Key Tanzanian Institutions
          </h2>
          <p className="text-content-secondary max-w-xl mx-auto">
            Trusted organisations shaping science, technology, and education across Tanzania.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {LINKS.map(({ abbr, name, url, description }) => (
            <a
              key={abbr}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group glass-card bg-white rounded-2xl p-6 hover:-translate-y-1 transition-transform flex flex-col gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{abbr}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-brand-navy text-sm leading-snug mb-1 group-hover:text-brand-teal transition-colors">
                  {name}
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">{description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-brand-teal font-medium">
                Visit site <ExternalLink size={11} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
