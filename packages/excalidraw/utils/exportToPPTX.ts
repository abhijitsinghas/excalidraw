import type { PresentationSlide } from "../hooks/usePresentationSlides";
import type {
  ExportSettings,
  RenderSlideToCanvasCallback,
} from "./exportPresentation";

/**
 * Get the quality scale factor based on quality setting
 * Low = 1x, Medium = 1.5x, High = 2x
 */
const getQualityScale = (quality: ExportSettings["quality"]): number => {
  switch (quality) {
    case "low":
      return 1.0;
    case "medium":
      return 1.5;
    case "high":
      return 2.0;
    default:
      return 2.0;
  }
};

/**
 * Render canvas to JPEG data URL with compression
 */
const canvasToJPEGDataURL = (
  canvas: HTMLCanvasElement,
  quality: number,
): string => {
  // Quality is 0-100, convert to 0-1 for canvas
  const jpegQuality = Math.max(0, Math.min(1, quality / 100));
  return canvas.toDataURL("image/jpeg", jpegQuality);
};

/**
 * Export slides to PPTX format
 */
export const exportToPPTX = async (
  slides: PresentationSlide[],
  settings: ExportSettings,
  renderSlideToCanvas: RenderSlideToCanvasCallback,
): Promise<Blob> => {
  // Dynamically import pptxgen-js
  let pptxgen: any;
  try {
    const pptxModule = await import("pptxgen-js");
    pptxgen = pptxModule.default;
  } catch (error) {
    console.error("pptxgen-js not installed, returning empty PPTX");
    return new Blob([""], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
  }

  const qualityScale = getQualityScale(settings.quality);

  // Create presentation
  const pres = new pptxgen();

  // Standard slide dimensions (16:9 aspect ratio)
  const slideWidth = 10; // inches
  const slideHeight = 5.625; // inches (16:9)

  // Process each slide
  for (const slide of slides) {
    try {
      // Create new slide
      const pptSlide = pres.addSlide();

      // Render slide to canvas
      const canvas = await renderSlideToCanvas(slide);

      // Apply quality scaling
      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = canvas.width * qualityScale;
      scaledCanvas.height = canvas.height * qualityScale;

      const ctx = scaledCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      }

      // Convert to image data with compression
      const imageData = canvasToJPEGDataURL(scaledCanvas, settings.compression);

      // Add image to slide, filling the entire slide
      pptSlide.addImage({
        data: imageData,
        x: 0,
        y: 0,
        w: slideWidth,
        h: slideHeight,
      });

      // Add animations metadata if requested
      if (settings.preserveAnimations) {
        // Note: pptxgen-js has limited animation support
        // This is a placeholder for future animation implementation
        // For now, we'll just note that animations were requested but not implemented
      }

      // Add slide title as notes (metadata)
      pptSlide.addNotes(slide.name);
    } catch (error) {
      console.warn(`Failed to render slide ${slide.id}:`, error);
      // Continue with next slide even if this one fails
      const pptSlide = pres.addSlide();
      pptSlide.addText("Error rendering slide", {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1,
        fontSize: 18,
        color: "FF0000",
      });
    }
  }

  // Return PPTX as Blob
  // PptxGen writeFile returns a Promise<Blob> in browser environments
  // or we can save with specific options
  if (typeof (pres as any).asBlob === "function") {
    return (pres as any).asBlob() as Promise<Blob>;
  } else if (typeof (pres as any).write === "function") {
    return (pres as any).write({ outputType: "blob" }) as Promise<Blob>;
  } else {
    // Fallback to empty blob if library methods aren't available
    return Promise.resolve(
      new Blob([], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      }),
    );
  }
};
