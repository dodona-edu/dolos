---
next:
  text: "Adding a language to the Dolos CLI / lib"
  link: /guide/adding-languages.md
---

# How Dolos handles programming languages

The choice of which programming language you teach should not be limited by the availability of plagiarism detection tools.
That is why we design Dolos to be as language-agnostic as possible.
We use a generic parser model that is already commonly used such that many parser are available.

![Tree-sitter logo](https://tree-sitter.github.io/tree-sitter/assets/images/tree-sitter-small.png)

Dolos uses [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) parsers to  process source files.
In theory, Dolos supports all programming languages for which a Tree-sitter parser is available.
[The list of available parsers](https://tree-sitter.github.io/tree-sitter/#available-parsers) is sheer endless.

## Supported programming languages

Shipping Dolos with all languages installed would be impractical, and not all parsers are of the same quality or have been updated to the latest version of Tree-sitter.
That is why the Dolos CLI only ships with a selection of parsers installed by default.

Dolos CLI and the online service have out-of-the-box support for the most common programming languages:
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

## Requesting support for a new language

If you're using the Dolos Server and the language you want to use is not in the list above, you can request support
on our [issue tracker on GitHub](https://github.com/dodona-edu/dolos/issues/1029) or [by sending us an email](mailto:dodona@ugent.be).

## Adding a language locally

If you don't want to wait for us to add support for a new language, you can also add it yourself by running the [Dolos CLI](/guide/installation) and [locally installing an additional parser](/guide/adding-languages.md).

Let us know if you've been successful, so we can officially add support for the language in the next release of Dolos.
If you need help, you can contact use [on GitHub](https://github.com/dodona-edu/dolos/issues/1029) or [by sending us an email](mailto:dodona@ugent.be).
