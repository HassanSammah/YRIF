import { BookOpen, Users, Trophy, Calendar, Database, Lightbulb } from 'lucide-react'

const FEATURES = [
  {
    Icon: BookOpen,
    title: 'Research Portal',
    description:
      'Submit, review, and publish research papers through a structured peer-review workflow. Build your academic portfolio.',
    color: 'bg-brand-teal/10 text-brand-teal',
  },
  {
    Icon: Users,
    title: 'Mentorship Network',
    description:
      'Connect with experienced professionals and academics who guide your research and career development.',
    color: 'bg-brand-navy/10 text-brand-navy',
  },
  {
    Icon: Trophy,
    title: 'Innovation Grants',
    description:
      'Compete in national competitions and win grants to fund your research projects and innovations.',
    color: 'bg-brand-gold/10 text-brand-gold',
  },
  {
    Icon: Calendar,
    title: 'Events & Workshops',
    description:
      'Attend seminars, workshops, hackathons, and bonanzas. Earn verified certificates for your participation.',
    color: 'bg-brand-teal/10 text-brand-teal',
  },
  {
    Icon: Database,
    title: 'Data Repository',
    description:
      'Access a growing library of Tanzanian youth research, datasets, and learning resources curated for impact.',
    color: 'bg-brand-navy/10 text-brand-navy',
  },
  {
    Icon: Lightbulb,
    title: 'Idea Incubator',
    description:
      'Collaborate with research assistants and partner organizations to transform early-stage ideas into real projects.',
    color: 'bg-brand-gold/10 text-brand-gold',
  },
]

export default function Features() {
  return (
    <section className="py-20 bg-gradient-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block text-xs font-semibold text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-full border border-brand-teal/20 mb-4">
            Platform Features
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mb-4">
            Bridging the Gap Between{' '}
            <span className="text-brand-teal">Knowledge and Innovation</span>
          </h2>
          <p className="text-content-secondary leading-relaxed">
            Everything a young Tanzanian researcher needs — from first draft to national recognition.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ Icon, title, description, color }) => (
            <div
              key={title}
              className="group glass-card bg-white rounded-2xl p-6 hover:-translate-y-1 transition-transform cursor-default"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-brand-navy mb-2">{title}</h3>
              <p className="text-sm text-content-secondary leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
