import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Cloud,
  Cpu,
  FileCheck,
  FlaskConical,
  Lightbulb,
  Palette,
  RefreshCw,
  Rocket,
  Search,
  Upload,
  Users,
  Zap,
} from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'

const CATEGORIES = [
  {
    icon: FlaskConical,
    title: 'Natural Sciences',
    body: 'One of three official categories for the Annual National Research Competition and Awards — covering scientific inquiry that advances understanding of the natural world and applied science challenges relevant to Tanzania.',
  },
  {
    icon: Users,
    title: 'Social Sciences',
    body: 'Research on society, education, livelihoods, governance, and community development — connecting youth inquiry to evidence-based solutions for social and economic challenges.',
  },
  {
    icon: Palette,
    title: 'Arts & Humanities',
    body: 'Creative and cultural research that expands how young Tanzanians contribute to knowledge, expression, and national identity through rigorous scholarly work.',
  },
]

const FOURTH_IR = [
  {
    icon: Cloud,
    title: 'Cloud Technology & Connectivity',
  },
  {
    icon: Cpu,
    title: 'Artificial Intelligence & Machine Learning',
  },
  {
    icon: Zap,
    title: 'Human-Machine Interaction',
  },
  {
    icon: Rocket,
    title: 'Advanced Engineering & Clean Energy',
  },
]

const INNOVATION_CYCLE = [
  {
    step: '01',
    title: 'Insights',
    body: 'Understanding the real needs, challenges, and context behind a research question before any solution is proposed.',
  },
  {
    step: '02',
    title: 'Ideation',
    body: 'Generating creative, evidence-informed ideas and hypotheses in response to the insights gathered.',
  },
  {
    step: '03',
    title: 'Investigation',
    body: 'Rigorous research and inquiry to test, validate, or refine the ideas generated.',
  },
  {
    step: '04',
    title: 'Implementation',
    body: 'Translating validated research findings into practical application and real-world impact.',
  },
  {
    step: '05',
    title: 'Iteration',
    body: 'Continuously revisiting and refining outcomes based on new evidence, feedback, and changing context.',
  },
]

const PUBLICATION = [
  {
    icon: BookOpen,
    title: 'Open-access youth research journal',
    body: 'A credible publication pathway for young researchers — the longer-term launch of the YRIF Journal is part of the Year 2+ roadmap.',
  },
  {
    icon: Search,
    title: 'Digital research repository',
    body: 'A national data hub for youth-generated research, accessible through the YRIF platform.',
  },
  {
    icon: Lightbulb,
    title: 'Fee-based research support services',
    body: 'Proofreading, coaching, and research assistance to help young researchers strengthen their work before and after submission.',
  },
]

const PLATFORM_STEPS = [
  {
    icon: Upload,
    step: '01',
    title: 'Submit',
    body: 'Register, complete your profile, and submit research with title, abstract, research area, and document through the platform.',
  },
  {
    icon: FileCheck,
    step: '02',
    title: 'Peer review',
    body: 'Assigned reviewers assess quality and relevance. You receive feedback as your work moves through the review workflow.',
  },
  {
    icon: BookOpen,
    step: '03',
    title: 'Publish',
    body: 'Approved work appears in the research repository for members to read, cite, and build on — with pathways toward journal recognition.',
  },
  {
    icon: RefreshCw,
    step: '04',
    title: 'Engage',
    body: 'Join open projects, find mentors, attend seminars and competitions, and continue refining your work through the Innovation Cycle.',
  },
]

