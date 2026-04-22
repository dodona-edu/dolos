//! Tree-sitter grammar bindings for a wide range of programming languages.
//!
//! Provides a unified [`Language`] enum and helper functions to resolve a
//! [`tree_sitter_language::LanguageFn`] from a file path, file extension, or
//! language name string.
//!
//! For installation instructions, the full list of supported languages, and
//! usage examples, see the [README](https://github.com/your-org/dolos-rs/tree/main/tree-sitter-grammars).

use std::ffi::OsStr;
use std::path::Path;

/// An enum with all the supported programming languages.
/// Each variant is only available if the corresponding `lang-*` feature is enabled.
#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum Language {
    #[cfg(feature = "lang-bash")]
    Bash,
    #[cfg(feature = "lang-c")]
    C,
    #[cfg(feature = "lang-cpp")]
    Cpp,
    #[cfg(feature = "lang-csharp")]
    CSharp,
    #[cfg(feature = "lang-dart")]
    Dart,
    #[cfg(feature = "lang-elixir")]
    Elixir,
    #[cfg(feature = "lang-elm")]
    Elm,
    #[cfg(feature = "lang-go")]
    Go,
    #[cfg(feature = "lang-groovy")]
    Groovy,
    #[cfg(feature = "lang-haskell")]
    Haskell,
    #[cfg(feature = "lang-java")]
    Java,
    #[cfg(feature = "lang-javascript")]
    Javascript,
    #[cfg(feature = "lang-julia")]
    Julia,
    #[cfg(feature = "lang-kotlin")]
    Kotlin,
    #[cfg(feature = "lang-lua")]
    Lua,
    #[cfg(feature = "lang-modelica")]
    Modelica,
    #[cfg(feature = "lang-ocaml")]
    Ocaml,
    #[cfg(feature = "lang-perl")]
    Perl,
    #[cfg(feature = "lang-php")]
    Php,
    #[cfg(feature = "lang-python")]
    Python,
    #[cfg(feature = "lang-r")]
    R,
    #[cfg(feature = "lang-ruby")]
    Ruby,
    #[cfg(feature = "lang-rust")]
    Rust,
    #[cfg(feature = "lang-scala")]
    Scala,
    #[cfg(feature = "lang-sql")]
    Sql,
    #[cfg(feature = "lang-swift")]
    Swift,
    #[cfg(feature = "lang-typescript")]
    Typescript,
    #[cfg(feature = "lang-tsx")]
    Tsx,
    #[cfg(feature = "lang-verilog")]
    Verilog,
}

/// Infer a [`Language`] from the extension of the given file path.
///
/// The extension is extracted with [`Path::extension`] and forwarded to
/// [`guess_grammar_from_ext`]. Panics if the path has no extension.
///
/// # Examples
///
/// ```rust,ignore
/// use std::path::Path;
/// use tree_sitter_grammars::guess_grammar_from_path;
///
/// assert!(guess_grammar_from_path(Path::new("main.py")).is_some());
/// assert!(guess_grammar_from_path(Path::new("unknown.xyz")).is_none());
/// ```
pub fn guess_grammar_from_path(path: &Path) -> Option<Language> {
    guess_grammar_from_ext(path.extension().expect("file has no extension"))
}

