# Installation

## Install Node.js

Dolos needs the JavaScript runtime [Node.js](https://nodejs.org/en/), version 12
or higher. You can check if Node is installed and its version by using the command:
```shell
node --version
# v14.17.3
```
If this reports an error (`node: command not found`) or a version lower than 12,
you will need to install Node using the instructions below.

We aim to support the latest Node versions. If you have to pick a version, the
latest **LTS** (long term support) version is a good choice.

### Windows

The Windows documentation mentions two approaches to installing Node.js:

- Download and install Node directly from the [Node.js homepage](https://nodejs.org/en/)
- [Install Node on WSL](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl) (Windows Subsystem for Linux).

If you are not sure which method is best, please refer to the [Microsoft documentation site](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-overview).

::: warning
When installing Dolos on Windows, you need to enable support for building native
modules. In the installer on the page **Tools for Native Modules** you need to
check the box to **Automatically install the necessary tools**.

Alternatively, you can install these tools manually by following [the instructions on the node-gyp page](https://github.com/nodejs/node-gyp#on-windows).
:::

### Debian or Ubuntu Linux

Node provides specific [installation instructions](https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions)
for these Linux distributions.

### Other Linux distributions

Node is available in the repository of various [package managers](https://nodejs.org/en/download/package-manager/),
please search for Node using the package manager of your distribution.

## Install Dolos

By default, Node comes with its own package manager `npm`. You can install
Dolos with `npm` using the following command:
```shell
npm install -g @dodona/dolos
```

::: warning
The `@dodona/` prefix is required. If you just try installing `dolos`
you will install another package not associated with this project.
:::

The `-g` flag will install Dolos  globally. If you omit this flag, `npm` will
add Dolos as a dependency to the JavaScript project you are currently in (if any)
and Dolos  will only be available there.

Alternatively, you can also use other node package managers like [yarn](https://classic.yarnpkg.com/lang/en/):
```shell
yarn add global @dodona/dolos
```

You should now be able to run Dolos. You can test this by running Dolos with the
`--version` flag, which will print the current Dolos version, the version of
Node it is running on and the version of tree-sitter.
```shell
dolos --version
```

Dolos already supports most common programming languages out-of-the box.
However, if the language you want to use is not supported, you can easily
[add a new language](/guide/languages#adding-a-new-language).

## Troubleshooting

If you encounter a problem not listed here, or if the solution does not work for
you, please contact us a [dodona@ugent.be](mailto:dodona@ugent.be) or
[open an issue](https://github.com/dodona-edu/dolos/issues/new) on our GitHub page.

### Module was compiled against a different Node.js version

If you get the following error:
```
Error: The module 'node_modules/@dodona/dolos/node_modules/tree-sitter/build/Release/tree_sitter_runtime_binding.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 67. This version of Node.js requires
NODE_MODULE_VERSION 83. Please try re-compiling or re-installing
```
This means `tree-sitter` was installed for another Node version. This can
occur when you update Node, or when you use a Node version manager (like nvm)
and switched versions.

**Solution:** run `npm rebuild -g --force`. This will recompile all binary
addons for your current Node version.

### Could not find Python/Visual Studio/CC installation

When installing Dolos, some native modules need to be build using `node-gyp`,
which requires Python and a compiler (Visual Studio on Windows).
For example: if you don't have Python available on your system,
you will get the following error when installing Dolos:

```
npm ERR! gyp ERR! find Python 
npm ERR! gyp ERR! configure error 
npm ERR! gyp ERR! stack Error: Could not find any Python installation to use
```

A similar warning can be shown for `Visual Studio`, `make`, `cc`, etc.

**Solution:** you need to install the dependencies required by `node-gyp`, there
are specific instructions for 
[Unix](https://github.com/nodejs/node-gyp#on-unix),
[MacOS](https://github.com/nodejs/node-gyp#on-macos)
and [Windows](https://github.com/nodejs/node-gyp#on-windows)

Afterwards you may need to reinstall dependencies by passing the `--force` flag:
```shell
npm install -g --force @dodona/dolos
```

### Cannot find module './build/Release/tree_sitter_runtime_binding'

Something went wrong while building the native modules.
Try to rebuild the native modules using `npm rebuild -g --force`.