export default function OurResearch() {
  usePageTitle('Research')

  return (
    <div className="min-h-screen bg-gradient-cream pt-16">
      <div className="bg-brand-navy text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
            <BookOpen size={13} /> Research at YRIF
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Our Research
          </h1>
          <p className="text-white/70 text-lg max-w-3xl mx-auto">
            Engaging and nurturing youth potential by addressing national and global challenges
            through research-based, innovative solutions — with a peer-reviewed pathway from
            insight to publication.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Research categories */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">
              Research Categories
            </h2>
            <p className="text-content-secondary max-w-2xl mx-auto">
              The Annual National Research Competition and Awards is structured around three
              official categories.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-brand-navy/5 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-brand-teal" />
                </div>
                <h3 className="font-semibold text-brand-navy mb-2">{title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4IR focus */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-4">
            Impact Focus: The 4th Industrial Revolution
          </h2>
          <p className="text-content-secondary leading-relaxed mb-6 max-w-3xl">
            In shaping its research and innovation priorities, YRIF orients youth talent toward the
            technological domains most likely to define Tanzania&apos;s and the world&apos;s next
            stage of development. By anchoring youth research training in these frontier domains
            alongside foundational disciplines in the Natural Sciences, Social Sciences, and Arts
            &amp; Humanities, YRIF ensures beneficiaries are equipped to contribute to both
            immediate local development needs and longer-term technological transformation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FOURTH_IR.map(({ icon: Icon, title }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gradient-cream px-4 py-3"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-navy/5 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-brand-teal" />
                </div>
                <span className="text-sm font-medium text-brand-navy">{title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Innovation Cycle */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">
              Our Approach: The Innovation Cycle
            </h2>
            <p className="text-content-secondary max-w-3xl mx-auto">
              YRIF guides every youth-led research and innovation initiative through five deliberate
              stages, ensuring that ideas are grounded in evidence and refined through continuous
              learning. This cycle underpins YRIF&apos;s training curricula, research mentorship,
              and evaluation criteria for the Annual National Research Competition.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {INNOVATION_CYCLE.map(({ step, title, body }) => (
              <div key={step} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <span className="text-xs font-bold text-brand-gold">{step}</span>
                <h3 className="font-semibold text-brand-navy mt-2 mb-2">{title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Competition process */}
        <section className="bg-brand-navy rounded-2xl p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
              Annual National Research Competition
            </h2>
            <p className="text-white/70 leading-relaxed mb-8 max-w-3xl">
              A flagship pathway for recognition: youth submit research in one of the three
              categories; work is evaluated; and awardees are celebrated at a ceremony with
              publication in the YRIF Journal and national recognition.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['Submission', 'Evaluation', 'Award Ceremony'].map((stage, i) => (
                <div
                  key={stage}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center"
                >
                  <p className="text-brand-gold text-xs font-bold mb-1">Step {i + 1}</p>
                  <p className="font-semibold">{stage}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Journal & hub */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">
              Publication Journal and Data Hub
            </h2>
            <p className="text-content-secondary max-w-2xl mx-auto">
              A credible pathway from youth research to open knowledge and national visibility.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PUBLICATION.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-brand-navy/5 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-brand-teal" />
                </div>
                <h3 className="font-semibold text-brand-navy mb-2">{title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Platform pathway */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">
              How the Platform Works
            </h2>
            <p className="text-content-secondary max-w-2xl mx-auto">
              From first submission to publication and ongoing engagement on yriftz.org.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_STEPS.map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-brand-navy/5 flex items-center justify-center">
                    <Icon size={22} className="text-brand-teal" />
                  </div>
                  <span className="text-xs font-bold text-brand-gold">{step}</span>
                </div>
                <h3 className="font-semibold text-brand-navy mb-2">{title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Eligibility */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-4">
            Eligibility &amp; Membership
          </h2>
          <p className="text-content-secondary leading-relaxed mb-4">
            Membership is voluntary and open to any Tanzanian who has attained the age of 18 years
            and above, of sound mind, and who is ready to join hands in supporting and promoting the
            vision, mission, and objectives of the Organization. Members pay entry and annual fees
            as prescribed by the General Meeting.
          </p>
          <p className="text-content-secondary leading-relaxed mb-6">
            Secondary school students in Form V–VI take part through YRIF High School Research Clubs
            as program participants, building research culture before formal membership age.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-brand-navy text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-teal transition-colors text-sm"
            >
              Join and submit research <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 border border-brand-navy/20 text-brand-navy px-6 py-3 rounded-xl font-semibold hover:border-brand-teal hover:text-brand-teal transition-colors text-sm"
            >
              Sign in to the repository
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 border border-brand-navy/20 text-brand-navy px-6 py-3 rounded-xl font-semibold hover:border-brand-teal hover:text-brand-teal transition-colors text-sm"
            >
              About YRIF
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
