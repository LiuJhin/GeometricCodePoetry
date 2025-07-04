// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  
  // App configuration
  app: {
    head: {
      title: 'Liam.dev - Tech Blog',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A personal tech blog exploring the future of web development' },
        { name: 'theme-color', content: '#050505' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap' }
      ]
    }
  },
  
  // CSS
  css: [
    '~/assets/css/main.css'
  ],
  
  // Build modules
  modules: [],
  
  // Auto-import components
  components: true
})
