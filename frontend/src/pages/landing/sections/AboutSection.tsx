import { CheckCircle2, Quote } from 'lucide-react'

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
            <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-brand-navy to-brand-teal p-1">
              <div className="w-full h-full rounded-[22px] bg-gradient-cream flex items-center justify-center p-10">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-brand-teal/10 flex items-center justify-center mx-auto">
                    <svg viewBox="0 0 80 80" fill="none" className="w-12 h-12">
                      <circle cx="40" cy="40" r="32" stroke="#0D9488" strokeWidth="4" strokeDasharray="8 4"/>
                      <circle cx="40" cy="40" r="18" fill="#093344"/>
                      <path d="M32 40l5 5 11-11" stroke="#df8d31" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="font-display font-bold text-brand-navy text-xl leading-snug">
                    Bridging Knowledge<br />& National Development
                  </p>
                  <p className="text-sm text-content-secondary">
                    Uniting Tanzanian youth, researchers, and industry leaders on one platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Floating testimonial */}
            <div className="absolute -bottom-6 -right-4 max-w-xs glass bg-white/90 rounded-2xl p-4 shadow-xl hidden lg:block">
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
