// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.nuumx.ai',
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
