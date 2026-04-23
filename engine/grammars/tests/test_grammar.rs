use std::ffi::OsStr;
use std::path::Path;
use tree_sitter_grammars::{
    Language, guess_grammar_from_ext, guess_grammar_from_name, guess_grammar_from_path,
};

// Maps (extension, name, expected Language)
const CASES: &[(&str, &str, Language)] = &[
    ("sh", "bash", Language::Bash),
    ("c", "c", Language::C),
    ("cpp", "cpp", Language::Cpp),
    ("cs", "csharp", Language::CSharp),
    ("dart", "dart", Language::Dart),
    ("ex", "elixir", Language::Elixir),
    ("elm", "elm", Language::Elm),
    ("go", "go", Language::Go),
    ("groovy", "groovy", Language::Groovy),
    ("hs", "haskell", Language::Haskell),
    ("java", "java", Language::Java),
    ("js", "javascript", Language::Javascript),
    ("jl", "julia", Language::Julia),
    ("kt", "kotlin", Language::Kotlin),
    ("lua", "lua", Language::Lua),
    ("mo", "modelica", Language::Modelica),
    ("ml", "ocaml", Language::Ocaml),
    ("pl", "perl", Language::Perl),
    ("php", "php", Language::Php),
    ("py", "python", Language::Python),
    ("r", "r", Language::R),
    ("rb", "ruby", Language::Ruby),
    ("rs", "rust", Language::Rust),
    ("scala", "scala", Language::Scala),
    ("sql", "sql", Language::Sql),
    ("swift", "swift", Language::Swift),
    ("ts", "typescript", Language::Typescript),
    ("tsx", "tsx", Language::Tsx),
    ("v", "verilog", Language::Verilog),
];

#[test]
fn test_all_languages_from_ext_and_name() {
    for (ext, name, lang) in CASES {
        assert_eq!(
            guess_grammar_from_ext(OsStr::new(ext)),
            Some(*lang),
            "ext '{ext}' should resolve to {lang:?}"
        );
        assert_eq!(
            guess_grammar_from_name(name),
            Some(*lang),
            "name '{name}' should resolve to {lang:?}"
        );
    }
}

#[test]
fn test_guess_from_path() {
    for (ext, _, lang) in CASES {
        let path = Path::new("file").with_extension(ext);
        assert_eq!(
            guess_grammar_from_path(&path),
            Some(*lang),
            "path 'file.{ext}' should resolve to {lang:?}"
        );
        assert!(
            lang.matches(&path),
            "{lang:?}.matches('file.{ext}') should be true"
        );
    }
}

#[test]
fn test_unknown_returns_none() {
    assert_eq!(guess_grammar_from_ext(OsStr::new("xyz")), None);
    assert_eq!(guess_grammar_from_name("unknown"), None);
}

#[test]
fn test_case_insensitive() {
    assert_eq!(
        guess_grammar_from_ext(OsStr::new("PY")),
        Some(Language::Python)
    );
    assert_eq!(guess_grammar_from_name("PYTHON"), Some(Language::Python));
}

#[test]
fn test_aliases() {
    assert_eq!(guess_grammar_from_name("golang"), Some(Language::Go));
    assert_eq!(guess_grammar_from_name("js"), Some(Language::Javascript));
    assert_eq!(guess_grammar_from_name("ts"), Some(Language::Typescript));
    assert_eq!(guess_grammar_from_name("py"), Some(Language::Python));
    assert_eq!(guess_grammar_from_name("shell"), Some(Language::Bash));
    assert_eq!(guess_grammar_from_name("sh"), Some(Language::Bash));
    assert_eq!(guess_grammar_from_name("c#"), Some(Language::CSharp));
    assert_eq!(guess_grammar_from_name("c++"), Some(Language::Cpp));
}

#[test]
fn test_tree_sitter_language_valid_for_all() {
    for (_, _, lang) in CASES {
        // Ensure we can get a LanguageFn without panicking
        let _lang_fn = lang.tree_sitter_language();
    }
}

#[test]
fn test_matches_false_for_wrong_lang() {
    assert!(!Language::Python.matches(Path::new("main.rs")));
    assert!(!Language::Rust.matches(Path::new("script.py")));
}
