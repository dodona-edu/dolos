# Installation

This tutorial describes step by step how you can install the Dolos CLI on your system.
As an alternative, you can also use the Dolos CLI from the [docker container](./docker) we provide.

## Install Node.js

Dolos needs the JavaScript runtime [Node.js](https://nodejs.org/en/) (we recommend the latest LTS version).
Use this command to check if a suitable Node version is installed on your system:

```shell
node --version
# v18.10.0
```

If this command reports an error (`node: command not found`) or if the Node.js version is too old,
you will need to install a recent version of Node.js using the instructions below.

### Windows

There are two ways to install Node.js on Windows:

- Download and install Node.js directly from its [homepage](https://nodejs.org/en/)
- [Install Node.js on Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl) (WSL).

Visit the [Microsoft documentation site](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-overview) for more information,
in case you are unsure which method will suite you best.

::: warning
When installing Dolos on Windows, you need to enable support for building native modules.
On the page **Tools for Native Modules** of the installer you need to check the box to **Automatically install the necessary tools**.

Alternatively, you can manually install these tools by following [the instructions on the node-gyp page](https://github.com/nodejs/node-gyp#on-windows).
:::

### Debian or Ubuntu Linux

Node.js provides specific [installation instructions](https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions)
for these Linux distributions.

### Other Linux distributions

Node.js is available in the repository of various [package managers](https://nodejs.org/en/download/package-manager/).
Search for "Node" using the package manager of your distribution.

## Install Dolos

By default, Node.js comes with its own package manager `npm`.
Use the following commando to install Dolos with `npm`:

```shell
npm install -g @dodona/dolos
```

::: warning
The `@dodona/` prefix is required. 
If you just try installing `dolos`, you will install another package that is not associated with this project.
:::

The `-g` flag will install Dolos globally.
If you omit this flag, `npm` will only add Dolos as a dependency to your current JavaScript project (if any) and Dolos will only be available for that project.

You should now be able to run Dolos.
Test this by running Dolos with the `--version` flag. 
This will print the Dolos version, the version of Node.js it is running on and the version of [Tree-sitter](https://tree-sitter.github.io/tree-sitter/).

```shell
dolos --version
```

Dolos supports most commonly used programming languages out-of-the box.
However, you can easily [add a new language](/docs/adding-languages#adding-a-new-language) if your target programming language is not yet supported.

## Troubleshooting

If you encounter a problem not listed here, or if the solution does not work for you, please [get in touch](/about/contact) or [open an issue on GitHub](https://github.com/dodona-edu/dolos/issues/new).

### Module was compiled against a different Node.js version

The following error message

```
Error: The module 'node_modules/@dodona/dolos/node_modules/tree-sitter/build/Release/tree_sitter_runtime_binding.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 67. This version of Node.js requires
NODE_MODULE_VERSION 83. Please try re-compiling or re-installing
```

means that `tree-sitter` was installed for another Node.js version.
This may occur when you update Node.js, or when you use a Node.js version manager (like `nvm`) and switched versions.

**Solution:** Run `npm rebuild -g --force`.
This will recompile all binary addons for your current Node.js version.

### Could not find Python/Visual Studio/CC installation

`node-gyp` must build some native modules when installing Dolos.
This requires Python and a compiler (Visual Studio on Windows).
For example, you get the following error when installing Dolos and Python is not installed on your system:

```
npm ERR! gyp ERR! find Python 
npm ERR! gyp ERR! configure error 
npm ERR! gyp ERR! stack Error: Could not find any Python installation to use
```

A similar warning can be displayed for `Visual Studio`, `make`, `cc`, etc.

**Solution:** Install the dependencies required by `node-gyp`.
There are specific instructions for
[Unix](https://github.com/nodejs/node-gyp#on-unix),
[MacOS](https://github.com/nodejs/node-gyp#on-macos),
and [Windows](https://github.com/nodejs/node-gyp#on-windows).
Afterwards you may need to reinstall dependencies by passing the `--force` flag:

```shell
npm install -g --force @dodona/dolos
```

### Cannot find module './build/Release/tree_sitter_runtime_binding'

Something went wrong while building the native modules.

**Solution:** Try to rebuild the native modules using `npm rebuild -g --force`.
