import { BookOpen, Users, Trophy, Calendar, Database, Lightbulb } from 'lucide-react'
import mentorshipImage from '@/assets/images/mentorship.png'

const features = [
  { icon: BookOpen, title: 'Research Portal', description: 'Access a comprehensive database of youth-led research papers and publications.' },
  { icon: Users, title: 'Mentorship', description: 'Connect with experienced academic and industry mentors for guidance.' },
  { icon: Trophy, title: 'Innovation Grants', description: 'Apply for funding to turn your research ideas into tangible solutions.' },
  { icon: Calendar, title: 'Events & Workshops', description: 'Participate in skill-building workshops and networking events.' },
  { icon: Database, title: 'Data Repository', description: 'Utilize open-access datasets for your research projects.' },
  { icon: Lightbulb, title: 'Idea Incubator', description: 'Collaborate with peers to refine and launch innovative concepts.' },
]

export default function Features() {
  return (
    <section id="features" className="py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-white/50 -z-50" />

      <div className="container mx-auto px-6 md:px-12">
        {/* Intro Section */}
        <div className="mb-24">
          <div className="relative rounded-[3rem] overflow-hidden bg-brand-navy text-white p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
            <div className="w-full md:w-1/2 z-10">
              <span className="text-brand-teal font-bold tracking-widest uppercase text-sm mb-4 block">Our Core Pillars</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
                bridging the gap between <span className="text-brand-teal">knowledge</span> and <span className="text-brand-gold">innovation</span>.
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                We provide the essential infrastructure for young Tanzanians to thrive in the global knowledge economy.
              </p>
            </div>
            <div className="w-full md:w-1/2 relative h-64 md:h-80">
              <img
                src={mentorshipImage}
                alt="Mentorship"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-90 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-navy to-transparent" />
            </div>

            {/* Decorative Circle */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-blue/30 rounded-full blur-3xl pointer-events-none" />
          </div>
        </div>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="glass-card p-8 rounded-3xl hover:border-brand-teal/30 hover:-translate-y-2 group cursor-pointer">
                <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-navy transition-colors duration-300">
                  <Icon className="text-brand-gold group-hover:text-white transition-colors duration-300" size={28} />
                </div>
                <h3 className="font-display text-2xl font-bold text-brand-navy mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
