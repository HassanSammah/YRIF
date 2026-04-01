import { ExternalLink, GraduationCap, Microscope, BookOpen, Building2 } from 'lucide-react'

const LINKS = [
  {
    abbr: 'MoEST',
    name: 'Ministry of Education, Science and Technology',
    url: 'https://www.moe.go.tz',
    description: "Tanzania's formal body for educational policies and technological advancement.",
    Icon: Building2,
    color: 'text-brand-gold',
  },
  {
    abbr: 'COSTECH',
    name: 'Commission for Science and Technology',
    url: 'https://www.costech.or.tz',
    description: 'The principal advisory organ to the Government on matters relating to scientific research and technology.',
    Icon: Microscope,
    color: 'text-brand-teal',
  },
  {
    abbr: 'TCU',
    name: 'Tanzania Commission for Universities',
    url: 'https://www.tcu.go.tz',
    description: 'Regulating and ensuring the quality of university education in Tanzania.',
    Icon: GraduationCap,
    color: 'text-brand-blue',
  },
  {
    abbr: 'UDSM',
    name: 'University of Dar es Salaam',
    url: 'https://www.udsm.ac.tz',
    description: "The oldest and premier public university in Tanzania, fostering research and innovation.",
    Icon: BookOpen,
    color: 'text-content-secondary',
  },
]

export default function UsefulLinks() {
  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-block text-xs font-semibold text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-full border border-brand-teal/20 mb-4">
            Ecosystem
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mb-4">
            Key Tanzanian Institutions
          </h2>
          <p className="text-content-secondary max-w-2xl mx-auto">
            Explore other organizations and institutions driving education, research, and innovation across Tanzania.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {LINKS.map(({ abbr, name, url, description, Icon, color }) => (
            <a
              key={abbr}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-6 sm:p-7 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-lg hover:border-brand-teal/20 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Hover Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Icon Container */}
                <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-5 border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                  <Icon className={`w-7 h-7 ${color}`} />
                </div>

                {/* Content */}
                <h3 className="text-sm font-bold text-brand-navy mb-1 group-hover:text-brand-teal transition-colors">
                  {abbr}
                </h3>
                <h4 className="text-sm font-semibold text-brand-navy mb-3 leading-snug pr-6">
                  {name}
                </h4>

                <p className="text-xs text-content-secondary mb-5 flex-grow leading-relaxed">
                  {description}
                </p>

                {/* CTA Link */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-teal group-hover:text-brand-navy transition-colors">
                  <span>Visit Website</span>
                  <ExternalLink size={14} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
