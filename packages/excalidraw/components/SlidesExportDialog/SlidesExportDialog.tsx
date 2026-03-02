import React, { useState, useMemo, useCallback, useEffect } from "react";
import { getFrameLikeElements, getFrameChildren } from "@excalidraw/element";

import { exportToCanvas } from "@excalidraw/utils/export";

import { THEME } from "@excalidraw/common";

import type {
  ExcalidrawFrameLikeElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/element/types";

import {
  useExcalidrawAppState,
  useExcalidrawElements,
  useExcalidrawSetAppState,
  useApp,
} from "../App";
import { t } from "../../i18n";
import { Dialog } from "../Dialog";
import { FilledButton } from "../FilledButton";
import { Switch } from "../Switch";
import { RadioGroup } from "../RadioGroup";

import type { BinaryFiles } from "../../types";

import "./SlidesExportDialog.scss";

type ExportFormat = "pdf" | "pptx";
type ExportQuality = "low" | "medium" | "high";

const QUALITY_MAP: Record<ExportQuality, number> = {
  low: 0.5,
  medium: 0.8,
  high: 1.0,
};

interface SlidePreviewProps {
  frame: ExcalidrawFrameLikeElement;
  index: number;
  isSelected: boolean;
  elements: readonly NonDeletedExcalidrawElement[];
  files: BinaryFiles;
  appState: any;
  onToggle: () => void;
}

const SlidePreview = ({
  frame,
  index,
  isSelected,
  elements,
  files,
  appState,
  onToggle,
}: SlidePreviewProps) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const frameElements = useMemo(() => {
    return getFrameChildren(elements, frame.id);
  }, [elements, frame.id]);

  useEffect(() => {
    let cancelled = false;

    const generateThumbnail = async () => {
      if (frameElements.length === 0) {
        return;
      }

      try {
        const canvas = await exportToCanvas({
          elements: frameElements,
          appState: {
            ...appState,
            exportBackground: true,
            exportWithDarkMode: appState.theme === THEME.DARK,
          },
          files,
          maxWidthOrHeight: 150,
          exportingFrame: frame,
        });

        if (!cancelled) {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setThumbnailUrl(dataUrl);
        }
      } catch (error) {
        console.error("Failed to generate thumbnail:", error);
      }
    };

    generateThumbnail();

    return () => {
      cancelled = true;
    };
  }, [frame.id, frameElements, files, appState.theme]);

  return (
    <div
      className={`slides-export-dialog__slide-preview ${
        isSelected ? "slides-export-dialog__slide-preview--selected" : ""
      }`}
      onClick={onToggle}
    >
      <div className="slides-export-dialog__slide-preview__checkbox">
        <input type="checkbox" checked={isSelected} onChange={onToggle} />
      </div>
      <div className="slides-export-dialog__slide-preview__number">
        {index + 1}
      </div>
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`Slide ${index + 1}`}
          className="slides-export-dialog__slide-preview__image"
        />
      ) : (
        <div className="slides-export-dialog__slide-preview__empty">
          {index + 1}
        </div>
      )}
    </div>
  );
};

