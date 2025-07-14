# Dolos parsers

This a collection of parsers officialy supported by [Dolos](https://dolos.ugent.be).

Visit [dolos.ugent.be](https://dolos.ugent.be) for more information.

## Installation

If you want to use Dolos, you don't need to install this package directly.
However, if you want to use the bundled parsers in your own app, you can install JavaScript library with:

```
npm install @dodona/dolos-parsers
```

### System requirements

**Required:** Node.js, Python 3 and a compiler (GCC)

These parsers use [tree-sitter](https://www.npmjs.com/package/tree-sitter) to parse source code files.
Tree-sitter currently only runs in node and will thus not run in browser environments.



## Development

1. Clone the Dolos repository including the submodules
    ```sh
    git clone --recursive git://github.com/dodona-edu/dolos.git

    # or, if you have cloned the repository already:
    git submodule update --init --recursive
    ```


2. Install dependencies (preferably in the repository root)
    ```sh
    npm install
    ```
    ```
3. Build the node bindings
    ```
    npm run build
    ```
   
### Updating parsers

Parsers are included as git submodules. Steps to update:

1. Ensure the working directory is clean
2. Fetch the latest commits, switch to the desired commit (e.g. latest tag)
3. Test building the parsers and running the tests in `dolos-lib`
   ```sh
   npm --workspace=parsers run build && npm --workspace=lib run test
   ```

## Documentation

Visit our web page at <https://dolos.ugent.be>.
