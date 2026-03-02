export interface ExportSettings {
  format: "pdf" | "pptx";
  quality: "low" | "medium" | "high";
  compression: number; // 0-100, default 80
  pdfMode: "print" | "screen";
  preserveAnimations: boolean;
  exportMode: "vectors" | "rasterized";
  preserveHandDrawn: boolean;
}
