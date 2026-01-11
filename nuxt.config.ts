// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxthub/core',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/ui',
    '@nuxt/test-utils',
    '@nuxt/hints',
    '@nuxt/eslint',
    '@nuxt/a11y',
    'nuxt-auth-utils',
    'nuxt-security',
    '@pinia/nuxt'
  ],

  css: ['~/assets/css/main.css'],

  // Force light mode
  colorMode: {
    preference: 'light'
  },

  // Runtime configuration
  runtimeConfig: {
    // Server-only (private)
    zeptomailApiKey: process.env.ZEPTOMAIL_API_KEY,

    // Public (available on client)
    public: {
      appUrl: '',
      mailFromAddress: process.env.MAIL_FROM_ADDRESS || 'contact@example.com',
      mailFromName: process.env.MAIL_FROM_NAME || 'Nuxt SaaS Starter',
    }
  },

  // NuxtHub Configuration for Cloudflare
  hub: {
    // D1 Database (SQLite)
    db: 'sqlite',

    // R2 Blob Storage
    blob: true,

    // Workers KV for key-value storage
    kv: true,

    // Workers KV for caching
    cache: true,
  },

  // Cloudflare Pages deployment preset (applied during build)
  nitro: {
    preset: process.env.NITRO_PRESET || 'cloudflare_pages',
    experimental: {
      websocket: true
    }
  }
})