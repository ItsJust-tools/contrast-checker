"use client";

import { useCallback, useRef, useState } from "react";
import { contrastTool, ToolCanvas, ToolToolbar, ToolSidebar } from "@/tool";
import { useToolState, useExport, useShare } from "@itsjust/core";
import type { ExportFormat } from "@itsjust/core";
import type { CvdType } from "@/lib/contrast";

import type { ExportFormat as ToolbarExportFormat } from "@/tool/components/tool-toolbar";

/**
 * Loading spinner SVG used while an async operation is in progress.
 */
function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "14px", height: "14px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm4.242 1.757a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM17 10a1 1 0 100 2h1a1 1 0 100-2h-1zm-1.757 4.242a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.242-1.757a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm1.757-4.243a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
SpinnerIcon.displayName = "SpinnerIcon";

/**
 * Checkmark icon SVG — displayed briefly after a successful share/download action.
 */
function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "14px", height: "14px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
CheckCircleIcon.displayName = "CheckCircleIcon";

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
      <ToolToolbar onExport={handleExport} disabled={isAnyActionInProgress} />
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