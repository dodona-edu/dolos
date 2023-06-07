import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Dolos",
  description: "Source Code Plagiarism Detection",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Try Dolos', link: '/try/' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Running Dolos', link: '/guide/running' },
          { text: 'Supported programming languages', link: '/guide/languages' },
          { text: 'How Dolos works', link: '/guide/algorithm' },
          { text: 'Install Dolos using docker', link: '/guide/docker' },
          { text: 'Use case: Dodona', link: '/guide/dodona' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/dodona-edu/dolos' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: "Made by Team Dodona with ❤️"
    }
  }
})
