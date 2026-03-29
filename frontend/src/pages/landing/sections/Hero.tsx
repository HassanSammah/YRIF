import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-cream pt-16">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-navy/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 fade-in-up">
          <TrendingUp size={14} className="text-brand-teal" />
          <span className="text-sm font-medium text-brand-navy">85% Growth in Youth Research</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-brand-navy leading-tight mb-6 fade-in-up">
          Empowering Youth Through{' '}
          <span className="text-gradient">Research & Innovation</span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-content-secondary leading-relaxed mb-10 fade-in-up">
          Tanzania's national digital platform connecting young researchers with mentors,
          opportunities, and resources to drive national development.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-in-up">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-brand-navy text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-teal transition-colors shadow-lg shadow-brand-navy/20"
          >
            Join YRIF <ArrowRight size={18} />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-brand-navy px-8 py-3.5 rounded-xl font-semibold border border-brand-navy/20 hover:border-brand-teal hover:text-brand-teal transition-colors"
          >
            Explore Research
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto fade-in-up">
          {[
            { value: '5,000+', label: 'Youth Members' },
            { value: '120+', label: 'Research Papers' },
            { value: '50+', label: 'Events Hosted' },
            { value: '30+', label: 'Partner Orgs' },
          ].map(({ value, label }) => (
            <div key={label} className="glass rounded-2xl p-4">
              <p className="font-display text-2xl font-bold text-brand-navy">{value}</p>
              <p className="text-xs text-content-secondary mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
