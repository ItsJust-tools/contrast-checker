/**
 * PNG Exporter for Contrast Checker
 * Captures the tool canvas as a PNG image with accessibility metadata
 */

import type { Exporter } from "@itsjust/core";
import { sanitizeFilename } from "@/lib/filename-sanitizer";

export const exporter: Exporter = {
  format: "png",
  export: async (element, options, _stateSerializer) => {
    try {
      const { toBlob } = await import("html-to-image");
      // Use the element's actual computed background so dark-mode exports
      // preserve the correct background instead of always rendering white
      const computedBg = getComputedStyle(element).backgroundColor;
      const backgroundColor =
        computedBg && computedBg !== "rgba(0, 0, 0, 0)"
          ? computedBg
          : "#ffffff";
      const blob = await toBlob(element, {
        width: element.offsetWidth,
        height: element.offsetHeight,
        quality: 0.9,
        backgroundColor,
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

      const sanitizedFilename = sanitizeFilename(
        options?.filename ?? `contrast-check-${Date.now()}`,
      );
      return {
        success: true,
        data: blob,
        filename: sanitizedFilename,
        format: "png",
      };
    } catch (error) {
      console.error("[PNG Exporter]", error);
      return {
        success: false,
        data: null,
        filename: sanitizeFilename(
          options?.filename ?? `contrast-check-${Date.now()}`,
        ),
        format: "png",
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  },
};

export default exporter;
