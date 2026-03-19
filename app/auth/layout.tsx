import type { ReactNode } from "react"
import AfricaMap from "../../components/auth/AfricaMap"

import { AfroTixLogo } from "@/components/shared/AfroTixLogo"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-poppins">
      {/* Left hero / brand side */}

      <div className="relative w-full lg:w-1/2 h-65 lg:h-screen overflow-hidden shadow bg-secondary-50 ">
        <AfricaMap
          images={["/landing/g.webp", "/landing/b.webp", "/landing/h.webp"]}
          interval={9000}
          showHoverColor={true}
          showTransitionColor={false}
        />

        {/* Hero copy (matches AfroTix-style layout) */}
        <div className="absolute top-1/2 left-6 right-6 lg:space-y-6 max-w-[12rem] sm:max-w-[15rem] md:max-w-xs pointer-events-none">
          <div className="flex items-center gap-2">
            {/* <Image height={40} width={40} src="/logo.png" alt="Sankofa Logo" className="bg-black h-20 w-auto" /> */}
            <Link href="/" className="pointer-events-auto">
              <AfroTixLogo className="w-28 sm:w-32 md:w-36 lg:w-40 h-auto border p-2 border-black" />
            </Link>
          </div>
          <span className="mt-2 text-sm inline-block bg-secondary-50 font-medium text-foreground/80 ">
            Discover and book the hottest events across the continent.
          </span>
        </div>
      </div>
      {/* <PanAfricanDivider className="my-4 rotate-90 absolute top-0   w-svh" /> */}

      {/* Right auth content */}
      <div className="flex-1 flex items-center   justify-center px-4 py-10 lg:px-16">
        <div className="w-full max-w-md  h-full flex flex-col justify-between">
          {children}
        </div>
      </div>
    </div>
  )
}

