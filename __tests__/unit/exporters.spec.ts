import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import pngExporter from "@/tool/exporters/png";
import webpExporter from "@/tool/exporters/webp";
import pdfExporter from "@/tool/exporters/pdf";
import type { ExportOptions } from "@itsjust/core";

const { toBlobMock, toPngMock } = vi.hoisted(() => ({
  toBlobMock: vi.fn(),
  toPngMock: vi.fn(),
}));

vi.mock("html-to-image", () => ({
  toBlob: (...args: unknown[]) => toBlobMock(...args),
  toPng: (...args: unknown[]) => toPngMock(...args),
}));

describe("exporters", () => {
  const makeOptions = (
    overrides: Partial<ExportOptions> = {},
  ): ExportOptions => ({
    format: "png",
    ...overrides,
  });

  let canvasToBlobSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    toBlobMock.mockReset();
    toPngMock.mockReset();
    toPngMock.mockResolvedValue(
      "data:image/png;base64," + btoa("fake-png-data"),
    );
    document.body.innerHTML = "";
    canvasToBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((cb) =>
        cb(new Blob(["fake"], { type: "image/png" })),
      );
  });

  afterEach(() => {
    document.body.innerHTML = "";
    canvasToBlobSpy?.mockRestore();
    vi.restoreAllMocks();
  });

  describe("pngExporter", () => {
    it("exports successfully", async () => {
      const el = document.createElement("div");
      el.className = "notepad-canvas";
      el.textContent = "Contrast Checker Content";
      document.body.appendChild(el);

      toBlobMock.mockResolvedValue(
        new Blob(["fake-image"], { type: "image/png" }),
      );

      const result = await pngExporter.export(
        el,
        makeOptions({ format: "png", filename: "test.png" }),
      );
      expect(result.success).toBe(true);
      expect(result.filename).toBe("test.png");
    });

    it("returns error when toBlob returns null", async () => {
      const el = document.createElement("div");
      el.className = "notepad-canvas";
      document.body.appendChild(el);

      toBlobMock.mockResolvedValue(null);

      const result = await pngExporter.export(
        el,
        makeOptions({ format: "png", filename: "fail.png" }),
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("webpExporter", () => {
    it("exports successfully", async () => {
      const el = document.createElement("div");
      el.className = "notepad-canvas";
      document.body.appendChild(el);

      toBlobMock.mockResolvedValue(
        new Blob(["fake-webp"], { type: "image/webp" }),
      );

      const result = await webpExporter.export(
        el,
        makeOptions({ format: "webp", filename: "test.webp" }),
      );
      expect(result.success).toBe(true);
      expect(result.filename).toBe("test.webp");
    });
  });

  describe("pdfExporter", () => {
    it("exports pdf successfully with json content", async () => {
      const el = document.createElement("div");
      el.textContent = "Contrast Checker Content";

      const result = await pdfExporter.export(
        el,
        makeOptions({ format: "pdf", filename: "report.pdf" }),
      );
      expect(result.success).toBe(true);
      expect(result.filename).toBe("report.pdf");
      expect(result.format).toBe("pdf");
      expect(result.data).toBeInstanceOf(Blob);
    });

    it("uses default filename with timestamp when not provided", async () => {
      const el = document.createElement("div");

      const result = await pdfExporter.export(
        el,
        makeOptions({ format: "pdf" }),
      );
      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/^contrast-check-report-\d+\.pdf$/);
    });
  });
});
