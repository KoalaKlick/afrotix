import { HeroSection } from '@/components/Landing/sections/RevampHeroSection'
import { PanAfricanDivider } from '@/components/shared/PanAficDivider'
import { FeaturesSection } from '@/components/Landing/sections/RevampFeaturesSection'
import { HowItWorksSection } from '@/components/Landing/sections/RevampWorksSection'
import { EventsSection } from '@/components/Landing/sections/revamp-events'
import { FAQSection } from '@/components/Landing/sections/FAQSection'
import { TestimonialsSection } from '@/components/Landing/sections/TestimonialsSection'
import { getVisibleEventsForUser } from '@/lib/dal/event'
import { createClient } from '@/utils/supabase/server'
import { FooterSection } from '@/components/Landing/sections/FooterSection'

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // TODO: Pass userId if available from session/auth context for personalized results
  const events = await getVisibleEventsForUser({ limit: 7, userId: user?.id });

  return (
    <>
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
                      <FooterSection />

    </>
  )
}