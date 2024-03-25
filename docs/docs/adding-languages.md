# Add a new language

Dolos is built on top of a [generic parser model](/about/languages.md) to achieve loose coupling with specific programming languages. 
As a result, it is fairly easy to add support for additional programming languages if a suitable parser is available.

Dolos bundles officially supported parsers in the [`dolos-parsers`](https://www.npmjs.com/package/@dodona/dolos-parsers) module.
[Let us know](https://github.com/dodona-edu/dolos/issues/1029) if you want to use a language that is not supported yet.

In addition, Dolos can automatically discover available [Tree-sitter parsers](https://tree-sitter.github.io/tree-sitter/) on the local system at runtime.
As such, if you are running Dolos locally, you can quickly add support for a new language by installing a Tree-sitter parser for that language in the `node_modules` on your system (Dolos searches `NODE_PATH`).

As an example, we demonstrate how the **Rust** programming language can be supported.

## Check availability

To assure that Dolos does not yet support the target programming language, simply run:

```shell
dolos -l rust *.rs
```

If no parser is available for the target language, you'll get this error message:

```
[error] Error: No tokenizer found for rust
```

## Find a parser

If no parser is available for the target programming language, 
search an appropriate parser [on the Tree-sitter website](https://tree-sitter.github.io/tree-sitter/#available-parsers)
or [on the Tree-sitter GitHub page](https://github.com/tree-sitter).

There exists a Rust parser named [`tree-sitter-rust`](https://github.com/tree-sitter/tree-sitter-rust).

::: tip
If the language you are looking for is not listed on either the website or GitHub, it might be that there is no parser available.
If that is the case, you can [contact us](/about/contact) and we will see if we can help.

It is possible to [create a new parser](https://tree-sitter.github.io/tree-sitter/creating-parsers), but this quickly becomes complicated.
:::

## Install the parser

First run the command `dolos --version` to check what version of Tree-sitter is currently used by Dolos.
The output will look like this:

```
Dolos v2.2.3
Node v18.16.0
Tree-sitter v0.20.1
```

Tree-sitter parsers must have the same (major) version as the core library,
so the version must be specified explicitly by suffixing the parser name with `@<version>`.
Dolos uses Tree-sitter v0.20.0 in the above example above,
so we need to install `tree-sitter-rust@0.20` in that case.
You may safely omit the minor version (the third number after the final dot).

Use `npm` to install a Tree-sitter parser for a specific programming language:

```shell
npm install -g tree-sitter-rust@0.20
```

## Start Dolos with the new parser

Dolos automatically detects newly installed parsers as soon as a new analysis is run.

Contact us on [GitHub](https://github.com/dodona-edu/dolos/issues/1029) if you need help with supporting additional programming languages.
