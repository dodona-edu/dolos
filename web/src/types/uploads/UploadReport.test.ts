import { describe, it, expect } from "vitest";
import { Report } from "./UploadReport";

const report = (status: string, stderr?: string) =>
  Report.fromResponse({ id: "1", name: "report", status, stderr });

describe("Report.hasWarnings", () => {
  it("is true for a finished report with stderr", () => {
    expect(report("finished", "warning: skipped a.txt\n").hasWarnings()).toBe(true);
  });

  it("is false for a finished report with an empty stderr", () => {
    expect(report("finished", "\n").hasWarnings()).toBe(false);
    expect(report("finished").hasWarnings()).toBe(false);
  });

  it("is false for a failed report", () => {
    expect(report("failed", "error: no files\n").hasWarnings()).toBe(false);
  });
});
