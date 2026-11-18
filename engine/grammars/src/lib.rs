//! Tree-sitter grammar bindings for a wide range of programming languages.
//!
//! Provides a [`Language`] enum that maps language names and file extensions to a
//! [`tree_sitter_language::LanguageFn`]. [`Language::Char`] for plain text has no
//! grammar.
//!
//! For installation instructions, the full list of supported languages, and
//! usage examples, see the [README](https://github.com/dodona-edu/dolos-rs/tree/main/tree-sitter-grammars).
//!
//! # Examples
//!
//! ```
//! # #[cfg(feature = "lang-python")] {
//! use tree_sitter_grammars::Language;
//! use std::path::Path;
//!
//! assert_eq!(Language::from_path(Path::new("src/main.py")), [Language::Python]);
//! # }
//! ```

use std::ffi::OsStr;
use std::path::Path;
use tree_sitter_language::LanguageFn;

/// An enum with all the supported languages.
/// Each variant with a grammar is only available if the corresponding `lang-*`
/// feature is enabled.
#[derive(Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Clone, Copy)]
pub enum Language {
    #[cfg(feature = "lang-bash")]
    Bash,
    #[cfg(feature = "lang-c")]
    C,
    /// Plain text. It has no grammar and no `lang-*` feature.
    Char,
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

/// The names, file extensions and tree-sitter grammar of one language.
struct Grammar {
    /// First the name, then its aliases, such as `"golang"`.
    names: &'static [&'static str],
    /// Lowercase file extensions, without the dot.
    extensions: &'static [&'static str],
    /// `None` for a language without a tree-sitter grammar.
    tree_sitter: Option<LanguageFn>,
}

