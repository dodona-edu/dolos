# Dolos

Plagiarism detection for computer programming assignments.

Right now, C#, Java, JavaScript and Python are officially supported. Additional languages for which a [tree-sitter grammar](https://yarnpkg.com/en/packages?q=tree-sitter-) is available might also work.

## Installation

To run Dolos on your system, you will need [NodeJS](https://nodejs.org/) and then
install the program globally for your system using either

- `yarn add global dolos`
- `npm install -g dolos`

Make sure the location `yarn` or `npm` are installing to is included in your
`$PATH`. Please refer to their manuals to specify the installation location.

## Usage

Run `dolos --help` to show the available commandline options.

A typical analysis can be started as follows:

```
dolos -l <lang> -k <k_length> -w <w_length> <files...>
```

With the following parameters:
- `<lang>` is the language of the source code files (e.g. `java`)
- `<k_length>` is minimal count of tokens in one fingerprint. Higher values make the analysis faster but possibly less accurate.
- `<w_length>` is amount of fingerprints in one window. Higher values make the analysis faster but possibly less accurate.
- `<files>` is a list of all files that should be analyzed **or** a single CSV file with a listing of the fles that should be analyzed.


## Development

- If you want to use the `web` format, you need to build the [web project](../web/) first and run `yarn copy:web`.
- Install dependencies with `yarn install`
- Build the project with `yarn build`
- Run basic tests with `yarn test`

## How does Dolos work?

### Tokenization

To be immune to plagiarism where variables and functions are renamed, Dolos doesn't run directly on the source code subjected to the test. First a tokenization step is performed using [tree-sitter](http://tree-sitter.github.io/tree-sitter/). Tree-sitter can generate syntax trees for many languages and converts source code to a more structured form, free of naming variabilities.

For example, the code

```javascript
function sum(a, b) {
  return a + b;
}
```

is converted to something like this:

```
program ([0, 0] - [3, 0])
  function ([0, 0] - [2, 1])
    identifier ([0, 9] - [0, 12])
    formal_parameters ([0, 12] - [0, 18])
      identifier ([0, 13] - [0, 14])
      identifier ([0, 16] - [0, 17])
    statement_block ([0, 19] - [2, 1])
      return_statement ([1, 2] - [1, 15])
        binary_expression ([1, 9] - [1, 14])
          identifier ([1, 9] - [1, 10])
          identifier ([1, 13] - [1, 14])
```

Next, we can start looking for similarities in the submitted files.

### Substring matching

To measure similarities between (converted) files, Dolos tries to find common substrings between them.
We use substrings of a fixed length called k-mers. To efficiently make these comparisons and reduce the memory usage, all k-mers are hashed using a rolling hash function (the one used by Rabin-Karp in their string matching algorithm).

To further reduce the memory usage, only a subset of all hashes are stored. The selection of which hashes to store is done by the Winnowing algorithm as described in [[1]](http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf).

### Using an index

Because we want to compare all files with each other, it is more efficient to first create an index containing the hashes of all files. For each of the hash values encountered in any of the files, we store the file and corresponding line number where we encountered that hash.

Afterwards, if we want to check a file against the rest, we can simply compute all hash values for that file and look them up in the index. We can then aggregate the results of all matches and report on the most similar files.

[1] Saul Schleimer, Daniel S. Wilkerson, Alex Aiken, “Winnowing: local algorithms for document fingerprinting,” in Proceedings of the 2003 ACM SIGMOD International Conference on Management of Data, San Diego, California, 2003, pp. 76–85, doi: [0.1145/872757.872770](http://dx.doi.org/0.1145/872757.872770)
