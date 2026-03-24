import { HeroSection } from '@/components/Landing/sections/RevampHeroSection'
import { PanAfricanDivider } from '@/components/shared/PanAficDivider'
import { FeaturesSection } from '@/components/Landing/sections/RevampFeaturesSection'
import { HowItWorksSection } from '@/components/Landing/sections/RevampWorksSection'
import { EventsSection } from '@/components/Landing/sections/revamp-events'
import { FAQSection } from '@/components/Landing/sections/FAQSection'
import { TestimonialsSection } from '@/components/Landing/sections/TestimonialsSection'
import { getPublicEvents } from '@/lib/dal/event'

export default async function LandingPage() {
  const events = await getPublicEvents({ limit: 7 })

  return (
    <>
    {/* <pre>{JSON.stringify(events, null, 2)}</pre> */}
      <HeroSection />
      <PanAfricanDivider />
      <FeaturesSection />
      <PanAfricanDivider />
      <HowItWorksSection />
      <PanAfricanDivider />
      <EventsSection items={events} />
      <PanAfricanDivider />
      <FAQSection />
      <PanAfricanDivider />
      <TestimonialsSection />
    </>
  )
}