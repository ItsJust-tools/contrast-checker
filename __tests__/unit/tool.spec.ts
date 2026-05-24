import { describe, it, expect } from "vitest";
import { contrastTool } from "@/tool";
import type { ContrastState } from "@/tool";

describe("Contrast Checker Tool", () => {
  describe("initialState", () => {
    it("should have default values", () => {
      const state = contrastTool.initialState;
      expect(state.fgColor).toBe("#000000");
      expect(state.bgColor).toBe("#ffffff");
      expect(state.combinations).toEqual([]);
      expect(state.label).toBe("");
    });
  });

  describe("serialize", () => {
    it("should serialize state correctly", () => {
      const state: ContrastState = {
        fgColor: "#000000",
        bgColor: "#ffffff",
        combinations: [],
        label: "",
      };

      const serialized = contrastTool.serialize(state);
      const parsed = JSON.parse(serialized);

      expect(parsed.fgColor).toBe("#000000");
      expect(parsed.bgColor).toBe("#ffffff");
      expect(parsed.combinations).toEqual([]);
    });

    it("should serialize with combinations", () => {
      const state: ContrastState = {
        fgColor: "#333333",
        bgColor: "#ffffff",
        combinations: [
          {
            fg: "#333333",
            bg: "#ffffff",
            ratio: 7,
            passAA: true,
            passAAA: false,
          },
        ],
        label: "Sample",
      };

      const serialized = contrastTool.serialize(state);
      const parsed = JSON.parse(serialized);

      expect(parsed.fgColor).toBe("#333333");
      expect(parsed.bgColor).toBe("#ffffff");
      expect(parsed.combinations).toHaveLength(1);
      expect(parsed.label).toBe("Sample");
    });
  });

  describe("deserialize", () => {
    it("should deserialize valid state", () => {
      const serialized = JSON.stringify({
        fgColor: "#333333",
        bgColor: "#ffffff",
        combinations: [],
        label: "Test",
      });

      const result = contrastTool.deserialize(serialized);
      expect(result.success).toBe(true);
      expect(result.data.fgColor).toBe("#333333");
      expect(result.data.bgColor).toBe("#ffffff");
    });

    it("should fail to deserialize invalid state", () => {
      const result = contrastTool.deserialize("invalid");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid data format");
    });

    it("should fail to deserialize missing fgColor", () => {
      const result = contrastTool.deserialize(
        JSON.stringify({
          bgColor: "#ffffff",
          combinations: [],
        }),
      );
      expect(result.success).toBe(false);
    });

    it("should fail to deserialize missing bgColor", () => {
      const result = contrastTool.deserialize(
        JSON.stringify({
          fgColor: "#000000",
          combinations: [],
        }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe("tool config", () => {
    it("should have correct tool ID", () => {
      expect(contrastTool.id).toBe("contrast-checker");
    });

    it("should have correct name", () => {
      expect(contrastTool.name).toBe("Contrast Checker");
    });

    it("should have all export formats configured", () => {
      expect(contrastTool.config.exportFormats).toContain("json");
      expect(contrastTool.config.exportFormats).toContain("png");
      expect(contrastTool.config.exportFormats).toContain("jpeg");
      expect(contrastTool.config.exportFormats).toContain("webp");
      expect(contrastTool.config.exportFormats).toContain("pdf");
    });

    it("should have feature flags correct", () => {
      expect(contrastTool.config.features.export).toBe(true);
      expect(contrastTool.config.features.autoSave).toBe(false);
      expect(contrastTool.config.features.undoRedo).toBe(false);
    });

    it("should have accent color configured", () => {
      expect(contrastTool.config.theme.accent).toBe("#ef4444");
    });
  });
});
