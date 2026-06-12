"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  getRelativeLuminance,
  getContrastRatio,
  formatRatio,
  suggestAccessibleColor,
  suggestAccessiblePair,
  hexToRgb,
  rgbToHsl,
  formatRgb,
  formatHsl,
  simulateCvd,
  getCvdContrastRatio,
  getWCAGLevel,
  getLuminanceLabel,
  CVD_LABELS,
  CVD_SHORT_LABELS,
} from "@/lib/contrast";
import type { AccessiblePair, SuggestionResult, CvdType } from "@/lib/contrast";
import { CheckIcon, XIcon, TrashIcon } from "./icons";

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
  cvdType?: CvdType;
  onCvdTypeChange?: (cvdType: CvdType) => void;
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
      className="color-swatch-small"
      style={{
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.6875rem",
        position: "relative",
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

ColorSwatch.displayName = "ColorSwatch";

/**
 * Displays a WCAG compliance badge with pass/fail visual indicator.
 * Shows the pass rate percentage for the given standard across all saved combinations.
 * When no combinations exist (`count === 0`), renders a neutral badge with N/A.
 */
function ComplianceBadge({
  pass,
  label,
  rate,
  count = 0,
}: {
  pass: boolean;
  label: string;
  rate: number;
  count?: number;
}) {
  return (
    <div
      className={`contrast-badge sidebar-compliance ${count === 0 ? "neutral" : pass ? "pass" : "fail"}`}
      role="status"
      aria-label={`WCAG ${label}: ${count === 0 ? "No combinations saved yet" : pass ? "Passing" : "Failing"}`}
    >
      {count === 0 ? (
        <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>&ndash;</span>
      ) : pass ? (
        <CheckIcon />
      ) : (
        <XIcon />
      )}
      <div className="contrast-badge-text">
        <span className="contrast-badge-label">{label}</span>
        <span className="contrast-badge-status">
          {count === 0 ? "No data" : `${rate.toFixed(0)}% Pass`}
        </span>
      </div>
    </div>
  );
}

ComplianceBadge.displayName = "ComplianceBadge";

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
  // Memoize the text color calculation to avoid recalculating getContrastRatio
  // on every render when the color hasn't changed.
  const textColor = useMemo(
    () =>
      getContrastRatio(color, "#ffffff") > 4.5 ? "#ffffff" : "#000000",
    [color],
  );
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

ColorReferenceSwatch.displayName = "ColorReferenceSwatch";

/**
 * Copy text to clipboard and show brief visual feedback.
 * Falls back gracefully when navigator.clipboard is unavailable.
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // clipboard API may not be available; silently ignore
    }
  }, [text]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}: ${text}`}
      title={`Copy ${label}`}
      style={{
        fontSize: "0.625rem",
        padding: "0.125rem 0.375rem",
        border: `1px solid var(--border)`,
        borderRadius: "3px",
        background: copied ? "var(--accent-subtle)" : "transparent",
        color: copied ? "var(--success)" : "var(--muted-foreground)",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.15s, color 0.15s",
        marginTop: "0.125rem",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

CopyButton.displayName = "CopyButton";

/**
 * Suggested foreground color row with click-to-apply behavior.
 * Shared between light and dark suggestion display.
 *
 * Uses the pre-calculated `brightness` label from {@link ColorSuggestion}
 * instead of recalculating contrast against white on every render.
 */
function SuggestionRow({
  suggestion,
  onApply,
  highlighted = false,
}: {
  suggestion: { color: string; ratio: number; passAAA: boolean; brightness: string };
  onApply?: (color: string) => void;
  highlighted?: boolean;
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

  // Use the pre-calculated brightness label instead of recalculating
  const brightnessLabel = suggestion.brightness === "dark" ? "Dark" : "Light";

  return (
    <div
      className="sidebar-suggestion-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: highlighted ? "0.5rem" : "0.375rem 0.5rem",
        borderRadius: "var(--radius)",
        cursor: "pointer",
        marginBottom: "0.375rem",
        transition: "background-color 0.15s",
        border: highlighted ? "2px solid var(--success)" : "none",
        background: highlighted
          ? "color-mix(in srgb, var(--success) 8%, transparent)"
          : "transparent",
      }}
      role="button"
      tabIndex={0}
      title={`Apply ${suggestion.color} (best match)`}
      aria-label={`Best match: apply ${brightnessLabel.toLocaleLowerCase()} foreground ${suggestion.color} with ratio ${formatRatio(suggestion.ratio)}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          width: highlighted ? "32px" : "28px",
          height: highlighted ? "32px" : "28px",
          background: suggestion.color,
          border: "1px solid var(--border)",
          borderRadius: "4px",
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span
          style={{
            fontSize: highlighted ? "0.8125rem" : "0.75rem",
            fontFamily: "monospace",
            fontWeight: highlighted ? 600 : 500,
          }}
        >
          {suggestion.color}
        </span>
        <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
          {brightnessLabel} · {formatRatio(suggestion.ratio)}
          {suggestion.passAAA ? " · AAA✓" : " · AA✓"}
        </span>
      </div>
      <span style={{ fontSize: highlighted ? "0.6875rem" : "0.65rem", color: "var(--success)", whiteSpace: "nowrap" }}>
        {highlighted ? "★ Best match" : "Apply"}
      </span>
    </div>
  );
}

SuggestionRow.displayName = "SuggestionRow";

/**
 * Small copy-to-clipboard button for a text value.
 * Shows a brief "Copied!" feedback on click, then reverts.
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API not available
    }
  }, [text]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCopy();
      }
    },
    [handleCopy],
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      title={`Copy ${text} to clipboard`}
      aria-label={`Copy ${text} to clipboard`}
      style={{
        padding: "0.125rem 0.375rem",
        fontSize: "0.625rem",
        fontFamily: "monospace",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        background: copied ? "var(--accent-subtle)" : "transparent",
        color: copied ? "var(--accent)" : "var(--muted-foreground)",
        cursor: "pointer",
        transition: "all 0.12s",
        lineHeight: "1.4",
        outline: "none",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
CopyButton.displayName = "CopyButton";

/**
 * Displays the hex, RGB, and HSL values for a given color in a compact layout.
 * Each value row includes a copy button for quick clipboard access.
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
  const rgbStr = useMemo(() => formatRgb(rgb.r, rgb.g, rgb.b), [rgb]);
  const hslStr = useMemo(() => formatHsl(hsl.h, hsl.s, hsl.l), [hsl]);
  const hexLower = useMemo(() => color.toLowerCase(), [color]);
  const luminance = useMemo(() => {
    try {
      return getRelativeLuminance(color);
    } catch {
      return 0;
    }
  }, [color]);
  const brightnessLabel = getLuminanceLabel(luminance);
  return (
    <div style={{ fontSize: "0.625rem", lineHeight: "1.5", minWidth: 0 }}>
      <div
        style={{
          fontWeight: 600,
          marginBottom: "0.25rem",
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.125rem" }}>
          <span style={{ flex: 1 }}>{hexLower}</span>
          <CopyButton text={hexLower} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.125rem" }}>
          <span style={{ flex: 1 }}>{rgbStr}</span>
          <CopyButton text={rgbStr} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.125rem" }}>
          <span style={{ flex: 1 }}>{hslStr}</span>
          <CopyButton text={hslStr} />
        </div>
        <div style={{ marginTop: "0.25rem", fontSize: "0.6rem" }}>
          Luminance: {(luminance * 100).toFixed(1)}% · {brightnessLabel}
        </div>
      </div>
    </div>
  );
}

ColorReferenceDetails.displayName = "ColorReferenceDetails";

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
  cvdType = "none",
  onCvdTypeChange,
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

  const fgRgb = useMemo(() => hexToRgb(fgColor), [fgColor]);
  const bgRgb = useMemo(() => hexToRgb(bgColor), [bgColor]);
  const fgRgbStr = useMemo(() => formatRgb(fgRgb.r, fgRgb.g, fgRgb.b), [fgRgb]);
  const bgRgbStr = useMemo(() => formatRgb(bgRgb.r, bgRgb.g, bgRgb.b), [bgRgb]);

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
    if (combinations.length === 0) return "No combinations saved yet. Use the Save Combination button on the canvas to add one.";
    return (
      `${combinations.length} combination${combinations.length === 1 ? "" : "s"} saved. ` +
      `Average contrast ratio ${formatRatio(averageContrast)}. ` +
      `AA pass rate ${passRateAA.toFixed(0)}%. ` +
      `AAA pass rate ${passRateAAA.toFixed(0)}%.`
    );
  }, [combinations, averageContrast, passRateAA, passRateAAA]);

  const levelIndicator = useMemo(() => getWCAGLevel(averageContrast, "normal"), [averageContrast]);

  const accessibleSuggestions = useMemo<SuggestionResult>(() => {
    try {
      return suggestAccessibleColor(bgColor);
    } catch {
      return { light: null, dark: null, best: null };
    }
  }, [bgColor]);

  const currentContrastRatio = useMemo(() => {
    try {
      return getContrastRatio(fgColor, bgColor);
    } catch {
      return 0;
    }
  }, [fgColor, bgColor]);

  const pairSuggestions = useMemo<AccessiblePair[]>(() => {
    try {
      return suggestAccessiblePair(fgColor, bgColor);
    } catch {
      return [];
    }
  }, [fgColor, bgColor]);

  const showPairSuggestions = currentContrastRatio < 4.5 && pairSuggestions.length > 0;

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
              {formatRatio(averageContrast).replace(/:1$/, "")}
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
            count={combinations.length}
          />
          <ComplianceBadge
            pass={combinations.length > 0 && passRateAAA >= 50}
            label="AAA"
            rate={passRateAAA}
            count={combinations.length}
          />
        </div>
      </div>

      {/* Click-to-select Color Section */}
      <div className="sidebar-section">
        <h3>Click to Pick Colors</h3>
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
            gridTemplateColumns: "auto 1fr auto",
            gap: "0.5rem",
          }}
        >
          <ColorReferenceSwatch color={fgColor} label="FG" />
          <ColorReferenceDetails color={fgColor} name="Foreground" />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "0.25rem" }}>
            <CopyButton text={fgColor.toLowerCase()} label="foreground hex" />
            <CopyButton text={fgRgbStr} label="foreground RGB" />
          </div>
          <ColorReferenceSwatch color={bgColor} label="BG" />
          <ColorReferenceDetails color={bgColor} name="Background" />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "0.25rem" }}>
            <CopyButton text={bgColor.toLowerCase()} label="background hex" />
            <CopyButton text={bgRgbStr} label="background RGB" />
          </div>
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

        {accessibleSuggestions.best && (
          <>
            <SuggestionRow
              suggestion={accessibleSuggestions.best}
              onApply={onFgChange}
              highlighted={true}
            />
            {/* Show secondary options only if they differ from best */}
            {accessibleSuggestions.light &&
              accessibleSuggestions.light.color !== accessibleSuggestions.best.color && (
                <SuggestionRow
                  suggestion={accessibleSuggestions.light}
                  onApply={onFgChange}
                />
              )}
            {accessibleSuggestions.dark &&
              accessibleSuggestions.dark.color !== accessibleSuggestions.best.color && (
                <SuggestionRow
                  suggestion={accessibleSuggestions.dark}
                  onApply={onFgChange}
                />
              )}
          </>
        )}

        {!accessibleSuggestions.best && (
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

      {/* Fix Contrast - shown when current pair fails WCAG AA */}
      {showPairSuggestions && (
        <div className="sidebar-section">
          <h3>Fix This Contrast</h3>
          <p
            style={{
              fontSize: "0.6875rem",
              color: "var(--muted)",
              marginBottom: "0.5rem",
            }}
          >
            Current ratio ({formatRatio(currentContrastRatio)}) does not pass WCAG AA.
            Click a suggestion to apply it.
          </p>
          {pairSuggestions.slice(0, 3).map((pair, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                marginBottom: "0.375rem",
                border: "2px solid var(--warning, #f59e0b)",
                background: "color-mix(in srgb, var(--warning, #f59e0b) 8%, transparent)",
                transition: "background-color 0.15s",
              }}
              role="button"
              tabIndex={0}
              title={pair.description}
              aria-label={`${pair.description}: ratio ${formatRatio(pair.ratio)}`}
              onClick={() => {
                onFgChange?.(pair.fg);
                onBgChange?.(pair.bg);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onFgChange?.(pair.fg);
                  onBgChange?.(pair.bg);
                }
              }}
            >
              <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    background: pair.fg,
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                  }}
                  aria-label={`Foreground: ${pair.fg}`}
                />
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    background: pair.bg,
                    border: "2px solid var(--foreground)",
                    borderRadius: "4px",
                  }}
                  aria-label={`Background: ${pair.bg}`}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.75rem", fontFamily: "monospace", fontWeight: 600 }}>
                  {pair.fg} / {pair.bg}
                </div>
                <div style={{ fontSize: "0.625rem", color: "var(--muted)" }}>
                  {formatRatio(pair.ratio)}
                  {pair.passAAA ? " · AAA✓" : " · AA✓"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Combinations Export */}
      {combinations.length > 0 ? (
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
                  {formatRatio(c.ratio)}
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
      ) : (
        <div className="sidebar-section" aria-live="polite">
          <h3>Combinations</h3>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
              fontStyle: "italic",
              padding: "0.5rem 0",
            }}
          >
            No saved combinations yet. Use the “Save Combination” button on the
            canvas to add one.
          </p>
        </div>
      )}

      {/* Color-Blindness Simulation */}
      <div className="sidebar-section">
        <h3>Color-Vision Simulation</h3>
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--muted)",
            marginBottom: "0.5rem",
          }}
        >
          Preview how your colors appear under different types of color vision
          deficiency.
        </p>
        <div
          role="radiogroup"
          aria-label="Color-vision deficiency simulation type"
          style={{
            display: "flex",
            gap: "0.375rem",
            flexWrap: "wrap",
          }}
        >
          {(Object.entries(CVD_LABELS) as [CvdType, string][]).map(
            ([type, label]) => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={cvdType === type}
                onClick={() => onCvdTypeChange?.(type)}
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.25rem 0.5rem",
                  border: `1px solid ${cvdType === type ? "var(--ring)" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  background:
                    cvdType === type ? "var(--accent-subtle)" : "transparent",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.1s",
                }}
                aria-label={`${label}${cvdType === type ? " (active)" : ""}`}
              >
                {CVD_SHORT_LABELS[type]}
              </button>
            ),
          )}
        </div>

        {cvdType !== "none" && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              background: "var(--accent-subtle)",
              borderRadius: "var(--radius)",
              fontSize: "0.6875rem",
              lineHeight: "1.5",
            }}
            role="region"
            aria-label={`Color-Vision Simulation: ${CVD_LABELS[cvdType]}`}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
              Simulated Contrast
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "0.375rem",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "4px",
                  background: simulateCvd(fgColor, cvdType),
                  border: "1px solid var(--border)",
                  flexShrink: 0,
                }}
                aria-label={`Simulated foreground: ${simulateCvd(fgColor, cvdType)}`}
              />
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "4px",
                  background: simulateCvd(bgColor, cvdType),
                  border: "1px solid var(--border)",
                  flexShrink: 0,
                }}
                aria-label={`Simulated background: ${simulateCvd(bgColor, cvdType)}`}
              />
              <div style={{ flex: 1 }}>
                <div>
                  Ratio:{" "}
                  <strong>{formatRatio(getCvdContrastRatio(fgColor, bgColor, cvdType))}</strong>
                </div>
              </div>
            </div>
            <div style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", fontFamily: "ui-monospace, Menlo, Monaco, monospace" }}>
              Sim fg: {simulateCvd(fgColor, cvdType)} ·
              Sim bg: {simulateCvd(bgColor, cvdType)}
            </div>
          </div>
        )}
      </div>

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
          <div style={{ marginBottom: "0.25rem" }}>
            <strong>UI Components:</strong> 3:1 minimum
          </div>
          <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
            Based on{" "}
            <a
              href="https://www.w3.org/TR/WCAG22/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              WCAG 2.2
            </a>{" "}
            and{" "}
            <a
              href="https://www.w3.org/TR/WCAG21/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              WCAG 2.1
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

ToolSidebar.displayName = "ToolSidebar";
