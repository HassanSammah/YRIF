import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Phone, MapPin, CheckCircle, Loader2, Send } from 'lucide-react'
import { communicationsApi } from '@/api/communications'

interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>()

  const onSubmit = async (data: ContactForm) => {
    setSubmitting(true)
    setError('')
    try {
      await communicationsApi.submitContact(data)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again or email us directly at info@yriftz.org.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          Have a question, suggestion, or partnership inquiry? We'd love to hear from you.
          Our team typically responds within 2–3 business days.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
              Get in Touch
            </h2>
            <div className="space-y-4">
              <ContactInfo
                icon={Mail}
                label="Email"
                value="info@yriftz.org"
                href="mailto:info@yriftz.org"
              />
              <ContactInfo
                icon={Phone}
                label="Phone"
                value="+255 (0) 000 000 000"
              />
              <ContactInfo
                icon={MapPin}
                label="Location"
                value="Dar es Salaam, Tanzania"
              />
            </div>
          </div>

          {/* FAQs teaser */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Looking for quick answers?</p>
            <p className="text-xs text-blue-600">
              Try our FAQ section or use the YRIF Chat widget (bottom-right corner) for instant help.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Thank you for reaching out. We've received your message and will get back to you
                at <strong>{}</strong> within 2–3 business days.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm text-blue-600 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      placeholder="Your full name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                      })}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('subject', { required: 'Subject is required' })}
                    placeholder="What is your message about?"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('message', {
                      required: 'Message is required',
                      minLength: { value: 20, message: 'Please write at least 20 characters' },
                    })}
                    rows={5}
                    placeholder="Tell us more about your inquiry…"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactInfo({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<any>
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
  return href ? (
    <a href={href} className="hover:opacity-80 transition-opacity">{inner}</a>
  ) : (
    <div>{inner}</div>
  )
}
