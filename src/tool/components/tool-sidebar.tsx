"use client";

import { useCallback, useMemo } from "react";
import {
  getRelativeLuminance,
  getContrastRatio,
  formatRatio,
  suggestAccessibleColor,
} from "@/lib/contrast";
import type { SuggestionResult } from "@/lib/contrast";
import { CheckIcon, XIcon, TrashIcon } from "./icons";

/**
 * Convert a hex color string to an RGB tuple.
 * Supports 3-, 6-, and 8-digit hex formats (8-digit discards alpha).
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace(/^#/, "");
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return { r, g, b };
  }
  if (cleaned.length >= 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b };
  }
  return { r: 0, g: 0, b: 0 };
}

/**
 * Convert an RGB tuple to an HSL tuple.
 * Returns values as integer degrees (H), percentage (S), percentage (L).
 */
export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) * 60;
    } else {
      h = ((rNorm - gNorm) / delta + 4) * 60;
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Format an RGB value as a CSS rgb() string.
 */
export function formatRgb(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Format an HSL value as a CSS hsl() string.
 */
export function formatHsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

interface ToolSidebarProps {
  fgColor: string;
  bgColor: string;
  combinations: {
    fg: string;
    bg: string;
    ratio: number;
    passAA: boolean;
    passAAA: boolean;
  }[];
  onFgChange?: (color: string) => void;
  onBgChange?: (color: string) => void;
  onClearCombinations?: () => void;
  onRemoveCombination?: (index: number) => void;
}

/**
 * Clickable color swatch that opens a native color picker on click.
 * Displays a two-letter abbreviation (first two chars of label) centered
 * on the swatch, rendered in an accessible contrasting color.
 */
function ColorSwatch({
  color,
  label,
  onColorChange,
  inputId,
}: {
  color: string;
  label: string;
  onColorChange?: (color: string) => void;
  inputId: string;
}) {
  const handleClick = useCallback(() => {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.click();
    }
  }, [inputId]);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onColorChange?.(e.target.value);
    },
    [onColorChange],
  );

  return (
    <div
      className="color-swatch"
      style={{
        width: "48px",
        height: "48px",
        background: color,
        border: "2px solid var(--foreground)",
        borderRadius: "var(--radius)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.6875rem",
        cursor: "pointer",
        position: "relative",
        transition: "transform 0.1s, box-shadow 0.1s",
        outline: "none",
      }}
      role="button"
      tabIndex={0}
      aria-label={`${label} color: ${color}. Click to change.`}
      title={`Click to pick ${label} color. Current: ${color}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span
        style={{
          fontSize: "0.6875rem",
          textShadow: "0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(255,255,255,0.5)",
          color:
            getContrastRatio(color, "#ffffff") > 4.5 ? "#ffffff" : "#000000",
        }}
      >
        {label.slice(0, 2).toUpperCase()}
      </span>
      <input
        type="color"
        id={inputId}
        value={color}
        onChange={handleColorChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Displays a WCAG compliance badge with pass/fail visual indicator.
 * Shows the pass rate percentage for the given standard across all saved combinations.
 */
function ComplianceBadge({
  pass,
  label,
  rate,
}: {
  pass: boolean;
  label: string;
  rate: number;
}) {
  return (
    <div
      className={`contrast-badge sidebar-compliance ${pass ? "pass" : "fail"}`}
    >
      {pass ? <CheckIcon /> : <XIcon />}
      <div className="contrast-badge-text">
        <span className="contrast-badge-label">{label}</span>
        <span className="contrast-badge-status">{rate.toFixed(0)}% Pass</span>
      </div>
    </div>
  );
}

/**
 * Small color swatch displaying the abbreviation label with contrasting text.
 * Reads the hex color and shows the abbreviation in an optimally readable color.
 */
/**
 * Small color swatch displaying the abbreviation label with contrasting text.
 * Reads the hex color and shows the abbreviation in an optimally readable color.
 */
function ColorReferenceSwatch({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  const textColor =
    getContrastRatio(color, "#ffffff") > 4.5 ? "#ffffff" : "#000000";
  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        background: color,
        border: "2px solid var(--foreground)",
        borderRadius: "var(--radius)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.05em",
        color: textColor,
        textShadow: `0 0 3px ${color === "#000000" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}`,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

/**
 * Suggested foreground color row with click-to-apply behavior.
 * Shared between light and dark suggestion display.
 */
function SuggestionRow({
  suggestion,
  onApply,
}: {
  suggestion: { color: string; ratio: number; passAAA: boolean };
  onApply?: (color: string) => void;
}) {
  const handleClick = useCallback(() => {
    onApply?.(suggestion.color);
  }, [onApply, suggestion.color]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onApply?.(suggestion.color);
      }
    },
    [onApply, suggestion.color],
  );

  const brightnessLabel =
    getContrastRatio(suggestion.color, "#ffffff") > 4.5 ? "Light" : "Dark";

  return (
    <div
      className="sidebar-suggestion-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.375rem 0.5rem",
        borderRadius: "var(--radius)",
        cursor: "pointer",
        marginBottom: "0.25rem",
        transition: "background-color 0.15s",
      }}
      role="button"
      tabIndex={0}
      title={`Apply ${suggestion.color}`}
      aria-label={`Apply ${brightnessLabel.toLocaleLowerCase()} foreground ${suggestion.color} with ratio ${formatRatio(suggestion.ratio)}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          background: suggestion.color,
          border: "1px solid var(--border)",
          borderRadius: "4px",
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontFamily: "monospace",
            fontWeight: 500,
          }}
        >
          {suggestion.color}
        </span>
        <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
          {brightnessLabel} · {formatRatio(suggestion.ratio)}
          {suggestion.passAAA ? " · AAA✓" : " · AA✓"}
        </span>
      </div>
      <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
        Click to apply
      </span>
    </div>
  );
}

