"use client";

import React, { useState } from 'react';

const DashedBorder = ({
    children,
    dashArray = "5 5",
    borderRadius = 16,
    className = "",
    strokeColor = "currentColor",
    animated = false,
    animateOnHover = false,
    animationDuration = 2,
    strokeWidth = 1,
}: {
    children: React.ReactNode;
    dashArray?: string;
    borderRadius?: number;
    className?: string;
    strokeColor?: string;
    animated?: boolean;
    animateOnHover?: boolean;
    animationDuration?: number;
    strokeWidth?: number;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const isAnimated = animateOnHover ? isHovered : animated && !isHovered;
    return (
        <div
            className={`relative rounded-lg ${className}`}
            tabIndex={0}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
        >
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id="panafrican-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="33%" stopColor="#facc15" />
                        <stop offset="66%" stopColor="#16a34a" />
                        <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <style>
                        {`
                            @keyframes dash-move {
                                0% { stroke-dashoffset: 0; }
                                100% { stroke-dashoffset: -20; }
                            }
                        `}
                    </style>
                </defs>
                <title>Dashed Border</title>
                <rect
                    x="0.5"
                    y="0.5"
                    width="calc(100% - 1px)"
                    height="calc(100% - 1px)"
                    rx={borderRadius}
                    ry={borderRadius}
                    fill="none"
                    stroke={strokeColor === 'panafrican' ? 'url(#panafrican-gradient)' : strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    className={strokeColor !== 'panafrican' ? "text-gray-300" : ""}
                    style={isAnimated ? {
                        animation: `dash-move ${animationDuration}s linear infinite`
                    } : {}}
                />
            </svg>
            {children}
        </div>
    );
};

export default DashedBorder;
