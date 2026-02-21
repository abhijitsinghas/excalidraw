import React, { useEffect, useState } from "react";

import {
  getFrameLikeTitle,
  getNonDeletedElements,
  isFrameLikeElement,
} from "@excalidraw/element";

import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

import { exportToCanvas } from "../scene/export";
import { canvasToBlob } from "../data/blob";
import { useI18n } from "../i18n";

import { FilledButton } from "./FilledButton";
import { downloadIcon } from "./icons";

import { Dialog } from "./Dialog";

import { CheckboxItem } from "./CheckboxItem";
import { TextField } from "./TextField";

import "./ExportFrameDialog.scss";

import type { AppState, BinaryFiles, UIAppState } from "../types";

type ExportFrameDialogProps = {
  elements: readonly NonDeletedExcalidrawElement[];
  appState: UIAppState;
  files: BinaryFiles;
  onCloseRequest: () => void;
};

export const ExportFrameDialog = ({
  elements,
  appState,
  files,
  onCloseRequest,
}: ExportFrameDialogProps) => {
  useI18n();
  const [framePreviews, setFramePreviews] = useState<
    { id: string; blob: Blob | null; name: string }[]
  >([]);
  const [selectedFrameIds, setSelectedFrameIds] = useState<Set<string>>(
    new Set(),
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<{
    index: number;
    position: "before" | "after";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [customRange, setCustomRange] = useState("");
  const [exportQuality, setExportQuality] = useState(0.8);
  const [exportScale, setExportScale] = useState(1);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const generatePreviews = async () => {
      const frames = getNonDeletedElements(elements)
        .filter((element) => isFrameLikeElement(element))
        .sort((a, b) => {
          if (a.y === b.y) {
            return a.x - b.x;
          }
          return a.y - b.y;
        });

      const initialSelectedIds = new Set<string>();
      frames.forEach((frame) => initialSelectedIds.add(frame.id));
      setSelectedFrameIds(initialSelectedIds);

      const previews = await Promise.all(
        frames.map(async (frame) => {
          try {
            const canvas = await exportToCanvas(
              getNonDeletedElements(elements),
              { ...appState, exportBackground: true } as AppState,
              files,
              {
                exportBackground: true,
                viewBackgroundColor: appState.viewBackgroundColor,
                exportingFrame: frame,
                exportPadding: 0,
              },
            );
            const blob = await canvasToBlob(canvas);
            return {
              id: frame.id,
              blob,
              name: getFrameLikeTitle(frame) || "Untitled Frame",
            };
          } catch (e) {
            console.error(e);
            return {
              id: frame.id,
              blob: null,
              name: getFrameLikeTitle(frame) || "Untitled Frame",
            };
          }
        }),
      );

      setFramePreviews(previews);
      setLoading(false);
    };

    generatePreviews();
  }, [elements, appState, files]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedFrameIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedFrameIds(newSelectedIds);
  };

  const handleSelectAll = () => {
    const newSelectedIds = new Set<string>();
    framePreviews.forEach((p) => newSelectedIds.add(p.id));
    setSelectedFrameIds(newSelectedIds);
    setCustomRange("");
  };

  const handleSelectNone = () => {
    setSelectedFrameIds(new Set());
    setCustomRange("");
  };

  const handleCustomRangeChange = (value: string) => {
    setCustomRange(value);
    if (!value.trim()) {
      setSelectedFrameIds(new Set());
      return;
    }

    const newSelectedIds = new Set<string>();
    const parts = value.split(",");

    parts.forEach((part) => {
      const range = part.trim().split("-");
      if (range.length === 2) {
        const start = parseInt(range[0], 10);
        const end = parseInt(range[1], 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= framePreviews.length) {
              newSelectedIds.add(framePreviews[i - 1].id);
            }
          }
        }
      } else if (range.length === 1) {
        const page = parseInt(range[0], 10);
        if (!isNaN(page) && page > 0 && page <= framePreviews.length) {
          newSelectedIds.add(framePreviews[page - 1].id);
        }
      }
    });
    setSelectedFrameIds(newSelectedIds);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Determine if we should drop before or after based on pointer position relative to target
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = x < rect.width / 2 ? "before" : "after";

    if (dropPosition?.index !== index || dropPosition?.position !== position) {
      setDropPosition({ index, position });
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !dropPosition) {
      return;
    }
    if (draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDropPosition(null);
      return;
    }

    const newPreviews = [...framePreviews];
    const [draggedItem] = newPreviews.splice(draggedIndex, 1);

    // Calculate new index
    let insertIndex = dropPosition.index;

    // If we removed an item from before the insertion point, the array shifted left
    if (draggedIndex < dropPosition.index) {
      insertIndex--;
    }

    // If dropping after, increment index
    if (dropPosition.position === "after") {
      insertIndex++;
    }

    newPreviews.splice(insertIndex, 0, draggedItem);

    setFramePreviews(newPreviews);
    setDraggedIndex(null);
    setDropPosition(null);
  };

  const handleExportPdf = async () => {
    try {
      const { exportToPDF } = await import("../scene/export-to-pdf");
      // Filter elements to only include selected frames
      const elementsToExport = elements.filter((element) => {
        if (isFrameLikeElement(element)) {
          return selectedFrameIds.has(element.id);
        }
        return true;
      });

      if (selectedFrameIds.size === 0) {
        return;
      }

      const orderedFrameIds = framePreviews
        .filter((p) => selectedFrameIds.has(p.id))
        .map((p) => p.id);

      await exportToPDF(elementsToExport, appState as AppState, files, {
        quality: exportQuality,
        scale: exportScale,
        orderedFrameIds,
      });
      onCloseRequest();
    } catch (error) {
      console.error(error);
      alert("Error exporting to PDF");
    }
  };

  const handleExportPptx = async () => {
    try {
      const { exportToPPTX } = await import("../scene/export-to-pptx");
      // Filter elements to only include selected frames
      const elementsToExport = elements.filter((element) => {
        if (isFrameLikeElement(element)) {
          return selectedFrameIds.has(element.id);
        }
        return true;
      });

      if (selectedFrameIds.size === 0) {
        return;
      }

      const orderedFrameIds = framePreviews
        .filter((p) => selectedFrameIds.has(p.id))
        .map((p) => p.id);

      await exportToPPTX(elementsToExport, appState as AppState, files, {
        orderedFrameIds,
      });
      onCloseRequest();
    } catch (error) {
      console.error(error);
      alert("Error exporting to PPTX");
    }
  };

  return (
    <Dialog onCloseRequest={onCloseRequest} size="wide" title="Export Frames">
      <div className="ExportFrameDialog">
        <div className="ExportFrameDialog__content">
          <div className="ExportFrameDialog__preview">
            {loading ? (
              <div>Loading previews...</div>
            ) : (
              <div className="ExportFrameDialog__preview-list">
                {framePreviews.map((preview, index) => (
                  <div
                    key={preview.id}
                    className={`ExportFrameDialog__preview-item ${
                      selectedFrameIds.has(preview.id)
                        ? "ExportFrameDialog__preview-item--selected"
                        : ""
                    } ${
                      draggedIndex === index
                        ? "ExportFrameDialog__preview-item--dragging"
                        : ""
                    } ${
                      dropPosition?.index === index
                        ? `ExportFrameDialog__preview-item--drop-${dropPosition.position}`
                        : ""
                    }`}
                    onClick={() =>
                      handleCheckboxChange(
                        preview.id,
                        !selectedFrameIds.has(preview.id),
                      )
                    }
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="ExportFrameDialog__preview-image">
                      {preview.blob && (
                        <img
                          src={URL.createObjectURL(preview.blob)}
                          alt={preview.name}
                        />
                      )}
                      <div className="ExportFrameDialog__preview-title">
                        {preview.name}
                      </div>
                      <div className="ExportFrameDialog__preview-checkbox">
                        <CheckboxItem
                          checked={selectedFrameIds.has(preview.id)}
                          onChange={(checked) =>
                            handleCheckboxChange(preview.id, checked)
                          }
                        >
                          {}
                        </CheckboxItem>
                      </div>
                    </div>
                  </div>
                ))}
                {framePreviews.length === 0 && (
                  <div>No frames found to export</div>
                )}
              </div>
            )}
          </div>
          <div className="ExportFrameDialog__right-panel">
            <div className="ExportFrameDialog__controls">
              <div className="ExportFrameDialog__row">
                <button
                  type="button"
                  className="ExportFrameDialog__button--secondary"
                  onClick={handleSelectAll}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="ExportFrameDialog__button--secondary"
                  onClick={handleSelectNone}
                >
                  Unselect All
                </button>
              </div>
              <div className="ExportFrameDialog__row">
                <TextField
                  value={customRange}
                  placeholder="e.g., 1,2,5-9"
                  onChange={handleCustomRangeChange}
                  label="Custom Range"
                  className="ExportFrameDialog__range"
                />
              </div>
              <div className="ExportFrameDialog__row ExportFrameDialog__count-row">
                <span className="ExportFrameDialog__count">
                  {selectedFrameIds.size} frames selected
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ExportFrameDialog__options-toggle"
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? "▼ Hide" : "▲ Show"} Export Options
            </button>

            {showOptions && (
              <div className="ExportFrameDialog__options">
                <label className="ExportFrameDialog__option">
                  <span>Quality: {Math.round(exportQuality * 100)}%</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={exportQuality}
                    onChange={(e) =>
                      setExportQuality(parseFloat(e.target.value))
                    }
                  />
                </label>
                <label className="ExportFrameDialog__option">
                  <span>Scale: {exportScale}x</span>
                  <select
                    value={exportScale}
                    onChange={(e) => setExportScale(parseFloat(e.target.value))}
                  >
                    <option value="1">1x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                  </select>
                </label>
              </div>
            )}

            <div className="ExportFrameDialog__actions">
              <FilledButton
                className="ExportFrameDialog__button"
                label="Export to PDF"
                onClick={handleExportPdf}
                icon={downloadIcon}
                disabled={selectedFrameIds.size === 0}
              >
                Export to PDF
              </FilledButton>
              <FilledButton
                className="ExportFrameDialog__button"
                label="Export to PPTX"
                onClick={handleExportPptx}
                icon={downloadIcon}
                disabled={selectedFrameIds.size === 0}
              >
                Export to PPTX
              </FilledButton>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
