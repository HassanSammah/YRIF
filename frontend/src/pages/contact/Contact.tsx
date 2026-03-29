import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Phone, MapPin, CheckCircle, Send } from 'lucide-react'
import { communicationsApi } from '@/api/communications'
import { Field, inputCls, PrimaryButton, FormError } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'

interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

export default function Contact() {
  usePageTitle('Contact')
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>()

  const onSubmit = async (data: ContactForm) => {
    setSubmitting(true)
    setError('')
    try {
      await communicationsApi.submitContact(data)
      setSubmittedEmail(data.email)
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
          <div className="bg-teal-50 rounded-2xl p-4">
            <p className="text-sm font-semibold text-[#093344] mb-1">Looking for quick answers?</p>
            <p className="text-xs text-[#0D9488]">
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
                at <strong>{submittedEmail}</strong> within 2–3 business days.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm text-[#0D9488] hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="name" label="Full Name" required error={errors.name?.message}>
                    <input
                      id="name"
                      {...register('name', { required: 'Name is required' })}
                      placeholder="Your full name"
                      className={inputCls(!!errors.name)}
                    />
                  </Field>
                  <Field id="email" label="Email Address" required error={errors.email?.message}>
                    <input
                      id="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                      })}
                      type="email"
                      placeholder="you@example.com"
                      className={inputCls(!!errors.email)}
                    />
                  </Field>
                </div>

                <Field id="subject" label="Subject" required error={errors.subject?.message}>
                  <input
                    id="subject"
                    {...register('subject', { required: 'Subject is required' })}
                    placeholder="What is your message about?"
                    className={inputCls(!!errors.subject)}
                  />
                </Field>

                <Field id="message" label="Message" required error={errors.message?.message}>
                  <textarea
                    id="message"
                    {...register('message', {
                      required: 'Message is required',
                      minLength: { value: 20, message: 'Please write at least 20 characters' },
                    })}
                    rows={5}
                    placeholder="Tell us more about your inquiry…"
                    className={inputCls(!!errors.message, 'resize-none')}
                  />
                </Field>

                {error && <FormError message={error} />}

                <div className="flex justify-end">
                  <PrimaryButton
                    type="submit"
                    disabled={submitting}
                    loading={submitting}
                    className="px-6"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </PrimaryButton>
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
      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#0D9488]" />
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
