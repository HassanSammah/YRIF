import { useState } from 'react'
import { CheckCircle, Send } from 'lucide-react'
import { communicationsApi } from '@/api/communications'

const ROLES = [
  'Youth Researcher',
  'Mentor',
  'Industry Partner',
  'Academic / Educator',
  'Government / Policy',
  'Other',
]

export default function FeedbackSection() {
  const [form, setForm] = useState({ name: '', email: '', role: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      await communicationsApi.submitContact({
        name: form.name,
        email: form.email,
        subject: form.role || 'General Feedback',
        message: form.message,
      })
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl">
          {/* Left — branding */}
          <div className="bg-brand-navy p-10 md:p-14 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-block text-xs font-semibold text-brand-gold bg-brand-gold/20 px-3 py-1.5 rounded-full mb-6">
                Get in Touch
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                Share Your Thoughts With Us
              </h2>
              <p className="text-white/70 leading-relaxed">
                Your feedback helps us improve YRIF for every young researcher in Tanzania. We read
                every message and respond within 48 hours.
              </p>
            </div>
            <div className="relative mt-10 space-y-4">
              {[
                'Platform feedback & suggestions',
                'Partnership enquiries',
                'Research collaboration requests',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-white/70 text-sm">
                  <CheckCircle size={15} className="text-brand-teal flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white p-10 md:p-14">
            {success ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-brand-teal/10 flex items-center justify-center">
                  <CheckCircle size={32} className="text-brand-teal" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-navy">Message Sent!</h3>
                <p className="text-content-secondary text-sm">
                  Thank you for reaching out. We'll get back to you within 48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      placeholder="you@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-navy mb-1.5">Your Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={onChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition bg-white"
                  >
                    <option value="">Select your role (optional)</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={onChange}
                    rows={5}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition resize-none"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-navy text-white font-semibold py-3 rounded-xl hover:bg-brand-teal transition-colors disabled:opacity-60"
                >
                  {loading ? 'Sending…' : <><Send size={16} /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
