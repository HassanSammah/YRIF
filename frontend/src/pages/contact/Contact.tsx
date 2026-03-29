import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Phone, MapPin, CheckCircle, Send, ChevronDown, MessageCircle } from 'lucide-react'
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
    /* pt-16 offsets the fixed 64px public navbar */
    <div className="max-w-5xl mx-auto px-4 pt-20 pb-16">
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

          {/* Chat teaser */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-4 border border-teal-100">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-[#0D9488]" />
              <p className="text-sm font-semibold text-[#093344]">Need instant help?</p>
            </div>
            <p className="text-xs text-[#0D9488] leading-relaxed">
              Use the <strong>YRIF Chat</strong> widget in the bottom-right corner for
              immediate AI-powered answers about the platform.
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

      {/* ── FAQ Section ──────────────────────────────────────────────────────── */}
      <div className="mt-20">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] text-xs font-semibold uppercase tracking-wider mb-3">
            FAQ
          </span>
          <h2 className="text-2xl font-bold text-[#093344]">Frequently Asked Questions</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-lg mx-auto">
            Quick answers to the most common questions about YRIF and the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        <p className="text-center text-sm text-gray-400 mt-8">
          Didn't find your answer?{' '}
          <a href="mailto:info@yriftz.org" className="text-[#0D9488] font-medium hover:underline">
            Email us directly
          </a>{' '}
          or use the YRIF Chat widget.
        </p>
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
        'w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden',
        open
          ? 'border-[#0D9488]/30 bg-teal-50/60 shadow-sm'
          : 'border-gray-100 bg-white hover:border-teal-200 hover:shadow-sm',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#093344]/8 flex items-center justify-center text-[10px] font-bold text-[#093344] mt-0.5">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-[#093344] leading-snug">{question}</span>
        </div>
        <ChevronDown
          className={`flex-shrink-0 w-4 h-4 text-[#0D9488] transition-transform duration-200 mt-0.5 ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <div className="px-5 pb-4">
          <div className="ml-9 text-sm text-gray-600 leading-relaxed border-t border-teal-100 pt-3">
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
