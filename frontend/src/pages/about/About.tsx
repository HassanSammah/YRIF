import { Link } from 'react-router-dom'
import {
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Cpu,
  Database,
  Factory,
  GraduationCap,
  Handshake,
  Lightbulb,
  Linkedin,
  Network,
  Presentation,
  Scale,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import researchMeetingImage from '@/assets/images/research_meeting.png'

const CORE_VALUES = [
  {
    icon: Shield,
    title: 'Integrity',
    body: 'Upholding honesty and accountability in research conduct.',
  },
  {
    icon: Scale,
    title: 'Adherence',
    body: 'Commitment to research ethics and legal standards.',
  },
  {
    icon: Award,
    title: 'Professionalism',
    body: 'Maintaining high academic and operational standards.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    body: 'Promoting creativity and the adoption of modern technology.',
  },
]

const OBJECTIVE_GROUPS = [
  {
    label: 'Youth & capacity',
    items: [
      {
        n: '01',
        icon: Users,
        kicker: 'Participation',
        text: 'Increase youth participation in academic and non-academic research',
      },
      {
        n: '02',
        icon: GraduationCap,
        kicker: 'Capacity',
        text: 'Build research capacity through structured training and mentorship',
      },
      {
        n: '03',
        icon: Network,
        kicker: 'Networks',
        text: 'Establish and strengthen national youth research networks',
      },
      {
        n: '04',
        icon: Presentation,
        kicker: 'Training',
        text: 'Deliver seminars, training, and scientific writing programs',
      },
    ],
  },
  {
    label: 'Recognition & application',
    items: [
      {
        n: '05',
        icon: Trophy,
        kicker: 'Grants & competitions',
        text: 'Coordinate research grants, projects, and innovation competitions',
      },
      {
        n: '06',
        icon: Award,
        kicker: 'Awards',
        text: 'Introduce annual Youth Research & Innovation Awards',
      },
      {
        n: '07',
        icon: Factory,
        kicker: 'Industry',
        text: 'Connect research outputs to industrial and market needs',
      },
    ],
  },
  {
    label: 'Knowledge & partnerships',
    items: [
      {
        n: '08',
        icon: Database,
        kicker: 'Journal & data hub',
        text: 'Develop an online research data hub and a youth research journal',
      },
      {
        n: '09',
        icon: Handshake,
        kicker: 'Partnerships',
        text: 'Foster partnerships with local and international research institutions',
      },
      {
        n: '10',
        icon: Cpu,
        kicker: 'Digital literacy & AI',
        text: 'Promote digital literacy and the integration of AI in research',
      },
    ],
  },
]

const ECOSYSTEM = [
  {
    icon: GraduationCap,
    title: 'Students / Youth',
    body: 'The primary beneficiaries — university students and secondary-school learners engaged in research training, mentorship, and competitions.',
  },
  {
    icon: Building2,
    title: 'Institutions',
    body: 'Universities, secondary schools, and government agencies that provide access, endorsement, and structural support.',
  },
  {
    icon: Users,
    title: 'Partners',
    body: 'National and international organizations providing funding, technical collaboration, and strategic alignment.',
  },
  {
    icon: Sparkles,
    title: 'Experts',
    body: 'Academic and industry professionals serving as mentors, judges, and technical advisors across YRIF programs.',
  },
]

const OFFICE_BEARERS = [
  { name: 'Kenneth P. Katho', position: 'Chairperson', phone: '+255 716 713 332' },
  { name: 'Shesaa S. Chamshama', position: 'Executive Secretary', phone: '+255 714 260 807' },
  { name: 'Victor J. Nchimbi', position: 'Treasurer', phone: '+255 769 210 323' },
]

const FOUNDER_MEMBERS = [
  {
    name: 'Kenneth P. Katho',
    position: 'Chairperson',
    initials: 'KK',
    featured: true,
  },
  {
    name: 'Shesaa S. Chamshama',
    position: 'Executive Secretary',
    initials: 'SC',
    featured: true,
  },
  {
    name: 'Victor J. Nchimbi',
    position: 'Treasurer',
    initials: 'VN',
    featured: true,
  },
  {
    name: 'Riziki S. Chamshama',
    position: 'Founder Member',
    initials: 'RC',
    featured: false,
    linkedin: 'https://www.linkedin.com/in/riziki-chamshama-34571b1b2',
  },
  {
    name: 'Jesca J. Nchimbi',
    position: 'Founder Member',
    initials: 'JN',
    featured: false,
  },
  {
    name: 'Rosemary A. Ikula',
    position: 'Founder Member',
    initials: 'RI',
    featured: false,
  },
]

const DEPARTMENTS = [
  'Programs & Training',
  'ICT & Digital Platforms',
  'Finance & Administration',
  'Communications & Partnerships',
]

const YEAR_ONE_TARGETS = [
  { value: '3,000+', label: 'Active youth members (Year 1 target)' },
  { value: '20', label: 'Universities engaged (Year 1 target)' },
  { value: '30', label: 'High schools engaged (Year 1 target)' },
  { value: '3', label: 'Research categories' },
]

export default function About() {
  usePageTitle('About Us')

  return (
    <div className="min-h-screen bg-gradient-cream pt-16">
      <div className="bg-brand-navy text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-teal/20 text-brand-teal px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
            Bridging Knowledge and Experience
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            About YRIF
          </h1>
          <p className="text-white/70 text-lg max-w-3xl mx-auto">
            Youth Research & Innovation Foundation — a registered non-governmental organization
            empowering young Tanzanians through research, innovation, and knowledge-driven solutions.
          </p>
          <p className="mt-4 text-sm text-white/50">
            Reg. No. 00NGO/R/10110 · Certificate No. 10110 · Issued 07 August 2026
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Who we are */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <div className="inline-block text-xs font-semibold text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-full border border-brand-teal/20">
              Who We Are
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy leading-tight">
              Building a generation of youth researchers and innovators
            </h2>
            <p className="text-content-secondary leading-relaxed">
              The Youth Research & Innovation Foundation (YRIF) is a non-governmental organization
              platform created to empower young Tanzanians through research, innovation, and
              knowledge-driven solutions. YRIF bridges the gap between academic learning and
              real-world challenges by nurturing youth talent in universities and schools.
            </p>
            <p className="text-content-secondary leading-relaxed">
              Through mentorship, training, publications, and innovation programs, YRIF is building
              a new generation of researchers and innovators who can contribute to Tanzania&apos;s
              sustainable development and future transformation.
            </p>
            <p className="text-content-secondary leading-relaxed">
              YRIF is formally registered as a Non-Governmental Organization under the
              Non-Governmental Organizations Act of the United Republic of Tanzania
              (Registration No. <strong className="text-brand-navy">00NGO/R/10110</strong>,
              Certificate No. <strong className="text-brand-navy">10110</strong>, issued
              07 August 2026), authorized to operate across Tanzania Mainland in accordance with
              its governing Constitution. The organization operates at national level and may
              extend its activities to other countries subject to applicable laws.
            </p>
            <p className="text-sm font-medium text-brand-navy italic">
              &ldquo;Enriching Youth with Research Development&rdquo;
            </p>
          </div>
          <img
            src={researchMeetingImage}
            alt="YRIF researchers collaborating"
            className="rounded-2xl shadow-xl w-full object-cover"
          />
        </section>

        {/* Why we exist */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-10">
          <div className="inline-block text-xs font-semibold text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-full border border-brand-teal/20 mb-4">
            Why YRIF Exists
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-4">
            Closing the youth research gap
          </h2>
          <p className="text-content-secondary leading-relaxed mb-4">
            YRIF was established to address the limited participation of Tanzanian youth in research,
            innovation, and knowledge production, despite their significant potential to contribute
            to national development. Many young people face challenges including inadequate
            mentorship, limited access to research funding, weak linkages between academia and
            industry, and low exposure to publication platforms.
          </p>
          <p className="text-content-secondary leading-relaxed">
            YRIF is therefore formed to promote youth engagement in research and innovation,
            strengthen research culture, encourage evidence-based solutions to social and economic
            challenges, and contribute to sustainable development, technological advancement, good
            governance, and economic transformation in Tanzania.
          </p>
        </section>

        {/* Vision, Mission, Values */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">
              Vision, Mission &amp; Core Values
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-brand-navy text-white rounded-2xl p-8">
              <div className="flex items-center gap-2 text-brand-gold text-xs font-semibold uppercase tracking-wide mb-3">
                <Target size={14} /> Vision
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold leading-snug">
                To become a global centre of excellence in youth-driven research and innovation.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-2 text-brand-teal text-xs font-semibold uppercase tracking-wide mb-3">
                <BookOpen size={14} /> Mission
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold text-brand-navy leading-snug">
                To engage and nurture youth potential by addressing national and global challenges
                through research-based, innovative solutions.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_VALUES.map(({ icon: Icon, title, body }) => (
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

        {/* Objectives */}
        <section>
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal mb-3">
              Constitution · Article 9
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-navy mb-3">
              Our Objectives
            </h2>
            <p className="text-content-secondary">
              Ten aims, in the order set out in the Constitution of the Youth Research &amp; Innovation Foundation.
            </p>
          </div>

          <div className="space-y-10">
            {OBJECTIVE_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-px flex-1 max-w-[2rem] bg-brand-gold" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy">
                    {group.label}
                  </h3>
                  <span className="h-px flex-1 bg-brand-navy/10" />
                </div>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                    group.items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                  }`}
                >
                  {group.items.map(({ n, icon: Icon, kicker, text }) => (
                    <article
                      key={n}
                      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
                    >
                      <span
                        className="absolute -right-1 -top-3 font-display text-6xl font-bold text-brand-navy/[0.06] group-hover:text-brand-teal/10 transition-colors select-none"
                        aria-hidden
                      >
                        {n}
                      </span>
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-brand-navy text-brand-gold flex items-center justify-center mb-4">
                          <Icon size={18} />
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal mb-1.5">
                          {kicker}
                        </p>
                        <p className="text-sm font-medium text-brand-navy leading-relaxed">{text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-content-secondary">
            Programs, the Innovation Cycle, and the publication pathway are on the{' '}
            <Link to="/our-research" className="font-semibold text-brand-teal hover:underline">
              research page
            </Link>
            .
          </p>
        </section>

        {/* Ecosystem */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">
              Who We Serve: Our Ecosystem
            </h2>
            <p className="text-content-secondary max-w-2xl mx-auto">
              YRIF operates at the centre of a four-part ecosystem, coordinating between the people
              it directly serves and the institutions that make impact possible.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {ECOSYSTEM.map(({ icon: Icon, title, body }) => (
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

        {/* Year 1 targets — clearly labelled as targets */}
        <section className="bg-brand-navy rounded-2xl p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
              Our Reach and Targets
            </h2>
            <p className="text-white/70 max-w-2xl mb-8">
              YRIF&apos;s Year 1 institutional targets, as set out in its implementation roadmap.
              These are goals, not current achievements. They are pursued through a phased 12-month
              plan spanning institutional registration, digital platform development, university and
              secondary-school outreach, and the inaugural National Research Competition and Youth
              Bonanza — followed by the longer-term launch of the YRIF Journal and a sustainable
              research-services network from Year 2 onward.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {YEAR_ONE_TARGETS.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="font-display text-3xl sm:text-4xl font-bold text-brand-gold mb-2">
                    {value}
                  </p>
                  <p className="text-xs text-white/70 uppercase tracking-wide leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Governance */}
        <section>
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-brand-navy mb-3">
              Governance and Leadership
            </h2>
            <p className="text-content-secondary max-w-3xl leading-relaxed">
              YRIF is governed under its Constitution. The General Meeting is the supreme organ,
              composed of all members. The Board of Directors provides oversight, policy direction,
              and assurance of compliance. Office bearers are elected by the General Meeting for a
              term of five years and may be re-elected for another five-year term. The financial year
              runs from 1 January to 31 December.
            </p>
          </div>

          <h3 className="text-sm font-bold uppercase tracking-wide text-brand-teal mb-4">
            Board of Directors — Office Bearers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {OFFICE_BEARERS.map(({ name, position, phone }) => (
              <div key={name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal mb-2">
                  {position}
                </p>
                <p className="font-display text-lg font-bold text-brand-navy mb-2">{name}</p>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="text-sm text-content-secondary hover:text-brand-teal transition-colors"
                >
                  {phone}
                </a>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-brand-navy mb-3">Board composition</h3>
              <p className="text-sm text-content-secondary leading-relaxed mb-3">
                The Board comprises the Chairperson, Executive Secretary, Treasurer, and three other
                members appointed by the General Meeting. Board members hold office for five years and
                may be re-appointed. The Board meets twice a year, or as needed in emergencies, with a
                quorum of two-thirds.
              </p>
              <p className="text-sm text-content-secondary leading-relaxed">
                Board functions include making rules and regulations, providing policy direction,
                protecting the organization&apos;s image and interests, approving strategic plans,
                appointing auditors, recruiting staff, and forming committees where necessary.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-brand-navy mb-3">Executive Management Team</h3>
              <p className="text-sm text-content-secondary leading-relaxed mb-4">
                Led by an Executive Director and organized into four departments:
              </p>
              <ul className="space-y-2">
                {DEPARTMENTS.map((dept) => (
                  <li key={dept} className="flex items-center gap-2 text-sm text-content-secondary">
                    <CheckCircle2 size={16} className="text-brand-teal flex-shrink-0" />
                    {dept}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-content-secondary leading-relaxed">
                An Advisory Board of experts from academia and industry provides technical guidance
                on research quality, program design, and strategic partnerships.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-display text-2xl font-bold text-brand-navy mb-2">
              Founder Members
            </h3>
            <p className="text-sm text-content-secondary max-w-2xl">
              The six founders who established YRIF, listed in the Constitution. Office bearers
              lead the Board; LinkedIn is shown only where a public profile matches the name.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FOUNDER_MEMBERS.map(({ name, position, initials, featured, linkedin }, index) => (
              <article
                key={name}
                className={`relative overflow-hidden rounded-2xl border p-6 ${
                  featured
                    ? 'bg-brand-navy text-white border-brand-navy shadow-lg'
                    : 'bg-white text-brand-navy border-gray-100 shadow-sm'
                }`}
              >
                <span
                  className={`absolute -right-3 -top-4 font-display text-7xl font-bold leading-none select-none ${
                    featured ? 'text-white/10' : 'text-brand-navy/5'
                  }`}
                  aria-hidden
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="relative flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display text-lg font-bold flex-shrink-0 ${
                      featured
                        ? 'bg-brand-gold text-brand-navy'
                        : 'bg-brand-teal/10 text-brand-teal'
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                        featured ? 'text-brand-gold' : 'text-brand-teal'
                      }`}
                    >
                      {position}
                    </p>
                    <h4 className="font-display text-lg font-bold leading-snug">{name}</h4>
                  </div>
                </div>
                {linkedin ? (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-teal hover:underline"
                  >
                    <Linkedin size={15} />
                    LinkedIn
                  </a>
                ) : (
                  <p
                    className={`relative mt-5 text-xs ${
                      featured ? 'text-white/45' : 'text-content-secondary/70'
                    }`}
                  >
                    Founding signatory
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
