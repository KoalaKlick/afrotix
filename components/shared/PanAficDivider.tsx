import { cn } from "@/lib/utils"

export const PanAfricanDivider = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex h-[1px]", className)} {...props}>
    <div className="flex-1 bg-primary-600" />
    <div className="flex-1 bg-secondary-400" />
    <div className="flex-1 bg-tertiary-600" />
  </div>
)