"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { DownloadIcon, ChevronDownIcon, UndoIcon, RedoIcon } from "./icons";

export type ExportFormat = "json" | "png" | "webp" | "pdf";

interface ToolToolbarProps {
  onExport?: (format: ExportFormat) => void;
  onSwapColors?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  disabled?: boolean;
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
 * (JSON, PNG, WebP, PDF).
 *
 * Keyboard navigation within the dropdown supports arrow keys (Up/Down),
 * Home/End to jump to first/last item, and Enter/Space to select.
 * Escape closes the dropdown and returns focus to the trigger button.
 */
export function ToolToolbar({ onExport, onSwapColors, onUndo, onRedo, canUndo = false, canRedo = false, disabled = false }: ToolToolbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Map keyboard shortcuts to their export format.
   * Stable reference via useRef to avoid re-creating the effect on every render.
   */
  const shortcutMapRef = useRef<Record<string, "json" | "png" | "swap" | "undo" | "redo">>({
    "ctrl+shift+e": "json",
    "meta+shift+e": "json",
    "ctrl+shift+p": "png",
    "meta+shift+p": "png",
    "ctrl+shift+x": "swap",
    "meta+shift+x": "swap",
    "ctrl+z": "undo",
    "meta+z": "undo",
    "ctrl+y": "redo",
    "meta+shift+z": "redo",
  });

  /** Global keyboard shortcut handler. */
  useEffect(() => {
    const shortcutMap = shortcutMapRef.current;
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      const key = [
        e.ctrlKey || e.metaKey ? "ctrl" : "",
        e.shiftKey ? "shift" : "",
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");
      const action = shortcutMap[key];
      if (action === "swap") {
        e.preventDefault();
        onSwapColors?.();
      } else if (action === "undo") {
        e.preventDefault();
        onUndo?.();
      } else if (action === "redo") {
        e.preventDefault();
        onRedo?.();
      } else if (action) {
        e.preventDefault();
        setDropdownOpen(false);
        onExport?.(action);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [disabled, onExport, onSwapColors, onUndo, onRedo]);

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

  /** Focus the active item when dropdown opens or focusedIndex changes. */
  useEffect(() => {
    if (!dropdownOpen) return;
    const target = itemRefs.current[focusedIndex];
    if (target) {
      target.focus();
    }
  }, [dropdownOpen, focusedIndex]);

  /** Reset focus index when dropdown opens. */
  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => {
      if (!prev) {
        // Resetting in the updater is safe and avoids cascading renders
        setFocusedIndex(0);
      }
      return !prev;
    });
  }, []);

  /**
   * Handle selecting an export format from the dropdown menu.
   * Closes the menu, returns focus to the trigger button, and calls onExport.
   */
  const handleFormatSelect = useCallback(
    (format: ExportFormat) => {
      setDropdownOpen(false);
      triggerRef.current?.focus();
      onExport?.(format);
    },
    [onExport],
  );

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDropdown();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!dropdownOpen) {
          toggleDropdown();
        }
      } else if (e.key === "Escape" && dropdownOpen) {
        e.preventDefault();
        setDropdownOpen(false);
      }
    },
    [toggleDropdown, dropdownOpen],
  );

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const lastIndex = EXPORT_FORMATS.length - 1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < lastIndex ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : lastIndex));
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(lastIndex);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleFormatSelect(EXPORT_FORMATS[focusedIndex].format);
          break;
        case "Escape":
          e.preventDefault();
          setDropdownOpen(false);
          triggerRef.current?.focus();
          break;
      }
    },
    [focusedIndex, handleFormatSelect],
  );

  return (
    <div className="contrast-toolbar" ref={dropdownRef}>
      {/* Undo / Redo buttons */}
      <div style={{ display: "flex", gap: "0.25rem", marginRight: "auto" }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUndo?.();
          }}
          disabled={disabled || !canUndo}
          className="btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "28px",
            padding: 0,
          }}
          aria-label="Undo last action (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
        >
          <UndoIcon />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRedo?.();
          }}
          disabled={disabled || !canRedo}
          className="btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "28px",
            padding: 0,
          }}
          aria-label="Redo last undone action (Ctrl+Shift+Z)"
          title="Redo (Ctrl+Shift+Z)"
        >
          <RedoIcon />
        </button>
      </div>
      <div className="export-dropdown" style={{ position: "relative" }}>
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleDropdown}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-controls={dropdownOpen ? "export-dropdown-menu" : undefined}
          aria-label="Export contrast combinations. Select format."
          aria-keyshortcuts="Ctrl+Shift+E Ctrl+Shift+P Ctrl+Shift+X"
          title="Export (Ctrl+Shift+E: JSON, Ctrl+Shift+P: PNG) | Swap Colors (Ctrl+Shift+X)"
          className="export-dropdown-trigger"
        >
          <DownloadIcon />
          Export
          <ChevronDownIcon open={dropdownOpen} />
        </button>

        {dropdownOpen && (
          <div
            id="export-dropdown-menu"
            className="export-dropdown-menu"
            role="menu"
            aria-label="Export format"
            onKeyDown={handleMenuKeyDown}
          >
            {EXPORT_FORMATS.map(({ format, label, shortcut }, index) => (
              <button
                key={format}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={index === focusedIndex ? 0 : -1}
                onClick={() => handleFormatSelect(format)}
                className="export-dropdown-item"
                aria-label={`Export as ${label}`}
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

ToolToolbar.displayName = "ToolToolbar";
