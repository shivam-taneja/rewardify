import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    128: 'public/logo.png',
  },
  action: {
    default_icon: {
      128: 'public/logo.png',
    },
  },
  permissions: [
    'sidePanel',
    'contentSettings',
  ],
  content_scripts: [{
    js: ['src/content/main.tsx'],
    matches: ['https://www.youtube.com/*'],
  }],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/lib/background.ts',
    type: 'module',
  },
})