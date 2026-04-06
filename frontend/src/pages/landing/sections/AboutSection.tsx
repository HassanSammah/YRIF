import { CheckCircle2, Quote } from 'lucide-react'
import researchMeetingImage from '@/assets/images/research_meeting.png'

const OFFERINGS = [
  'A national research submission and peer-review platform',
  'Structured mentorship matching with industry experts',
  'Competitive events, hackathons, and innovation grants',
  'A curated digital repository of Tanzanian youth research',
]

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Visual */}
          <div className="relative">
            <img src={researchMeetingImage} alt="Research Team Meeting" className="rounded-2xl shadow-xl w-full object-cover" />

            {/* Floating testimonial */}
            <div className="absolute -bottom-6 -right-6 max-w-xs bg-white rounded-2xl p-4 shadow-xl hidden lg:block">
              <Quote size={16} className="text-brand-gold mb-2" />
              <p className="text-xs text-content-secondary italic leading-relaxed">
                "YRIF gave my research the visibility and mentorship it needed to reach national policymakers."
              </p>
              <p className="mt-2 text-xs font-semibold text-brand-navy">— Dr. K. Katho, Researcher</p>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-6">
            <div className="inline-block text-xs font-semibold text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-full border border-brand-teal/20">
              Our Mission
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy leading-tight">
              To Bridge the Gap Between{' '}
              <span className="text-brand-teal">Youth & National Development</span>
            </h2>
            <p className="text-content-secondary leading-relaxed">
              YRIF is Tanzania's dedicated digital ecosystem for young researchers and innovators. We
              provide the infrastructure, networks, and opportunities needed to transform ideas into
              nationally recognized work.
            </p>

            <ul className="space-y-3">
              {OFFERINGS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-brand-teal mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-content-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
