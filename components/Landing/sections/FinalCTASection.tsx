import { Button } from '@/components/ui/button'
import { Section } from '@/components/Landing/shared/Section'
import { PROJ_NAME } from '@/lib/const/branding'

export function FinalCTASection() {
    return (
        <Section id="contact" as="section" contentClassName="py-20 bg-primary text-white text-center" className="scroll-mt-20">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Host Your Next Great Event?</h2>
                <p className="text-xl mb-8 opacity-90">Join thousands of event creators who trust {PROJ_NAME} to power their success.</p>
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">Start for Free</Button>
                <p className="mt-4 text-sm opacity-75">No credit card required • 14-day free trial</p>
            </div>
        </Section>
    )
}