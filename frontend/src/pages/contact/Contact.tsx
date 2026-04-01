import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Phone, MapPin, CheckCircle, Send, ChevronDown, MessageCircle, MessageSquare } from 'lucide-react'
import { communicationsApi } from '@/api/communications'
import { Field, inputCls, PrimaryButton, FormError } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'

interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

const FAQS = [
  {
    q: 'Is YRIF free to join?',
    a: 'Yes, completely free. There are no fees for registration, research submission, or event attendance.',
  },
  {
    q: 'Who can join YRIF?',
    a: 'Anyone passionate about research and innovation — secondary school students, university students, researchers, mentors, and private sector partners. We welcome all ages.',
  },
  {
    q: 'How long does account approval take?',
    a: 'Usually 1–2 business days. Our team reviews every new account to ensure community safety. If it has been more than 3 days, please email info@yriftz.org.',
  },
  {
    q: 'How do I submit my research?',
    a: 'Log in → Dashboard → Research → Submit Research. Fill in the title, abstract, research area, and upload your document. You will receive an email once reviewed (usually 3–7 business days).',
  },
  {
    q: 'How do I find a mentor?',
    a: 'Go to Dashboard → Mentorship → Browse Mentors. Filter by subject area or expertise, then send a mentorship request with your topic. The mentor will accept and a private conversation opens.',
  },
  {
    q: 'What login methods does YRIF support?',
    a: 'Three methods: Email + password, Google (Gmail), and BRIQ Auth (Tanzanian phone number + SMS OTP). All lead to the same account.',
  },
  {
    q: 'Can I participate in events without publishing research?',
    a: 'Yes. Events, competitions, and workshops are open to all active members regardless of whether you have submitted research.',
  },
  {
    q: 'How do I get my certificate?',
    a: 'Certificates are issued after attending events or winning competitions. View and download them at Dashboard → My Certificates.',
  },
]

export default function Contact() {
  usePageTitle('Contact')
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
    <div className="min-h-screen bg-gradient-cream pt-16">
      {/* Hero */}
      <div className="bg-brand-navy text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-teal/20 text-brand-teal px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
            <MessageSquare size={13} /> Get in Touch
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Contact Us
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Have a question, suggestion, or partnership inquiry? We'd love to hear from you. Our team typically responds within 2–3 business days.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="space-y-6">
          <div className="glass-card bg-white rounded-2xl p-6">
            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-wide mb-6">
              Direct Contact
            </h2>
            <div className="space-y-5">
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

          {/* Chat teaser */}
          <div className="glass-card bg-gradient-to-br from-brand-teal/10 to-brand-navy/5 rounded-2xl p-6 border border-brand-teal/20">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-navy mb-1">Quick Support?</p>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Use the <strong>YRIF Chat</strong> widget for instant AI answers about the platform available 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center py-16 glass-card bg-white rounded-2xl p-8">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-2">Message Sent!</h3>
              <p className="text-sm text-content-secondary max-w-sm mb-6">
                Thank you for reaching out. We've received your message and will get back to you
                at <strong>{submittedEmail}</strong> within 2–3 business days.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-sm font-medium text-brand-teal hover:text-brand-navy transition-colors"
              >
                Send another message →
              </button>
            </div>
          ) : (
            <div className="glass-card bg-white rounded-2xl p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

                <div className="flex justify-end pt-2">
                  <PrimaryButton
                    type="submit"
                    disabled={submitting}
                    loading={submitting}
                    className="px-8"
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

        {/* ── FAQ Section ──────────────────────────────────────────────────────── */}
        <div className="mt-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-brand-teal/10 text-brand-teal px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              <ChevronDown size={13} /> FAQ
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mb-3">Frequently Asked Questions</h2>
            <p className="text-content-secondary text-lg max-w-2xl mx-auto">
              Quick answers to the most common questions about YRIF and how to use the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {FAQS.map((faq, i) => (
              <FaqItem
                key={i}
                index={i}
                question={faq.q}
                answer={faq.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>

          <p className="text-center text-sm text-content-secondary mt-10">
            Didn't find your answer?{' '}
            <a href="mailto:info@yriftz.org" className="text-brand-teal font-semibold hover:underline">
              Email us directly
            </a>{' '}
            or use the YRIF Chat widget.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function FaqItem({
  index,
  question,
  answer,
  open,
  onToggle,
}: {
  index: number
  question: string
  answer: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'w-full text-left glass-card rounded-2xl border transition-all duration-200 overflow-hidden',
        open
          ? 'border-brand-teal/30 bg-brand-teal/5 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-navy/10 flex items-center justify-center text-xs font-bold text-brand-navy mt-0.5">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-brand-navy leading-snug">{question}</span>
        </div>
        <ChevronDown
          className={`flex-shrink-0 w-5 h-5 text-brand-teal transition-transform duration-300 mt-0.5 ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <div className="px-6 pb-5 border-t border-brand-teal/10">
          <div className="ml-9 text-sm text-content-secondary leading-relaxed pt-4">
            {answer}
          </div>
        </div>
      )}
    </button>
  )
}

function ContactInfo({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-brand-teal" />
      </div>
      <div>
        <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-brand-navy">{value}</p>
      </div>
    </div>
  )
  return href ? (
    <a href={href} className="hover:opacity-80 transition-opacity">{inner}</a>
  ) : (
    <div>{inner}</div>
  )
}
