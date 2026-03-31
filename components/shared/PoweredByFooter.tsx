import Link from "next/link";
import { AfroTixLogo } from "./AfroTixLogo";

export function PoweredByFooter() {
  return (
    <div className="py-12 border-t border-dashed text-center space-y-4 bg-black">
      <div className="flex items-center justify-center gap-2">
        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <AfroTixLogo className="h-10 w-auto" />
         </Link>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-1">
          Powered by Afrotix Event Management System
        </p>
        <p className="text-[9px] text-white/50 italic">
          &copy; {new Date().getFullYear()} Afrotix. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
