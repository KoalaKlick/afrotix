"use client";

import { Check } from "lucide-react";

interface StepPillProps {
    readonly index: number;
    readonly label: string;
    readonly active: boolean;
    readonly done: boolean;
}

function getBackgroundColor(active: boolean, done: boolean): string {
    if (active) return "#6366f1";
    if (done) return "#22c55e";
    return "rgba(255,255,255,0.1)";
}

export function StepPill({ index, label, active, done }: StepPillProps) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: getBackgroundColor(active, done),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff",
                transition: "background 0.2s",
            }}>
                {done ? <Check size={11} /> : index}
            </div>
            <span style={{
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? "#e8e8f0" : "rgba(255,255,255,0.35)",
                transition: "color 0.2s",
            }}>
                {label}
            </span>
        </div>
    );
}
