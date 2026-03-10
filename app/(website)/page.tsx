import React from 'react'

import { ActiveStatsBuffer } from "motion/react"
import { HeroSection } from '@/components/Landing/sections/RevampHeroSection'
import { PanAfricanDivider } from '@/components/shared/PanAficDivider'
import { FeaturesSection } from '@/components/Landing/sections/RevampFeaturesSection'
import { HowItWorksSection } from '@/components/Landing/sections/RevampWorksSection'
import { EventsSection } from '@/components/Landing/sections/revamp-events'
import { FAQSection } from '@/components/Landing/sections/FAQSection'
import { TestimonialsSection } from '@/components/Landing/sections/TestimonialsSection'

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
      <FAQSection />
      <PanAfricanDivider />
      <TestimonialsSection />

    </>
  )
}

export default page