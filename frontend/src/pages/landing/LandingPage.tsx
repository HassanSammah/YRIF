import Hero from './sections/Hero'
import AboutSection from './sections/AboutSection'
import Features from './sections/Features'
import FeaturedResearch from './sections/FeaturedResearch'
import UpcomingEvents from './sections/UpcomingEvents'
import ImpactMetrics from './sections/ImpactMetrics'
import Partners from './sections/Partners'
import NewsAnnouncements from './sections/NewsAnnouncements'
import CTASection from './sections/CTASection'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <AboutSection />
      <Features />
      <FeaturedResearch />
      <UpcomingEvents />
      <ImpactMetrics />
      <Partners />
      <NewsAnnouncements />
      <CTASection />
    </>
  )
}
