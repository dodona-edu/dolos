# dolos-rs

A Rust implementation of the [Dolos](https://github.com/dodona-edu/dolos) source code plagiarism detection CLI.

> **Note:** This project is intended to eventually replace the existing Node.js CLI in the main Dolos repository.

## Workspace crates

- **[`dolos-cli`](./dolos-cli/)** — the Rust CLI (the `dolos` binary) for running similarity analyses on source code files.
- **[`dolos-lib`](./dolos-lib/)** — the library (`dolos`) implementing tokenization, winnowing, the reader and the report. The per-language feature flags live here.
- **[`dolos-core`](./dolos-core/)** — the pure computational core: the generalized suffix tree, the maximal-exact-match analysis and the pairwise similarity metrics. It has no dependencies, and it also builds for WebAssembly.
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

## WebAssembly

`dolos-core` builds for the browser, so a frontend can run the analysis itself.
The binding is behind the opt-in `wasm` feature, so a normal build pulls none of
its dependencies.

```sh
rustup target add wasm32-unknown-unknown
wasm-pack build dolos-core --target bundler --release -- --features wasm
```

This writes the npm package `dolos-core` to `dolos-core/pkg/`, which git
ignores. The package version follows the crate version.

```ts
import { analyze } from "dolos-core";

// `ignored` holds the positions to leave out, one list of `{ start, end }`
// intervals per sequence. Pass `null` to ignore nothing.
using analysis = analyze(fingerprints, ignored, { minMatchLength: 5, keepMatches: true });

const metrics = analysis.metrics(0, 1);
const matches = analysis.matches(0, 1);
```

`Analysis` holds the result in WebAssembly memory and converts one pair per call,
so an analysis over hundreds of files stays cheap. Release it with `free()`, or
declare it with `using` as above.

Vite 8.1 and later need no plugin. Earlier versions need
[`vite-plugin-wasm`](https://www.npmjs.com/package/vite-plugin-wasm) and
`build.target: "esnext"`.

## Who made this?

Dolos is an active research project by [Team Dolos](https://dolos.ugent.be/) at Ghent University. If you use this software for your research, please cite:

- Maertens et al. (2024) SoftwareX [doi:10.1016/j.softx.2024.101755](https://doi.org/10.1016/j.softx.2024.101755)

## License

Licensed under the [MIT license](./LICENSE).
