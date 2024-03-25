# Dolos lib

This is the software library behind [Dolos](https://dolos.ugent.be). It exposes
a JavaScript API to integrate plagiarism detection in your applications.

Visit [dolos.ugent.be](https://dolos.ugent.be) for more information.

## Installation

```
npm install @dodona/dolos-lib
```

### Node & Web environments

**Required:** Node.js, Python 3 and a compiler (GCC)

Dolos uses [tree-sitter](https://www.npmjs.com/package/tree-sitter) to parse source code files.
Tree-sitter currently only runs in node and will thus not run in browser environments.

If you only require the matching algorithms, you can use the platform-independent library [Dolos Core](https://www.npmjs.com/package/@dodona/dolos-core).

## Usage

```typescript
import { Dolos } from "@dodona/dolos-lib";

const dolos = new Dolos();
const report = dolos.analyzePaths(["./file1.js", "./file2.js"]);
```

## Development

1. Install dependencies (preferably in the repository root)
    ```
    npm install
    ```
2. Build the project with typescript
    ```
    npm run build
    ```
3. Test the project with ava.js
    ```
    npm run test
    ```

## Documentation

Visit our web page at <https://dolos.ugent.be>.
