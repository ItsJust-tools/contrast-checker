"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ToolCanvasProps {
  fgColor: string;
  bgColor: string;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onFgChange?: (color: string) => void;
  onBgChange?: (color: string) => void;
  label?: string;
  onLabelChange?: (label: string) => void;
  onContrastChange?: (result: {
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
}

function ColorPreview({ color, label }: ColorPreviewProps) {
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
        role="img"
        tabIndex={0}
        onClick={() =>
          document
            .getElementById(`color-${color}`)
            ?.dispatchEvent(new Event("click", { bubbles: true }))
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document
              .getElementById(`color-${color}`)
              ?.dispatchEvent(new Event("click", { bubbles: true }));
          }
        }}
      />
      <input
        type="color"
        id={`color-${color}`}
        value={color}
        onChange={(e) => {}}
        style={{ display: "none" }}
        aria-hidden="true"
        title="Click to pick a color"
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <label
          htmlFor={`color-${color}`}
          className="color-label"
          style={{ fontSize: "0.8125rem", fontWeight: 600 }}
        >
          {label || "Color"}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            id={`color-${color}`}
            type="text"
            value={color}
            onChange={(e) => {}}
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
            title="Click or select to change color"
          />
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              background: color,
              borderRadius: "50%",
              border: "1px solid var(--border)",
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
  onContrastChange,
}: ToolCanvasProps) {
  const [localFg, setLocalFg] = useState(fgColor);
  const [localBg, setLocalBg] = useState(bgColor);
  const [localLabel, setLocalLabel] = useState(label);
  const canvasInnerRef = useRef<HTMLDivElement>(null);

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

  const fgDisplay = useMemo(() => {
    const rgb = parseInt(localFg.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    return (r * 299 + g * 587 + b * 114) / 1000;
  }, [localFg]);

  const bgDisplay = useMemo(() => {
    const rgb = parseInt(localBg.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    return (r * 299 + g * 587 + b * 114) / 1000;
  }, [localBg]);

  const ratio = useMemo(() => {
    if (fgDisplay === 0 || bgDisplay === 0) return 0;
    const lighter = Math.max(fgDisplay, bgDisplay);
    const darker = Math.min(fgDisplay, bgDisplay);
    return (lighter + 0.05) / (darker + 0.05);
  }, [fgDisplay, bgDisplay]);

  const passAA = ratio >= 4.5;
  const passAAA = ratio >= 7;

  const handleFgChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setLocalFg(newColor);
      onFgChange?.(newColor);
      if (onContrastChange) {
        onContrastChange({ fg: newColor, bg: bgColor, ratio, passAA, passAAA });
      }
    },
    [bgColor, ratio, passAA, passAAA, onFgChange, onContrastChange],
  );

  const handleBgChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setLocalBg(newColor);
      onBgChange?.(newColor);
      if (onContrastChange) {
        const fgLum = parseInt(localFg.slice(1), 16);
        const fgR = (fgLum >> 16) & 255;
        const fgG = (fgLum >> 8) & 255;
        const fgB = fgLum & 255;
        const fgDisp = (fgR * 299 + fgG * 587 + fgB * 114) / 1000;
        const newBgLum = parseInt(newColor.slice(1), 16);
        const newBgR = (newBgLum >> 16) & 255;
        const newBgG = (newBgLum >> 8) & 255;
        const newBgB = newBgLum & 255;
        const newBgDisp = (newBgR * 299 + newBgG * 587 + newBgB * 114) / 1000;
        const newRatio =
          (Math.max(fgDisp, newBgDisp) + 0.05) /
          (Math.min(fgDisp, newBgDisp) + 0.05);
        onContrastChange?.({
          fg: localFg,
          bg: newColor,
          ratio: newRatio,
          passAA: newRatio >= 4.5,
          passAAA: newRatio >= 7,
        });
      }
    },
    [localFg, onBgChange, onContrastChange],
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
            {fgDisplay > 0.18 && (
              <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
                ({(fgDisplay * 100).toFixed(0)}% brightness)
              </span>
            )}
          </div>
          <ColorPreview color={localFg} label="Foreground" />
        </div>

        {/* Background Color */}
        <div className="contrast-row">
          <div className="contrast-row-label">
            <span>Background</span>
            {bgDisplay < 0.179 && (
              <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
                ({(bgDisplay * 100).toFixed(0)}% brightness)
              </span>
            )}
          </div>
          <ColorPreview color={localBg} label="Background" />
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
