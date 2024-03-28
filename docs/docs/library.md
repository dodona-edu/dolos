# Dolos Javascript library

The Dolos CLI is actually a wrapper around the core TypeScript/JavaScript library [@dodona/dolos-lib](https://www.npmjs.com/package/@dodona/dolos-lib).
This library implements the [algorithms](/about/algorithm) of the Dolos plagiarism detection pipeline.
Feel free to use or extend individual algorithms in your own projects.
We're happy to [hear](/about/contact) about any extensions you make.

## Installation

Using `npm` to install the library, similar to [installing the CLI](/docs/installation):

```shell
npm install @dodona/dolos-lib
```

## Usage

Take a look at our [example repository](https://github.com/rien/dolos-lib-example/blob/main/index.mjs)
for some simple use cases that demonstrate how the library can be used.

For example, this JavaScript code snippet logs all matching fragments shared among a list of files:

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

Since Dolos primarily targets teachers that will use Dolos as a [web app](/docs/server) or as a [command line tool](/docs/running),
the library is not documented as extensive as we would like.
Feel free to [create an issue on GitHub](https://github.com/dodona-edu/dolos) or [contact us](/about/contact) if you have any questions.
