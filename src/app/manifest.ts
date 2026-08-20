import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cosmoids TD: The Grand Voyage',
    short_name: 'Cosmoids',
    description: 'A creature collection RPG set in the Pirate era!',
    start_url: '/',
    display: 'fullscreen',
    orientation: 'landscape',
    background_color: '#0d2b45',
    theme_color: '#0d2b45',
    icons: [
      {
        src: '/icons/cosmoids-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/cosmoids-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/cosmoids-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
