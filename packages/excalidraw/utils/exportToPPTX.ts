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
  try {
    // Quality is 0-100, convert to 0-1 for canvas
    const jpegQuality = Math.max(0, Math.min(1, quality / 100));
    const dataUrl = canvas.toDataURL("image/jpeg", jpegQuality);

    // Validate that we got actual data
    if (!dataUrl || dataUrl === "data:,") {
      return "";
    }

    return dataUrl;
  } catch (error) {
    console.warn("Failed to convert canvas to JPEG:", error);
    return "";
  }
};

/**
 * Export slides to PPTX format
 */
export const exportToPPTX = async (
  slides: PresentationSlide[],
  settings: ExportSettings,
  renderSlideToCanvas: RenderSlideToCanvasCallback,
): Promise<Blob> => {
  // Dynamically import pptxgenjs
  let pptxgen: any;
  try {
    const pptxModule = await import("pptxgenjs");
    pptxgen = pptxModule.default;
  } catch (error) {
    console.error("pptxgenjs not installed, returning empty PPTX");
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

      // Only add image if we got valid data
      if (imageData && imageData.startsWith("data:image")) {
        // Add image to slide, filling the entire slide
        pptSlide.addImage({
          data: imageData,
          x: 0,
          y: 0,
          w: slideWidth,
          h: slideHeight,
        });
      }

      // Add animations metadata if requested
      if (settings.preserveAnimations) {
        // Note: pptxgenjs has limited animation support
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
  // pptxgenjs's write method returns a Promise<Blob> in browser environments
  try {
    if (typeof (pres as any).write === "function") {
      return await (pres as any).write({ outputType: "blob" });
    } else if (typeof (pres as any).asBlob === "function") {
      return await (pres as any).asBlob();
    }
  } catch (error) {
    console.error("Failed to generate PPTX:", error);
  }

  // Fallback to empty blob if library methods aren't available
  return new Blob([], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
};