/**
 * Displays the hex, RGB, and HSL values for a given color in a compact layout.
 */
function ColorReferenceDetails({
  color,
  name,
}: {
  color: string;
  name: string;
}) {
  const rgb = useMemo(() => hexToRgb(color), [color]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);
  return (
    <div style={{ fontSize: "0.625rem", lineHeight: "1.5", minWidth: 0 }}>
      <div
        style={{
          fontWeight: 600,
          marginBottom: "0.125rem",
          color: "var(--foreground)",
        }}
      >
        {name}
      </div>
      <div
        style={{
          color: "var(--muted-foreground)",
          fontFamily: "ui-monospace, Menlo, Monaco, monospace",
        }}
      >
        <div>{color.toLowerCase()}</div>
        <div>{formatRgb(rgb.r, rgb.g, rgb.b)}</div>
        <div>{formatHsl(hsl.h, hsl.s, hsl.l)}</div>
      </div>
    </div>
  );
}

/**
 * Sidebar panel for the Contrast Checker tool.
 *
 * Displays:
 * - Aggregate accessibility stats (average contrast ratio, pass rates for AA/AAA)
 * - Quick color picker swatches for foreground and background
 * - Color reference swatches showing current colors
 * - Accessible color suggestions for the current background
 * - Saved combinations list with individual deletion
 * - WCAG guidelines reference
 */
