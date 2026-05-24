"use client";

import { ThemeProvider } from "@itsjust/core";
import ToolClient from "./tool-client";

export function ToolClientWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
