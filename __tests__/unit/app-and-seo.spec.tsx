import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import manifest from '@/app/manifest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import ErrorPage from '@/app/error';
import NotFound from '@/app/not-found';
import { JsonLd } from '@/app/json-ld';
import ToolPage from '@/app/page';
import { generateJsonLd, generateToolMetadata } from '@/lib/seo';
import toolConfig from '@/tool/tool.config';
import { getPublicSiteUrl, templateMetadata } from '@/tool/template-metadata';
import { contrastTool } from '@/tool/tool-definition';

// Set the public URL for robots/sitemap tests
process.env.NEXT_PUBLIC_URL = 'http://localhost:3000';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/app/tool-client', () => ({
  default: () => <div data-testid="tool-client">tool-client</div>,
}));

describe('app and seo', () => {
  it('builds metadata and json-ld values', () => {
    const metadata = generateToolMetadata(toolConfig);
    const jsonLd = generateJsonLd(toolConfig);

    expect(metadata.creator).toBe(toolConfig.name);
    expect(metadata.metadataBase?.toString()).toBe('http://localhost:3000/');
    expect(jsonLd.url).toBe('http://localhost:3000');
    expect(jsonLd.featureList.length).toBeGreaterThan(0);
  });

  it('returns site manifest, robots and sitemap', () => {
    const man = manifest();
    const rob = robots();
    const sm = sitemap();

    expect(man.name).toBe(templateMetadata.appName);
    expect(rob.sitemap).toBe('http://localhost:3000/sitemap.xml');
    expect(sm[0]?.url).toBe('http://localhost:3000/');
  });

  it('renders tool definition and helper exports', () => {
    expect(getPublicSiteUrl()).toBe('http://localhost:3000');
    expect(
      contrastTool.deserialize({
        fgColor: '#ff0000',
        bgColor: '#000000',
        combinations: [],
      })
    ).toEqual({
      success: true,
      data: {
        fgColor: '#ff0000',
        bgColor: '#000000',
        combinations: [],
        label: '',
      },
    });
    expect(contrastTool.deserialize({ nope: true })).toEqual({
      success: false,
      error:
        'Invalid data format: expected { fgColor: string, bgColor: string, combinations: Array<{ fg, bg, ratio, passAA, passAAA }>, label?: string }',
    });
    expect(
      contrastTool.serialize({
        fgColor: '#000',
        bgColor: '#fff',
        combinations: [],
        label: '',
      })
    ).toContain('"fgColor": "#000"');
  });

  it('renders error page', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('boom')} reset={reset} />);

    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
  });

  it('renders not-found page', () => {
    render(<NotFound />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders top-level tool page', () => {
    render(<ToolPage />);
    expect(screen.getByTestId('tool-client')).toBeInTheDocument();
    expect(document.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
  });

  it('renders json-ld script safely', () => {
    const { container } = render(<JsonLd />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toContain('Contrast Checker');
  });

  it('has correct exporters count', () => {
    const exporters = contrastTool.exporters ?? [];
    expect(exporters).toHaveLength(3);
  });
});