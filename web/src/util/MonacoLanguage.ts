// Language names of the report metadata whose Monaco language id is not the lowercase name.
const MONACO_IDS: Partial<Record<string, string>> = {
  Bash: "shell",
  Tsx: "typescript",
};

/**
 * Returns the Monaco language id for a language name of the report metadata.
 * Monaco shows a language id that it does not know as plain text.
 */
export function monacoLanguage(language: string): string {
  return MONACO_IDS[language] ?? language.toLowerCase();
}
