# Dolos core

This is the core library containing the matching algorithms behind [Dolos](https://dolos.ugent.be).
It exposes a JavaScript API to integrate plagiarism detection in your applications.

This library compiles to platform-independent JavaScript and can thus be included in web environments.

**Note:** this library does not contain parsing functionality.
If you need to parse files as well, you should consider using [Dolos lib](https://www.npmjs.com/package/@dodona/dolos-core).

Visit [dolos.ugent.be](https://dolos.ugent.be) for more information.

## Installation

```
yarn add @dodona/dolos-core # or,
npm install @dodona/dolos-core
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
