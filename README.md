# Dolos

<p align="center">
  <a href="https://dolos.ugent.be/" target="_blank">
    <img width="180" src="https://raw.githubusercontent.com/dodona-edu/dolos/main/docs/public/images/demo-exercise-graph-circle.png" alt="A plagiarism graph showing a lot of plagiarism.">
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@dodona/dolos">
    <img src="https://img.shields.io/npm/v/@dodona/dolos.svg" alt="Current version of the npm package">
  </a>
  <a href="https://doi.org/10.1016/j.softx.2024.101755">
    <img src="https://img.shields.io/badge/DOI-10.1016%2Fj.softx.2024.101755-28A745.svg?link=https%3A%2F%2Fdoi.org%2F10.1016%2Fj.softx.2024.101755" alt="DOI of the latest journal article about Dolos">
  </a>
  <a href="https://matrix.to/#/#dolos:matrix.org">
    <img src="https://img.shields.io/matrix/dolos%3Amatrix.org.svg?logo=matrix" alt="Public chat channel for Dolos">
  </a>
  <a href="https://github.com/dodona-edu/dolos/blob/main/LICENSE">
    <img alt="MIT source code license" src="https://img.shields.io/github/license/dodona-edu/dolos">
  </a>
</p>

Dolos is a source code plagiarism detection tool for programming exercises.
Dolos helps teachers in discovering students sharing solutions, even if they are
modified. By providing interactive visualizations, Dolos can also be used to
sensitize students to prevent plagiarism.

Dolos aims to be:

- **Easy to use** by offering a web app with an intuitive user interface
- **Flexible** to support many programming languages
- **Powerful** by using state-of-the-art algorithms to help you discover plagiarism

Dolos is a [web app](https://dolos.ugent.be) that analyses source code files for similarities between them.
In addition, it offers a command-line interface to run an analysis locally, showing the interactive user interface in your browser by launching a local webserver.
The analysis results are available in machine readable CSV files and Dolos can be integrated as a [JavaScript library](https://www.npmjs.com/package/@dodona/dolos-lib) in other applications empowering users to integrate plagiarism detection in their personal workflow.

You can use our free to use instance of Dolos on <https://dolos.ugent.be>.

## Self-hosting Dolos

As Dolos is open source, it is also possible to host the Dolos web app.

Follow our instructions on <https://dolos.ugent.be/docs>.

## Local installation with Dolos CLI

If you want to run the Dolos CLI instead of using [the web app](https://dolos.ugent.be), you can install Dolos CLI your system using npm:
```shell
npm install -g @dodona/dolos
```

See [the installation instructions on our website](https://dolos.ugent.be/guide/installation.html) for more complete instructions.

### Usage

Dolos can be launched using the command-line interface, but it is able to
show the results in your browser.

Launch Dolos using the following command in your terminal:
```shell
dolos run -f web path/to/your/files/*
```
This will launch a web interface with the analysis results at <http://localhost:3000>.

[More elaborate instructions on how to use Dolos](https://dolos.ugent.be/guide/running.html).

### Documentation

Visit our web page at <https://dolos.ugent.be/docs>.

### Building and developing

To develop the parsers, library or CLI components, you will need to clone this repository recursively to include its submodules (the tree-sitter parsers):

```sh
git clone --recursive git://github.com/dodona-edu/dolos.git

# or, if you have cloned the repository already:
git submodule update --init --recursive
```

You only need to run install the dependencies once in the repository root by
running `npm install`. This will install all dependencies and link them in each
project's `node_modules`. You should **not** run `npm install` in each project's directory separately.

This will also link the `dist` folder from the core, lib and web projects as their versions match in the `package.json` file.
This allows you to simultaneously develop the CLI, lib and the web project together.

Each component has its own build instructions in its own directory.

## Local installation using Docker

The latest Dolos version comes pre-installed in a Docker container image that is available from GitHub's container registry. Use the following command to pull the image:

```shell
docker pull ghcr.io/dodona-edu/dolos-cli:latest
```

Next, you can run an analysis with Dolos and start a web server to view the results using the following docker command:

```shell
docker run --init --network host -v "$PWD:/dolos" dodona/dolos -l javascript -f web *.js
```

The arguments passed to docker serve the following purpose:
- `--init` will make sure stopping the container with Control-C works
- `--network host` allows Dolos's webserver to bind to <http://localhost:3000>
- `-v "$PWD:/dolos"` gives Dolos acces to your current directory


## Components

- [CLI](https://github.com/dodona-edu/dolos/tree/main/cli): the command-line interface
- [Core](https://github.com/dodona-edu/dolos/tree/main/core): the Javascript library with only the core algorithms
- [Parsers](https://github.com/dodona-edu/dolos/tree/main/parsers): the tree-sitter parsers vendored by Dolos
- [Lib](https://github.com/dodona-edu/dolos/tree/main/lib): the Node.js library which can parse and analyze files
- [Web](https://github.com/dodona-edu/dolos/tree/main/web): the graphical user interface in your browser which can be launched using the CLI
- [Docs](https://github.com/dodona-edu/dolos/tree/main/docs): the source code of <https://dolos.ugent.be>
- [API](https://github.com/dodona-edu/dolos/tree/main/api): the API server running the Dolos web app at <https://dolos.ugent.be/server>

## Who made this software?

Dolos is an active research project by [Team Dodona](https://dodona.ugent.be/en/about/) at Ghent University. If you use this software for your research, please cite:

- Maertens et. al. (2024) SoftwareX [doi:10.1016/j.softx.2024.101755](https://doi.org/10.1016/j.softx.2024.101755)
