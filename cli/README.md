# Dolos

<p align="center">
  <a href="https://dolos.ugent.be/" target="_blank">
    <img width="180" src="https://github.com/dodona-edu/dolos/blob/docs/docs/.vuepress/public/images/soco-java-graph.png" alt="A plagiarism graph showing a lot of plagiarism.">
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@dodona/dolos">
    <img src="https://img.shields.io/npm/v/@dodona/dolos.svg" alt="Version of the npm package">
  </a>
  <a href="https://github.com/dodona-edu/dolos/actions?query=branch%3Amain">
    <img src="https://github.com/dodona-edu/dolos/actions/workflows/cli.yml/badge.svg" alt="Build state">
  </a>
  <a href="https://github.com/dodona-edu/dolos/blob/main/LICENSE">
    <img alt="Source code license" src="https://img.shields.io/github/license/dodona-edu/dolos">
  </a>
</p>

Dolos is a source code plagiarism detection tool which is:

- **Easy to use** by having minimal installation instructions and an intuitive user interface
- **Flexible** to support many programming languages
- **Powerful** by using state-of-the art algorithms to help you discover plagiarism

## How to use Dolos

Visit the project's web page at <https://dolos.ugent.be> to find out how  to [install](https://dolos.ugent.be/guide/installation.html)
and [use](https://dolos.ugent.be/guide/running.html) Dolos.

## Development

This project uses [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)
so you will need to use yarn.

- Run `yarn install` in the **root directory**, this will link the `web` project
  with the `cli` project as well.
- If you want to use the `web` format, you need to build the [web project](../web/) first.
- Build the project with `yarn build`
- Run tests with `yarn test`