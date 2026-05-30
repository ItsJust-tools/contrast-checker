import type { Tool } from "@itsjust/core";
import toolConfig from "./tool.config";
import type { ContrastState } from "./types";

function isContrastState(value: unknown): value is ContrastState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as {
    fgColor?: unknown;
    bgColor?: unknown;
    combinations?: unknown;
    label?: unknown;
  };
  if (typeof v.fgColor !== "string") return false;
  if (typeof v.bgColor !== "string") return false;
  if (!Array.isArray(v.combinations)) return false;
  for (const combination of v.combinations) {
    if (typeof combination !== "object" || combination === null) return false;
    const c = combination as {
      fg: unknown;
      bg: unknown;
      ratio: unknown;
      passAA?: unknown;
      passAAA?: unknown;
    };
    if (
      typeof c.fg !== "string" ||
      typeof c.bg !== "string" ||
      typeof c.ratio !== "number"
    )
      return false;
    if (c.passAA !== undefined && typeof c.passAA !== "boolean") return false;
    if (c.passAAA !== undefined && typeof c.passAAA !== "boolean") return false;
  }
  return true;
}

export const contrastTool: Tool<ContrastState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: {
    fgColor: "#000000",
    bgColor: "#ffffff",
    combinations: [],
    label: "",
  },
  serialize: (state) =>
    JSON.stringify(
      {
        fgColor: state.fgColor,
        bgColor: state.bgColor,
        combinations: state.combinations,
        label: state.label,
      },
      null,
      2,
    ),
  deserialize: (data) => {
    let parsed: unknown = data;
    if (typeof data === "string") {
      try {
        parsed = JSON.parse(data);
      } catch {
        return {
          success: false,
          error:
            "Invalid data format: expected { fgColor: string, bgColor: string, combinations: Array<{ fg, bg, ratio, passAA, passAAA }>, label?: string }",
        };
      }
    }
    if (isContrastState(parsed)) {
      return {
        success: true,
        data: {
          fgColor: parsed.fgColor,
          bgColor: parsed.bgColor,
          combinations: parsed.combinations,
          label: parsed.label || "",
        },
      };
    }
    return {
      success: false,
      error:
        "Invalid data format: expected { fgColor: string, bgColor: string, combinations: Array<{ fg, bg, ratio, passAA, passAAA }>, label?: string }",
    };
  },
  exporters: [
    { format: "png", loader: () => import("./exporters/png") },
    { format: "webp", loader: () => import("./exporters/webp") },
    { format: "pdf", loader: () => import("./exporters/pdf") },
  ],
};
