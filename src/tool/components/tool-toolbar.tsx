"use client";

import type { ReactNode } from "react";
import { DownloadIcon } from "./icons";

interface ToolToolbarProps {
  onExport?: () => void;
  children?: ReactNode;
}

export function ToolToolbar({ onExport, children }: ToolToolbarProps) {
  return (
    <div
      className="contrast-toolbar"
      style={{ padding: "0.5rem", display: "flex", justifyContent: "flex-end" }}
    >
      {children ?? (
        <button
          type="button"
          onClick={onExport}
          aria-label="Export contrast combinations"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            padding: "0.375rem 0.75rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            background: "var(--card)",
            color: "var(--foreground)",
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <DownloadIcon />
          Export
        </button>
      )}
    </div>
  );
}
