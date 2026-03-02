import React, { useState, useCallback, useMemo } from "react";
import type { PresentationSlide } from "../../hooks/usePresentationSlides";

interface ExportSlideListProps {
  slides: PresentationSlide[];
  selectedSlides: Set<string>;
  onSlideOrderChange: (newOrder: PresentationSlide[]) => void;
  onSelectedSlidesChange: (selectedSlides: Set<string>) => void;
  onSlideNameChange: (slideId: string, newName: string) => void;
  onSlideDelete: (slideId: string) => void;
}

export const ExportSlideList: React.FC<ExportSlideListProps> = ({
  slides,
  selectedSlides,
  onSlideOrderChange,
  onSelectedSlidesChange,
  onSlideNameChange,
  onSlideDelete,
}) => {
  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(slides.map((s) => s.id));
    onSelectedSlidesChange(allIds);
  }, [slides, onSelectedSlidesChange]);

  const handleDeselectAll = useCallback(() => {
    onSelectedSlidesChange(new Set());
  }, [onSelectedSlidesChange]);

  const handleCheckboxChange = useCallback(
    (slideId: string) => {
      const newSelected = new Set(selectedSlides);
      if (newSelected.has(slideId)) {
        newSelected.delete(slideId);
      } else {
        newSelected.add(slideId);
      }
      onSelectedSlidesChange(newSelected);
    },
    [selectedSlides, onSelectedSlidesChange],
  );

  const handleDragStart = useCallback((e: React.DragEvent, slideId: string) => {
    setDraggedSlideId(slideId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetSlideId: string) => {
      e.preventDefault();
      if (!draggedSlideId || draggedSlideId === targetSlideId) return;

      const draggedIndex = slides.findIndex((s) => s.id === draggedSlideId);
      const targetIndex = slides.findIndex((s) => s.id === targetSlideId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newSlides = [...slides];
      const [draggedSlide] = newSlides.splice(draggedIndex, 1);
      newSlides.splice(targetIndex, 0, draggedSlide);

      onSlideOrderChange(newSlides);
      setDraggedSlideId(null);
    },
    [draggedSlideId, slides, onSlideOrderChange],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedSlideId(null);
  }, []);

  const handleDoubleClick = useCallback((slideId: string, name: string) => {
    setEditingSlideId(slideId);
    setEditingName(name);
  }, []);

  const handleNameInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditingName(e.target.value);
    },
    [],
  );

  const handleNameInputBlur = useCallback(() => {
    if (editingSlideId && editingName.trim()) {
      onSlideNameChange(editingSlideId, editingName);
    }
    setEditingSlideId(null);
    setEditingName("");
  }, [editingSlideId, editingName, onSlideNameChange]);

  const handleNameInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (editingSlideId && editingName.trim()) {
          onSlideNameChange(editingSlideId, editingName);
        }
        setEditingSlideId(null);
        setEditingName("");
      } else if (e.key === "Escape") {
        setEditingSlideId(null);
        setEditingName("");
      }
    },
    [editingSlideId, editingName, onSlideNameChange],
  );

  return (
    <div className="export-slide-list">
      <div className="export-slide-list-header">
        <h3>Slides</h3>
        <div className="export-slide-list-actions">
          <button
            className="export-slide-list-button"
            onClick={handleSelectAll}
            title="Select All"
          >
            Select All
          </button>
          <button
            className="export-slide-list-button"
            onClick={handleDeselectAll}
            title="Deselect All"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="export-slide-list-content">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`export-slide-item ${
              draggedSlideId === slide.id ? "dragging" : ""
            } ${selectedSlides.has(slide.id) ? "selected" : ""}`}
            draggable
            onDragStart={(e) => handleDragStart(e, slide.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, slide.id)}
            onDragEnd={handleDragEnd}
          >
            <div className="export-slide-item-checkbox">
              <input
                type="checkbox"
                checked={selectedSlides.has(slide.id)}
                onChange={() => handleCheckboxChange(slide.id)}
                aria-label={`Select ${slide.name}`}
              />
            </div>

            {slide.thumbnail && (
              <div className="export-slide-item-thumbnail">
                <img
                  src={slide.thumbnail}
                  alt={slide.name}
                  width={50}
                  height={40}
                />
              </div>
            )}

            <div className="export-slide-item-name">
              {editingSlideId === slide.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={handleNameInputChange}
                  onBlur={handleNameInputBlur}
                  onKeyDown={handleNameInputKeyDown}
                  autoFocus
                  className="export-slide-item-name-input"
                />
              ) : (
                <span
                  onDoubleClick={() => handleDoubleClick(slide.id, slide.name)}
                >
                  {slide.name}
                </span>
              )}
            </div>

            <button
              className="export-slide-item-delete"
              onClick={() => onSlideDelete(slide.id)}
              title={`Delete ${slide.name}`}
              aria-label={`Delete ${slide.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
