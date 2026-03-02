import React, { useState, useCallback, useMemo } from "react";
import { ExportSlideList } from "./ExportSlideList";
import { ExportOptions } from "./ExportOptions";
import type { ExportSettings } from "./types";
import type { PresentationSlide } from "../../hooks/usePresentationSlides";

interface ExportDialogProps {
  slides: PresentationSlide[];
  onClose: () => void;
  onExport: (
    slides: PresentationSlide[],
    settings: ExportSettings,
  ) => Promise<void>;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  slides: initialSlides,
  onClose,
  onExport,
}) => {
  const [slides, setSlides] = useState<PresentationSlide[]>(initialSlides);
  const [selectedSlides, setSelectedSlides] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<ExportSettings>({
    format: "pdf",
    quality: "high",
    compression: 80,
    pdfMode: "screen",
    preserveAnimations: false,
    exportMode: "vectors",
    preserveHandDrawn: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleSlideOrderChange = useCallback(
    (newOrder: PresentationSlide[]) => {
      setSlides(newOrder);
    },
    [],
  );

  const handleSelectedSlidesChange = useCallback((newSelected: Set<string>) => {
    setSelectedSlides(newSelected);
  }, []);

  const handleSlideNameChange = useCallback(
    (slideId: string, newName: string) => {
      setSlides((prev) =>
        prev.map((slide) =>
          slide.id === slideId ? { ...slide, name: newName } : slide,
        ),
      );
    },
    [],
  );

  const handleSlideDelete = useCallback((slideId: string) => {
    setSlides((prev) => prev.filter((slide) => slide.id !== slideId));
    setSelectedSlides((prev) => {
      const newSelected = new Set(prev);
      newSelected.delete(slideId);
      return newSelected;
    });
  }, []);

  const selectedSlidesToExport = useMemo(() => {
    return slides.filter((slide) => selectedSlides.has(slide.id));
  }, [slides, selectedSlides]);

  const handleExport = useCallback(async () => {
    if (selectedSlidesToExport.length === 0) return;

    setIsExporting(true);
    try {
      await onExport(selectedSlidesToExport, settings);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      // Error state remains visible in the dialog
    } finally {
      setIsExporting(false);
    }
  }, [selectedSlidesToExport, settings, onExport, onClose]);

  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog">
        <div className="export-dialog-header">
          <h2>Export Presentation</h2>
          <button
            className="export-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="export-dialog-content">
          <ExportSlideList
            slides={slides}
            selectedSlides={selectedSlides}
            onSlideOrderChange={handleSlideOrderChange}
            onSelectedSlidesChange={handleSelectedSlidesChange}
            onSlideNameChange={handleSlideNameChange}
            onSlideDelete={handleSlideDelete}
          />

          <ExportOptions settings={settings} onSettingsChange={setSettings} />
        </div>

        <div className="export-dialog-footer">
          <button
            className="export-dialog-button export-dialog-button-cancel"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            className="export-dialog-button export-dialog-button-export"
            onClick={handleExport}
            disabled={selectedSlidesToExport.length === 0 || isExporting}
          >
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
};
