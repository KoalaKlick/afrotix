'use client'

import NextImage, { type StaticImageData, type ImageProps as NextImageProps } from 'next/image'
import * as React from 'react'
import { cn, getColorClass } from '@/lib/utils'
import { User } from 'lucide-react'

interface ImageProps extends Omit<NextImageProps, 'src'> {
  src: string | StaticImageData
  alt: string
  fallback?: string
  className?: string
  fullName?: string | null
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ src, alt, fallback, fullName, className, ...props }, ref) => {
    const [error, setError] = React.useState(false)
    const [loading, setLoading] = React.useState(true)

    const isInvalidSrc = !src || (typeof src === 'string' && src.trim() === '')

    // Generate initials from fullName (alt is used as fallback)
    const displayName = fullName || alt || ''
    const initials = displayName
      ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : ''

    const handleError = () => {
      setError(true)
      setLoading(false)
    }

    const handleLoad = () => {
      setLoading(false)
    }

    if ((error || isInvalidSrc) && fallback) {
      return (
        <NextImage
          ref={ref}
          src={fallback}
          alt={alt}
          className={cn('object-cover', className)}
          onError={handleError}
          onLoad={handleLoad}
          {...props}
        />
      )
    }

    if ((error || isInvalidSrc) && !fallback) {
      const colorClass = initials ? getColorClass(displayName) : 'bg-gray-600 text-white'
      return (
        <div
          className={cn(
            'flex items-center transition-all duration-300 justify-center @container',
            colorClass,
            className
          )}
          style={{ width: props.width, height: props.height }}
        >
          {initials ? (
            <span className='uppercase font-bold' style={{ fontSize: '40cqw' }}>{initials}</span>
          ) : (
            <span className="text-xs"><User /></span>
          )}
        </div>
      )
    }

    return (
      <NextImage
        ref={ref}
        src={src}
        alt={alt}
        className={cn(
          'object-cover transition-all duration-300 ease-in bg-muted aspect-square border ',
          loading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    )
  }
)

Image.displayName = 'Image'

export const Avatar = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, alt = '', ...props }, ref) => (
    <Image ref={ref} className={cn('rounded-full', className)} alt={alt} {...props} />
  )
)

Avatar.displayName = 'Avatar'

export const Logo = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, alt = '', ...props }, ref) => (
    <Image ref={ref} className={cn('object-contain', className)} priority alt={alt} {...props} />
  )
)

Logo.displayName = 'Logo'