import { Link } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-24 bg-brand-navy relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <div className="inline-block text-xs font-semibold text-brand-gold bg-brand-gold/20 px-3 py-1.5 rounded-full border border-brand-gold/30">
          Get Started Today
        </div>

        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
          Ready to Start Your{' '}
          <span className="text-brand-gold">Research Journey?</span>
        </h2>

        <p className="text-white/70 text-lg leading-relaxed">
          Join thousands of young Tanzanian innovators who are shaping the future through research,
          collaboration, and innovation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy font-bold px-8 py-3.5 rounded-xl hover:bg-yellow-400 transition-colors text-sm"
          >
            Join YRIF <ArrowRight size={16} />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm"
          >
            <Mail size={16} /> Contact Us
          </Link>
        </div>

        <p className="text-xs text-white/40">
          Free to join · Peer-reviewed platform · Open to all Tanzanian youth
        </p>
      </div>
    </section>
  )
}
