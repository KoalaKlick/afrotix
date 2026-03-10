import { Section } from '@/components/Landing/shared/Section'
import { StepCard, type StepCardProps } from '@/components/Landing/shared/StepCard'

const steps: Omit<StepCardProps, 'isLast'>[] = [
    {
        step: 1,
        title: 'Sign Up',
        numberClassName: 'text-primary-600',
        dotClassName: 'bg-primary-600',
        description: 'Create your free account and set up your profile in seconds.',
    },
    {
        step: 2,
        title: 'Create Event',
        numberClassName: 'text-secondary-500',
        dotClassName: 'bg-secondary-500',
        description: 'Choose your event type and customize with our intuitive builder.',
    },
    {
        step: 3,
        title: 'Share & Promote',
        numberClassName: 'text-tertiary-600',
        dotClassName: 'bg-tertiary-600',
        description: 'Share your event page and engage with your audience effortlessly.',
    },
    {
        step: 4,
        title: 'Track Results',
        numberClassName: 'text-gray-400',
        dotClassName: 'bg-gray-400',
        description: 'Monitor live engagement and analyze performance in real-time.',
    },
]

export function HowItWorksSection() {
    return (
        <Section id="about" as="section" contentClassName="py-20 " className="scroll-mt-20">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                {/* Left side - Title */}
                <div className="lg:w-1/3 lg:sticky lg:top-24 lg:self-start">
                    <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">The Flow</p>
                    <h2 className="text-5xl lg:text-6xl font-black uppercase leading-none mb-4">
                        How It<br />
                        <span className="text-primary-600">Works.</span>
                    </h2>
                    <div className="w-12 h-1 bg-black mb-6" />
                    <p className="text-gray-500 max-w-sm">
                        A streamlined process designed to take your event from concept to reality in record time.
                        Professional, powerful, and ridiculously easy.
                    </p>
                </div>

                {/* Right side - Steps timeline */}
                <div className="lg:w-2/3">
                    {steps.map((item, index) => (
                        <StepCard
                            key={item.step}
                            step={item.step}
                            title={item.title}
                            numberClassName={item.numberClassName}
                            dotClassName={item.dotClassName}
                            description={item.description}
                            isLast={index === steps.length - 1}
                        />
                    ))}
                </div>
            </div>
        </Section>
    )
}