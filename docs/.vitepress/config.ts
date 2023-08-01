import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Dolos",
  description: "Source Code Plagiarism Detection",

  ignoreDeadLinks: [
    /^https?:\/\/localhost/
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    nav: [
      { text: 'Documentation', link: '/guide/' },
      { text: 'Examples', link: '/try/' },
      { text: 'Use Dolos', link: 'https://dolos.ugent.be/server' },
    ],

    sidebar: [
      { text: "Introduction", link: "/guide/" },
      {
        text: 'Dolos Online',
        items: [
          { text: 'Use Dolos Online', link: '/guide/server' },
          { text: 'Use case: Dodona', link: '/guide/dodona' },
        ]
      },
      {
        text: 'CLI & Library',
        items: [
          { text: 'Install the Dolos CLI', link: '/guide/installation' },
          { text: 'Use the Dolos CLI', link: '/guide/running' },
          { text: 'Run Dolos using docker', link: '/guide/docker' },
          { text: 'Add metadata', link: '/guide/adding-metadata' },
          { text: 'Add new languages', link: '/guide/adding-languages' },
          { text: 'Use the Dolos library', link: '/guide/library' },
        ]
      },
      {
        text: 'About Dolos',
        items: [
          { text: 'How Dolos works', link: '/about/algorithm' },
          { text: 'Supported programming languages', link: '/about/languages' },
          { text: 'Research publications', link: '/about/publications' },
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
