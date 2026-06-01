"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getRelativeLuminance,
  getContrastRatio,
  getRequiredRatio,
  formatRatio,
} from "@/lib/contrast";

interface ToolCanvasProps {
  fgColor: string;
  bgColor: string;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onFgChange?: (color: string) => void;
  onBgChange?: (color: string) => void;
  label?: string;
  onLabelChange?: (label: string) => void;
  onAddCombination?: (combination: {
    fg: string;
    bg: string;
    ratio: number;
    passAA: boolean;
    passAAA: boolean;
  }) => void;
}

interface ColorPreviewProps {
  color: string;
  label?: string;
  onChange?: (color: string) => void;
  instanceId?: string;
}

function ColorPreview({
  color,
  label,
  onChange,
  instanceId = "default",
}: ColorPreviewProps) {
  const colorInputId = `color-picker-${instanceId}`;

  const handleColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    },
    [onChange],
  );

  const handleHexInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.trim();
      // Allow typing a hex value, auto-complete with # if missing
      const fullHex = val.startsWith("#") ? val : `#${val}`;
      if (/^#[0-9a-fA-F]{6}$/.test(fullHex)) {
        setHexInputError(false);
        onChange?.(fullHex);
      } else if (/^#[0-9a-fA-F]{3}$/.test(fullHex)) {
        // Convert shorthand 3-char hex to 6-char
        const expanded =
          "#" +
          fullHex[1] + fullHex[1] +
          fullHex[2] + fullHex[2] +
          fullHex[3] + fullHex[3];
        setHexInputError(false);
        onChange?.(expanded);
      } else if (val.length >= 7) {
        setHexInputError(true);
      } else {
        setHexInputError(false);
      }
    },
    [onChange],
  );

  const [hexInputError, setHexInputError] = useState(false);
  const [hexInputMessage, setHexInputMessage] = useState<string | null>(null);

  const handleHexInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value.trim();
      if (!val) {
        setHexInputError(false);
        setHexInputMessage(null);
        return;
      }
      const cleaned = val.startsWith("#") ? val : `#${val}`;
      const isValid = /^#[0-9a-fA-F]{6}$/.test(cleaned) || /^#[0-9a-fA-F]{3}$/.test(cleaned);
      setHexInputError(!isValid);
      if (!isValid) {
        setHexInputMessage("Expected format: #RRGGBB");
      } else {
        setHexInputMessage(null);
      }
    },
    [],
  );

  const openColorPicker = useCallback(() => {
    const input = document.getElementById(
      colorInputId,
    ) as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  }, [colorInputId]);

  return (
    <div
      className="color-preview-container"
      style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
    >
      <div
        className="color-swatch"
        style={{
          width: "56px",
          height: "56px",
          background: color,
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          cursor: "pointer",
          transition: "transform 0.1s",
          outline: "none",
        }}
        aria-label={label || `Color preview: ${color}`}
        role="button"
        tabIndex={0}
        onClick={openColorPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openColorPicker();
          }
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = "2px solid var(--ring)";
          e.currentTarget.style.outlineOffset = "2px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = "none";
        }}
      />
      <input
        type="color"
        id={colorInputId}
        value={color}
        onChange={handleColorPickerChange}
        style={{ display: "none" }}
        aria-hidden="true"
        title="Click to pick a color"
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <label
          htmlFor={colorInputId}
          className="color-label"
          style={{ fontSize: "0.8125rem", fontWeight: 600 }}
        >
          {label || "Color"}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            id={`hex-${colorInputId}`}
            type="text"
            value={color}
            onChange={handleHexInputChange}
            onBlur={handleHexInputBlur}
            style={{
              width: "100%",
              padding: "0.375rem 0.5rem",
              fontSize: "0.8125rem",
              fontFamily: "ui-monospace, Menlo, Monaco, monospace",
              background: "var(--background)",
              color: "var(--foreground)",
              border: hexInputError
                ? "1px solid var(--error)"
                : "1px solid var(--border)",
              borderRadius: "var(--radius)",
              outline: "none",
            }}
            aria-label={`Hex value for ${label || "color"}`}
            aria-invalid={hexInputError}
            title="Type a hex color value (e.g. #ff0000 or #f00)"
          />
          {hexInputMessage && (
            <span
              style={{
                fontSize: "0.625rem",
                color: "var(--error)",
                whiteSpace: "nowrap",
              }}
              role="alert"
            >
              {hexInputMessage}
            </span>
          )}
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              background: color,
              borderRadius: "50%",
              border: "1px solid var(--border)",
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

