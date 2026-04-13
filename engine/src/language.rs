use std::ffi::OsStr;
use std::path::Path;

#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum Language {
    Bash,
    C,
    Cpp,
    CSharp,
    Dart,
    Elixir,
    Elm,
    Go,
    Groovy,
    Haskell,
    Java,
    Javascript,
    Julia,
    Kotlin,
    Lua,
    Modelica,
    Ocaml,
    Perl,
    Php,
    Python,
    R,
    Ruby,
    Rust,
    Scala,
    Sql,
    Swift,
    Typescript,
    Tsx,
    Verilog,
}

impl Language {
    pub fn guess_from_path(path: &Path) -> Option<Language> {
        Self::from_ext(path.extension().expect("file has no extension"))
    }

    pub fn matches(&self, path: &Path) -> bool {
        if let Some(lang) = Self::guess_from_path(path) {
            return self == &lang;
        };
        false
    }

    pub fn from_ext(ext: &OsStr) -> Option<Language> {
        match ext.to_ascii_lowercase().to_str()? {
            "sh" | "bash" => Self::Bash,
            "c" | "h" => Self::C,
            "cpp" | "hpp" | "cc" | "cp" | "cxx" | "c++" | "hh" | "hxx" | "h++" => Self::Cpp,
            "cs" | "csx" => Self::CSharp,
            "dart" => Self::Dart,
            "ex" | "exs" => Self::Elixir,
            "elm" => Self::Elm,
            "go" => Self::Go,
            "groovy" | "gvy" | "gy" | "gsh" => Self::Groovy,
            "hs" | "lhs" => Self::Haskell,
            "java" => Self::Java,
            "js" => Self::Javascript,
            "jl" => Self::Julia,
            "kt" | "kts" => Self::Kotlin,
            "lua" => Self::Lua,
            "ml" => Self::Ocaml,
            "pl" | "pm" | "t" => Self::Perl,
            "php" | "php3" | "php4" | "php5" | "php7" | "phps" | "phpt" | "phtml" => Self::Php,
            "py" | "py3" => Self::Python,
            "r" | "rdata" | "rds" | "rda" => Self::R,
            "rb" | "rbw" => Self::Ruby,
            "rs" | "rlib" => Self::Rust,
            "scala" | "sc" => Self::Scala,
            "sql" => Self::Sql,
            "swift" => Self::Swift,
            "ts" => Self::Typescript,
            "tsx" => Self::Tsx,
            "v" | "vh" => Self::Verilog,
            _ => return None,
        }
        .into()
    }

