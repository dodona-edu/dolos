import { describe, it, expect } from "vitest";
import { castToType } from "./cast";

describe("castToType", () => {
  it("parses boolean rows case-insensitively", () => {
    expect(castToType({ value: "True", type: "boolean" } as never).value).toBe(true);
    expect(castToType({ value: "false", type: "boolean" } as never).value).toBe(false);
  });

  it("defaults missing boolean values to false", () => {
    expect(castToType({ value: "", type: "boolean" } as never).value).toBe(false);
  });

  it("parses numeric rows to numbers", () => {
    expect(castToType({ value: "3.14", type: "number" } as never).value).toBe(3.14);
  });

  it("maps object-typed rows to null", () => {
    expect(castToType({ value: "whatever", type: "object" } as never).value).toBeNull();
  });

  it("leaves string rows untouched", () => {
    expect(castToType({ value: "hello", type: "string" } as never).value).toBe("hello");
  });
});
