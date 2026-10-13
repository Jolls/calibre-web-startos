import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'calibre-web',
  title: 'Calibre-Web',
  license: 'GPL-3.0',
  packageRepo: 'https://github.com/Jolls/calibre-web-startos',
  upstreamRepo: 'https://github.com/janeczku/calibre-web',
  marketingUrl: 'https://github.com/janeczku/calibre-web',
  donationUrl: null,
  description: { short, long },
  // 'config' holds app.db (users, settings) and this package's store.json;
  // 'books' holds the Calibre library (metadata.db plus the book files).
  volumes: ['config', 'books'],
  images: {
    // linuxserver's build is the maintained image; janeczku/calibre-web on
    // Docker Hub was last updated in 2017. Confirmed on Docker Hub 2026-10-12:
    // amd64 + arm64.
    'calibre-web': {
      source: { dockerTag: 'linuxserver/calibre-web:0.6.27-ls405' },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
