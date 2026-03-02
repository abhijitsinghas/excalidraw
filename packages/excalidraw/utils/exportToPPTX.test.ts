import { describe, it, expect, vi } from "vitest";
import { exportToPPTX } from "./exportToPPTX";
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

describe("exportToPPTX", () => {
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

  it("should create a PPTX blob", async () => {
    const slides = [mockPresentationSlide("slide-1")];
    const settings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const result = await exportToPPTX(
      slides,
      settings,
      mockRenderSlideToCanvas,
    );

    expect(result).toBeInstanceOf(Blob);
    expect(result.size).toBeGreaterThan(0);
  });

  it("should create PPTX with correct number of slides", async () => {
    const slides = [
      mockPresentationSlide("slide-1"),
      mockPresentationSlide("slide-2"),
      mockPresentationSlide("slide-3"),
    ];
    const settings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const result = await exportToPPTX(
      slides,
      settings,
      mockRenderSlideToCanvas,
    );

    expect(result).toBeInstanceOf(Blob);
    // Should have called render for each slide
    expect(mockRenderSlideToCanvas).toHaveBeenCalledTimes(3);
  });

  it("should apply quality settings to PPTX", async () => {
    const slides = [mockPresentationSlide("slide-1")];

    const lowSettings: ExportSettings = {
      format: "pptx",
      quality: "low",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const highSettings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const lowQualityPPTX = await exportToPPTX(
      slides,
      lowSettings,
      mockRenderSlideToCanvas,
    );
    const highQualityPPTX = await exportToPPTX(
      slides,
      highSettings,
      mockRenderSlideToCanvas,
    );

    // High quality should be larger
    expect(highQualityPPTX.size).toBeGreaterThan(lowQualityPPTX.size);
  });

  it("should apply compression settings to PPTX", async () => {
    const slides = [mockPresentationSlide("slide-1")];

    const lowCompressionSettings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 100,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const highCompressionSettings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 20,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const lessCompressedPPTX = await exportToPPTX(
      slides,
      lowCompressionSettings,
      mockRenderSlideToCanvas,
    );
    const moreCompressedPPTX = await exportToPPTX(
      slides,
      highCompressionSettings,
      mockRenderSlideToCanvas,
    );

    // More compression should produce smaller files
    expect(lessCompressedPPTX.size).toBeGreaterThanOrEqual(
      moreCompressedPPTX.size,
    );
  });

  it("should handle preservation of animations flag", async () => {
    const slides = [mockPresentationSlide("slide-1")];

    const withAnimationsSettings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: true,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const withoutAnimationsSettings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const pptxWithAnimations = await exportToPPTX(
      slides,
      withAnimationsSettings,
      mockRenderSlideToCanvas,
    );
    const pptxWithoutAnimations = await exportToPPTX(
      slides,
      withoutAnimationsSettings,
      mockRenderSlideToCanvas,
    );

    expect(pptxWithAnimations).toBeInstanceOf(Blob);
    expect(pptxWithoutAnimations).toBeInstanceOf(Blob);
  });

  it("should handle rendering errors gracefully", async () => {
    const failingRender = vi.fn().mockRejectedValue(new Error("Render failed"));
    const slides = [mockPresentationSlide("slide-1")];
    const settings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "rasterized",
      preserveHandDrawn: false,
    };

    const result = await exportToPPTX(slides, settings, failingRender);
    expect(result).toBeInstanceOf(Blob);
  });

  it("should handle vector export mode", async () => {
    const slides = [mockPresentationSlide("slide-1")];
    const settings: ExportSettings = {
      format: "pptx",
      quality: "high",
      compression: 80,
      pdfMode: "screen",
      preserveAnimations: false,
      exportMode: "vectors",
      preserveHandDrawn: false,
    };

    const result = await exportToPPTX(
      slides,
      settings,
      mockRenderSlideToCanvas,
    );

    expect(result).toBeInstanceOf(Blob);
  });
});
