import { describe, it, expect } from "vitest";
import {
  simulateCvd,
  getCvdContrastRatio,
} from "@/lib/contrast";
import type { CvdType } from "@/lib/contrast";

describe("CVD Simulation - simulateCvd", () => {
  it("should return original color when cvdType is 'none'", () => {
    expect(simulateCvd("#ff0000", "none")).toBe("#ff0000");
    expect(simulateCvd("#ffffff", "none")).toBe("#ffffff");
    expect(simulateCvd("#000000", "none")).toBe("#000000");
  });

  it("should simulate protanopia (red-blind) — red changes appearance", () => {
    const original = "#ff0000";
    const simulated = simulateCvd(original, "protanopia");
    // Protanopia reduces red sensitivity; the simulated color should differ
    expect(simulated.toLowerCase()).not.toBe("#ff0000");
  });

  it("should simulate deuteranopia (green-blind) — green changes appearance", () => {
    const original = "#00ff00";
    const simulated = simulateCvd(original, "deuteranopia");
    expect(simulated.toLowerCase()).not.toBe("#00ff00");
  });

  it("should simulate tritanopia (blue-blind) — blue changes appearance", () => {
    const original = "#0000ff";
    const simulated = simulateCvd(original, "tritanopia");
    expect(simulated.toLowerCase()).not.toBe("#0000ff");
  });

  it("should simulate achromatopsia (monochrome) — color becomes grayscale", () => {
    const simulated = simulateCvd("#ff0000", "achromatopsia");
    // For achromatopsia, R=G=B should hold (or approx) since it's grayscale
    const hex = simulated.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Grayscale means all channels should be equal (within rounding)
    expect(Math.abs(r - g)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(1);
    expect(Math.abs(r - b)).toBeLessThanOrEqual(1);
  });

  it("should handle black (stays black under all CVD types)", () => {
    for (const cvd of ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as CvdType[]) {
      const simulated = simulateCvd("#000000", cvd);
      expect(simulated.toLowerCase()).toBe("#000000");
    }
  });

  it("should return valid hex format for all CVD types", () => {
    const testColors = ["#ff0000", "#00ff00", "#0000ff", "#808080", "#ffa500"];
    for (const cvd of ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as CvdType[]) {
      for (const color of testColors) {
        const simulated = simulateCvd(color, cvd);
        expect(simulated).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it("should produce different results for different CVD types on the same color", () => {
    const color = "#ff8800";
    const results = new Set(
      (["protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as CvdType[]).map(
        (cvd) => simulateCvd(color, cvd),
      ),
    );
    // At least 3 should be distinct (achromatopsia will be very different)
    expect(results.size).toBeGreaterThanOrEqual(3);
  });

  it("should return a valid hex string with six hex digits", () => {
    const color = "#ff8000";
    for (const cvd of ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as CvdType[]) {
      const result = simulateCvd(color, cvd);
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("CVD Simulation - getCvdContrastRatio", () => {
  it("should return same ratio for 'none'", () => {
    const ratio = getCvdContrastRatio("#ff0000", "#ffffff", "none");
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(21);
  });

  it("should return different ratio under protanopia vs normal for red on white", () => {
    const normalRatio = getCvdContrastRatio("#ff0000", "#ffffff", "none");
    const cvdRatio = getCvdContrastRatio("#ff0000", "#ffffff", "protanopia");
    // The ratio should differ under CVD simulation
    expect(Math.abs(cvdRatio - normalRatio)).toBeGreaterThan(0.01);
  });

  it("should return different ratio under deuteranopia vs normal for green on white", () => {
    const normalRatio = getCvdContrastRatio("#00ff00", "#ffffff", "none");
    const cvdRatio = getCvdContrastRatio("#00ff00", "#ffffff", "deuteranopia");
    expect(Math.abs(cvdRatio - normalRatio)).toBeGreaterThan(0.01);
  });

  it("should return approximately 21:1 for black on white with 'none' CVD", () => {
    const ratio = getCvdContrastRatio("#000000", "#ffffff", "none");
    expect(ratio).toBeCloseTo(21, 1);
  });

  it("should return valid ratio for black on white under all CVD types", () => {
    for (const cvd of ["none", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as CvdType[]) {
      const ratio = getCvdContrastRatio("#000000", "#ffffff", cvd);
      expect(ratio).toBeGreaterThanOrEqual(1);
      expect(ratio).toBeLessThanOrEqual(21);
    }
  });

  it("should return 1:1 for identical colors under all CVD types", () => {
    for (const cvd of ["none", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as CvdType[]) {
      const ratio = getCvdContrastRatio("#ff0000", "#ff0000", cvd);
      expect(ratio).toBeCloseTo(1, 4);
    }
  });

  it("achromatopsia should produce luminance-only ratios regardless of hue", () => {
    // Under monochrome, contrast depends only on luminance
    const ratioRed = getCvdContrastRatio("#ff0000", "#ffffff", "achromatopsia");
    const ratioGreen = getCvdContrastRatio("#00ff00", "#ffffff", "achromatopsia");
    const ratioBlue = getCvdContrastRatio("#0000ff", "#ffffff", "achromatopsia");
    // All should be valid ratios
    expect(ratioRed).toBeGreaterThanOrEqual(1);
    expect(ratioGreen).toBeGreaterThanOrEqual(1);
    expect(ratioBlue).toBeGreaterThanOrEqual(1);
    // Green has highest luminance → lowest contrast against white
    expect(ratioGreen).toBeLessThan(ratioRed);
    expect(ratioGreen).toBeLessThan(ratioBlue);
  });

  it("all CVD types return ratios within valid range for edge color pairs", () => {
    const edgeFgColors = ["#000000", "#ffffff", "#808080", "#ff0000", "#00ff00", "#0000ff"];
    const edgeBgColors = ["#000000", "#ffffff", "#808080", "#ff0000", "#00ff00", "#0000ff"];
    for (const fg of edgeFgColors) {
      for (const bg of edgeBgColors) {
        for (const cvd of ["protanopia", "deuteranopia", "tritanopia"] as CvdType[]) {
          const ratio = getCvdContrastRatio(fg, bg, cvd);
          expect(ratio).toBeGreaterThanOrEqual(1);
          expect(ratio).toBeLessThanOrEqual(21);
        }
      }
    }
  });
});