/** Check icon SVG */
function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "18px", height: "18px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** X icon SVG */
function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "18px", height: "18px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ContrastBadge({
  pass,
  standard,
  ratio,
}: {
  pass: boolean;
  standard: "AA" | "AAA";
  ratio: number;
}) {
  return (
    <div
      className="contrast-badge"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        background: pass
          ? "var(--card)"
          : "var(--error, rgba(244, 63, 94, 0.1))",
      }}
    >
      {pass ? <CheckIcon /> : <XIcon />}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
          {standard}
        </span>
        <span style={{ fontSize: "0.65rem", opacity: 0.9 }}>
          {pass ? "Pass" : `Fail (needs ${getRequiredRatio(standard, "normal").toFixed(1)}:1)`}
        </span>
      </div>
    </div>
  );
}

export function ToolCanvas({
  fgColor,
  bgColor,
  canvasRef,
  onFgChange,
  onBgChange,
  label = "",
  onLabelChange,
  onAddCombination,
}: ToolCanvasProps) {
  const [localFg, setLocalFg] = useState(fgColor);
  const [localBg, setLocalBg] = useState(bgColor);
  const [localLabel, setLocalLabel] = useState(label);

  // Sync props to local state (intentional controlled-component pattern)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLocalFg(fgColor);
  }, [fgColor]);
  useEffect(() => {
    setLocalBg(bgColor);
  }, [bgColor]);
  useEffect(() => {
    setLocalLabel(label);
  }, [label]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const ratio = useMemo(() => {
    try {
      return getContrastRatio(localFg, localBg);
    } catch {
      return 0;
    }
  }, [localFg, localBg]);

  const fgBrightness = useMemo(() => {
    try {
      return getRelativeLuminance(localFg);
    } catch {
      return 0;
    }
  }, [localFg]);

  const bgBrightness = useMemo(() => {
    try {
      return getRelativeLuminance(localBg);
    } catch {
      return 0;
    }
  }, [localBg]);

  const passAA = useMemo(() => ratio >= getRequiredRatio("AA", "normal"), [ratio]);
  const passAAA = useMemo(() => ratio >= getRequiredRatio("AAA", "normal"), [ratio]);
  const passLargeAA = useMemo(() => ratio >= getRequiredRatio("AA", "large"), [ratio]);
  const passUIAA = useMemo(() => ratio >= getRequiredRatio("AA", "ui"), [ratio]);

  const handleFgChange = useCallback(
    (color: string) => {
      setLocalFg(color);
      onFgChange?.(color);
    },
    [onFgChange],
  );

  const handleBgChange = useCallback(
    (color: string) => {
      setLocalBg(color);
      onBgChange?.(color);
    },
    [onBgChange],
  );

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newLabel = e.target.value;
      setLocalLabel(newLabel);
      onLabelChange?.(newLabel);
    },
    [onLabelChange],
  );

  return (
    <div
      ref={canvasRef}
      className="contrast-canvas"
      role="application"
      aria-label="Contrast Checker"
    >
      {/* Color Selection Section */}
      <div className="contrast-section">
        <h3 className="contrast-section-title">Color Selection</h3>

        {/* Foreground Color */}
        <div className="contrast-row">
          <div className="contrast-row-label">
            <span>Foreground</span>
            <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
              {" "}({(fgBrightness * 100).toFixed(0)}% luminance)
            </span>
          </div>
          <ColorPreview
            color={localFg}
            label="Foreground"
            onChange={handleFgChange}
            instanceId="fg"
          />
        </div>

        {/* Background Color */}
        <div className="contrast-row">
          <div className="contrast-row-label">
            <span>Background</span>
            <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
              {" "}({(bgBrightness * 100).toFixed(0)}% luminance)
            </span>
          </div>
          <ColorPreview
            color={localBg}
            label="Background"
            onChange={handleBgChange}
            instanceId="bg"
          />
        </div>

        {/* Contrast Preview Bar */}
        <div className="contrast-preview-section">
          <h4
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
              marginTop: "0",
            }}
          >
            Live Contrast Preview
          </h4>

          {/* Preview Bar */}
          <div
            className="contrast-preview-bar"
            style={{
              width: "100%",
              height: "48px",
              background: localBg,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              marginTop: "0.5rem",
              position: "relative",
              overflow: "hidden",
            }}
            aria-label={`Contrast preview bar showing ${localFg} on ${localBg}`}
          >
            <div
              className="contrast-preview-overlay"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: localFg,
                textShadow:
                  passAA
                    ? `0 0 2px ${localBg}, 0 0 1px ${localBg}`
                    : `0 0 3px ${localBg}, 0 0 1px ${localBg}`,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "24px",
                  height: "24px",
                  background: localFg,
                  borderRadius: "4px",
                  border: `1px solid ${localBg}`,
                }}
              />
              <span
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {passAA ? <CheckIcon /> : <XIcon />}
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 700 }}>{formatRatio(ratio)}</span>
                  <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                    {passAA ? "✓ WCAG AA Pass" : "✗ WCAG AA Fail"}
                  </span>
                </span>
              </span>
            </div>
          </div>

          {/* Live Announcement for Screen Readers */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              padding: 0,
              margin: "-1px",
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            Contrast ratio {formatRatio(ratio)}.
            WCAG AA {passAA ? "pass" : "fail"} for normal text.
            WCAG AAA {passAAA ? "pass" : "fail"} for normal text.
          </div>

          {/* Compliance Badges */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginTop: "0.5rem",
            }}
          >
            <ContrastBadge pass={passAAA} standard="AAA" ratio={ratio} />
            <ContrastBadge pass={passAA} standard="AA" ratio={ratio} />
          </div>

          {/* WCAG Guidelines Info */}
          <div
            className="wcag-guidelines"
            style={{
              marginTop: "0.5rem",
              fontSize: "0.6875rem",
              color: "var(--muted)",
            }}
          >
            <div>
              Normal text (18pt or less):{" "}
              <strong>{passAA ? "✓" : "✗"}</strong>{" "}
              {getRequiredRatio("AA", "normal").toFixed(1)}:1 minimum
            </div>
            <div>
              Large text (18pt+ or 14pt bold):{" "}
              <strong>{passLargeAA ? "✓" : "✗"}</strong>{" "}
              {getRequiredRatio("AA", "large").toFixed(1)}:1 minimum
            </div>
            <div>
              UI Components: <strong>{passUIAA ? "✓" : "✗"}</strong>{" "}
              {getRequiredRatio("AA", "ui").toFixed(1)}:1 minimum
            </div>
          </div>
        </div>

        {/* Save Combination Button */}
        {onAddCombination && (
          <button
            type="button"
            onClick={() =>
              onAddCombination({
                fg: localFg,
                bg: localBg,
                ratio: Math.round(ratio * 100) / 100,
                passAA,
                passAAA,
              })
            }
            className="btn-secondary"
            style={{ alignSelf: "flex-start", marginTop: "0.25rem" }}
            aria-label={`Save current combination ${localFg} on ${localBg} (ratio ${formatRatio(ratio)})`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{
                width: "16px",
                height: "16px",
                display: "inline-block",
                verticalAlign: "middle",
                marginRight: "0.25rem",
              }}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Save Combination
          </button>
        )}
      </div>

      {/* Label Input */}
      <div className="contrast-section" style={{ marginTop: "1rem" }}>
        <h3 className="contrast-section-title">Preview</h3>
        <div className="contrast-row">
          <label
            htmlFor="contrast-label"
            className="contrast-row-label"
            style={{ fontWeight: 600 }}
          >
            Text Preview
          </label>
          <input
            id="contrast-label"
            type="text"
            value={localLabel}
            onChange={handleLabelChange}
            placeholder="Sample text preview"
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              fontFamily: "inherit",
              background: localBg,
              color: localFg,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              outline: "none",
            }}
            aria-label="Text preview label"
          />
        </div>
        <div
          className="contrast-preview-text"
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem",
            background: localBg,
            color: localFg,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontSize: "1rem",
            lineHeight: "1.5",
          }}
        >
          {localLabel ||
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
        </div>
      </div>
    </div>
  );
}