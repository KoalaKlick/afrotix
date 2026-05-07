import NoEventSvg from "@/app/assert/no-event.svg";
import type { SVGProps } from "react";

type Props = SVGProps<SVGElement>;

/**
 * Illustration for empty event states.
 * Colors automatically adapt to the current theme via CSS variables:
 *   - primary shapes   → var(--primary)
 *   - accent / cheeks  → var(--color-brand-tertiary)
 *   - character body   → currentColor  (light/dark aware)
 *   - ground shadow    → var(--border)
 */
export function NoEventsIllustration({ className, ...props }: Readonly<Props>) {
    return (
        <NoEventSvg
            className={className}
            aria-hidden="true"
            focusable="false"
            {...props}
        />
    );
}
