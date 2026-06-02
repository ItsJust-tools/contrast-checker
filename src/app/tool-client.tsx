"use client";

import { useCallback, useRef } from "react";
import { contrastTool, ToolCanvas, ToolToolbar, ToolSidebar } from "@/tool";
import { useToolState, useExport, useShare } from "@itsjust/core";
import type { ExportFormat } from "@itsjust/core";

export default function ToolClient() {
  const canvasRef = useRef<HTMLDivElement>(null);

  const toolConfig = contrastTool.config;

  const state = useToolState<typeof contrastTool.initialState>(
    contrastTool.initialState,
    {
      key: "contrast-checker",
      maxHistoryEntries: 100,
      debounceMs: 0,
    },
  );

  const { exportTo, isExporting } = useExport(canvasRef, toolConfig, () =>
    contrastTool.serialize(state.data),
  );

  const { downloadShareFile, shareViaWeb } = useShare();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      await exportTo(format);
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

  return (
    <div className="contrast-tool-layout">
      <ToolToolbar onExport={() => handleExport("json")} />
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
        />
      </main>
      {/* Share Actions - visible only when data is ready */}
      <div className="contrast-share-actions">
        <button
          type="button"
          onClick={async () => {
            await downloadShareFile({
              toolId: toolConfig.id,
              content: contrastTool.serialize(state.data),
              metadata: { schemaVersion: "1.0" },
            });
          }}
          disabled={isExporting}
          className="btn-secondary"
          aria-disabled={isExporting}
        >
          Download .itsjust.json
        </button>
        <button
          type="button"
          onClick={async () => {
            await shareViaWeb({
              toolId: toolConfig.id,
              content: contrastTool.serialize(state.data),
              metadata: { schemaVersion: "1.0" },
            });
          }}
          disabled={isExporting}
          className="btn-secondary"
          aria-disabled={isExporting}
        >
          Share
        </button>
      </div>
    </div>
  );
}
