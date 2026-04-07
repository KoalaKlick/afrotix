import * as React from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon, value, defaultValue, onChange, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const isPassword = type === 'password'
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

        // If onChange is provided, treat as controlled - use empty string as fallback to prevent
        // "uncontrolled to controlled" warnings when value starts as undefined
        const isControlled = onChange !== undefined
        const inputValue = isControlled ? (value ?? '') : undefined
        const inputDefaultValue = !isControlled ? defaultValue : undefined

        if (icon) {
            return (
                <div className="relative">
                    <span className="absolute  left-3 top-1/2 -translate-y-1/2 text-primary-600">
                        {icon}
                    </span>
                    <input
                        type={inputType}
                        className={cn(
                            'flex h-10 w-full rounded-md border border-input placeholder:opacity-70 pl-10 py-3 text-sm shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                            isPassword ? 'pr-10' : 'pr-3',
                            className
                        )}
                        ref={ref}
                        {...props}
                        onChange={onChange}
                        value={inputValue}
                        defaultValue={inputDefaultValue}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    )}
                </div>
            )
        }

        if (isPassword) {
            return (
                <div className="relative">
                    <input
                        type={inputType}
                        className={cn(
                            'flex h-10 w-full rounded-md border border-input bg-neutral-50 placeholder:opacity-70 px-3 pr-10 py-2 text-sm shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                            className
                        )}
                        ref={ref}
                        {...props}
                        onChange={onChange}
                        value={inputValue}
                        defaultValue={inputDefaultValue}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                </div>
            )
        }

        return (
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-neutral-50/50 placeholder:opacity-70 px-3 py-2 text-sm shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                ref={ref}
                {...props}
                onChange={onChange}
                value={inputValue}
                defaultValue={inputDefaultValue}
            />
        )
    }
)
Input.displayName = 'Input'

export { Input }
