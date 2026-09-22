import type {
  MetadataRoute,
} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BJJ Tracker',
    short_name: 'BJJ Tracker',
    description:
      'Personal Brazilian Jiu-Jitsu training tracker for sessions, rolls, techniques, goals and stats.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090A0C',
    theme_color: '#090A0C',
    orientation: 'portrait',
    categories: [
      'sports',
      'fitness',
      'productivity',
    ],
  };
}


