import { defineCollection, defineContentConfig } from '@nuxt/content'

/**
 * Nuxt Content Configuration
 * Defines collections for content management
 */
export default defineContentConfig({
    collections: {
        // Legal documents collection
        legal: defineCollection({
            type: 'page',
            source: 'legal/**/*.md'
        })
    }
})
