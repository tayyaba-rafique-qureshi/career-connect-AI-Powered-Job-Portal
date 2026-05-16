import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import StatsBar from '../components/landing/StatsBar'
import HowItWorks from '../components/landing/HowItWorks'
import FeaturedJobs from '../components/landing/FeaturedJobs'
import CategoryBrowse from '../components/landing/CategoryBrowse'
import ForEmployers from '../components/landing/ForEmployers'
import Testimonials from '../components/landing/Testimonials'
import TrustBar from '../components/landing/TrustBar'
import CTABanner from '../components/landing/CTABanner'
import Footer from '../components/landing/Footer'
import TourGuide from '../components/landing/TourGuide'

export default function LandingPage() {
  return (
    <div className="font-sans">
      <TourGuide />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <FeaturedJobs />
      <CategoryBrowse />
      <ForEmployers />
      <Testimonials />
      <TrustBar />
      <CTABanner />
      <Footer />
    </div>
  )
}