export function ToolSidebar({
  fgColor,
  bgColor,
  combinations,
  onFgChange,
  onBgChange,
  onClearCombinations,
  onRemoveCombination,
}: ToolSidebarProps) {
  const fgPreview = useMemo(() => {
    try {
      return getRelativeLuminance(fgColor);
    } catch {
      return 0;
    }
  }, [fgColor]);

  const bgPreview = useMemo(() => {
    try {
      return getRelativeLuminance(bgColor);
    } catch {
      return 0;
    }
  }, [bgColor]);

  const averageContrast = useMemo(() => {
    if (combinations.length === 0) return 0;
    const sum = combinations.reduce((acc, c) => acc + c.ratio, 0);
    return sum / combinations.length;
  }, [combinations]);

  const passRateAA = useMemo(() => {
    if (combinations.length === 0) return 0;
    const passed = combinations.filter((c) => c.passAA).length;
    return (passed / combinations.length) * 100;
  }, [combinations]);

  const passRateAAA = useMemo(() => {
    if (combinations.length === 0) return 0;
    const passed = combinations.filter((c) => c.passAAA).length;
    return (passed / combinations.length) * 100;
  }, [combinations]);

  /** Announceable summary of current stats, used by the screen-reader live region. */
  const liveSummary = useMemo(() => {
    if (combinations.length === 0) return "No combinations saved yet.";
    return (
      `${combinations.length} combination${combinations.length === 1 ? "" : "s"} saved. ` +
      `Average contrast ratio ${averageContrast.toFixed(2)}:1. ` +
      `AA pass rate ${passRateAA.toFixed(0)}%. ` +
      `AAA pass rate ${passRateAAA.toFixed(0)}%.`
    );
  }, [combinations, averageContrast, passRateAA, passRateAAA]);

  const levelIndicator =
    averageContrast >= 7
      ? ("aaa" as const)
      : averageContrast >= 4.5
        ? ("aa" as const)
        : ("fail" as const);

  const accessibleSuggestions = useMemo<SuggestionResult>(() => {
    try {
      return suggestAccessibleColor(bgColor);
    } catch {
      return { light: null, dark: null, best: null };
    }
  }, [bgColor]);

  return (
    <div className="contrast-sidebar">
      {/* Screen-reader live region for stats changes */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveSummary}
      </div>

      {/* Stats */}
      <div className="sidebar-section">
        <h3>Accessibility Stats</h3>
        <div
          className="stats-summary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.75rem",
            background:
              levelIndicator === "aaa"
                ? "var(--accent-subtle, rgba(139, 92, 246, 0.08))"
                : undefined,
            borderRadius: "var(--radius)",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              background: "var(--card)",
              borderRadius: "var(--radius)",
              padding: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                fontFamily: "ui-monospace, Menlo, Monaco, monospace",
                color: fgPreview > bgPreview ? fgColor : bgColor,
              }}
            >
              {averageContrast.toFixed(2)}
            </span>
            <span style={{ fontSize: "0.6875rem" }}>:1</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontWeight: 600 }}>Average Contrast Ratio</span>
            <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
              {(fgPreview * 100).toFixed(0)}% luminance on{" "}
              {(bgPreview * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Compliance Badges — show check when at least half of saved combos pass */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <ComplianceBadge
            pass={combinations.length > 0 && passRateAA >= 50}
            label="AA"
            rate={passRateAA}
          />
          <ComplianceBadge
            pass={combinations.length > 0 && passRateAAA >= 50}
            label="AAA"
            rate={passRateAAA}
          />
        </div>
      </div>

      {/* Click-to-select Color Section */}
      <div className="sidebar-section">
        <h3>Click to Pick Colors</h3>
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--muted)",
            marginBottom: "0.75rem",
          }}
        >
          Click any color swatch to open the color picker
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <ColorSwatch
            color={fgColor}
            label="Foreground"
            onColorChange={onFgChange}
            inputId="side-fg"
          />
          <ColorSwatch
            color={bgColor}
            label="Background"
            onColorChange={onBgChange}
            inputId="side-bg"
          />
        </div>
      </div>

      {/* Color Reference with RGB/HSL Format Display */}
      <div className="sidebar-section">
        <h3>Color Reference</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "0.5rem",
          }}
        >
          <ColorReferenceSwatch color={fgColor} label="FG" />
          <ColorReferenceDetails color={fgColor} name="Foreground" />
          <ColorReferenceSwatch color={bgColor} label="BG" />
          <ColorReferenceDetails color={bgColor} name="Background" />
        </div>
      </div>

      {/* Accessible Color Suggestions */}
      <div className="sidebar-section">
        <h3>Accessible Color Suggestions</h3>
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--muted)",
            marginBottom: "0.5rem",
          }}
        >
          Suggested foreground colors that pass WCAG AA on this background.
          Click a suggestion to apply it.
        </p>

        {accessibleSuggestions.light && (
          <SuggestionRow
            suggestion={accessibleSuggestions.light}
            onApply={onFgChange}
          />
        )}

        {accessibleSuggestions.dark && (
          <SuggestionRow
            suggestion={accessibleSuggestions.dark}
            onApply={onFgChange}
          />
        )}

        {!accessibleSuggestions.light && !accessibleSuggestions.dark && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
              fontStyle: "italic",
              padding: "0.25rem 0",
            }}
          >
            No passing suggestion found for this background color.
          </div>
        )}
      </div>

      {/* Combinations Export */}
      {combinations.length > 0 && (
        <div className="sidebar-section">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3>Combinations ({combinations.length})</h3>
            {onClearCombinations && (
              <button
                type="button"
                onClick={onClearCombinations}
                className="btn-secondary"
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.25rem 0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  color: "var(--error)",
                }}
                aria-label="Clear all saved combinations"
              >
                <TrashIcon />
                Clear
              </button>
            )}
          </div>
          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.5rem",
            }}
          >
            {combinations.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem",
                  marginBottom: "0.25rem",
                  borderRadius: "4px",
                  background: c.passAA
                    ? "var(--card)"
                    : "var(--error, rgba(244, 63, 94, 0.1))",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    background: c.fg,
                    borderRadius: "3px",
                    border: `1px solid ${c.bg}`,
                  }}
                />
                <div
                  style={{ display: "flex", flexDirection: "column", flex: 1 }}
                >
                  <span
                    style={{ fontSize: "0.75rem", fontFamily: "monospace" }}
                  >
                    {c.fg}
                  </span>
                  <span
                    style={{ fontSize: "0.6875rem", color: "var(--muted)" }}
                  >
                    {c.bg}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: c.passAA ? "var(--foreground)" : "var(--error)",
                  }}
                >
                  {c.ratio.toFixed(2)}:1
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.125rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.625rem",
                      color: c.passAAA ? "var(--success)" : "var(--muted)",
                    }}
                  >
                    {c.passAAA ? "\u2713 AAA" : "\u2717 AAA"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      color: c.passAA ? "var(--success)" : "var(--muted)",
                    }}
                  >
                    {c.passAA ? "\u2713 AA" : "\u2717 AA"}
                  </span>
                </div>
                {onRemoveCombination && (
                  <button
                    type="button"
                    onClick={() => onRemoveCombination(i)}
                    className="btn-icon"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      padding: 0,
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      background: "transparent",
                      color: "var(--muted)",
                      cursor: "pointer",
                      flexShrink: 0,
                      transition: "color 0.1s, border-color 0.1s",
                    }}
                    aria-label={`Delete combination ${c.fg} on ${c.bg}`}
                    title="Remove this combination"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WCAG Guidelines */}
      <div className="sidebar-section">
        <h3>WCAG Guidelines</h3>
        <div
          style={{
            fontSize: "0.6875rem",
            color: "var(--muted)",
            lineHeight: "1.6",
          }}
        >
          <div style={{ marginBottom: "0.25rem" }}>
            <strong>Normal text (18pt or less):</strong> 4.5:1 minimum
          </div>
          <div style={{ marginBottom: "0.25rem" }}>
            <strong>Large text (18pt+ or 14pt bold):</strong> 3:1 minimum
          </div>
          <div>
            <strong>UI Components:</strong> 3:1 minimum
          </div>
        </div>
      </div>
    </div>
  );
}
