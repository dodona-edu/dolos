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

1. Install dependencies (preferably in the repository root)
    ```
    npm install
    ```
2. Prepare the project (generate some parsers)
    ```
    npm run prepare
    ```
3. Build the node bindings
    ```
    npm run build
    ```

## Documentation

Visit our web page at <https://dolos.ugent.be>.
