import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
    icon: LucideIcon
    title: string
    description: string
    iconClassName?: string
    className?: string
}

export function FeatureCard({
    icon: Icon,
    title,
    description,
    iconClassName,
    className
}: FeatureCardProps) {
    return (
        <Card  variant='afro-4' className={cn( "shadow-sm pt-4 backdrop-blur-md group gap-2 bg-amber-50/10 border-0 hover:shadow-sm    transition-shadow", className)}>
            <CardHeader className=''>
                <div className=""><Icon className={cn("size-12  group-hover:scale-105 transition-all rounded-full text-white p-2", iconClassName)} /></div>
                
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>{description}</CardDescription>
            </CardContent>
        </Card>
    )
}
