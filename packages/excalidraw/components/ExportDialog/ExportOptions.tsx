import React, { useCallback } from "react";
import type { ExportSettings } from "./types";

interface ExportOptionsProps {
  settings: ExportSettings;
  onSettingsChange: (settings: ExportSettings) => void;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleFormatChange = useCallback(
    (format: "pdf" | "pptx") => {
      onSettingsChange({ ...settings, format });
    },
    [settings, onSettingsChange],
  );

  const handlePdfModeChange = useCallback(
    (pdfMode: "print" | "screen") => {
      onSettingsChange({ ...settings, pdfMode });
    },
    [settings, onSettingsChange],
  );

  const handlePreserveAnimationsChange = useCallback(
    (preserveAnimations: boolean) => {
      onSettingsChange({ ...settings, preserveAnimations });
    },
    [settings, onSettingsChange],
  );

  const handleQualityChange = useCallback(
    (quality: "low" | "medium" | "high") => {
      onSettingsChange({ ...settings, quality });
    },
    [settings, onSettingsChange],
  );

  const handleCompressionChange = useCallback(
    (compression: number) => {
      onSettingsChange({ ...settings, compression });
    },
    [settings, onSettingsChange],
  );

  const handleExportModeChange = useCallback(
    (exportMode: "vectors" | "rasterized") => {
      onSettingsChange({ ...settings, exportMode });
    },
    [settings, onSettingsChange],
  );

  const handlePreserveHandDrawnChange = useCallback(
    (preserveHandDrawn: boolean) => {
      onSettingsChange({ ...settings, preserveHandDrawn });
    },
    [settings, onSettingsChange],
  );

  const qualityLabels: Record<"low" | "medium" | "high", string> = {
    low: "Low (1x)",
    medium: "Medium (1.5x)",
    high: "High (2x)",
  };

  return (
    <div className="export-options">
      {/* Format Section */}
      <div className="export-options-section">
        <h3 className="export-options-title">Format</h3>
        <div className="export-options-group">
          <label className="export-options-radio">
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={settings.format === "pdf"}
              onChange={(e) =>
                handleFormatChange(e.target.value as "pdf" | "pptx")
              }
            />
            <span>PDF</span>
          </label>
          <label className="export-options-radio">
            <input
              type="radio"
              name="format"
              value="pptx"
              checked={settings.format === "pptx"}
              onChange={(e) =>
                handleFormatChange(e.target.value as "pdf" | "pptx")
              }
            />
            <span>PPTX</span>
          </label>
        </div>
      </div>

      {/* PDF Options */}
      {settings.format === "pdf" && (
        <div className="export-options-section">
          <h3 className="export-options-title">PDF Mode</h3>
          <div className="export-options-group">
            <label className="export-options-radio">
              <input
                type="radio"
                name="pdfMode"
                value="screen"
                checked={settings.pdfMode === "screen"}
                onChange={(e) =>
                  handlePdfModeChange(e.target.value as "print" | "screen")
                }
              />
              <span>Screen Viewing</span>
            </label>
            <label className="export-options-radio">
              <input
                type="radio"
                name="pdfMode"
                value="print"
                checked={settings.pdfMode === "print"}
                onChange={(e) =>
                  handlePdfModeChange(e.target.value as "print" | "screen")
                }
              />
              <span>Print Optimized</span>
            </label>
          </div>
        </div>
      )}

      {/* PPTX Options */}
      {settings.format === "pptx" && (
        <div className="export-options-section">
          <h3 className="export-options-title">PPTX Options</h3>
          <div className="export-options-group">
            <label className="export-options-checkbox">
              <input
                type="checkbox"
                checked={settings.preserveAnimations}
                onChange={(e) =>
                  handlePreserveAnimationsChange(e.target.checked)
                }
              />
              <span>Preserve Animations</span>
            </label>
          </div>
        </div>
      )}

      {/* Quality Section */}
      <div className="export-options-section">
        <h3 className="export-options-title">Quality</h3>
        <div className="export-options-group">
          <select
            value={settings.quality}
            onChange={(e) =>
              handleQualityChange(e.target.value as "low" | "medium" | "high")
            }
            className="export-options-select"
          >
            <option value="low">{qualityLabels.low}</option>
            <option value="medium">{qualityLabels.medium}</option>
            <option value="high">{qualityLabels.high}</option>
          </select>
        </div>
      </div>

      {/* Compression Section */}
      <div className="export-options-section">
        <h3 className="export-options-title">Compression</h3>
        <div className="export-options-group">
          <div className="export-options-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={settings.compression}
              onChange={(e) => handleCompressionChange(Number(e.target.value))}
              className="export-options-slider"
            />
            <span className="export-options-value">
              {settings.compression}%
            </span>
          </div>
        </div>
      </div>

      {/* Export Mode Section */}
      <div className="export-options-section">
        <h3 className="export-options-title">Export Mode</h3>
        <div className="export-options-group">
          <label className="export-options-radio">
            <input
              type="radio"
              name="exportMode"
              value="vectors"
              checked={settings.exportMode === "vectors"}
              onChange={(e) =>
                handleExportModeChange(
                  e.target.value as "vectors" | "rasterized",
                )
              }
            />
            <span>Vectors</span>
          </label>
          <label className="export-options-radio">
            <input
              type="radio"
              name="exportMode"
              value="rasterized"
              checked={settings.exportMode === "rasterized"}
              onChange={(e) =>
                handleExportModeChange(
                  e.target.value as "vectors" | "rasterized",
                )
              }
            />
            <span>Rasterized</span>
          </label>
        </div>
      </div>

      {/* Hand-Drawn Shapes Section */}
      <div className="export-options-section">
        <h3 className="export-options-title">Hand-Drawn Shapes</h3>
        <div className="export-options-group">
          <label className="export-options-checkbox">
            <input
              type="checkbox"
              checked={settings.preserveHandDrawn}
              onChange={(e) => handlePreserveHandDrawnChange(e.target.checked)}
            />
            <span>Preserve Hand-Drawn Shapes</span>
          </label>
          <p className="export-options-help-text">
            Hand-drawn shapes exported as images, text remains selectable
          </p>
        </div>
      </div>
    </div>
  );
};
