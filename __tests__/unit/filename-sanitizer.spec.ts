import { describe, it, expect } from "vitest";
import {
  sanitizeFilename,
  sanitizeAndUniqueFilename,
} from "@/lib/filename-sanitizer";

describe("sanitizeFilename", () => {
  it("passes through clean filenames unchanged", () => {
    expect(sanitizeFilename("report.pdf")).toBe("report.pdf");
    expect(sanitizeFilename("contrast-check-123.png")).toBe(
      "contrast-check-123.png",
    );
  });

  it("replaces Windows invalid characters with hyphens", () => {
    expect(sanitizeFilename("test:file?.png")).toBe("test-file-.png");
    expect(sanitizeFilename("file\\with\\slashes.png")).toBe(
      "file-with-slashes.png",
    );
    expect(sanitizeFilename('file"with"quotes.png')).toBe(
      "file-with-quotes.png",
    );
    expect(sanitizeFilename("file<with>brackets.png")).toBe(
      "file-with-brackets.png",
    );
    expect(sanitizeFilename("file|pipe.png")).toBe("file-pipe.png");
    expect(sanitizeFilename("file*star.png")).toBe("file-star.png");
  });

  it("removes control characters", () => {
    expect(sanitizeFilename("test\x00file.png")).toBe("test-file.png");
    expect(sanitizeFilename("test\x1Ffile.png")).toBe("test-file.png");
  });

  it("trims leading and trailing dots and spaces", () => {
    expect(sanitizeFilename("  file.png")).toBe("file.png");
    expect(sanitizeFilename("file  .png")).toBe("file.png");
    expect(sanitizeFilename(".hidden.png")).toBe("hidden.png");
    expect(sanitizeFilename("file...png")).toBe("file.png");
  });

  it("handles Windows reserved names", () => {
    expect(sanitizeFilename("CON.txt")).toBe("CON-.txt");
    expect(sanitizeFilename("con.txt")).toBe("con-.txt");
    expect(sanitizeFilename("PRN.png")).toBe("PRN-.png");
    expect(sanitizeFilename("COM1.txt")).toBe("COM1-.txt");
    expect(sanitizeFilename("LPT9.png")).toBe("LPT9-.png");
  });

  it("enforces max length limit", () => {
    const longName = "a".repeat(200) + ".png";
    const result = sanitizeFilename(longName, { maxLength: 100 });
    expect(result.length).toBeLessThanOrEqual(104); // 100 + ".png"
    expect(result).toMatch(/\.png$/);
  });

  it("handles empty string", () => {
    expect(sanitizeFilename("")).toBe("untitled");
  });

  it("handles null/undefined input", () => {
    expect(sanitizeFilename("")).toBe("untitled");
  });

  it("preserves filenames with multiple extensions", () => {
    expect(sanitizeFilename("archive.tar.gz")).toBe("archive.tar.gz");
  });
});

describe("sanitizeAndUniqueFilename", () => {
  it("returns sanitized name when no collision", () => {
    const existing = new Set<string>();
    expect(sanitizeAndUniqueFilename("report.pdf", existing)).toBe(
      "report.pdf",
    );
  });

  it("appends counter on collision", () => {
    const existing = new Set(["report.pdf"]);
    expect(sanitizeAndUniqueFilename("report.pdf", existing)).toBe(
      "report-1.pdf",
    );
  });

  it("increments counter for multiple collisions", () => {
    const existing = new Set(["report.pdf", "report-1.pdf"]);
    expect(sanitizeAndUniqueFilename("report.pdf", existing)).toBe(
      "report-2.pdf",
    );
  });
});
