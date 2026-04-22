# tree-sitter-grammars

A unified Rust crate that bundles tree-sitter grammar bindings for a wide range
of programming languages behind a single, ergonomic API.

It provides a [`Language`] enum and three helper functions to resolve a
`tree_sitter_language::LanguageFn` from a file path, file extension, or
language name string — acting as a thin, convenient wrapper around the
individual `tree-sitter-*` crates.

## Supported languages

| Language   | Feature flag       | Extensions                                      | Name aliases              |
|------------|--------------------|-------------------------------------------------|---------------------------|
| Bash       | `lang-bash`        | `.sh`, `.bash`                                  | `bash`, `shell`, `sh`     |
| C          | `lang-c`           | `.c`, `.h`                                      | `c`                       |
| C++        | `lang-cpp`         | `.cpp`, `.hpp`, `.cc`, `.cp`, `.cxx`, `.c++`, `.hh`, `.hxx`, `.h++` | `c++`, `cpp`              |
| C#         | `lang-csharp`      | `.cs`, `.csx`                                   | `c#`, `csharp`            |
| Dart       | `lang-dart`        | `.dart`                                         | `dart`                    |
| Elixir     | `lang-elixir`      | `.ex`, `.exs`                                   | `elixir`                  |
| Elm        | `lang-elm`         | `.elm`                                          | `elm`                     |
| Go         | `lang-go`          | `.go`                                           | `go`, `golang`            |
| Groovy     | `lang-groovy`      | `.groovy`, `.gvy`, `.gy`, `.gsh`                | `groovy`                  |
| Haskell    | `lang-haskell`     | `.hs`, `.lhs`                                   | `haskell`                 |
| Java       | `lang-java`        | `.java`                                         | `java`                    |
| JavaScript | `lang-javascript`  | `.js`                                           | `javascript`, `js`        |
| Julia      | `lang-julia`       | `.jl`                                           | `julia`                   |
| Kotlin     | `lang-kotlin`      | `.kt`, `.kts`                                   | `kotlin`                  |
| Lua        | `lang-lua`         | `.lua`                                          | `lua`                     |
| Modelica   | `lang-modelica`    | `.mo`                                           | `modelica`                |
| OCaml      | `lang-ocaml`       | `.ml`                                           | `ocaml`                   |
| Perl       | `lang-perl`        | `.pl`, `.pm`, `.t`                              | `perl`                    |
| PHP        | `lang-php`         | `.php`, `.php3`, `.php4`, `.php5`, `.php7`, `.phps`, `.phpt`, `.phtml` | `php`                     |
| Python     | `lang-python`      | `.py`, `.py3`                                   | `python`, `py`            |
| R          | `lang-r`           | `.r`, `.rdata`, `.rds`, `.rda`                  | `r`                       |
| Ruby       | `lang-ruby`        | `.rb`, `.rbw`                                   | `ruby`                    |
| Rust       | `lang-rust`        | `.rs`, `.rlib`                                  | `rust`                    |
| Scala      | `lang-scala`       | `.scala`, `.sc`                                 | `scala`                   |
| SQL        | `lang-sql`         | `.sql`                                          | `sql`                     |
| Swift      | `lang-swift`       | `.swift`                                        | `swift`                   |
| TSX        | `lang-tsx`         | `.tsx`                                          | `tsx`                     |
| TypeScript | `lang-typescript`  | `.ts`                                           | `typescript`, `ts`        |
| Verilog    | `lang-verilog`     | `.v`, `.vh`                                     | `verilog`                 |

## Installation

Add the crate to your `Cargo.toml` and enable the languages you need via `lang-*` feature flags.
**No languages are included by default.**

### Select specific languages

```toml
[dependencies]
tree-sitter-grammars = { version = "0.1", features = ["lang-python", "lang-javascript"] }
```

### Enable all languages

```toml
[dependencies]
tree-sitter-grammars = { version = "0.1", features = ["all-languages"] }
```

## Usage

### Resolve from a file path

```rust
use std::path::Path;
use tree_sitter_grammars::guess_grammar_from_path;

let lang = guess_grammar_from_path(Path::new("main.py"))
    .expect("unsupported file extension");

let ts_lang = lang.tree_sitter_language();
```

### Resolve from an extension

```rust
use std::ffi::OsStr;
use tree_sitter_grammars::guess_grammar_from_ext;

if let Some(lang) = guess_grammar_from_ext(OsStr::new("ts")) {
    let ts_lang = lang.tree_sitter_language();
}
```

### Resolve from a language name

```rust
use tree_sitter_grammars::guess_grammar_from_name;

if let Some(lang) = guess_grammar_from_name("golang") {
    let ts_lang = lang.tree_sitter_language();
}
```

### Use with `tree-sitter`

```rust
use tree_sitter::Parser;
use tree_sitter_grammars::Language;

let mut parser = Parser::new();
parser
    .set_language(&Language::Python.tree_sitter_language().into())
    .expect("failed to load grammar");
```

## License

Licensed under the MIT license.
