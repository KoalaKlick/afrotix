import { HeroSection } from '@/components/Landing/sections/HeroSection'
import { FeaturesSection } from '@/components/Landing/sections/FeaturesSection'
import { HowItWorksSection } from '@/components/Landing/sections/HowItWorksSection'
import { TestimonialsSection } from '@/components/Landing/sections/TestimonialsSection'
import { PricingSection } from '@/components/Landing/sections/PricingSection'
import { FAQSection } from '@/components/Landing/sections/FAQSection'
import { FinalCTASection } from '@/components/Landing/sections/FinalCTASection'
import { EventsSection } from '@/components/Landing/sections/events'
import { PanAfricanDivider } from '@/components/shared/PanAficDivider'

// Pan-African divider component


const page = () => {
  return (
    <>
      <HeroSection />

      <PanAfricanDivider />
      <FeaturesSection />
      <PanAfricanDivider />
      <HowItWorksSection />
      <PanAfricanDivider />
      <EventsSection />
      <PanAfricanDivider />
      <TestimonialsSection />
      <PanAfricanDivider />
      <PricingSection />
      <PanAfricanDivider />
      <FAQSection />
      <PanAfricanDivider />
      <FinalCTASection />
      <PanAfricanDivider />
    </>


  )
}

export default page