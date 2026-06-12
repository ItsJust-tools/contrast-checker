import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import ToolClient from "@/app/tool-client";
import { ToolClientWrapper } from "@/app/tool-client-wrapper";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockSetData = vi.fn();
const mockExportTo = vi.fn();
const mockDownloadShareFile = vi.fn();
const mockShareViaWeb = vi.fn();

vi.mock("@itsjust/core", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  useToolState: () => ({
    data: {
      fgColor: "#000000",
      bgColor: "#ffffff",
      combinations: [],
      label: "",
    },
    setData: mockSetData,
    isDirty: false,
    lastSaved: "just now",
  }),
  useExport: () => ({
    exportTo: mockExportTo,
    isExporting: false,
  }),
  useShare: () => ({
    downloadShareFile: mockDownloadShareFile,
    shareViaWeb: mockShareViaWeb,
  }),
}));

vi.mock("@/tool", () => ({
  toolConfig: {
    id: "contrast-checker",
    name: "Contrast Checker",
    version: "1.5.0",
    features: { sidebar: true },
    theme: { brand: "Contrast Checker" },
  },
  contrastTool: {
    serialize: (state: unknown) => JSON.stringify(state),
    deserialize: () => ({
      success: true,
      data: { fgColor: "#000", bgColor: "#fff", combinations: [], label: "" },
    }),
  },
  ToolCanvas: () => <div data-testid="mock-canvas">canvas</div>,
  ToolToolbar: ({ onExport }: { onExport: (format: string) => void }) => (
    <button
      type="button"
      data-testid="export-btn"
      onClick={() => onExport("json")}
    >
      Export
    </button>
  ),
  ToolSidebar: () => <div data-testid="mock-sidebar">sidebar</div>,
}));

describe("app client", () => {
  beforeEach(() => {
    mockSetData.mockReset();
    mockExportTo.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders tool client", () => {
    render(<ToolClient />);

    expect(screen.getByText("Export")).toBeInTheDocument();
    expect(screen.getByTestId("mock-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sidebar")).toBeInTheDocument();
  });

  it("renders ToolClientWrapper with ThemeProvider", () => {
    render(
      <ToolClientWrapper>
        <div data-testid="child">child</div>
      </ToolClientWrapper>,
    );

    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("triggers export on button click", () => {
    render(<ToolClient />);

    fireEvent.click(screen.getByTestId("export-btn"));
    expect(mockExportTo).toHaveBeenCalledWith("json");
  });

  it("renders share buttons", () => {
    render(<ToolClient />);

    const downloadBtns = screen.getAllByText("Download .itsjust.json");
    expect(downloadBtns).toHaveLength(1);
    const shareBtns = screen.getAllByText("Share");
    expect(shareBtns).toHaveLength(1);
  });
});
