"use client";

import { useCallback } from "react";

interface ToolToolbarProps {
  onExport?: () => void;
}

export function ToolToolbar({ onExport }: ToolToolbarProps) {
  const actions = useCallback(() => {
    return (
      <>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{ width: "16px", height: "16px" }}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Export
        </button>
      </>
    );
  }, [onExport]);

  return (
    <div
      className="contrast-toolbar"
      style={{ padding: "0.5rem", display: "flex", justifyContent: "flex-end" }}
    >
      {actions()}
    </div>
  );
}
