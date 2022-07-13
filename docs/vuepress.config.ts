import { defineUserConfig, defaultTheme } from 'vuepress';
import { searchPlugin } from "@vuepress/plugin-search";

export default defineUserConfig({
  lang: 'en-US',
  title: 'Dolos',
  description: 'Dolos source code plagiarism detection: information & documentation',

  public: "public/",

  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],


  theme: defaultTheme({
    repo: "https://github.com/dodona-edu/dolos",
    editLink: false,
    contributors: false,
    lastUpdated: false,
    navbar: [
      {
        text: 'Guide',
        link: '/guide/',
      },
      {
        text: 'Try Dolos',
        link: '/try/'
      },
    ],

    sidebarDepth: 1,
    sidebar: [
      {
        link: '/guide/',
        text: 'Guide',
        children: [
          './',
          './installation',
          './running',
          './languages',
          './algorithm',
          './docker',
          './dodona'
        ]
      }
    ],
  }),

  plugins: [
    searchPlugin({
      isSearchable: (page) => page.path !== '/',
    })
  ],
});
