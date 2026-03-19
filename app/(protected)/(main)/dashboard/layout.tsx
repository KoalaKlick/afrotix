export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    // All routing checks handled by parent protected layout
    return <>{children}</>
}
