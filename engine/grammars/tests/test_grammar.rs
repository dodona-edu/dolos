use std::path::Path;
use tree_sitter_grammars::Language;

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
fn test_all_languages_from_path_and_name() {
    for (ext, name, lang) in CASES {
        let path = Path::new("file").with_extension(ext);
        assert_eq!(
            Language::from_path(&path),
            vec![*lang],
            "path 'file.{ext}' should resolve to {lang:?}"
        );
        assert!(
            lang.matches(&path),
            "{lang:?}.matches('file.{ext}') should be true"
        );
        assert_eq!(
            Language::from_name(name),
            Some(*lang),
            "name '{name}' should resolve to {lang:?}"
        );
    }
    assert_eq!(Language::ALL.len(), CASES.len());
}

#[test]
fn test_unknown_returns_nothing() {
    assert!(Language::from_path(Path::new("file.xyz")).is_empty());
    assert_eq!(Language::from_name("unknown"), None);
}

#[test]
fn test_case_insensitive() {
    assert_eq!(
        Language::from_path(Path::new("Main.PY")),
        vec![Language::Python]
    );
    assert_eq!(Language::from_name("PYTHON"), Some(Language::Python));
}

#[test]
fn test_aliases() {
    assert_eq!(Language::from_name("golang"), Some(Language::Go));
    assert_eq!(Language::from_name("js"), Some(Language::Javascript));
    assert_eq!(Language::from_name("ts"), Some(Language::Typescript));
    assert_eq!(Language::from_name("py"), Some(Language::Python));
    assert_eq!(Language::from_name("shell"), Some(Language::Bash));
    assert_eq!(Language::from_name("sh"), Some(Language::Bash));
    assert_eq!(Language::from_name("c#"), Some(Language::CSharp));
    assert_eq!(Language::from_name("c++"), Some(Language::Cpp));
}

#[test]
fn test_tree_sitter_language_valid_for_all() {
    for lang in Language::ALL {
        // Ensure we can get a LanguageFn without panicking
        let _lang_fn = lang.tree_sitter_language();
    }
}

#[test]
fn test_matches_false_for_wrong_lang() {
    assert!(!Language::Python.matches(Path::new("main.rs")));
    assert!(!Language::Rust.matches(Path::new("script.py")));
}

#[test]
fn test_h_maps_to_c_and_cpp() {
    assert_eq!(
        Language::from_path(Path::new("LIB.H")),
        vec![Language::C, Language::Cpp]
    );
    assert!(Language::Cpp.matches(Path::new("lib.h")));
}

#[test]
fn test_path_without_extension_matches_nothing() {
    assert!(Language::from_path(Path::new("Makefile")).is_empty());
    assert!(Language::from_path(Path::new(".gitignore")).is_empty());
    assert!(!Language::Python.matches(Path::new("Makefile")));
}
