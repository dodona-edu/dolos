# Language support

In order to analyze the source code files, Dolos needs to parse them into tokens.
Dolos uses [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) which is
both a parser generator and an incremental parsing library. Dolos supports every
language supported by tree-sitter. [Which is a lot](https://tree-sitter.github.io/tree-sitter/#available-parsers).

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

If the parser is not installed, you can search for it [on their website](https://tree-sitter.github.io/tree-sitter/#available-parsers)
or [on their GitHub site](https://github.com/tree-sitter).

We are lucky: a Rust parser [exists](https://github.com/tree-sitter/tree-sitter-rust) and the package is named, unsurprisingly, `tree-sitter-rust`.

::: tip
If the language you are looking for is not listed on either the website or GitHub, it might be that there is no parser available.
If that is the case, you can [contact us](mailto:dodona@ugent.be) and we will see if we can help.

It is possible to [create a new parser](https://tree-sitter.github.io/tree-sitter/creating-parsers), but this quickly becomes complicated. 
:::

### Install the parser

Just like we installed Dolos itself, we can install a new parser using `npm` or `yarn`:
```shell
npm install -g tree-sitter-rust@0.19
```

::: warning
Since Tree-sitter is evolving quickly, you often need to pass the specific version
of the parser supported by Dolos. You can specify an older version of a parser by
suffixing it with `@<version>` like we did in the example.
:::

### Start Dolos with the new parser

Once the parser is installed, Dolos will be able to detect the new parser, and you
can run the analysis on your files.