// components/AfroTixLogoModern.tsx
import { useId } from 'react'

export function AfroTixLogo({ className = " h-auto" }: { readonly className?: string }) {
    const filterId = useId()

    return (
        <svg
            className={className}
            viewBox="0 0 600 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <title>AfroTix Logo</title>
            <defs>
                <filter id={filterId}>
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
                </filter>
            </defs>

            {/* Main text with custom styling */}
            <g filter={`url(#${filterId})`}>
                <text
                    x="300"
                    y="130"
                    fontFamily="'Poppins', 'Arial', sans-serif"
                    fontSize="100"
                    fontWeight="800"
                    letterSpacing="-2"
                    textAnchor="middle"
                >
                    <tspan fill="#C41E3A">Afro</tspan>
                    <tspan fill="#FFB800">Tix</tspan>
                    <tspan fill="#228B22">.</tspan>
                </text>
            </g>


        </svg>
    )
}