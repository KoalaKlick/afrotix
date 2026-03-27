import Image from "next/image";
import { PROJ_NAME } from "@/lib/const/branding";

export default function DashboardLoading() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh]">
            <Image src="/logo.svg" alt={PROJ_NAME} width={120} height={40} className="h-10 w-auto animate-pulse" priority />
            <p className="text-sm text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
    );
}