/// Infer a [`Language`] from a raw file extension.
///
/// The comparison is **case-insensitive**. Returns `None` if the extension is
/// not recognized or if the corresponding `lang-*` feature is not enabled.
///
/// # Examples
///
/// ```rust,ignore
/// use std::ffi::OsStr;
/// use tree_sitter_grammars::guess_grammar_from_ext;
/// use tree_sitter_grammars::Language;
///
/// assert_eq!(guess_grammar_from_ext(OsStr::new("py")), Some(Language::Python));
/// assert_eq!(guess_grammar_from_ext(OsStr::new("xyz")), None);
/// ```
pub fn guess_grammar_from_ext(ext: &OsStr) -> Option<Language> {
    match ext.to_ascii_lowercase().to_str()? {
        #[cfg(feature = "lang-bash")]
        "sh" | "bash" => Some(Language::Bash),
        #[cfg(feature = "lang-c")]
        "c" | "h" => Some(Language::C),
        #[cfg(feature = "lang-cpp")]
        "cpp" | "hpp" | "cc" | "cp" | "cxx" | "c++" | "hh" | "hxx" | "h++" => Some(Language::Cpp),
        #[cfg(feature = "lang-csharp")]
        "cs" | "csx" => Some(Language::CSharp),
        #[cfg(feature = "lang-dart")]
        "dart" => Some(Language::Dart),
        #[cfg(feature = "lang-elixir")]
        "ex" | "exs" => Some(Language::Elixir),
        #[cfg(feature = "lang-elm")]
        "elm" => Some(Language::Elm),
        #[cfg(feature = "lang-go")]
        "go" => Some(Language::Go),
        #[cfg(feature = "lang-groovy")]
        "groovy" | "gvy" | "gy" | "gsh" => Some(Language::Groovy),
        #[cfg(feature = "lang-haskell")]
        "hs" | "lhs" => Some(Language::Haskell),
        #[cfg(feature = "lang-java")]
        "java" => Some(Language::Java),
        #[cfg(feature = "lang-javascript")]
        "js" => Some(Language::Javascript),
        #[cfg(feature = "lang-julia")]
        "jl" => Some(Language::Julia),
        #[cfg(feature = "lang-kotlin")]
        "kt" | "kts" => Some(Language::Kotlin),
        #[cfg(feature = "lang-lua")]
        "lua" => Some(Language::Lua),
        #[cfg(feature = "lang-modelica")]
        "mo" => Some(Language::Modelica),
        #[cfg(feature = "lang-ocaml")]
        "ml" => Some(Language::Ocaml),
        #[cfg(feature = "lang-perl")]
        "pl" | "pm" | "t" => Some(Language::Perl),
        #[cfg(feature = "lang-php")]
        "php" | "php3" | "php4" | "php5" | "php7" | "phps" | "phpt" | "phtml" => {
            Some(Language::Php)
        }
        #[cfg(feature = "lang-python")]
        "py" | "py3" => Some(Language::Python),
        #[cfg(feature = "lang-r")]
        "r" | "rdata" | "rds" | "rda" => Some(Language::R),
        #[cfg(feature = "lang-ruby")]
        "rb" | "rbw" => Some(Language::Ruby),
        #[cfg(feature = "lang-rust")]
        "rs" | "rlib" => Some(Language::Rust),
        #[cfg(feature = "lang-scala")]
        "scala" | "sc" => Some(Language::Scala),
        #[cfg(feature = "lang-sql")]
        "sql" => Some(Language::Sql),
        #[cfg(feature = "lang-swift")]
        "swift" => Some(Language::Swift),
        #[cfg(feature = "lang-typescript")]
        "ts" => Some(Language::Typescript),
        #[cfg(feature = "lang-tsx")]
        "tsx" => Some(Language::Tsx),
        #[cfg(feature = "lang-verilog")]
        "v" | "vh" => Some(Language::Verilog),
        _ => None,
    }
}

