import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Section } from '@/components/Landing/shared/Section'

export function FAQSection() {
    return (
        <Section id="faq" as="section" contentClassName="py-20" className="scroll-mt-20">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                        <AccordionTrigger>What types of events can I create?</AccordionTrigger>
                        <AccordionContent>
                            You can create voting/polling events, ticketed events (paid or free), and standard showcase events. Each type comes with tailored features for maximum engagement.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Is there a transaction fee on tickets?</AccordionTrigger>
                        <AccordionContent>
                            We charge a competitive 2.9% + $0.30 per transaction for paid tickets. This covers payment processing and platform fees.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>How real-time are the updates?</AccordionTrigger>
                        <AccordionContent>
                            Updates are instantaneous thanks to WebSocket connections. Votes, ticket purchases, and other interactions update in real-time for all participants.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>Can I make events private?</AccordionTrigger>
                        <AccordionContent>
                            Yes, you can set events to private with invitation-only access, or require registration with approval.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-5">
                        <AccordionTrigger>What payment processors do you support?</AccordionTrigger>
                        <AccordionContent>
                            We support Stripe, PayPal, and major credit cards. More payment options are coming soon.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-6">
                        <AccordionTrigger>Is my data secure?</AccordionTrigger>
                        <AccordionContent>
                            Absolutely. We use enterprise-grade encryption, comply with GDPR and CCPA, and never share your data without permission.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </Section>
    )
}