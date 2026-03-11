/**
 * Welcome Card Component
 * Shows a welcome message and quick setup guide for new users
 */

import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SetupStep {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    href: string;
}

interface WelcomeCardProps {
    readonly userName: string;
    readonly organizationName: string;
    readonly setupSteps?: SetupStep[];
    readonly className?: string;
}

const defaultSetupSteps: SetupStep[] = [
    {
        id: "profile",
        title: "Complete your profile",
        description: "Add your photo and contact details",
        completed: false,
        href: "/settings/profile",
    },
    {
        id: "event",
        title: "Create your first event",
        description: "Set up an event and start selling tickets",
        completed: false,
        href: "/events/create",
    },
    {
        id: "team",
        title: "Invite team members",
        description: "Add collaborators to help manage events",
        completed: false,
        href: "/team/invite",
    },
    {
        id: "payout",
        title: "Set up payouts",
        description: "Connect your bank account to receive funds",
        completed: false,
        href: "/settings/payouts",
    },
];

export function WelcomeCard({
    userName,
    organizationName,
    setupSteps = defaultSetupSteps,
    className,
}: WelcomeCardProps) {
    const completedCount = setupSteps.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / setupSteps.length) * 100);
    const allCompleted = completedCount === setupSteps.length;

    // Find next incomplete step
    const nextStep = setupSteps.find((s) => !s.completed);

    return (
        <div
            className={cn(
                "bg-linear-to-br from-primary/10 via-primary/5 to-transparent border rounded-xl p-6 shadow-sm",
                className
            )}
        >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Welcome Message */}
                <div>
                    <h2 className="text-xl font-semibold">
                        Welcome{userName ? `, ${userName}` : ""}! 👋
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        {allCompleted
                            ? `You're all set up! ${organizationName} is ready to host amazing events.`
                            : `Let's get ${organizationName} set up for success.`}
                    </p>
                </div>

                {/* Progress Indicator */}
                {!allCompleted && (
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {completedCount}/{setupSteps.length}
                        </span>
                    </div>
                )}
            </div>

            {/* Setup Steps */}
            {!allCompleted && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {setupSteps.map((step) => (
                        <Link
                            key={step.id}
                            href={step.href}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                                step.completed
                                    ? "bg-muted/30 opacity-60"
                                    : "bg-card hover:bg-muted/50 border"
                            )}
                        >
                            {step.completed ? (
                                <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                                <Circle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                                <p
                                    className={cn(
                                        "font-medium text-sm",
                                        step.completed && "line-through text-muted-foreground"
                                    )}
                                >
                                    {step.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {step.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* CTA Button for next step */}
            {nextStep && (
                <div className="mt-4 pt-4 border-t">
                    <Button asChild>
                        <Link href={nextStep.href}>
                            {nextStep.title}
                            <ArrowRight className="ml-2 size-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

export { defaultSetupSteps };
export type { SetupStep };
