import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp, Users, BookOpen } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-cream flex items-center overflow-hidden pt-16">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="space-y-6 fade-in-up">
            <div className="inline-flex items-center gap-2 bg-brand-teal/10 text-brand-teal text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-teal/20">
              <TrendingUp size={13} />
              Tanzania's #1 Youth Research Platform
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-navy leading-tight">
              Empowering Youth Through{' '}
              <span className="bg-gradient-to-r from-brand-teal to-brand-gold bg-clip-text text-transparent">
                Research & Innovation
              </span>
            </h1>

            <p className="text-lg text-content-secondary leading-relaxed max-w-xl">
              Join thousands of young Tanzanian researchers and innovators. Submit research, connect with
              mentors, compete in events, and grow your professional network.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-brand-navy text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-teal transition-colors"
              >
                Join YRIF <ArrowRight size={16} />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 border border-brand-navy text-brand-navy font-semibold px-6 py-3 rounded-xl hover:bg-brand-navy hover:text-white transition-colors"
              >
                <BookOpen size={16} /> Explore Research
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { icon: Users, label: '5,000+ Members' },
                { icon: BookOpen, label: '120+ Research Papers' },
                { icon: TrendingUp, label: '50+ Events Hosted' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-content-secondary">
                  <Icon size={15} className="text-brand-teal" />
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Glass card */}
          <div className="relative lg:flex justify-end hidden">
            <div className="relative w-full max-w-md">
              {/* Main card */}
              <div className="glass-card bg-white/80 rounded-3xl p-8 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal flex items-center justify-center">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-navy text-sm">Platform Growth</p>
                    <p className="text-xs text-content-secondary">Since YRIF Inception</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Youth Researchers', pct: '85%', color: 'bg-brand-teal' },
                    { label: 'Research Publications', pct: '72%', color: 'bg-brand-gold' },
                    { label: 'Partner Organizations', pct: '60%', color: 'bg-brand-navy' },
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-brand-navy">
                        <span>{label}</span><span>{pct}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: pct }} />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-content-secondary italic">
                  "85% Growth in Youth Research Since YRIF Inception"
                </p>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-6 glass bg-white rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center">
                  <Users size={14} className="text-brand-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-navy">30+ Partners</p>
                  <p className="text-[10px] text-content-secondary">Nationwide network</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
