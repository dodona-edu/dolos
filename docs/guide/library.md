# Dolos Javascript library

Underlying Dolos CLI is the TypeScript/JavaScript library [@dodona/dolos-lib](https://www.npmjs.com/package/@dodona/dolos-lib).
It includes the core algorithm behind Dolos and can be used in your own projects.

## Installation

Just like [installtion of the CLI](/guide/installation.html), you can install the library using `npm` or `yarn`:

```shell
npm install @dodona/dolos-lib
```

## Usage

We've provided a [simple example repository](https://github.com/rien/dolos-lib-example/blob/main/index.mjs) that shows how to use the library.

The following code snippet will log all all matching fragments in the given files:

```javascript
import { Dolos } from "@dodona/dolos-lib";

const files = [
  "sample.js",
  "copied_function.js",
  "another_copied_function.js",
  "copy_of_sample.js",
];

const dolos = new Dolos();
const report = await dolos.analyzePaths(files);

for (const pair of report.allPairs()) {
 for (const fragment of pair.buildFragments()) {
    const left = fragment.leftSelection;
    const right = fragment.rightSelection;
    console.log(`${pair.leftFile.path}:{${left.startRow},${left.startCol} -> ${left.endRow},${left.endCol}} matches with ${pair.rightFile.path}:{${right.startRow},${right.startCol} -> ${right.endRow},${right.endCol}}`);
 }
}
```

Since our target audience is teachers, the documentation of the library is not as extensive as we would like.
If you have any questions, feel free to [create an issue on GitHub](https://github.com/dodona-edu/dolos) or [send us an email](mailto:dodona@ugent.be).
