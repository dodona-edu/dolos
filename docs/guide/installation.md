# Installation

If you get stuck installing Dolos, please let us know at
[dodona@ugent.be](mailto:dodona@ugent.be).

## Install Node.js

Dolos needs the JavaScript runtime [Node.js](https://nodejs.org/en/).
We aim to support the latest Node versions. If you have to pick a version, the
latest **LTS** (long term support) version is a good choice.

## Windows

Windows provides documentation about how to install Node.js on their platform.
There are two main approaches to installing Node.js:

- Download and install Node directly from their [homepage](https://nodejs.org/en/)
- [Install Node on WSL](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl) (Windows Subsystem for Linux).

If you are not sure which method is best, please refer to the [Microsoft documentation site](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-overview).

### Debian or Ubuntu Linux

Node provides specific [installation instructions](https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions)
for these Linux distributions.

### Other Linux distributions

Node is availeble in the repository of various [package managers](https://nodejs.org/en/download/package-manager/),
please search for Node using the package manager of your distribution.

## Install Dolos

By default, Node comes with its own package manager `npm`. You can install
Dolos with `npm` with the folllowing command:
```shell
npm install -g @dodona/dolos
```

::: warning
The `@dodona/` prefix is required. If you just try installing `dolos`
you will install another package not associated with this project.
:::

The `-g` flag will install Dolos  globally. If you ommit this flag, `npm` will
add Dolos as a dependency to the JavaScript project you are currently in (if any)
and Dolos  will only be available there.

Alternatively, you can also use other node package managers like [yarn](https://classic.yarnpkg.com/lang/en/):
```shell
yarn add global @dodona/dolos
```


