import { useState } from 'react'
import { Heart, RefreshCw, CheckCircle, Lock, Building2, Gift, CreditCard, ChevronRight } from 'lucide-react'
import { publicApi } from '@/api/public'

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000]

const IMPACT = [
  { amount: 5000, label: 'Provides study materials for 1 student' },
  { amount: 10000, label: 'Funds a youth research workshop' },
  { amount: 25000, label: 'Sponsors a competition prize' },
  { amount: 50000, label: 'Supports a full mentorship cohort' },
]

export default function Donations() {
  const [amount, setAmount] = useState<number | ''>(10000)
  const [custom, setCustom] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const finalAmount = custom ? Number(custom) : (amount as number)
  const impact = IMPACT.slice().reverse().find((i) => finalAmount >= i.amount)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !finalAmount) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      await publicApi.submitDonation({ name, email, amount: finalAmount, recurring })
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-cream pt-16">
      {/* Hero */}
      <div className="bg-brand-navy text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
            <Heart size={13} /> Support YRIF
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Invest in Tanzania's Future
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Your donation directly empowers young Tanzanian researchers and innovators.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Impact panel */}
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-brand-navy">Your Impact</h2>
            <div className="space-y-4">
              {IMPACT.map(({ amount: a, label }) => (
                <div
                  key={a}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    finalAmount >= a
                      ? 'border-brand-teal bg-brand-teal/5'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    finalAmount >= a ? 'bg-brand-teal text-white' : 'bg-gray-100 text-content-secondary'
                  }`}>
                    <Heart size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-navy text-sm">
                      TZS {a.toLocaleString()}
                    </p>
                    <p className="text-xs text-content-secondary mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            {impact && (
              <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-xl p-4 text-sm text-brand-teal font-medium">
                ✓ Your donation of TZS {finalAmount.toLocaleString()} will: {impact.label.toLowerCase()}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="glass-card bg-white rounded-2xl p-8">
            {success ? (
              <div className="flex flex-col items-center text-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-brand-teal/10 flex items-center justify-center">
                  <CheckCircle size={32} className="text-brand-teal" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-navy">Thank You!</h3>
                <p className="text-content-secondary text-sm">
                  We've received your donation pledge. Our team will be in touch with payment details.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                {/* Preset amounts */}
                <div>
                  <label className="block text-xs font-semibold text-brand-navy mb-2">
                    Select Amount (TZS)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => { setAmount(a); setCustom('') }}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                          amount === a && !custom
                            ? 'bg-brand-navy text-white border-brand-navy'
                            : 'bg-white text-brand-navy border-gray-200 hover:border-brand-navy'
                        }`}
                      >
                        {a.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={custom}
                    onChange={(e) => { setCustom(e.target.value); setAmount('') }}
                    placeholder="Or enter custom amount"
                    min={1000}
                    className="mt-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
                  />
                </div>

                {/* Recurring toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setRecurring(!recurring)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${recurring ? 'bg-brand-teal' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${recurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-content-secondary">
                    <RefreshCw size={14} className={recurring ? 'text-brand-teal' : ''} />
                    Make this a monthly recurring donation
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-brand-navy mb-2">
                    Preferred Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 p-2.5 border-2 border-brand-teal bg-brand-teal/5 rounded-lg transition-all font-semibold text-sm"
                    >
                      <CreditCard size={14} /> Bank Card
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex items-center justify-center gap-2 p-2.5 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed text-xs"
                    >
                      Mobile Money
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-navy text-white font-semibold py-3 rounded-xl hover:bg-brand-teal transition-colors disabled:opacity-60"
                >
                  {loading ? 'Processing…' : <><Heart size={16} /> Donate TZS {finalAmount ? finalAmount.toLocaleString() : '—'}</>}
                </button>

                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Lock size={12} /> Secure payment processing
                </div>

                <p className="text-xs text-center text-content-secondary">
                  We'll contact you with payment instructions after submission.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Additional sections */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Corporate Partnerships */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <h3 className="font-display text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-brand-navy" />
              Corporate Partnerships
            </h3>
            <p className="text-content-secondary text-sm mb-4">
              Looking to align your company with youth empowerment and national development? We offer tailored partnership packages for corporate sponsors.
            </p>
            <a
              href="mailto:partners@yrif.org"
              className="text-brand-teal font-semibold text-sm hover:text-brand-navy transition-colors flex items-center gap-1"
            >
              Contact our partnerships team <ChevronRight size={14} />
            </a>
          </div>

          {/* Other Ways to Give */}
          <div className="bg-gradient-cream rounded-2xl p-8 shadow-sm">
            <h3 className="font-display text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
              <Gift size={20} className="text-brand-gold" />
              Other Ways to Give
            </h3>
            <p className="text-content-secondary text-sm mb-3">
              We also accept donations via:
            </p>
            <ul className="text-sm text-content-secondary space-y-2">
              <li>• Bank transfer</li>
              <li>• Mobile money (M-Pesa, Tigo Pesa, Airtel Money)</li>
              <li>• In-kind donations (equipment, books, software)</li>
              <li>• Honorary gifts & endowments</li>
            </ul>
            <a
              href="mailto:donate@yrif.org"
              className="text-brand-teal font-semibold text-sm hover:text-brand-navy transition-colors flex items-center gap-1 mt-4"
            >
              Get in touch for details <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
