# Dolos

<p align="center">
  <a href="https://dolos.ugent.be/" target="_blank">
    <img width="180" src="https://github.com/dodona-edu/dolos/blob/main/docs/.vuepress/public/images/soco-java-graph-circle.png" alt="A plagiarism graph showing a lot of plagiarism.">
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@dodona/dolos">
    <img src="https://img.shields.io/npm/v/@dodona/dolos.svg" alt="Version of the npm package">
  </a>
  <a href="https://github.com/dodona-edu/dolos/actions?query=branch%3Amain">
    <img src="https://github.com/dodona-edu/dolos/actions/workflows/ci.yml/badge.svg" alt="GitHub checks status">
  </a>
  <a href="https://github.com/dodona-edu/dolos/blob/main/LICENSE">
    <img alt="Source code license" src="https://img.shields.io/github/license/dodona-edu/dolos">
  </a>
</p>

Dolos is a source code plagiarism detection tool for programming exercises.
Dolos helps teachers in discovering students sharing solutions, even if they are
modified. By providing interactive visualizations, Dolos can also be used to
sensitize students to prevent plagiarism.

Dolos aims to be:

- **Easy to use** by having minimal installation instructions and an intuitive user interface
- **Flexible** to support many programming languages
- **Powerful** by using state-of-the-art algorithms to help you discover plagiarism

Dolos is a command-line (CLI) tool that analyses source code files for similarities between them.
It is able to show an interactive user interface in your browser by launching a local webserver.
The analysis results are available in machine readable CSV files and Dolos can be integrated as a
[JavaScript library](https://www.npmjs.com/package/@dodona/dolos) in other applications empowering
users to integrate plagiarism detection in their personal workflow.

## Installation

You can install Dolos on your system using npm:
```shell
npm install -g @dodona/dolos
```

See [the installation instructions on our website](https://dolos.ugent.be/guide/installation.html) for more complete instructions.

## Usage

Dolos has to be launched using the command-line interface, but it is able to
show the results in your browser.

Launch Dolos using the following command in your terminal:
```shell
dolos run -f web --language <language> path/to/your/files/*
```
The above command will launch a web interface with the analysis results at <http://localhost:3000>.

[More elaborate instructions on how to use Dolos](https://dolos.ugent.be/guide/running.html).

## Documentation

Visit our web page at <https://dolos.ugent.be>.

## Development

This project uses [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)
so you will need to use yarn.

- Run `yarn install` in the **root directory**, this will link the `web` project
  with the `cli` project as well.
- If you want to use the `web` format, you need to build the [web project](../web/) first.
- Build the project with `yarn build`
- Run tests with `yarn test`
