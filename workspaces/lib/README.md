# Dolos lib

This is the software library behind [Dolos](https://dolos.ugent.be). It exposes
a JavaScript API to integrate plagiarism detection in your applications.

Visit [dolos.ugent.be](https://dolos.ugent.be) for more information.

## Installation

```
yarn add @dodona/dolos-lib # or,
npm install @dodona/dolos-lib
```

### Node & Web environments

Dolos uses [tree-sitter](https://www.npmjs.com/package/tree-sitter) to parse
source code files. Tree-sitter currently only runs in node and will thus not
run in browser environments. Since some of the library's functionality is use
by the [Dolos Web UI](https://www.npmjs.com/package/@dodona/dolos-web), the
dependency on tree-sitter is optional.

## Usage

```typescript
import { Dolos } from "@dodona/dolos-lib";

const dolos = new Dolos();
const report = dolos.analyzePaths(["./file1.js", "./file2.js"]);
```

## Development

1. Install dependencies (preferably in the repository root)
    ```
    yarn install
    ```
2. Build the project with typescript
    ```
    yarn build
    ```
3. Test the project with ava.js
    ```
    yarn test
    ```

## Documentation

Visit our web page at <https://dolos.ugent.be>.
