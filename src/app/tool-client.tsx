'use client';

import { useCallback, useRef } from 'react';
import { contrastTool, ToolCanvas, ToolToolbar, ToolSidebar, templateMetadata } from '@/tool';
import { useToolState, useExport, useShare } from '@itsjust/core';

export default function ToolClient() {
  const canvasRef = useRef<HTMLDivElement>(null);

  const state = useToolState<typeof contrastTool.initialState>(contrastTool.initialState, {
    key: 'contrast-checker',
    maxHistory: 100,
    autoSaveDelay: 0,
  });

  const { exportTo, supportedFormats, isExporting } = useExport(
    canvasRef,
    toolConfig,
    state.serialize,
  );

  const { downloadShareFile, shareViaWeb } = useShare();

  const toolConfig = contrastTool.config;

  const handleExport = useCallback(async (format: string) => {
    await exportTo(format);
  }, [exportTo]);

  return (
    <>
      <ToolToolbar onExport={() => handleExport('json')} />
      <ToolCanvas
        fgColor={state.data.fgColor}
        bgColor={state.data.bgColor}
        canvasRef={canvasRef}
        onFgChange={(fg) => state.setData((prev) => ({ ...prev, fgColor: fg }))}
        onBgChange={(bg) => state.setData((prev) => ({ ...prev, bgColor: bg }))}
        label={state.data.label}
        onLabelChange={(label) => state.setData((prev) => ({ ...prev, label: label }))}
      />
      <ToolSidebar
        fgColor={state.data.fgColor}
        bgColor={state.data.bgColor}
        combinations={state.data.combinations}
      />
      {/* Share Actions - visible only when data is ready */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button
          type="button"
          onClick={async () => {
            await downloadShareFile({
              toolId: toolConfig.id,
              content: state.serialize(),
              metadata: { schemaVersion: '1.0' },
            });
          }}
          disabled={isExporting}
          style={{
            padding: '0.375rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            fontSize: '0.8125rem',
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
          aria-disabled={isExporting}
        >
          Download .itsjust.json
        </button>
        <button
          type="button"
          onClick={async () => {
            await shareViaWeb({
              toolId: toolConfig.id,
              content: state.serialize(),
              metadata: { schemaVersion: '1.0' },
            });
          }}
          disabled={isExporting}
          style={{
            padding: '0.375rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            fontSize: '0.8125rem',
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
          aria-disabled={isExporting}
        >
          Share
        </button>
      </div>
    </>
  );
}
