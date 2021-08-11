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
dolos --format web --language <language> path/to/your/files/*
```
The above command will launch a web interface with the analysis results at <http://localhost:3000>.

[More elaborate instructions on how to use Dolos](https://dolos.ugent.be/guide/running.html).

## Documentation

Visit our web page at <https://dolos.ugent.be>.

## Projects

- [CLI](https://github.com/dodona-edu/dolos/tree/main/cli): the core library and command-line interface
- [Web](https://github.com/dodona-edu/dolos/tree/main/web): the graphical user interface in your browser which can be launched using the CLI
- [Docs](https://github.com/dodona-edu/dolos/tree/main/docs): the source code of <https://dolos.ugent.be>
