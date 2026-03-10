import { Section } from '@/components/Landing/shared/Section'
import { FeatureCard } from '@/components/Landing/shared/FeatureCard'
import { Users, BarChart3, Ticket, Zap, Shield, Globe } from 'lucide-react'

const features = [
    {
        icon: BarChart3,
        iconClassName: 'bg-primary-500 ',
        className: 'hover:bg-primary-50',
        title: 'Real-Time Analytics',
        description: 'Track live views, votes, and ticket sales with detailed dashboards and instant insights.',
    },
    {
        icon: Users,
        iconClassName: "bg-secondary-500 ",
        className: "hover:bg-secondary-50",
        title: 'Live Voting & Polls',
        description: 'Engage your audience with interactive polls and see results update in real-time.',
    },
    {
        icon: Ticket,
        iconClassName: "bg-tertiary-700",
        className: "hover:bg-tertiary-50",
        title: 'Seamless Ticketing',
        description: 'Sell tickets effortlessly with integrated payment processing and automated check-ins.',
    },
    {
        icon: Globe,
        iconClassName: "bg-black",
        className: "hover:bg-neutral-50",
        title: 'Beautiful Public Pages',
        description: 'Create stunning event pages that look professional and drive registrations.',
    },
       {
        icon: Zap,
        iconClassName: "bg-yellow-500",
        className: "hover:bg-yellow-50",
        title: 'Multiple Event Types',
        description: 'From webinars to conferences, support all event formats in one unified platform.',
    },
    {
        icon: Shield,
        iconClassName: "bg",
        title: 'Secure & Scalable',
        description: 'Enterprise-grade security with unlimited scalability for events of any size.',
    },
]

export function FeaturesSection() {
    return (
        <Section id="features" as="section" contentClassName="py-20" className="scroll-mt-20">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4 uppercase">Powerful Features</h2>
                <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
                    Everything you need to create engaging, real-time events that captivate your audience.
                </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature) => (
                    <FeatureCard
                        key={feature.title}
                        icon={feature.icon}
                        className={feature.className}
                        title={feature.title}
                        iconClassName={feature.iconClassName}
                        description={feature.description}
                    />
                ))}
            </div>
        </Section>
    )
}