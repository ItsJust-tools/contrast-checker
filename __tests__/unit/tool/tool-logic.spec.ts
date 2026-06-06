import { describe, it, expect } from 'vitest';
import { contrastTool } from '@/tool/tool-definition';
import type { ContrastState, ContrastCombination } from '@/tool/types';

describe('Contrast tool definition', () => {
  it('initializes with default state', () => {
    const state = contrastTool.initialState;
    expect(state.fgColor).toBe('#000000');
    expect(state.bgColor).toBe('#ffffff');
    expect(state.combinations).toEqual([]);
    expect(state.label).toBe('');
  });

  it('has correct metadata', () => {
    expect(contrastTool.id).toBe('contrast-checker');
    expect(contrastTool.name).toBe('Contrast Checker');
    expect(contrastTool.version).toBe('1.5.0');
  });

  it('serializes state correctly', () => {
    const state: ContrastState = {
      fgColor: '#ff0000',
      bgColor: '#0000ff',
      combinations: [],
      label: 'Test',
    };

    const serialized = contrastTool.serialize(state);
    const parsed = JSON.parse(serialized);
    expect(parsed.fgColor).toBe('#ff0000');
    expect(parsed.bgColor).toBe('#0000ff');
    expect(parsed.label).toBe('Test');
  });

  it('serializes with combinations', () => {
    const state: ContrastState = {
      fgColor: '#333333',
      bgColor: '#ffffff',
      combinations: [
        {
          fg: '#333333',
          bg: '#ffffff',
          ratio: 7,
          passAA: true,
          passAAA: false,
        },
      ],
      label: 'Sample',
    };

    const serialized = contrastTool.serialize(state);
    const parsed = JSON.parse(serialized);
    expect(parsed.combinations).toHaveLength(1);
    expect(parsed.combinations[0].ratio).toBe(7);
    expect(parsed.combinations[0].passAA).toBe(true);
    expect(parsed.combinations[0].passAAA).toBe(false);
  });

  it('deserializes valid state', () => {
    const result = contrastTool.deserialize(JSON.stringify({
      fgColor: '#333333',
      bgColor: '#ffffff',
      combinations: [],
      label: 'Test',
    }));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.fgColor).toBe('#333333');
    expect(result.data.bgColor).toBe('#ffffff');
    expect(result.data.label).toBe('Test');
  });

  it('deserializes plain object', () => {
    const result = contrastTool.deserialize({
      fgColor: '#ff0000',
      bgColor: '#0000ff',
      combinations: [
        { fg: '#ff0000', bg: '#0000ff', ratio: 4.5, passAA: true, passAAA: false },
      ],
      label: 'Test',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.combinations).toHaveLength(1);
      expect(result.data.combinations[0].ratio).toBe(4.5);
    }
  });

  it('accepts minimal state without optional fields', () => {
    const result = contrastTool.deserialize({
      fgColor: '#000000',
      bgColor: '#ffffff',
      combinations: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.label).toBe('');
    }
  });

  it('accepts combination without optional pass fields', () => {
    const result = contrastTool.deserialize({
      fgColor: '#000',
      bgColor: '#fff',
      combinations: [{ fg: '#000', bg: '#fff', ratio: 10 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.combinations).toHaveLength(1);
    }
  });

  it('fails to deserialize invalid JSON string', () => {
    const result = contrastTool.deserialize('invalid');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain('Invalid data format');
  });

  it('fails to deserialize null', () => {
    const result = contrastTool.deserialize(null);
    expect(result.success).toBe(false);
  });

  it('fails to deserialize non-object', () => {
    const result = contrastTool.deserialize('not-an-object');
    expect(result.success).toBe(false);
  });

  it('fails to deserialize missing fgColor', () => {
    const result = contrastTool.deserialize(JSON.stringify({
      bgColor: '#ffffff',
      combinations: [],
    }));
    expect(result.success).toBe(false);
  });

  it('fails to deserialize missing bgColor', () => {
    const result = contrastTool.deserialize(JSON.stringify({
      fgColor: '#000000',
      combinations: [],
    }));
    expect(result.success).toBe(false);
  });

  it('fails to deserialize non-string fgColor', () => {
    const result = contrastTool.deserialize({
      fgColor: 123,
      bgColor: '#ffffff',
      combinations: [],
    });
    expect(result.success).toBe(false);
  });

  it('fails to deserialize non-array combinations', () => {
    const result = contrastTool.deserialize({
      fgColor: '#000',
      bgColor: '#fff',
      combinations: 'not-an-array',
    });
    expect(result.success).toBe(false);
  });

  it('fails to deserialize combination with non-string fg', () => {
    const result = contrastTool.deserialize({
      fgColor: '#000',
      bgColor: '#fff',
      combinations: [{ fg: 12345, bg: '#fff', ratio: 4.5 }],
    });
    expect(result.success).toBe(false);
  });

  it('fails to deserialize combination with non-number ratio', () => {
    const result = contrastTool.deserialize({
      fgColor: '#000',
      bgColor: '#fff',
      combinations: [{ fg: '#000', bg: '#fff', ratio: 'high' }],
    });
    expect(result.success).toBe(false);
  });

  it('fails to deserialize combination with non-boolean passAA', () => {
    const result = contrastTool.deserialize({
      fgColor: '#000',
      bgColor: '#fff',
      combinations: [{ fg: '#000', bg: '#fff', ratio: 4.5, passAA: 'yes' }],
    });
    expect(result.success).toBe(false);
  });

  it('has correct exporters configured', () => {
    const exporters = contrastTool.exporters ?? [];
    expect(exporters).toHaveLength(3);
    const formats = exporters.map((e) => e.format);
    expect(formats).toContain('png');
    expect(formats).toContain('webp');
    expect(formats).toContain('pdf');
  });

  it('has correct tool config', () => {
    expect(contrastTool.config.id).toBe('contrast-checker');
    expect(contrastTool.config.name).toBe('Contrast Checker');
    expect(contrastTool.config.exportFormats).toContain('json');
    expect(contrastTool.config.features.export).toBe(true);
    expect(contrastTool.config.theme!.accent).toBe('#ef4444');
  });
});