import { describe, it, expect } from "vitest";
import { monacoLanguage } from "./MonacoLanguage";

describe("monacoLanguage", () => {
  it("returns the lowercase name", () => {
    expect(monacoLanguage("Python")).toBe("python");
    expect(monacoLanguage("CSharp")).toBe("csharp");
    expect(monacoLanguage("Cpp")).toBe("cpp");
    expect(monacoLanguage("Javascript")).toBe("javascript");
  });

  it("maps the names that differ from the Monaco id", () => {
    expect(monacoLanguage("Bash")).toBe("shell");
    expect(monacoLanguage("Tsx")).toBe("typescript");
  });
});
