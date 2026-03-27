import { type MetadataRoute } from 'next'
import { PROJ_NAME } from '@/lib/const/branding'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PROJ_NAME,
    short_name: PROJ_NAME,
    description: 'Create, Manage & Grow Events with Real-Time Power',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#dc2626',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/logo.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/logo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  }
}