export const SlidesExportDialog = () => {
  const appState = useExcalidrawAppState();
  const elements = useExcalidrawElements();
  const setAppState = useExcalidrawSetAppState();
  const app = useApp();

  const frames = useMemo(() => {
    return getFrameLikeElements(
      elements as readonly NonDeletedExcalidrawElement[],
    );
  }, [elements]);

  const [selectedSlides, setSelectedSlides] = useState<Set<string>>(() => {
    return new Set(frames.map((f) => f.id));
  });

  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [quality, setQuality] = useState<ExportQuality>("medium");
  const [exportVectors, setExportVectors] = useState(true);
  const [exportRasterize, setExportRasterize] = useState(false);
  const [preserveHanddrawn, setPreserveHanddrawn] = useState(false);

  const files = (app as any).files || {};

  const handleClose = useCallback(() => {
    setAppState({ openDialog: null });
  }, [setAppState]);

  const handleToggleSlide = useCallback((frameId: string) => {
    setSelectedSlides((prev) => {
      const next = new Set(prev);
      if (next.has(frameId)) {
        next.delete(frameId);
      } else {
        next.add(frameId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedSlides(new Set(frames.map((f) => f.id)));
  }, [frames]);

  const handleDeselectAll = useCallback(() => {
    setSelectedSlides(new Set());
  }, []);

  const handleExport = useCallback(async () => {
    const selectedFrames = frames.filter((f) => selectedSlides.has(f.id));
    const qualityValue = QUALITY_MAP[quality];

    for (const frame of selectedFrames) {
      const frameElements = getFrameChildren(
        elements as readonly NonDeletedExcalidrawElement[],
        frame.id,
      );

      if (frameElements.length === 0) {
        continue;
      }

      const canvas = await exportToCanvas({
        elements: frameElements,
        appState: {
          ...appState,
          exportBackground: true,
          exportWithDarkMode: appState.theme === THEME.DARK,
        },
        files,
        maxWidthOrHeight: 1920,
        exportingFrame: frame,
      });

      const imageDataUrl = canvas.toDataURL("image/jpeg", qualityValue);
      // eslint-disable-next-line no-console
      console.log(
        `Generated slide ${frame.name || frame.id}:`,
        `${imageDataUrl.substring(0, 50)}...`,
      );
    }

    // eslint-disable-next-line no-console
    console.log("Export completed for", selectedFrames.length, "slides");
    handleClose();
  }, [frames, selectedSlides, quality, elements, appState, files, handleClose]);

  if (!appState.openDialog || appState.openDialog.name !== "slidesExport") {
    return null;
  }

  return (
    <Dialog
      onCloseRequest={handleClose}
      size="wide"
      title={t("slidesExport.title")}
    >
      <div className="slides-export-dialog">
        <div className="slides-export-dialog__left">
          <div className="slides-export-dialog__header">
            <span>
              {t("slidesExport.selectedSlides", { count: selectedSlides.size })}
            </span>
            <div className="slides-export-dialog__header__actions">
              <button onClick={handleSelectAll}>
                {t("slidesExport.selectAll")}
              </button>
              <button onClick={handleDeselectAll}>
                {t("slidesExport.deselectAll")}
              </button>
            </div>
          </div>
          <div className="slides-export-dialog__slides-grid">
            {frames.map((frame, index) => (
              <SlidePreview
                key={frame.id}
                frame={frame}
                index={index}
                isSelected={selectedSlides.has(frame.id)}
                elements={elements as readonly NonDeletedExcalidrawElement[]}
                files={files}
                appState={appState}
                onToggle={() => handleToggleSlide(frame.id)}
              />
            ))}
          </div>
        </div>

        <div className="slides-export-dialog__right">
          <div className="slides-export-dialog__option">
            <label>{t("slidesExport.format")}</label>
            <RadioGroup
              name="exportFormat"
              value={format}
              onChange={(val) => setFormat(val as ExportFormat)}
              choices={[
                { value: "pdf", label: "PDF" },
                { value: "pptx", label: "PPTX" },
              ]}
            />
          </div>

          <div className="slides-export-dialog__option">
            <label>
              {t("slidesExport.quality")}:{" "}
              {Math.round(QUALITY_MAP[quality] * 100)}%
            </label>
            <RadioGroup
              name="exportQuality"
              value={quality}
              onChange={(val) => setQuality(val as ExportQuality)}
              choices={[
                { value: "low", label: t("slidesExport.qualityLow") },
                { value: "medium", label: t("slidesExport.qualityMedium") },
                { value: "high", label: t("slidesExport.qualityHigh") },
              ]}
            />
          </div>

          <div className="slides-export-dialog__option">
            <Switch
              name="exportVectors"
              checked={exportVectors}
              onChange={(checked) => setExportVectors(checked)}
            />
            <span>{t("slidesExport.exportVectors")}</span>
          </div>

          <div className="slides-export-dialog__option">
            <Switch
              name="exportRasterize"
              checked={exportRasterize}
              onChange={(checked) => setExportRasterize(checked)}
            />
            <span>{t("slidesExport.exportRasterize")}</span>
          </div>

          <div className="slides-export-dialog__option">
            <Switch
              name="preserveHanddrawn"
              checked={preserveHanddrawn}
              onChange={(checked) => setPreserveHanddrawn(checked)}
            />
            <span>{t("slidesExport.preserveHanddrawn")}</span>
          </div>

          <div className="slides-export-dialog__buttons">
            <FilledButton onClick={handleClose}>
              {t("slidesExport.cancel")}
            </FilledButton>
            <FilledButton onClick={handleExport} color="primary">
              {t("slidesExport.exportButton")}
            </FilledButton>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
