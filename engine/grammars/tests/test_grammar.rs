use rstest::rstest;
use std::path::Path;
use tree_sitter_grammars::Language;

#[rstest]
#[case::bash("sh", Language::Bash)]
#[case::c("c", Language::C)]
#[case::cpp("cpp", Language::Cpp)]
#[case::csharp("cs", Language::CSharp)]
#[case::dart("dart", Language::Dart)]
#[case::elixir("ex", Language::Elixir)]
#[case::elm("elm", Language::Elm)]
#[case::go("go", Language::Go)]
#[case::groovy("groovy", Language::Groovy)]
#[case::haskell("hs", Language::Haskell)]
#[case::java("java", Language::Java)]
#[case::javascript("js", Language::Javascript)]
#[case::julia("jl", Language::Julia)]
#[case::kotlin("kt", Language::Kotlin)]
#[case::lua("lua", Language::Lua)]
#[case::modelica("mo", Language::Modelica)]
#[case::ocaml("ml", Language::Ocaml)]
#[case::perl("pl", Language::Perl)]
#[case::php("php", Language::Php)]
#[case::python("py", Language::Python)]
#[case::r("r", Language::R)]
#[case::ruby("rb", Language::Ruby)]
#[case::rust("rs", Language::Rust)]
#[case::scala("scala", Language::Scala)]
#[case::sql("sql", Language::Sql)]
#[case::swift("swift", Language::Swift)]
#[case::typescript("ts", Language::Typescript)]
#[case::tsx("tsx", Language::Tsx)]
#[case::verilog("v", Language::Verilog)]
fn from_path_resolves_the_extension(#[case] ext: &str, #[case] lang: Language) {
    let path = Path::new("file").with_extension(ext);

    assert_eq!(Language::from_path(&path), vec![lang]);
}

#[rstest]
#[case::bash("sh", Language::Bash)]
#[case::c("c", Language::C)]
#[case::cpp("cpp", Language::Cpp)]
#[case::csharp("cs", Language::CSharp)]
#[case::dart("dart", Language::Dart)]
#[case::elixir("ex", Language::Elixir)]
#[case::elm("elm", Language::Elm)]
#[case::go("go", Language::Go)]
#[case::groovy("groovy", Language::Groovy)]
#[case::haskell("hs", Language::Haskell)]
#[case::java("java", Language::Java)]
#[case::javascript("js", Language::Javascript)]
#[case::julia("jl", Language::Julia)]
#[case::kotlin("kt", Language::Kotlin)]
#[case::lua("lua", Language::Lua)]
#[case::modelica("mo", Language::Modelica)]
#[case::ocaml("ml", Language::Ocaml)]
#[case::perl("pl", Language::Perl)]
#[case::php("php", Language::Php)]
#[case::python("py", Language::Python)]
#[case::r("r", Language::R)]
#[case::ruby("rb", Language::Ruby)]
#[case::rust("rs", Language::Rust)]
#[case::scala("scala", Language::Scala)]
#[case::sql("sql", Language::Sql)]
#[case::swift("swift", Language::Swift)]
#[case::typescript("ts", Language::Typescript)]
#[case::tsx("tsx", Language::Tsx)]
#[case::verilog("v", Language::Verilog)]
fn matches_accepts_the_extension(#[case] ext: &str, #[case] lang: Language) {
    let path = Path::new("file").with_extension(ext);

    assert!(lang.matches(&path));
}

#[rstest]
#[case::bash("bash", Language::Bash)]
#[case::c("c", Language::C)]
#[case::cpp("cpp", Language::Cpp)]
#[case::csharp("csharp", Language::CSharp)]
#[case::dart("dart", Language::Dart)]
#[case::elixir("elixir", Language::Elixir)]
#[case::elm("elm", Language::Elm)]
#[case::go("go", Language::Go)]
#[case::groovy("groovy", Language::Groovy)]
#[case::haskell("haskell", Language::Haskell)]
#[case::java("java", Language::Java)]
#[case::javascript("javascript", Language::Javascript)]
#[case::julia("julia", Language::Julia)]
#[case::kotlin("kotlin", Language::Kotlin)]
#[case::lua("lua", Language::Lua)]
#[case::modelica("modelica", Language::Modelica)]
#[case::ocaml("ocaml", Language::Ocaml)]
#[case::perl("perl", Language::Perl)]
#[case::php("php", Language::Php)]
#[case::python("python", Language::Python)]
#[case::r("r", Language::R)]
#[case::ruby("ruby", Language::Ruby)]
#[case::rust("rust", Language::Rust)]
#[case::scala("scala", Language::Scala)]
#[case::sql("sql", Language::Sql)]
#[case::swift("swift", Language::Swift)]
#[case::typescript("typescript", Language::Typescript)]
#[case::tsx("tsx", Language::Tsx)]
#[case::verilog("verilog", Language::Verilog)]
fn from_name_resolves_the_name(#[case] name: &str, #[case] lang: Language) {
    assert_eq!(Language::from_name(name), Some(lang));
}

#[test]
fn from_path_ignores_an_unknown_extension() {
    assert!(Language::from_path(Path::new("file.xyz")).is_empty());
}

#[test]
fn from_name_ignores_an_unknown_name() {
    assert_eq!(Language::from_name("unknown"), None);
}

#[test]
fn from_path_ignores_case() {
    assert_eq!(
        Language::from_path(Path::new("Main.PY")),
        vec![Language::Python]
    );
}

#[test]
fn from_name_ignores_case() {
    assert_eq!(Language::from_name("PYTHON"), Some(Language::Python));
}

#[test]
fn from_name_accepts_aliases() {
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
fn every_language_has_a_grammar() {
    for lang in Language::ALL {
        lang.tree_sitter_language();
    }
}

#[test]
fn matches_rejects_the_extension_of_another_language() {
    assert!(!Language::Python.matches(Path::new("main.rs")));
    assert!(!Language::Rust.matches(Path::new("script.py")));
}

#[test]
fn h_extension_maps_to_c_and_cpp() {
    assert_eq!(
        Language::from_path(Path::new("LIB.H")),
        vec![Language::C, Language::Cpp]
    );
    assert!(Language::Cpp.matches(Path::new("lib.h")));
}

#[test]
fn path_without_extension_matches_nothing() {
    assert!(Language::from_path(Path::new("Makefile")).is_empty());
    assert!(Language::from_path(Path::new(".gitignore")).is_empty());
    assert!(!Language::Python.matches(Path::new("Makefile")));
}
