/**
 * WebP Exporter for Contrast Checker
 * Captures the tool canvas as a WebP image with accessibility metadata
 */

import type { Exporter } from "@itsjust/core";
import { sanitizeFilename } from "@/lib/filename-sanitizer";

export const exporter: Exporter = {
  format: "webp",
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
        quality: 0.85,
        backgroundColor,
        type: "image/webp",
        ...(options?.padding && { padding: options.padding }),
      });

      if (!blob) {
        return {
          success: false,
          data: null,
          filename: options?.filename ?? `contrast-check-${Date.now()}`,
          format: "webp",
          error: "Failed to generate WebP blob",
        };
      }

      const sanitizedFilename = sanitizeFilename(
        options?.filename ?? `contrast-check-${Date.now()}`,
      );
      return {
        success: true,
        data: blob,
        filename: sanitizedFilename,
        format: "webp",
      };
    } catch (error) {
      console.error("[WebP Exporter]", error);
      return {
        success: false,
        data: null,
        filename: sanitizeFilename(
          options?.filename ?? `contrast-check-${Date.now()}`,
        ),
        format: "webp",
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  },
};

export default exporter;
