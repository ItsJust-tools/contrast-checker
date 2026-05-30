"use client";

import { ThemeProvider } from "@itsjust/core";

export function ToolClientWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
