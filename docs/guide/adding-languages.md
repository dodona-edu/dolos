# Adding a new language

Dolos is designed to use a [generic parser model](/about/languages.md), which means that it it  relatively easy to add support for a new language if a parser is available.

Dolos discovers tree-sitter parsers at runtime. This means that in order to add
support for a new language, you only need that parser to be available on your
system in your `node_modules` (Dolos searches in the `NODE_PATH`).

We will demonstrate this by adding language support for the programming language **Rust**.

## Check availability

To make sure Dolos doesn't already support the desired language, you can simply start
an analysis:

```shell
dolos -l rust *.rs
```

If the parser is not installed, you will get an error message:
```
[error] Error: No tokenizer found for rust
```

## Find a parser

If the parser is not installed, you can search for it [on the Tree-sitter website](https://tree-sitter.github.io/tree-sitter/#available-parsers)
or [on the Tree-sitter GitHub page](https://github.com/tree-sitter).

A Rust parser [exists](https://github.com/tree-sitter/tree-sitter-rust) and the package is named, unsurprisingly, `tree-sitter-rust`.

::: tip
If the language you are looking for is not listed on either the website or GitHub, it might be that there is no parser available.
If that is the case, you can [contact us](mailto:dodona@ugent.be) and we will see if we can help.

It is possible to [create a new parser](https://tree-sitter.github.io/tree-sitter/creating-parsers), but this quickly becomes complicated.
:::

## Install the parser

First, you need to check which version of Tree-sitter Dolos is currently using,
by running the command `dolos --version`. The output will look like this:

```
Dolos v2.2.3
Node v18.16.0
Tree-sitter v0.20.1
```

Tree-sitter parsers need to have the same (major) version of the core library,
so you will need to specify the version explicitly by suffixing the parser name
with `@<version>`. In the example above, Dolos is using Tree-sitter v0.20.0, so
you would need to install `tree-sitter-rust@0.20`. You may safely omit the minor
version (the numbers after the last dot).

Install a Tree-sitter parser for a specific programming language using `npm` or `yarn`:
```shell
npm install -g tree-sitter-rust@0.20
```
## Start Dolos with the new parser

Once the parser is installed, Dolos will be able to detect the new parser, and you
can run the analysis on your files. If you need help, you can always contact us
[on GitHub](https://github.com/dodona-edu/dolos/issues/1029).
