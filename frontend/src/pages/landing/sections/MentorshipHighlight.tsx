import { Link } from 'react-router-dom'
import { Users, GraduationCap } from 'lucide-react'

export default function MentorshipHighlight() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-navy to-brand-teal rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
              <Users size={13} /> Mentorship Programme
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Grow With a Mentor Who's Been There
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
              Connect with experienced researchers, academics, and industry professionals who will
              guide your journey from idea to impact.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-brand-navy font-bold px-8 py-3.5 rounded-xl hover:bg-brand-gold hover:text-white transition-colors text-sm shadow-lg"
              >
                <GraduationCap size={18} /> Request Mentorship
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                <Users size={18} /> Become a Mentor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
