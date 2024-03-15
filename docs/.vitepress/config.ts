import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Dolos",
  description: "Source Code Plagiarism Detection",

  ignoreDeadLinks: [
    /^https?:\/\/localhost/
  ],

  themeConfig: {
    nav: [
      { text: 'Documentation', link: '/docs/' },
      { text: 'Examples', link: '/demo/' },
      { text: 'Use Dolos', link: 'https://dolos.ugent.be/server' },
    ],

    sidebar: [
      { text: "Introduction", link: "/docs/" },
      {
        text: 'Dolos',
        items: [
          { text: 'Use Dolos', link: '/docs/server' },
          { text: 'Use case: Dodona', link: '/docs/dodona' },
          { text: 'Self-host Dolos', link: '/docs/hosting-dolos' },
          { text: 'Dolos API', link: '/docs/api' },
        ]
      },
      {
        text: 'Dolos CLI & Library',
        items: [
          { text: 'Install Dolos CLI', link: '/docs/installation' },
          { text: 'Use Dolos CLI', link: '/docs/running' },
          { text: 'Run Dolos CLI using docker', link: '/docs/docker' },
          { text: 'Add metadata', link: '/docs/adding-metadata' },
          { text: 'Add new languages', link: '/docs/adding-languages' },
          { text: 'Use the Dolos library', link: '/docs/library' },
        ]
      },
      {
        text: 'About Dolos',
        items: [
          { text: 'How Dolos works', link: '/about/algorithm' },
          { text: 'Supported programming languages', link: '/about/languages' },
          { text: 'Research publications', link: '/about/publications' },
          { text: 'Contact us', link: '/about/contact' },
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
  },

  vite: {
    resolve: {
      alias: {
        '@components': __dirname + '/components'
      }
    }
  }
})
