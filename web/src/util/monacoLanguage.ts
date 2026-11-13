// Language names of the report metadata whose Monaco language id is not the lowercase name.
const MONACO_IDS: Record<string, string> = {
  Bash: "shell",
  Char: "plaintext",
  Elm: "plaintext",
  Groovy: "plaintext",
  Haskell: "plaintext",
  Modelica: "plaintext",
  Ocaml: "plaintext",
  Tsx: "typescript",
};

/**
 * Returns the Monaco language id for a language name of the report metadata.
 */
export function monacoLanguage(language: string): string {
  return MONACO_IDS[language] ?? language.toLowerCase();
}
