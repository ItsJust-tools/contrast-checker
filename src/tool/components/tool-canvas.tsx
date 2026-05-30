"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getRelativeLuminance, getContrastRatio } from "@/lib/contrast";

interface ToolCanvasProps {
  fgColor: string;
  bgColor: string;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onFgChange?: (color: string) => void;
  onBgChange?: (color: string) => void;
  label?: string;
  onLabelChange?: (label: string) => void;
}

interface ColorPreviewProps {
  color: string;
  label?: string;
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
        onChange?.(fullHex);
      }
    },
    [onChange],
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
            style={{
              width: "100%",
              padding: "0.375rem 0.5rem",
              fontSize: "0.8125rem",
              fontFamily: "ui-monospace, Menlo, Monaco, monospace",
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              outline: "none",
            }}
            aria-label={`Hex value for ${label || "color"}`}
            title="Type a hex color value (e.g. #ff0000)"
          />
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

function ContrastBadge({
  pass,
  standard,
  ratio,
}: {
  pass: boolean;
  standard: "AA" | "AAA";
  ratio: number;
}) {
  const color = pass ? "var(--success)" : "var(--error)";

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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        style={{ width: "18px", height: "18px" }}
        aria-hidden="true"
      >
        {pass ? (
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-12a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V6zM8 9a1 1 0 001 1h2a1 1 0 001-1V6a1 1 0 00-1-1H9a1 1 0 00-1 1v3z"
            clipRule="evenodd"
          />
        ) : (
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        )}
      </svg>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
          {standard}
        </span>
        <span style={{ fontSize: "0.65rem", color: color, opacity: 0.9 }}>
          {ratio < 7 && ratio < 4.5 ? `${ratio.toFixed(1)}:1 - ` : ""}
          {pass ? "Pass" : "Fail"}
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

  const passAA = ratio >= 4.5;
  const passAAA = ratio >= 7;

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
            {fgBrightness > 0.18 && (
              <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
                ({(fgBrightness * 100).toFixed(0)}% luminance)
              </span>
            )}
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
            {bgBrightness < 0.179 && (
              <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
                ({(bgBrightness * 100).toFixed(0)}% luminance)
              </span>
            )}
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
              background: `${localBg} ${localFg}`,
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
                color: ratio > 4.5 ? localFg : localBg,
                textShadow:
                  ratio > 4.5 ? `0 0 1px ${localBg}` : `0 0 1px ${localFg}`,
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ width: "16px", height: "16px", flexShrink: 0 }}
                  aria-hidden="true"
                >
                  {passAA ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-12a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V6zm2.588 2.712a1 1 0 00-.586-1.295l-7-3.435A1 1 0 006.286 6l.296 5.669a1 1 0 102 0zM11.716 12.288a1 1 0 00-.296-5.669 1 1 0 00-1.988.296l-.296 5.669a1 1 0 001.988.296l7-3.435a1 1 0 00.586-1.295z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 700 }}>{ratio.toFixed(2)}:1</span>
                  <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                    {passAA ? "✓ WCAG AA Pass" : "✗ WCAG AA Fail"}
                  </span>
                </span>
              </span>
            </div>
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
              Normal text (18pt or less): <strong>{passAA ? "✓" : "✗"}</strong>{" "}
              4.5:1 minimum
            </div>
            <div>
              Large text (18pt+ or 14pt bold):{" "}
              <strong>{ratio >= 3 ? "✓" : "✗"}</strong> 3:1 minimum
            </div>
            <div>
              UI Components: <strong>{ratio >= 3 ? "✓" : "✗"}</strong> 3:1
              minimum
            </div>
          </div>
        </div>
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
