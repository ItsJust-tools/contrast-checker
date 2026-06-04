"use client";

import { useCallback, useState, useRef, useEffect, type ReactNode } from "react";
import { DownloadIcon, ChevronDownIcon } from "./icons";

export type ExportFormat = "json" | "png" | "webp" | "pdf";

interface ToolToolbarProps {
  onExport?: (format: ExportFormat) => void;
  disabled?: boolean;
  children?: ReactNode;
}

/**
 * Available export formats with display labels and descriptions.
 */
const EXPORT_FORMATS: { format: ExportFormat; label: string; shortcut?: string }[] = [
  { format: "json", label: "Export JSON", shortcut: "Ctrl+Shift+E" },
  { format: "png", label: "Export PNG", shortcut: "Ctrl+Shift+P" },
  { format: "webp", label: "Export WebP" },
  { format: "pdf", label: "Export PDF" },
];

/**
 * Toolbar component for the Contrast Checker.
 *
 * Displays an Export button with a dropdown to select the desired format
 * (JSON, PNG, WebP, PDF). Falls back to `children` when provided.
 */
export function ToolToolbar({ onExport, disabled = false, children }: ToolToolbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /** Close dropdown on outside click. */
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [dropdownOpen]);

  /** Close dropdown on Escape key. */
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [dropdownOpen]);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const handleFormatSelect = useCallback(
    (format: ExportFormat) => {
      setDropdownOpen(false);
      onExport?.(format);
    },
    [onExport],
  );

  const handleDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDropdown();
      }
    },
    [toggleDropdown],
  );

  if (children) {
    return (
      <div className="contrast-toolbar">
        {children}
      </div>
    );
  }

  return (
    <div className="contrast-toolbar" ref={dropdownRef}>
      <div className="export-dropdown" style={{ position: "relative" }}>
        <button
          type="button"
          onClick={toggleDropdown}
          onKeyDown={handleDropdownKeyDown}
          disabled={disabled}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-label="Export contrast combinations. Select format."
          className="export-dropdown-trigger"
        >
          <DownloadIcon />
          Export
          <ChevronDownIcon open={dropdownOpen} />
        </button>

        {dropdownOpen && (
          <div
            className="export-dropdown-menu"
            role="menu"
            aria-label="Export format"
          >
            {EXPORT_FORMATS.map(({ format, label, shortcut }) => (
              <button
                key={format}
                type="button"
                role="menuitem"
                onClick={() => handleFormatSelect(format)}
                className="export-dropdown-item"
              >
                <span>{label}</span>
                {shortcut && (
                  <kbd className="export-shortcut-hint">{shortcut}</kbd>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
