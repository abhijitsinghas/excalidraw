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
 * Get DPI based on PDF mode
 */
const getDPI = (pdfMode: ExportSettings["pdfMode"]): number => {
  switch (pdfMode) {
    case "print":
      return 300; // Print quality
    case "screen":
      return 96; // Screen quality
    default:
      return 96;
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
 * Export slides to PDF format
 */
export const exportToPDF = async (
  slides: PresentationSlide[],
  settings: ExportSettings,
  renderSlideToCanvas: RenderSlideToCanvasCallback,
): Promise<Blob> => {
  // Dynamically import jsPDF
  let jsPDF: any;
  try {
    const jsPDFModule = await import("jspdf");
    jsPDF = jsPDFModule.jsPDF;
  } catch (error) {
    console.error("jsPDF not installed, returning empty PDF");
    return new Blob([""], { type: "application/pdf" });
  }

  const qualityScale = getQualityScale(settings.quality);
  const dpi = getDPI(settings.pdfMode);

  // Standard PDF page size (8.5 x 11 inches)
  const pageWidth = 210; // mm
  const pageHeight = 297; // mm

  // Create PDF instance
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: settings.pdfMode === "print",
  });

  // Process each slide
  for (let i = 0; i < slides.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    const slide = slides[i];

    try {
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

      // Calculate dimensions to fit on page while maintaining aspect ratio
      const imgWidth = pageWidth - 10; // 5mm margin on each side
      const imgHeight = (imgWidth * scaledCanvas.height) / scaledCanvas.width;

      let yPos = (pageHeight - imgHeight) / 2; // Center vertically
      if (yPos < 5) {
        yPos = 5;
      }

      // Add image to PDF
      pdf.addImage(imageData, "JPEG", 5, yPos, imgWidth, imgHeight);
    } catch (error) {
      console.warn(`Failed to render slide ${slide.id}:`, error);
      // Continue with next slide even if this one fails
    }
  }

  // Return PDF as Blob
  return pdf.output("blob");
};
