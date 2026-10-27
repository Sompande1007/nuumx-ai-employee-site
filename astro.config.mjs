// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// https://astro.build/config
// SITE and BASE can be set at build time (the GitHub Pages workflow serves the site under /nuumx-ai-employee/).
// Without them it builds for www.nuumx.ai at the root.
const env = /** @type {any} */ (globalThis).process?.env ?? {};

export default defineConfig({
  site: env.SITE || 'https://www.nuumx.ai',
  base: env.BASE || '/',
  integrations: [
    icon({
      include: {
        'material-symbols': [
          'call-outline', 'call-end', 'chat-outline', 'close', 'database-outline',
          'dialpad', 'done-all', 'mail-outline', 'mic-off-outline', 'search', 'sms-outline',
          'volume-up-outline', 'chevron-left', 'chevron-right', 'arrow-forward'
        ]
      }
    })
  ],
  build: { inlineStylesheets: 'auto' }
});
