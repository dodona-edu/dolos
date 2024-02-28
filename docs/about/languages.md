---
next:
  text: "Adding a language to the Dolos CLI / lib"
  link: /guide/adding-languages.md
---

# How Dolos handles programming languages

Your choice of programming languages in teaching should not restrict how easily you can detect plagiarism.
That's why the plagiarism detection pipeline of Dolos is built on top of a generic parser model that supports the broadest possible array of programming languages.

![Tree-sitter logo](https://tree-sitter.github.io/tree-sitter/assets/images/tree-sitter-small.png)

Dolos uses [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) parsers to process source files.
As such, Dolos supports all programming languages for which a Tree-sitter parser is available.
[The list of available parsers](https://tree-sitter.github.io/tree-sitter/#available-parsers) is sheer endless and still growing.

## Supported programming languages

Shipping Dolos with all languages readily installed would be impractical.
Moreover, not all parsers are of the same quality or have been updated to the latest version of Tree-sitter.
That's why we only ship the Dolos CLI with a default selection of high-quality parsers.

Dolos and Dolos CLI have out-of-the-box support for the most commonly used programming languages:

- Bash
- C
- C++
- C#
- Elm
- JavaScript
- Java
- PHP
- Python
- Typescript
- ...

## Requesting support for a new language

If you're using Dolos and your programming language of choice is not in the above list, you can request support
on our [issue tracker on GitHub](https://github.com/dodona-edu/dolos/issues/1029) or [by contacting us](/about/contact).

## Adding a language locally

If you don't want to wait on our support to add a new language, you can also add it yourself by running the [Dolos CLI](/docs/installation) and [installing additional parsers locally](/docs/adding-languages.md).

