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
        match ext.to_ascii_lowercase().to_str() {
            Some("sh") | Some("bash") => Some(Self::Bash),
            Some("c") | Some("h") => Some(Self::C),
            Some("cpp") | Some("hpp") | Some("cc") | Some("cp") | Some("cxx") | Some("c++")
            | Some("hh") | Some("hxx") | Some("h++") => Some(Self::Cpp),
            Some("cs") | Some("csx") => Some(Self::CSharp),
            Some("dart") => Some(Self::Dart),
            Some("ex") | Some("exs") => Some(Self::Elixir),
            Some("elm") => Some(Self::Elm),
            Some("go") => Some(Self::Go),
            Some("groovy") | Some("gvy") | Some("gy") | Some("gsh") => Some(Self::Groovy),
            Some("hs") | Some("lhs") => Some(Self::Haskell),
            Some("java") => Some(Self::Java),
            Some("js") => Some(Self::Javascript),
            Some("jl") => Some(Self::Julia),
            Some("kt") | Some("kts") => Some(Self::Kotlin),
            Some("lua") => Some(Self::Lua),
            Some("ml") => Some(Self::Ocaml),
            Some("pl") | Some("pm") | Some("t") => Some(Self::Perl),
            Some("php") | Some("php3") | Some("php4") | Some("php5") | Some("php7")
            | Some("phps") | Some("phpt") | Some("phtml") => Some(Self::Php),
            Some("py") | Some("py3") => Some(Self::Python),
            Some("r") | Some("rdata") | Some("rds") | Some("rda") => Some(Self::R),
            Some("rb") | Some("rbw") => Some(Self::Ruby),
            Some("rs") | Some("rlib") => Some(Self::Rust),
            Some("scala") | Some("sc") => Some(Self::Scala),
            Some("sql") => Some(Self::Sql),
            Some("swift") => Some(Self::Swift),
            Some("ts") => Some(Self::Typescript),
            Some("tsx") => Some(Self::Tsx),
            Some("v") | Some("vh") => Some(Self::Verilog),
            _ => None,
        }
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
