# dolos-rs

A Rust implementation of the [Dolos](https://github.com/dodona-edu/dolos) source code plagiarism detection CLI.

> **Note:** This project is intended to eventually replace the existing Node.js CLI in the main Dolos repository.

## Workspace crates

- **[`dolos-cli`](./dolos-cli/)** — the Rust CLI (the `dolos` binary) for running similarity analyses on source code files.
- **[`dolos-lib`](./dolos-lib/)** — the library (`dolos`) implementing tokenization, winnowing, the reader and the report. The per-language feature flags live here.
- **[`dolos-core`](./dolos-core/)** — the pure computational core: the generalized suffix tree, the maximal-exact-match analysis and the pairwise similarity metrics. It has no dependencies.
- **[`dolos-core-wasm`](./dolos-core-wasm/)** — the JavaScript binding of `dolos-core`, built for WebAssembly. See [WebAssembly](#webassembly).
- **[`tree-sitter-grammars`](./tree-sitter-grammars/)** — a unified crate that bundles tree-sitter grammar bindings for 29 programming languages behind a single ergonomic API. It also defines the `char` language for plain text, which has no grammar. See its [README](./tree-sitter-grammars/README.md) for details.

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

# Analyze plain text (.txt, .md) with one token per character
dolos run -l char essay1.txt essay2.txt

# Output results as CSV
dolos run --output-format csv --output-destination ./results/ path/to/files/
```

## WebAssembly

The `dolos-core-wasm` crate builds `dolos-core` for the browser, so a frontend
can run the analysis itself. It holds the JavaScript binding, so `dolos-core`
itself has no dependencies.

```sh
rustup target add wasm32-unknown-unknown
wasm-pack build dolos-core-wasm --target web --release
```

This writes the npm package `dolos-core-wasm` to `dolos-core-wasm/pkg/`, which
git ignores. The package version follows the crate version.

The package loads its `.wasm` file in `init()`. Await it once before the first
call into the package. It works with any bundler and without one.

```ts
import init, { analyze } from "dolos-core-wasm";

await init();

// `ignored` holds the positions to leave out, one list of `{ start, end }`
// intervals per sequence. Pass `null` to ignore nothing.
using analysis = analyze(fingerprints, ignored, { minMatchLength: 5, keepMatches: true });

const metrics = analysis.metrics(0, 1);
const matches = analysis.matches(0, 1);
```

`Analysis` holds the result in WebAssembly memory and converts one pair per call,
so an analysis over hundreds of files stays cheap. Release it with `free()`, or
declare it with `using` as above.

For exactly two sequences, `analyzePair` returns the metrics and the matches as
plain data, so there is nothing to release:

```ts
import init, { analyzePair } from "dolos-core-wasm";

await init();

const { metrics, matches } = analyzePair(
  { fingerprints: leftFingerprints, ignored: leftIgnored },
  { fingerprints: rightFingerprints, ignored: rightIgnored },
  { minMatchLength: 5 },
);
```

In Node.js, `init()` cannot fetch the `.wasm` file. Pass its bytes instead:

```ts
import { readFile } from "node:fs/promises";
import init from "dolos-core-wasm";

const wasm = new URL(import.meta.resolve("dolos-core-wasm/dolos_core_wasm_bg.wasm"));
await init({ module_or_path: await readFile(wasm) });
```

## Who made this?

Dolos is an active research project by [Team Dolos](https://dolos.ugent.be/) at Ghent University. If you use this software for your research, please cite:

- Maertens et al. (2024) SoftwareX [doi:10.1016/j.softx.2024.101755](https://doi.org/10.1016/j.softx.2024.101755)

## AI disclosure

Parts of the code and documentation in this repository were written with the help of an AI coding assistant, [Claude Code](https://claude.com/claude-code).
A human maintainer reviews these changes before they are merged.

## License

Licensed under the [MIT license](./LICENSE).
