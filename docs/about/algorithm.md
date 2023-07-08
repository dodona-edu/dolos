# How Dolos works

Conceptually, the plagiarism detection pipeline of Dolos can be split into four successive steps:

1. Tokenization
2. Fingerprinting
3. Indexing
4. Reporting

## Tokenization

To be immune against masking plagiarism by techniques such as renaming variables and functions, Dolos
doesn't directly process the source code under investigation. It starts by performing a
tokenization step using [Tree-sitter](http://tree-sitter.github.io/tree-sitter/).
Tree-sitter can generate syntax trees for many programming languages, converts source code
to a more structured form, and masks specific naming of variables and functions.

For example, the JavaScript code

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

Based on this representation, Dolos starts looking for similarities among the submitted files.

## Fingerprinting

To measure similarities between (converted) files, Dolos tries to find common
sequences of tokens. More specifically, it uses subsequences of fixed length called _k_-grams.
To efficiently make these comparisons and reduce the memory usage, all _k_-grams
are hashed using a rolling hash function (the one used by Rabin-Karp in their
string matching algorithm). The length _k_ of _k_-grams can be with the `-k`
option.

To further reduce the memory usage, only a subset of all hashes are stored. The
selection of hashes is done by the Winnowing algorithm as
described by [(Schleimer, Wilkerson and Aiken)](http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf). In short: only the hash with the smallest numerical
value is kept for each window. The window length (in _k_-grams) can be altered
with the `-w` option.

The remaining hashes are the **fingerprints** of the analyzed files. Internally,
these are stored as simple integers.

## Indexing

Because Dolos needs to compare all files with each other, it is more efficient to
first create an index containing the fingerprints of all files. For each of the
fingerprints encountered in any of the files, we store the file and the
corresponding line number where we encountered that fingerprint.

As soon as a fingerprint is stored in the index twice, this is recorded as a match
between the two files because they share at least one k-gram.

## Reporting

Dolos finally collects all fingerprints that occur in more than one file and
aggregates the results into a report.

This report contains all file pairs that have at least one common fingerprint, together with some metrics:

- **similarity**: the fraction of shared fingerprints between the two files
- **total overlap**: the absolute value of shared fingerprints, useful for larger projects
- **longest fragment**: the length (in fingerprints) of the longest subsequence of fingerprints matching between the two files, useful when not the whole source code is copied
