# Supported programming languages

Dolos uses [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) parsers to
process source files. As a result, Dolos supports all programming languages for
which a Tree-sitter parser is available.
[The list of available parsers](https://tree-sitter.github.io/tree-sitter/#available-parsers) 
is sheer endless

![Tree-sitter logo](https://tree-sitter.github.io/tree-sitter/assets/images/tree-sitter-small.png)

Each of these parsers has its own package which needs to be installed if you want
to use it. By default, Dolos ships out-of-the box with parsers installed for the
most common programming languages:
- JavaScript
- Java
- Python
- C
- C#
- Bash

However, adding a new language is very easy.

## Adding a new language

Dolos discovers tree-sitter parsers at runtime. This means that in order to add
support for a new language, you only need that parser to be available on your
system in your `NODE_PATH`.

We will demonstrate this by adding language support for the programming language **Rust**.

### Check availability

To make sure Dolos doesn't already support the desired language, you can simply start
an anlysis:

```shell
dolos -l rust *.rs
```

If the parser is not installed, you will get an error message:
```
[error] Error: No tokenizer found for rust
```

### Find a parser

If the parser is not installed, you can search for it [on the Tree-sitter website](https://tree-sitter.github.io/tree-sitter/#available-parsers)
or [on the Tree-sitter GitHub page](https://github.com/tree-sitter).

A Rust parser [exists](https://github.com/tree-sitter/tree-sitter-rust) and the package is named, unsurprisingly, `tree-sitter-rust`.

::: tip
If the language you are looking for is not listed on either the website or GitHub, it might be that there is no parser available.
If that is the case, you can [contact us](mailto:dodona@ugent.be) and we will see if we can help.

It is possible to [create a new parser](https://tree-sitter.github.io/tree-sitter/creating-parsers), but this quickly becomes complicated. 
:::

### Install the parser

First, you need to check which version of Tree-sitter Dolos is currently using,
by running the command `dolos --version`. The output will look like this:

```
Dolos v1.0.1
Node v14.17.3
Tree-sitter v0.19.0
```

Tree-sitter parsers need to have the same (major) version of the core library,
so you will need to specify the version explicitly by suffixing the parser name
with `@<version>`. In the example above, Dolos is using Tree-sitter v0.19.0, so
you would need to install `tree-sitter-rust@0.19`. You may safely omit the minor
version (the numbers after the last dot).

Install a Tree-sitter parser for a specific programming language using `npm` or `yarn`:
```shell
npm install -g tree-sitter-rust@0.19
```
### Start Dolos with the new parser

Once the parser is installed, Dolos will be able to detect the new parser, and you
can run the analysis on your files.