impl Language {
    /// Every language with an enabled `lang-*` feature, and [`Language::Char`].
    ///
    /// # Examples
    ///
    /// ```
    /// # #[cfg(feature = "lang-python")] {
    /// use tree_sitter_grammars::Language;
    ///
    /// assert!(Language::ALL.contains(&Language::Python));
    /// # }
    /// ```
    pub const ALL: &'static [Language] = &[
        #[cfg(feature = "lang-bash")]
        Language::Bash,
        #[cfg(feature = "lang-c")]
        Language::C,
        Language::Char,
        #[cfg(feature = "lang-cpp")]
        Language::Cpp,
        #[cfg(feature = "lang-csharp")]
        Language::CSharp,
        #[cfg(feature = "lang-dart")]
        Language::Dart,
        #[cfg(feature = "lang-elixir")]
        Language::Elixir,
        #[cfg(feature = "lang-elm")]
        Language::Elm,
        #[cfg(feature = "lang-go")]
        Language::Go,
        #[cfg(feature = "lang-groovy")]
        Language::Groovy,
        #[cfg(feature = "lang-haskell")]
        Language::Haskell,
        #[cfg(feature = "lang-java")]
        Language::Java,
        #[cfg(feature = "lang-javascript")]
        Language::Javascript,
        #[cfg(feature = "lang-julia")]
        Language::Julia,
        #[cfg(feature = "lang-kotlin")]
        Language::Kotlin,
        #[cfg(feature = "lang-lua")]
        Language::Lua,
        #[cfg(feature = "lang-modelica")]
        Language::Modelica,
        #[cfg(feature = "lang-ocaml")]
        Language::Ocaml,
        #[cfg(feature = "lang-perl")]
        Language::Perl,
        #[cfg(feature = "lang-php")]
        Language::Php,
        #[cfg(feature = "lang-python")]
        Language::Python,
        #[cfg(feature = "lang-r")]
        Language::R,
        #[cfg(feature = "lang-ruby")]
        Language::Ruby,
        #[cfg(feature = "lang-rust")]
        Language::Rust,
        #[cfg(feature = "lang-scala")]
        Language::Scala,
        #[cfg(feature = "lang-sql")]
        Language::Sql,
        #[cfg(feature = "lang-swift")]
        Language::Swift,
        #[cfg(feature = "lang-typescript")]
        Language::Typescript,
        #[cfg(feature = "lang-tsx")]
        Language::Tsx,
        #[cfg(feature = "lang-verilog")]
        Language::Verilog,
    ];

    /// Return the language with the name or alias `name`, ignoring case.
    ///
    /// Returns `None` when no enabled language has that name.
    ///
    /// # Parameters
    ///
    /// - `name`: a language name, such as `"python"`, or an alias, such as
    ///   `"golang"`.
    ///
    /// # Examples
    ///
    /// ```
    /// # #[cfg(feature = "lang-go")] {
    /// use tree_sitter_grammars::Language;
    ///
    /// assert_eq!(Language::from_name("GoLang"), Some(Language::Go));
    /// assert_eq!(Language::from_name("cobol"), None);
    /// # }
    /// ```
    pub fn from_name(name: &str) -> Option<Language> {
        Self::ALL
            .iter()
            .copied()
            .find(|language| contains_ignoring_case(language.grammar().names, name))
    }

    /// Return the name of this language, such as `"JavaScript"`.
    ///
    /// # Examples
    ///
    /// ```
    /// # #[cfg(feature = "lang-go")] {
    /// use tree_sitter_grammars::Language;
    ///
    /// assert_eq!(Language::Go.name(), "Go");
    /// assert_eq!(Language::from_name("golang").map(Language::name), Some("Go"));
    /// # }
    /// ```
    pub fn name(self) -> &'static str {
        self.grammar().names[0]
    }

    /// Return the languages that use the extension of `path`, ignoring case.
    ///
    /// Several languages can share an extension, such as `.h` for C and C++.
    /// Returns an empty list when the path has no extension or the extension is
    /// unknown.
    ///
    /// # Parameters
    ///
    /// - `path`: a file path. Only its extension counts.
    ///
    /// # Examples
    ///
    /// ```
    /// # #[cfg(feature = "lang-python")] {
    /// use tree_sitter_grammars::Language;
    /// use std::path::Path;
    ///
    /// assert_eq!(Language::from_path(Path::new("main.PY")), [Language::Python]);
    /// assert!(Language::from_path(Path::new("Makefile")).is_empty());
    /// # }
    /// ```
    pub fn from_path(path: &Path) -> Vec<Language> {
        Self::ALL
            .iter()
            .copied()
            .filter(|language| language.matches(path))
            .collect()
    }

    /// Return `true` if the extension of `path` belongs to this language, ignoring case.
    ///
    /// # Parameters
    ///
    /// - `path`: a file path. Only its extension counts.
    ///
    /// # Examples
    ///
    /// ```
    /// # #[cfg(feature = "lang-javascript")] {
    /// use tree_sitter_grammars::Language;
    /// use std::path::Path;
    ///
    /// assert!(Language::Javascript.matches(Path::new("src/app.js")));
    /// assert!(!Language::Javascript.matches(Path::new("src/app.ts")));
    /// # }
    /// ```
    pub fn matches(self, path: &Path) -> bool {
        path.extension()
            .and_then(OsStr::to_str)
            .is_some_and(|ext| contains_ignoring_case(self.grammar().extensions, ext))
    }

    /// Return the tree-sitter grammar of this language.
    ///
    /// Returns `None` for [`Language::Char`], which has no grammar.
    ///
    /// # Examples
    ///
    /// ```
    /// use tree_sitter_grammars::Language;
    ///
    /// assert!(Language::Char.tree_sitter_language().is_none());
    ///
    /// # #[cfg(feature = "lang-python")] {
    /// use tree_sitter::Parser;
    ///
    /// let grammar = Language::Python.tree_sitter_language().ok_or("Python has no grammar")?;
    /// let mut parser = Parser::new();
    /// parser.set_language(&grammar.into())?;
    ///
    /// let tree = parser.parse("x = 1", None).ok_or("the parser returned no tree")?;
    /// assert_eq!(tree.root_node().kind(), "module");
    /// assert!(!tree.root_node().has_error());
    /// # }
    /// # Ok::<(), Box<dyn std::error::Error>>(())
    /// ```
    pub fn tree_sitter_language(self) -> Option<LanguageFn> {
        self.grammar().tree_sitter
    }

    fn grammar(self) -> Grammar {
        match self {
            #[cfg(feature = "lang-bash")]
            Language::Bash => Grammar {
                names: &["Bash", "shell", "sh"],
                extensions: &["sh", "bash"],
                tree_sitter: Some(tree_sitter_bash::LANGUAGE),
            },
            #[cfg(feature = "lang-c")]
            Language::C => Grammar {
                names: &["C"],
                extensions: &["c", "h"],
                tree_sitter: Some(tree_sitter_c::LANGUAGE),
            },
            Language::Char => Grammar {
                names: &["char"],
                extensions: &["txt", "md"],
                tree_sitter: None,
            },
            #[cfg(feature = "lang-cpp")]
            Language::Cpp => Grammar {
                names: &["C++", "cpp"],
                extensions: &[
                    "cpp", "hpp", "cc", "cp", "cxx", "c++", "h", "hh", "hxx", "h++",
                ],
                tree_sitter: Some(tree_sitter_cpp::LANGUAGE),
            },
            #[cfg(feature = "lang-csharp")]
            Language::CSharp => Grammar {
                names: &["C#", "csharp"],
                extensions: &["cs", "csx"],
                tree_sitter: Some(tree_sitter_c_sharp::LANGUAGE),
            },
            #[cfg(feature = "lang-dart")]
            Language::Dart => Grammar {
                names: &["Dart"],
                extensions: &["dart"],
                tree_sitter: Some(tree_sitter_dart::LANGUAGE),
            },
            #[cfg(feature = "lang-elixir")]
            Language::Elixir => Grammar {
                names: &["Elixir"],
                extensions: &["ex", "exs"],
                tree_sitter: Some(tree_sitter_elixir::LANGUAGE),
            },
            #[cfg(feature = "lang-elm")]
            Language::Elm => Grammar {
                names: &["Elm"],
                extensions: &["elm"],
                tree_sitter: Some(tree_sitter_elm::LANGUAGE),
            },
            #[cfg(feature = "lang-go")]
            Language::Go => Grammar {
                names: &["Go", "golang"],
                extensions: &["go"],
                tree_sitter: Some(tree_sitter_go::LANGUAGE),
            },
            #[cfg(feature = "lang-groovy")]
            Language::Groovy => Grammar {
                names: &["Groovy"],
                extensions: &["groovy", "gvy", "gy", "gsh"],
                tree_sitter: Some(tree_sitter_groovy::LANGUAGE),
            },
            #[cfg(feature = "lang-haskell")]
            Language::Haskell => Grammar {
                names: &["Haskell"],
                extensions: &["hs", "lhs"],
                tree_sitter: Some(tree_sitter_haskell::LANGUAGE),
            },
            #[cfg(feature = "lang-java")]
            Language::Java => Grammar {
                names: &["Java"],
                extensions: &["java"],
                tree_sitter: Some(tree_sitter_java::LANGUAGE),
            },
            #[cfg(feature = "lang-javascript")]
            Language::Javascript => Grammar {
                names: &["JavaScript", "js"],
                extensions: &["js"],
                tree_sitter: Some(tree_sitter_javascript::LANGUAGE),
            },
            #[cfg(feature = "lang-julia")]
            Language::Julia => Grammar {
                names: &["Julia"],
                extensions: &["jl"],
                tree_sitter: Some(tree_sitter_julia::LANGUAGE),
            },
            #[cfg(feature = "lang-kotlin")]
            Language::Kotlin => Grammar {
                names: &["Kotlin"],
                extensions: &["kt", "kts"],
                tree_sitter: Some(tree_sitter_kotlin::LANGUAGE),
            },
            #[cfg(feature = "lang-lua")]
            Language::Lua => Grammar {
                names: &["Lua"],
                extensions: &["lua"],
                tree_sitter: Some(tree_sitter_lua::LANGUAGE),
            },
            #[cfg(feature = "lang-modelica")]
            Language::Modelica => Grammar {
                names: &["Modelica"],
                extensions: &["mo"],
                tree_sitter: Some(tree_sitter_modelica::LANGUAGE),
            },
            #[cfg(feature = "lang-ocaml")]
            Language::Ocaml => Grammar {
                names: &["OCaml"],
                extensions: &["ml"],
                tree_sitter: Some(tree_sitter_ocaml::LANGUAGE_OCAML),
            },
            #[cfg(feature = "lang-perl")]
            Language::Perl => Grammar {
                names: &["Perl"],
                extensions: &["pl", "pm", "t"],
                tree_sitter: Some(tree_sitter_perl::LANGUAGE),
            },
            #[cfg(feature = "lang-php")]
            Language::Php => Grammar {
                names: &["PHP"],
                extensions: &[
                    "php", "php3", "php4", "php5", "php7", "phps", "phpt", "phtml",
                ],
                tree_sitter: Some(tree_sitter_php::LANGUAGE_PHP),
            },
            #[cfg(feature = "lang-python")]
            Language::Python => Grammar {
                names: &["Python", "py"],
                extensions: &["py", "py3"],
                tree_sitter: Some(tree_sitter_python::LANGUAGE),
            },
            #[cfg(feature = "lang-r")]
            Language::R => Grammar {
                names: &["R"],
                extensions: &["r"],
                tree_sitter: Some(tree_sitter_r::LANGUAGE),
            },
            #[cfg(feature = "lang-ruby")]
            Language::Ruby => Grammar {
                names: &["Ruby"],
                extensions: &["rb", "rbw"],
                tree_sitter: Some(tree_sitter_ruby::LANGUAGE),
            },
            #[cfg(feature = "lang-rust")]
            Language::Rust => Grammar {
                names: &["Rust"],
                extensions: &["rs"],
                tree_sitter: Some(tree_sitter_rust::LANGUAGE),
            },
            #[cfg(feature = "lang-scala")]
            Language::Scala => Grammar {
                names: &["Scala"],
                extensions: &["scala", "sc"],
                tree_sitter: Some(tree_sitter_scala::LANGUAGE),
            },
            #[cfg(feature = "lang-sql")]
            Language::Sql => Grammar {
                names: &["SQL"],
                extensions: &["sql"],
                tree_sitter: Some(tree_sitter_sequel::LANGUAGE),
            },
            #[cfg(feature = "lang-swift")]
            Language::Swift => Grammar {
                names: &["Swift"],
                extensions: &["swift"],
                tree_sitter: Some(tree_sitter_swift::LANGUAGE),
            },
            #[cfg(feature = "lang-typescript")]
            Language::Typescript => Grammar {
                names: &["TypeScript", "ts"],
                extensions: &["ts"],
                tree_sitter: Some(tree_sitter_typescript::LANGUAGE_TYPESCRIPT),
            },
            #[cfg(feature = "lang-tsx")]
            Language::Tsx => Grammar {
                names: &["TSX"],
                extensions: &["tsx"],
                tree_sitter: Some(tree_sitter_typescript::LANGUAGE_TSX),
            },
            #[cfg(feature = "lang-verilog")]
            Language::Verilog => Grammar {
                names: &["Verilog"],
                extensions: &["v", "vh"],
                tree_sitter: Some(tree_sitter_verilog::LANGUAGE),
            },
        }
    }
}

/// Returns `true` if `values` contains `value`, ignoring ASCII case.
fn contains_ignoring_case(values: &[&str], value: &str) -> bool {
    values.iter().any(|known| known.eq_ignore_ascii_case(value))
}
