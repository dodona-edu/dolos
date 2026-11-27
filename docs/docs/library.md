# Dolos JavaScript library

The JavaScript library [@dodona/dolos-lib](https://www.npmjs.com/package/@dodona/dolos-lib) runs a Dolos analysis from Node.js.
It is a native binding of the Rust library `dolos-lib`, the same library the [command line tool](/docs/running) uses.
The library implements the [algorithms](/about/algorithm) of the Dolos plagiarism detection pipeline.
We're happy to [hear](/about/contact) about any projects that use it.

## Installation

Use `npm` to install the library:

```shell
npm install @dodona/dolos-lib
```

The package contains a prebuilt binary for these platforms:

- Linux x64 and arm64, with glibc or musl
- Windows x64 and arm64
- macOS x64 and arm64 (Apple silicon)

## Usage

Create a `Dolos` analysis with the paths of the files, then build the report.
This example logs all fragments that a list of files share:

```javascript
import { Dolos } from "@dodona/dolos-lib";

const files = [
  "sample.js",
  "copied_function.js",
  "another_copied_function.js",
  "copy_of_sample.js",
];

const dolos = new Dolos(files, { compare: true });
const report = await dolos.buildReport();

for (const pair of report.pairs) {
  for (const fragment of pair.fragments) {
    const left = fragment.leftRegion;
    const right = fragment.rightRegion;
    console.log(
      `${pair.leftFile.relativePath}:{${left.startPoint.row},${left.startPoint.column} -> ${left.endPoint.row},${left.endPoint.column}} ` +
      `matches with ${pair.rightFile.relativePath}:{${right.startPoint.row},${right.startPoint.column} -> ${right.endPoint.row},${right.endPoint.column}}`
    );
  }
}
```

The constructor reads, tokenizes and fingerprints the files.
It accepts several files, one directory, one CSV file with a `filename` column, or one archive (`.zip`, `.tar`, `.tar.gz`, `.tgz`, `.tar.bz2`, `.tbz`, `.tbz2`), as the command line tool does.
It throws an error when an option is invalid or the input cannot be read.
The `code` of the error is the kind of the error, such as `"InvalidInput"` or `"NotFound"`.

`buildReport()` compares all files pairwise and returns a promise of the report.
You can call it once per analysis.

## Options

The second argument of the constructor holds the options.
Every option is optional and has the default of the command line tool.

| Option                     | Default                     | Description                                                                          |
| -------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| `name`                     | the name of the input       | The name of the report.                                                              |
| `language`                 | detected from the files     | A `Language` value, such as `"python"`. Files of other languages are skipped.        |
| `kgramLength`              | `23`                        | The number of tokens in a k-gram.                                                    |
| `kgramsInWindow`           | `17`                        | The number of k-grams in a winnowing window.                                         |
| `maxFingerprintCount`      | no limit                    | Ignore a fingerprint that occurs in more than this number of files.                  |
| `maxFingerprintPercentage` | no limit                    | Ignore a fingerprint that occurs in more than this fraction (0 to 1) of the files.   |
| `template`                 | no template                 | Paths of template code. Dolos ignores the fingerprints of the template.              |
| `includeComments`          | `false`                     | Tokenize the comments of the files.                                                  |
| `compare`                  | `false`                     | Compute the fragments of every pair. Without it, only an analysis of 2 files has them. |
| `minLengthMatch`           | `1`                         | The minimum number of fingerprints in a match.                                       |
| `sortBy`                   | `PairSortBy.FileId`         | The order of the pairs: `"file-id"`, `"similarity"`, `"total-overlap"` or `"longest-fragment"`. |
| `fragmentSortBy`           | `FragmentSortBy.FileOrder`  | The order of the fragments: `"kgrams-ascending"`, `"kgrams-descending"` or `"file-order"`. |

## Report

The report is a plain object:

- `metadata`: the options of the analysis, the detected `language`, the `reportName`, `createdAt` (a `Date`) and `includeFragments`.
- `files`: the analyzed files. Each file has an `id`, a `relativePath`, the `content` and `info`: the other columns of its CSV row, as `[column, value]` pairs.
- `pairs`: one pair for every two files, in the order of `sortBy`.
  Each pair has a `leftFile` and a `rightFile` (the same objects as in `files`), the `metrics` and, when `metadata.includeFragments` is `true`, the `fragments`.

The `metrics` of a pair are `similarity` (between 0 and 1), `totalLeft`, `totalRight`, `overlapLeft`, `overlapRight` and `longestMatch`.
All counts are in fingerprints.
A fragment has a `leftRegion`, a `rightRegion` and a `fingerprintCount`.
A region has a `startPoint` and an `endPoint`, each with a zero-based `row` and `column`.

The package includes TypeScript declarations for all these types.

Since Dolos primarily targets teachers that will use Dolos as a [web app](/docs/server) or as a [command line tool](/docs/running),
the library is not documented as extensively as we would like.
Feel free to [create an issue on GitHub](https://github.com/dodona-edu/dolos) or [contact us](/about/contact) if you have any questions.
