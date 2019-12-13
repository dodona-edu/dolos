# Dolos

Plagiarism detection for computer programming assignments.

Right now, C#, Java, JavaScript and Python are officially supported. Additional languages for which a [tree-sitter grammar](https://yarnpkg.com/en/packages?q=tree-sitter-) is available might also work.

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

To further reduce the memory usage, only a subset of all hashes are stored. The selection of which hashes to store is done by the Winnowing algorithm as described in [http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf](http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf).

### Using an index

Because we want to compare all files with each other, it is more efficient to first create an index containing the hashes of all files. For each of the hash values encountered in any of the files, we store the file and corresponding line number where we encountered that hash.

Afterwards, if we want to check a file against the rest, we can simply compute all hash values for that file and look them up in the index. We can then aggregate the results of all matches and report on the most similar files.

## How to get this code running

- Make sure Node 10 is installed. Node 12 is not supported by tree-sitter, one of our dependencies.
- Clone the repository
- Run `yarn install` to install all dependencies
- If you want to generate plain JS files, run `yarn build` and the `dist` folder should be created
- Running `yarn test` will run all tests
- Running `yarn lint` will run the linter
- Running `yarn start` will compile everything and run the `app.js` file. Additional arguments are required, use the --help option for more information.

## Contributing

Please adhere to the linter rules. They are quite strict at the moment, but
they are open for discussion.

You can run the linter before each commit (and prevent a commit from happening
if there are any errors) by linking the pre-commit file:
`ln -s ../../.hooks/pre-commit .git/hooks/`.

Our CI will test and lint each pull request automatically, showing any failing
tests of linter errors.
