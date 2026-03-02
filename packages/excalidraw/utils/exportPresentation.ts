import type { PresentationSlide } from "../hooks/usePresentationSlides";

/**
 * Export settings for PDF/PPTX export
 */
export interface ExportSettings {
  format: "pdf" | "pptx";
  quality: "low" | "medium" | "high";
  compression: number; // 0-100, default 80
  pdfMode: "print" | "screen";
  preserveAnimations: boolean;
  exportMode: "vectors" | "rasterized";
  preserveHandDrawn: boolean;
}

/**
 * Callback function to render a slide to canvas
 */
export type RenderSlideToCanvasCallback = (
  slide: PresentationSlide,
) => Promise<HTMLCanvasElement>;

/**
 * Main export orchestrator - routes to appropriate export handler
 */
export const exportPresentation = async (
  slides: PresentationSlide[],
  settings: ExportSettings,
  renderSlideToCanvas: RenderSlideToCanvasCallback,
): Promise<Blob> => {
  try {
    if (settings.format === "pdf") {
      const { exportToPDF } = await import("./exportToPDF");
      return exportToPDF(slides, settings, renderSlideToCanvas);
    } else if (settings.format === "pptx") {
      const { exportToPPTX } = await import("./exportToPPTX");
      return exportToPPTX(slides, settings, renderSlideToCanvas);
    } else {
      throw new Error(`Unsupported export format: ${settings.format}`);
    }
  } catch (error) {
    console.error("Export failed:", error);
    // Return empty PDF/PPTX as fallback
    if (settings.format === "pdf") {
      return new Blob([""], { type: "application/pdf" });
    } else {
      return new Blob([""], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
    }
  }
};
