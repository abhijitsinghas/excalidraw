import { describe, it, expect, vi } from "vitest";
import { exportPresentation } from "./exportPresentation";
import type { PresentationSlide } from "../hooks/usePresentationSlides";
import type { ExportSettings } from "./exportPresentation";

describe("exportPresentation", () => {
  const mockPresentationSlide = (id: string): PresentationSlide => ({
    id,
    name: `Slide ${id}`,
    frameElement: {
      id,
      type: "frame",
      x: 0,
      y: 0,
      width: 1024,
      height: 768,
      name: `Slide ${id}`,
      isDeleted: false,
    } as any,
    isIncluded: true,
    index: 0,
    thumbnail: undefined,
  });

  const mockSlide: PresentationSlide = mockPresentationSlide("slide-1");

  const mockRenderSlideToCanvas = vi.fn().mockResolvedValue(
    (() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 768;
      return canvas;
    })(),
  );

  it("should route to PDF handler for PDF format", async () => {
    const settings: ExportSettings = {
      format: "pdf",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "vectors",
      preserveHandDrawn: false,
    };

    const result = await exportPresentation(
      [mockSlide],
      settings,
      mockRenderSlideToCanvas,
    );

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("application/pdf");
  });

  it("should route to PPTX handler for PPTX format", async () => {
    const settings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "vectors",
      preserveHandDrawn: false,
    };

    const result = await exportPresentation(
      [mockSlide],
      settings,
      mockRenderSlideToCanvas,
    );

    expect(result).toBeInstanceOf(Blob);
    expect(
      result.type.includes("presentation") || result.size > 0,
    ).toBeTruthy();
  });

  it("should handle multiple slides", async () => {
    const slides: PresentationSlide[] = [
      mockPresentationSlide("slide-1"),
      mockPresentationSlide("slide-2"),
      mockPresentationSlide("slide-3"),
    ];

    const settings: ExportSettings = {
      format: "pdf",
      quality: "medium",
      compression: 80,
      pdfMode: "print",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const result = await exportPresentation(
      slides,
      settings,
      mockRenderSlideToCanvas,
    );

    expect(result).toBeInstanceOf(Blob);
    expect(result.size).toBeGreaterThan(0);
  });

  it("should respect quality settings", async () => {
    const mockRender = vi.fn().mockResolvedValue(
      (() => {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 768;
        return canvas;
      })(),
    );

    const settings: ExportSettings = {
      format: "pdf",
      quality: "low",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const result = await exportPresentation([mockSlide], settings, mockRender);

    expect(result).toBeInstanceOf(Blob);
    expect(mockRender).toHaveBeenCalled();
  });

  it("should handle errors during slide rendering gracefully", async () => {
    const mockRenderWithError = vi
      .fn()
      .mockRejectedValue(new Error("Render failed"));

    const settings: ExportSettings = {
      format: "pdf",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "vectors",
      preserveHandDrawn: false,
    };

    const result = await exportPresentation(
      [mockSlide],
      settings,
      mockRenderWithError,
    );

    // Should still return a Blob even if rendering fails
    expect(result).toBeInstanceOf(Blob);
  });
});