    pub fn tree_sitter_language(self) -> tree_sitter_language::LanguageFn {
        match self {
            Language::Bash => tree_sitter_bash::LANGUAGE,
            Language::C => tree_sitter_c::LANGUAGE,
            Language::Cpp => tree_sitter_cpp::LANGUAGE,
            Language::CSharp => tree_sitter_c_sharp::LANGUAGE,
            Language::Dart => tree_sitter_dart::LANGUAGE,
            Language::Elixir => tree_sitter_elixir::LANGUAGE,
            Language::Elm => tree_sitter_elm::LANGUAGE,
            Language::Go => tree_sitter_go::LANGUAGE,
            Language::Groovy => tree_sitter_groovy::LANGUAGE,
            Language::Haskell => tree_sitter_haskell::LANGUAGE,
            Language::Java => tree_sitter_java::LANGUAGE,
            Language::Javascript => tree_sitter_javascript::LANGUAGE,
            Language::Julia => tree_sitter_julia::LANGUAGE,
            Language::Kotlin => tree_sitter_kotlin_sg::LANGUAGE,
            Language::Lua => tree_sitter_lua::LANGUAGE,
            Language::Modelica => tree_sitter_modelica::LANGUAGE,
            Language::Ocaml => tree_sitter_ocaml::LANGUAGE_OCAML,
            Language::Perl => tree_sitter_perl::LANGUAGE,
            Language::Php => tree_sitter_php::LANGUAGE_PHP,
            Language::Python => tree_sitter_python::LANGUAGE,
            Language::R => tree_sitter_r::LANGUAGE,
            Language::Ruby => tree_sitter_ruby::LANGUAGE,
            Language::Rust => tree_sitter_rust::LANGUAGE,
            Language::Scala => tree_sitter_scala::LANGUAGE,
            Language::Sql => tree_sitter_sequel::LANGUAGE,
            Language::Swift => tree_sitter_swift::LANGUAGE,
            Language::Typescript => tree_sitter_typescript::LANGUAGE_TYPESCRIPT,
            Language::Tsx => tree_sitter_typescript::LANGUAGE_TSX,
            Language::Verilog => tree_sitter_verilog::LANGUAGE,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_ext() {
        assert_eq!(Language::from_ext(OsStr::new("sh")), Some(Language::Bash));
        assert_eq!(Language::from_ext(OsStr::new("bash")), Some(Language::Bash));
        assert_eq!(Language::from_ext(OsStr::new("c")), Some(Language::C));
        assert_eq!(Language::from_ext(OsStr::new("h")), Some(Language::C));
        assert_eq!(Language::from_ext(OsStr::new("cpp")), Some(Language::Cpp));
        assert_eq!(Language::from_ext(OsStr::new("hpp")), Some(Language::Cpp));
        assert_eq!(Language::from_ext(OsStr::new("cc")), Some(Language::Cpp));
        assert_eq!(Language::from_ext(OsStr::new("py")), Some(Language::Python));
        assert_eq!(
            Language::from_ext(OsStr::new("py3")),
            Some(Language::Python)
        );
        assert_eq!(
            Language::from_ext(OsStr::new("js")),
            Some(Language::Javascript)
        );
        assert_eq!(Language::from_ext(OsStr::new("java")), Some(Language::Java));
        assert_eq!(Language::from_ext(OsStr::new("rs")), Some(Language::Rust));
        assert_eq!(Language::from_ext(OsStr::new("rlib")), Some(Language::Rust));
        assert_eq!(
            Language::from_ext(OsStr::new("ts")),
            Some(Language::Typescript)
        );
        assert_eq!(Language::from_ext(OsStr::new("tsx")), Some(Language::Tsx));
        assert_eq!(Language::from_ext(OsStr::new("rb")), Some(Language::Ruby));
        assert_eq!(Language::from_ext(OsStr::new("rbw")), Some(Language::Ruby));
        assert_eq!(Language::from_ext(OsStr::new("go")), Some(Language::Go));
    }

    #[test]
    fn test_from_ext_unknown() {
        assert_eq!(Language::from_ext(OsStr::new("xyz")), None);
        assert_eq!(Language::from_ext(OsStr::new("unknown")), None);
    }

    #[test]
    fn test_from_ext_insensitive() {
        assert_eq!(Language::from_ext(OsStr::new("JAVA")), Some(Language::Java));
    }

    #[test]
    fn test_guess_from_path() {
        assert_eq!(
            Language::guess_from_path(Path::new("main.test.py")),
            Some(Language::Python)
        );
        assert_eq!(
            Language::guess_from_path(Path::new("script.sh")),
            Some(Language::Bash)
        );
        assert_eq!(
            Language::guess_from_path(Path::new("lib.rs")),
            Some(Language::Rust)
        );
    }

    #[test]
    fn test_matches() {
        let python = Language::Python;
        assert!(python.matches(Path::new("test.py")));
        assert!(python.matches(Path::new("script.py3")));
        assert!(!python.matches(Path::new("main.rs")));

        let rust = Language::Rust;
        assert!(rust.matches(Path::new("main.rs")));
        assert!(!rust.matches(Path::new("test.py")));
    }

    #[test]
    fn test_matches_case_insensitive() {
        let java = Language::Java;
        assert!(java.matches(Path::new("HelloWorld.JAVA")));
    }
}
