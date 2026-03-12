import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Color palette for avatar backgrounds based on name/initials
const colorClasses = [
  'bg-red-500 text-white',
  'bg-orange-500 text-white',
  'bg-amber-500 text-white',
  'bg-yellow-500 text-black',
  'bg-lime-500 text-black',
  'bg-green-500 text-white',
  'bg-emerald-500 text-white',
  'bg-teal-500 text-white',
  'bg-cyan-500 text-white',
  'bg-sky-500 text-white',
  'bg-blue-500 text-white',
  'bg-indigo-500 text-white',
  'bg-violet-500 text-white',
  'bg-purple-500 text-white',
  'bg-fuchsia-500 text-white',
  'bg-pink-500 text-white',
  'bg-rose-500 text-white',
]

/**
 * Generate a consistent color class based on a name/string
 * Used for avatar backgrounds to ensure the same name always gets the same color
 */
export function getColorClass(name: string): string {
  if (!name) return 'bg-gray-500 text-white'

  // Generate a simple hash from the name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + (name.codePointAt(i) ?? 0)
    hash = hash & hash // Convert to 32bit integer
  }

  const index = Math.abs(hash) % colorClasses.length
  return colorClasses[index]
}



export function formatDate(date: Date, addTime?: boolean): string {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  if (addTime) {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    })
    return `${dateStr}, ${timeStr}`
  }
  return dateStr
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function trimText(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length)}...` : text
}

type NumberFormatOptions = {
  locale?: string
  style?: Intl.NumberFormatOptions['style']
  currency?: string
  unit?: Intl.NumberFormatOptions['unit']
  unitDisplay?: Intl.NumberFormatOptions['unitDisplay']
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: Intl.NumberFormatOptions['useGrouping']
}

export function formatNumber(
  value: number,
  {
    locale = 'en-US',
    style = 'decimal',
    currency,
    unit,
    unitDisplay = 'short',
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }: NumberFormatOptions = {}
): string {
  const opts: Intl.NumberFormatOptions = {
    style,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }
  if (style === 'currency' && currency) opts.currency = currency
  if (style === 'unit' && unit) {
    opts.unit = unit
    opts.unitDisplay = unitDisplay
  }
  return new Intl.NumberFormat(locale, opts).format(value)
}

export function formatAmount(value: number, currency = "GHS") {
  return formatNumber(value, { style: 'currency', currency })
}




