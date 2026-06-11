"use client";

import { useCallback, useRef, useState } from "react";
import { contrastTool, ToolCanvas, ToolToolbar, ToolSidebar } from "@/tool";
import { SpinnerIcon, CheckCircleIcon } from "@/tool/components/icons";
import { useToolState, useExport, useShare } from "@itsjust/core";
import type { ExportFormat } from "@itsjust/core";
import type { CvdType } from "@/lib/contrast";

import type { ExportFormat as ToolbarExportFormat } from "@/tool/components/tool-toolbar";

/**
 * Main client component for the Contrast Checker tool.
 *
 * Orchestrates the canvas, sidebar, toolbar, and share actions.
 * Owns the tool state via useToolState and wires up export/share
 * callbacks with individual loading and success-feedback state.
 */
export default function ToolClient() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cvdType, setCvdType] = useState<CvdType>("none");

  /**
   * Per-button loading state so each share action button tracks
   * its own async operation independently.
   */
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  /**
   * After a successful action, briefly show a success indicator.
   * Stores "download" | "share" to display the checkmark on the right button.
   */
  const [successAction, setSuccessAction] = useState<
    "download" | "share" | null
  >(null);

  const toolConfig = contrastTool.config;

  const state = useToolState<typeof contrastTool.initialState>(
    contrastTool.initialState,
    {
      key: "contrast-checker",
      maxHistoryEntries: 100,
      debounceMs: 0,
    },
  );

  const { exportTo, isExporting } = useExport(
    canvasRef,
    toolConfig,
    () => contrastTool.serialize(state.data),
    contrastTool.exporters,
  );

  const { downloadShareFile, shareViaWeb } = useShare();

  /**
   * Export the canvas to the requested format (JSON, PNG, WebP, PDF).
   * Delegates to the core @itsjust/core export system.
   */
  const handleExport = useCallback(
    async (format: ToolbarExportFormat) => {
      await exportTo(format as ExportFormat);
    },
    [exportTo],
  );

  const handleAddCombination = useCallback(
    (combination: {
      fg: string;
      bg: string;
      ratio: number;
      passAA: boolean;
      passAAA: boolean;
    }) => {
      state.setData((prev) => ({
        ...prev,
        combinations: [...prev.combinations, combination],
      }));
    },
    [state],
  );

  const handleClearCombinations = useCallback(() => {
    state.setData((prev) => ({
      ...prev,
      combinations: [],
    }));
  }, [state]);

  const handleRemoveCombination = useCallback(
    (index: number) => {
      state.setData((prev) => ({
        ...prev,
        combinations: prev.combinations.filter((_, i) => i !== index),
      }));
    },
    [state],
  );

  const handleSwapColors = useCallback(() => {
    state.setData((prev) => ({
      ...prev,
      fgColor: prev.bgColor,
      bgColor: prev.fgColor,
    }));
  }, [state]);

  /**
   * Show a brief success indicator then clear it.
   */
  const flashSuccess = useCallback((action: "download" | "share") => {
    setSuccessAction(action);
    setTimeout(() => setSuccessAction(null), 2000);
  }, []);

  const handleDownload = useCallback(async () => {
    if (isDownloading || isExporting) return;
    setIsDownloading(true);
    try {
      await downloadShareFile({
        toolId: toolConfig.id,
        content: contrastTool.serialize(state.data),
        metadata: { schemaVersion: "1.0" },
      });
      flashSuccess("download");
    } catch {
      // Silently handle — download failures are rare and non-blocking.
    } finally {
      setIsDownloading(false);
    }
  }, [
    downloadShareFile,
    toolConfig.id,
    state.data,
    isDownloading,
    isExporting,
    flashSuccess,
  ]);

  const handleShare = useCallback(async () => {
    if (isSharing || isExporting) return;
    setIsSharing(true);
    try {
      await shareViaWeb({
        toolId: toolConfig.id,
        content: contrastTool.serialize(state.data),
        metadata: { schemaVersion: "1.0" },
      });
      flashSuccess("share");
    } catch {
      // Share dialog dismissal or failure is handled gracefully.
    } finally {
      setIsSharing(false);
    }
  }, [
    shareViaWeb,
    toolConfig.id,
    state.data,
    isSharing,
    isExporting,
    flashSuccess,
  ]);

  const isAnyActionInProgress = isExporting || isDownloading || isSharing;

  return (
    <div className="contrast-tool-layout">
      <ToolToolbar onExport={handleExport} onSwapColors={handleSwapColors} disabled={isAnyActionInProgress} />
      <main className="contrast-main-content">
        <ToolCanvas
          fgColor={state.data.fgColor}
          bgColor={state.data.bgColor}
          canvasRef={canvasRef}
          onFgChange={(fg) =>
            state.setData((prev) => ({ ...prev, fgColor: fg }))
          }
          onBgChange={(bg) =>
            state.setData((prev) => ({ ...prev, bgColor: bg }))
          }
          label={state.data.label}
          onLabelChange={(label) =>
            state.setData((prev) => ({ ...prev, label: label }))
          }
          onAddCombination={handleAddCombination}
          onSwapColors={handleSwapColors}
        />
        <ToolSidebar
          fgColor={state.data.fgColor}
          bgColor={state.data.bgColor}
          combinations={state.data.combinations}
          onFgChange={(fg) =>
            state.setData((prev) => ({ ...prev, fgColor: fg }))
          }
          onBgChange={(bg) =>
            state.setData((prev) => ({ ...prev, bgColor: bg }))
          }
          onClearCombinations={handleClearCombinations}
          onRemoveCombination={handleRemoveCombination}
          cvdType={cvdType}
          onCvdTypeChange={setCvdType}
        />
      </main>
      {/* Share Actions - visible only when data is ready */}
      <div className="contrast-share-actions">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isAnyActionInProgress}
          className="btn-secondary btn-share-action"
          aria-disabled={isAnyActionInProgress}
          title="Download a .itsjust.json file containing your current state"
        >
          {isDownloading ? (
            <>
              <SpinnerIcon />
              <span>Downloading...</span>
            </>
          ) : successAction === "download" ? (
            <>
              <CheckCircleIcon />
              <span>Downloaded</span>
            </>
          ) : (
            "Download .itsjust.json"
          )}
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={isAnyActionInProgress}
          className="btn-secondary btn-share-action"
          aria-disabled={isAnyActionInProgress}
          title="Share your current state via a link"
        >
          {isSharing ? (
            <>
              <SpinnerIcon />
              <span>Sharing...</span>
            </>
          ) : successAction === "share" ? (
            <>
              <CheckCircleIcon />
              <span>Shared</span>
            </>
          ) : (
            "Share"
          )}
        </button>
      </div>
    </div>
  );
}