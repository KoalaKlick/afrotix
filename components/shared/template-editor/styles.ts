/* TemplateEditor Style Constants */

import type { CSSProperties } from "react";

export const iconBtnStyle: CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    padding: "5px 8px",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    transition: "background 0.15s",
};

export const primaryBtnStyle: CSSProperties = {
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "opacity 0.15s",
};

export const secondaryBtnStyle: CSSProperties = {
    ...iconBtnStyle,
    padding: "9px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
};

export const cancelBtnStyle: CSSProperties = {
    ...secondaryBtnStyle,
    color: "rgba(255,255,255,0.5)",
};

export const presetBtnStyle: CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 5,
    padding: "4px 8px",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    fontSize: 11,
    width: "100%",
    textAlign: "center" as const,
};
