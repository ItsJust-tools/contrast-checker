import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard } from "../../src/utils/copy-to-clipboard";

describe("copyToClipboard", () => {
  let originalClipboard: unknown;
  let originalExecCommand: unknown;

  beforeEach(() => {
    originalClipboard = navigator.clipboard;
    originalExecCommand = (document as unknown as Record<string, unknown>)[
      "execCommand"
    ];
    // jsdom does not implement execCommand; provide a stub so tests can spy on it.
    (document as unknown as Record<string, unknown>)["execCommand"] = vi.fn(
      () => true,
    );
    vi.restoreAllMocks();
  });

  afterEach(() => {
    (document as unknown as Record<string, unknown>)["execCommand"] =
      originalExecCommand;
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    document.body.innerHTML = "";
  });

  it("uses navigator.clipboard.writeText when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    await copyToClipboard("hello");

    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("falls back to execCommand when writeText rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Not allowed"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);

    await copyToClipboard("hello");

    expect(writeText).toHaveBeenCalledWith("hello");
    expect(execSpy).toHaveBeenCalledWith("copy");
    expect(document.querySelectorAll("textarea")).toHaveLength(0);
  });

  it("throws the original error when clipboard rejects and fallback fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    vi.spyOn(document, "execCommand").mockReturnValue(false);

    await expect(copyToClipboard("hello")).rejects.toThrow("Permission denied");
  });

  it("uses the legacy path when navigator.clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);

    await copyToClipboard("hello");

    expect(execSpy).toHaveBeenCalledWith("copy");
  });

  it("throws when no strategy is available", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    vi.spyOn(document, "execCommand").mockReturnValue(false);

    await expect(copyToClipboard("hello")).rejects.toThrow(
      "Clipboard is not available",
    );
  });

  it("creates an off-screen textarea and removes it afterwards", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Blocked"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    vi.spyOn(document, "execCommand").mockReturnValue(true);

    await copyToClipboard("fallback-text");

    // textarea is cleaned up after the copy attempt
    expect(document.querySelectorAll("textarea")).toHaveLength(0);
  });

  it("restores the previous selection after legacy copy", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Blocked"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    vi.spyOn(document, "execCommand").mockReturnValue(true);

    // Use a div with a text node: jsdom does not reflect input selection in
    // the document selection, but element-content ranges work reliably.
    const div = document.createElement("div");
    div.textContent = "existing selection";
    document.body.appendChild(div);
    const selection = document.getSelection();
    if (!selection) {
      expect(selection).not.toBeNull();
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(div);
    selection.removeAllRanges();
    selection.addRange(range);

    await copyToClipboard("hello");

    expect(selection.rangeCount).toBeGreaterThan(0);
    expect(selection.getRangeAt(0).toString()).toBe("existing selection");
  });
});
