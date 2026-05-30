/**
 * PNG Exporter for Contrast Checker
 * Captures the tool canvas as a PNG image with accessibility metadata
 */

import type { Exporter } from "@itsjust/core";

export const exporter: Exporter = {
  format: "png",
  export: async (element, options, _stateSerializer) => {
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(element, {
        width: element.offsetWidth,
        height: element.offsetHeight,
        quality: 0.9,
        backgroundColor: "#ffffff",
        ...(options?.padding && { padding: options.padding }),
      });

      if (!blob) {
        return {
          success: false,
          data: null,
          filename: options?.filename ?? `contrast-check-${Date.now()}`,
          format: "png",
          error: "Failed to generate PNG blob",
        };
      }

      return {
        success: true,
        data: blob,
        filename: options?.filename ?? `contrast-check-${Date.now()}.png`,
        format: "png",
      };
    } catch (error) {
      console.error("[PNG Exporter]", error);
      return {
        success: false,
        data: null,
        filename: options?.filename ?? `contrast-check-${Date.now()}`,
        format: "png",
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  },
};

export default exporter;
