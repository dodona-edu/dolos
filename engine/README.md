# dolos-rs

A Rust implementation of the [Dolos](https://github.com/dodona-edu/dolos) source code plagiarism detection CLI.

> **Note:** This project is intended to eventually replace the existing Node.js CLI in the main Dolos repository.

## Workspace crates

- **[`dolos-cli`](./dolos-cli/)** — the Rust CLI (the `dolos` binary) for running similarity analyses on source code files.
- **[`dolos-lib`](./dolos-lib/)** — the core library (`dolos`) implementing tokenization, suffix-tree construction, and the pairwise similarity metrics. The per-language feature flags live here.
- **[`tree-sitter-grammars`](./tree-sitter-grammars/)** — a unified crate that bundles tree-sitter grammar bindings for 29 programming languages behind a single ergonomic API. See its [README](./tree-sitter-grammars/README.md) for details.

## Building

Requires a recent stable Rust toolchain. To build the CLI (which bundles support for all languages):

```sh
cargo build -p dolos-cli
```

The per-language feature flags are defined on `dolos-lib`. To depend on the
library with only specific languages, enable the corresponding features:

```sh
# In your Cargo.toml
dolos-lib = { path = "../dolos-lib", default-features = false, features = ["lang-python", "lang-javascript"] }
```

## Usage

```sh
# Analyze a directory of files
dolos run path/to/files/

# Analyze specific files
dolos run file1.py file2.py file3.py

# Output results as CSV
dolos run --output-format csv --output-destination ./results/ path/to/files/
```

## Who made this?

Dolos is an active research project by [Team Dodona](https://dodona.ugent.be/en/about/) at Ghent University. If you use this software for your research, please cite:

- Maertens et al. (2024) SoftwareX [doi:10.1016/j.softx.2024.101755](https://doi.org/10.1016/j.softx.2024.101755)

## License

Licensed under the [MIT license](./LICENSE).
