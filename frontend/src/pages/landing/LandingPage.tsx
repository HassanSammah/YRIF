import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Hero from './sections/Hero'
import AboutSection from './sections/AboutSection'
import Features from './sections/Features'
import FeaturedResearch from './sections/FeaturedResearch'
import UpcomingEvents from './sections/UpcomingEvents'
import ImpactMetrics from './sections/ImpactMetrics'
import MentorshipHighlight from './sections/MentorshipHighlight'
import Partners from './sections/Partners'
import NewsAnnouncements from './sections/NewsAnnouncements'
import UsefulLinks from './sections/UsefulLinks'
import FeedbackSection from './sections/FeedbackSection'
import CTASection from './sections/CTASection'

export default function LandingPage() {
  const location = useLocation()

  useEffect(() => {
    // Handle scroll-to-section on page load or hash change
    const hash = location.hash
    if (hash) {
      const elementId = hash.slice(1)
      setTimeout(() => {
        const element = document.getElementById(elementId)
        if (element) {
          const top = element.getBoundingClientRect().top + window.scrollY - 80
          window.scrollTo({ top, behavior: 'smooth' })
        }
      }, 200)
    } else {
      // Scroll to top if no hash
      window.scrollTo(0, 0)
    }
  }, [location])

  return (
    <>
      <Hero />
      <AboutSection />
      <Features />
      <FeaturedResearch />
      <UpcomingEvents />
      <ImpactMetrics />
      <MentorshipHighlight />
      <Partners />
      <NewsAnnouncements />
      <UsefulLinks />
      <FeedbackSection />
      <CTASection />
    </>
  )
}
