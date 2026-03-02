import { describe, it, expect, vi } from "vitest";
import { exportToPDF } from "./exportToPDF";
import type { PresentationSlide } from "../hooks/usePresentationSlides";
import type { ExportSettings } from "./exportPresentation";

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

describe("exportToPDF", () => {
  const mockRenderSlideToCanvas = vi.fn().mockResolvedValue(
    (() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return canvas;
    })(),
  );

  it("should create a PDF blob", async () => {
    const slides = [mockPresentationSlide("slide-1")];
    const settings: ExportSettings = {
      format: "pdf",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const result = await exportToPDF(slides, settings, mockRenderSlideToCanvas);

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("application/pdf");
    expect(result.size).toBeGreaterThan(0);
  });

  it("should apply quality scaling - low quality should produce smaller output", async () => {
    const slides = [mockPresentationSlide("slide-1")];

    const lowSettings: ExportSettings = {
      format: "pdf",
      quality: "low",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const highSettings: ExportSettings = {
      format: "pdf",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const lowQualityPDF = await exportToPDF(
      slides,
      lowSettings,
      mockRenderSlideToCanvas,
    );
    const highQualityPDF = await exportToPDF(
      slides,
      highSettings,
      mockRenderSlideToCanvas,
    );

    // High quality should be larger (higher resolution)
    expect(highQualityPDF.size).toBeGreaterThan(lowQualityPDF.size);
  });

  it("should apply compression settings", async () => {
    const slides = [mockPresentationSlide("slide-1")];

    const lowCompressionSettings: ExportSettings = {
      format: "pdf",
      quality: "high",
      compression: 100, // Best quality
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const highCompressionSettings: ExportSettings = {
      format: "pdf",
      quality: "high",
      compression: 20, // Worst quality
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const lessCompressedPDF = await exportToPDF(
      slides,
      lowCompressionSettings,
      mockRenderSlideToCanvas,
    );
    const moreCompressedPDF = await exportToPDF(
      slides,
      highCompressionSettings,
      mockRenderSlideToCanvas,
    );

    // More compression should produce smaller files
    expect(lessCompressedPDF.size).toBeGreaterThanOrEqual(
      moreCompressedPDF.size,
    );
  });

  it("should handle multiple slides with different PDF modes", async () => {
    const slides = [
      mockPresentationSlide("slide-1"),
      mockPresentationSlide("slide-2"),
    ];

    const printSettings: ExportSettings = {
      format: "pdf",
      quality: "high",
      compression: 80,
      pdfMode: "print",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const result = await exportToPDF(
      slides,
      printSettings,
      mockRenderSlideToCanvas,
    );

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("application/pdf");
  });

  it("should handle vector export mode", async () => {
    const slides = [mockPresentationSlide("slide-1")];
    const settings: ExportSettings = {
      format: "pdf",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "vectors",
      preserveHandDrawn: false,
    };

    const result = await exportToPDF(slides, settings, mockRenderSlideToCanvas);

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("application/pdf");
  });

  it("should handle rendering errors gracefully", async () => {
    const failingRender = vi.fn().mockRejectedValue(new Error("Render failed"));
    const slides = [mockPresentationSlide("slide-1")];
    const settings: ExportSettings = {
      format: "pdf",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    // Should not throw, should return a PDF even if some slides fail
    const result = await exportToPDF(slides, settings, failingRender);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("application/pdf");
  });
});