/// Infer a [`Language`] from a human-readable language name.
///
/// Common aliases are accepted (e.g. `"js"` for JavaScript, `"golang"` for
/// Go, `"py"` for Python). The comparison is **case-insensitive**. Returns
/// `None` if the name is not recognized or if the corresponding `lang-*`
/// feature is not enabled.
///
/// # Examples
///
/// ```rust,ignore
/// use tree_sitter_grammars::guess_grammar_from_name;
/// use tree_sitter_grammars::Language;
///
/// assert_eq!(guess_grammar_from_name("python"), Some(Language::Python));
/// assert_eq!(guess_grammar_from_name("golang"), Some(Language::Go));
/// assert_eq!(guess_grammar_from_name("unknown"), None);
/// ```
pub fn guess_grammar_from_name(name: &str) -> Option<Language> {
    match name.to_ascii_lowercase().as_str() {
        #[cfg(feature = "lang-bash")]
        "bash" | "shell" | "sh" => Some(Language::Bash),
        #[cfg(feature = "lang-c")]
        "c" => Some(Language::C),
        #[cfg(feature = "lang-cpp")]
        "c++" | "cpp" => Some(Language::Cpp),
        #[cfg(feature = "lang-csharp")]
        "c#" | "csharp" => Some(Language::CSharp),
        #[cfg(feature = "lang-dart")]
        "dart" => Some(Language::Dart),
        #[cfg(feature = "lang-elixir")]
        "elixir" => Some(Language::Elixir),
        #[cfg(feature = "lang-elm")]
        "elm" => Some(Language::Elm),
        #[cfg(feature = "lang-go")]
        "go" | "golang" => Some(Language::Go),
        #[cfg(feature = "lang-groovy")]
        "groovy" => Some(Language::Groovy),
        #[cfg(feature = "lang-haskell")]
        "haskell" => Some(Language::Haskell),
        #[cfg(feature = "lang-java")]
        "java" => Some(Language::Java),
        #[cfg(feature = "lang-javascript")]
        "javascript" | "js" => Some(Language::Javascript),
        #[cfg(feature = "lang-julia")]
        "julia" => Some(Language::Julia),
        #[cfg(feature = "lang-kotlin")]
        "kotlin" => Some(Language::Kotlin),
        #[cfg(feature = "lang-lua")]
        "lua" => Some(Language::Lua),
        #[cfg(feature = "lang-modelica")]
        "modelica" => Some(Language::Modelica),
        #[cfg(feature = "lang-ocaml")]
        "ocaml" => Some(Language::Ocaml),
        #[cfg(feature = "lang-perl")]
        "perl" => Some(Language::Perl),
        #[cfg(feature = "lang-php")]
        "php" => Some(Language::Php),
        #[cfg(feature = "lang-python")]
        "python" | "py" => Some(Language::Python),
        #[cfg(feature = "lang-r")]
        "r" => Some(Language::R),
        #[cfg(feature = "lang-ruby")]
        "ruby" => Some(Language::Ruby),
        #[cfg(feature = "lang-rust")]
        "rust" => Some(Language::Rust),
        #[cfg(feature = "lang-scala")]
        "scala" => Some(Language::Scala),
        #[cfg(feature = "lang-sql")]
        "sql" => Some(Language::Sql),
        #[cfg(feature = "lang-swift")]
        "swift" => Some(Language::Swift),
        #[cfg(feature = "lang-typescript")]
        "typescript" | "ts" => Some(Language::Typescript),
        #[cfg(feature = "lang-tsx")]
        "tsx" => Some(Language::Tsx),
        #[cfg(feature = "lang-verilog")]
        "verilog" => Some(Language::Verilog),
        _ => None,
    }
}

impl Language {
    /// Returns `true` if the file at `path` is written in this language,
    /// determined by the file extension.
    ///
    /// # Examples
    ///
    /// ```rust,ignore
    /// use std::path::Path;
    /// use tree_sitter_grammars::Language;
    ///
    /// assert!(Language::Python.matches(Path::new("script.py")));
    /// assert!(!Language::Python.matches(Path::new("main.rs")));
    /// ```
    pub fn matches(&self, path: &Path) -> bool {
        if let Some(lang) = guess_grammar_from_path(path) {
            return self == &lang;
        };
        false
    }

