import type { ToolConfig } from "@itsjust/core";

const toolConfig = {
  id: "contrast-checker",
  name: "Contrast Checker",
  description:
    "Test color contrast ratios against WCAG guidelines. Check accessibility compliance for AA and AAA levels with normal and large text.",
  version: "1.7.0",
  exportFormats: ["json", "png", "webp", "pdf"],
  features: {
    export: true,
    autoSave: false,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: "#ef4444",
    accentHover: "#dc2626",
    accentSubtle: "rgba(239, 68, 68, 0.08)",
    brand: "Contrast Checker",
    icon: "◈",
  },
  shortcuts: [
    {
      title: "Contrast Checker",
      shortcuts: [
        {
          keys: "Ctrl+Shift+E",
          label: "Export JSON",
          description: "export current combinations as JSON",
        },
        {
          keys: "Ctrl+Shift+P",
          label: "Export PNG",
          description: "screenshot as PNG",
        },
        {
          keys: "Ctrl+Shift+X",
          label: "Swap Colors",
          description: "swap foreground and background colors",
        },
        {
          keys: "Ctrl+Z",
          label: "Undo",
          description: "undo last change",
        },
        {
          keys: "Ctrl+Y",
          label: "Redo",
          description: "redo previously undone change",
        },
      ],
    },
  ],
} satisfies ToolConfig;

export default toolConfig;