    /// Returns the underlying [`tree_sitter_language::LanguageFn`] for this
    /// language, which can be passed directly to `tree_sitter::Parser::set_language`.
    ///
    /// # Examples
    ///
    /// ```rust,ignore
    /// use tree_sitter::Parser;
    /// use tree_sitter_grammars::Language;
    ///
    /// let mut parser = Parser::new();
    /// parser.set_language(&Language::Python.tree_sitter_language().into()).unwrap();
    /// ```
    pub fn tree_sitter_language(self) -> tree_sitter_language::LanguageFn {
        match self {
            #[cfg(feature = "lang-bash")]
            Language::Bash => tree_sitter_bash::LANGUAGE,
            #[cfg(feature = "lang-c")]
            Language::C => tree_sitter_c::LANGUAGE,
            #[cfg(feature = "lang-cpp")]
            Language::Cpp => tree_sitter_cpp::LANGUAGE,
            #[cfg(feature = "lang-csharp")]
            Language::CSharp => tree_sitter_c_sharp::LANGUAGE,
            #[cfg(feature = "lang-dart")]
            Language::Dart => tree_sitter_dart::LANGUAGE,
            #[cfg(feature = "lang-elixir")]
            Language::Elixir => tree_sitter_elixir::LANGUAGE,
            #[cfg(feature = "lang-elm")]
            Language::Elm => tree_sitter_elm::LANGUAGE,
            #[cfg(feature = "lang-go")]
            Language::Go => tree_sitter_go::LANGUAGE,
            #[cfg(feature = "lang-groovy")]
            Language::Groovy => tree_sitter_groovy::LANGUAGE,
            #[cfg(feature = "lang-haskell")]
            Language::Haskell => tree_sitter_haskell::LANGUAGE,
            #[cfg(feature = "lang-java")]
            Language::Java => tree_sitter_java::LANGUAGE,
            #[cfg(feature = "lang-javascript")]
            Language::Javascript => tree_sitter_javascript::LANGUAGE,
            #[cfg(feature = "lang-julia")]
            Language::Julia => tree_sitter_julia::LANGUAGE,
            #[cfg(feature = "lang-kotlin")]
            Language::Kotlin => tree_sitter_kotlin::LANGUAGE,
            #[cfg(feature = "lang-lua")]
            Language::Lua => tree_sitter_lua::LANGUAGE,
            #[cfg(feature = "lang-modelica")]
            Language::Modelica => tree_sitter_modelica::LANGUAGE,
            #[cfg(feature = "lang-ocaml")]
            Language::Ocaml => tree_sitter_ocaml::LANGUAGE_OCAML,
            #[cfg(feature = "lang-perl")]
            Language::Perl => tree_sitter_perl::LANGUAGE,
            #[cfg(feature = "lang-php")]
            Language::Php => tree_sitter_php::LANGUAGE_PHP,
            #[cfg(feature = "lang-python")]
            Language::Python => tree_sitter_python::LANGUAGE,
            #[cfg(feature = "lang-r")]
            Language::R => tree_sitter_r::LANGUAGE,
            #[cfg(feature = "lang-ruby")]
            Language::Ruby => tree_sitter_ruby::LANGUAGE,
            #[cfg(feature = "lang-rust")]
            Language::Rust => tree_sitter_rust::LANGUAGE,
            #[cfg(feature = "lang-scala")]
            Language::Scala => tree_sitter_scala::LANGUAGE,
            #[cfg(feature = "lang-sql")]
            Language::Sql => tree_sitter_sequel::LANGUAGE,
            #[cfg(feature = "lang-swift")]
            Language::Swift => tree_sitter_swift::LANGUAGE,
            #[cfg(feature = "lang-typescript")]
            Language::Typescript => tree_sitter_typescript::LANGUAGE_TYPESCRIPT,
            #[cfg(feature = "lang-tsx")]
            Language::Tsx => tree_sitter_typescript::LANGUAGE_TSX,
            #[cfg(feature = "lang-verilog")]
            Language::Verilog => tree_sitter_verilog::LANGUAGE,
        }
    }
}
