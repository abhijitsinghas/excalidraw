import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import clsx from "clsx";
import type { AppState, BinaryFiles } from "../../types";
import type { ExcalidrawElement } from "@excalidraw/element/types";
import { usePresentationSlides } from "../../hooks/usePresentationSlides";
import { generateFrameThumbnail } from "../../utils/thumbnailGenerator";
import {
  PlusIcon,
  DotsHorizontalIcon,
  eyeIcon,
  eyeClosedIcon,
  TrashIcon,
  playerPlayIcon,
} from "../icons";

import "./PresentationSidebar.scss";

export interface PresentationSidebarProps {
  appState: AppState;
  elements: readonly ExcalidrawElement[];
  binaryFiles: BinaryFiles;
  onStartPresentation: () => void;
  onExportClick: () => void;
  onZoomToFrame: (frameId: string) => void;
  onCreateFrame?: () => void;
  isOpen?: boolean;
}

const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 150;
const THUMBNAIL_DEBOUNCE_MS = 300;

export const PresentationSidebar: React.FC<PresentationSidebarProps> = ({
  appState,
  elements,
  binaryFiles,
  onStartPresentation,
  onExportClick,
  onZoomToFrame,
  onCreateFrame,
  isOpen = true,
}) => {
  const {
    slides,
    slideOrder,
    reorderSlides,
    toggleSlideIncluded,
    updateThumbnail,
    thumbnailCache,
  } = usePresentationSlides(elements);

  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  // Generate thumbnails when slides change
  useEffect(() => {
    const generateMissingThumbnails = async () => {
      for (const slide of slides) {
        // Skip if thumbnail already exists
        if (thumbnailCache.has(slide.id)) {
          continue;
        }

        // Generate and update thumbnail
        const url = await generateFrameThumbnail(
          slide.frameElement,
          appState,
          elements as ExcalidrawElement[],
          THUMBNAIL_WIDTH,
          THUMBNAIL_HEIGHT,
          binaryFiles,
        );

        if (url) {
          updateThumbnail(slide.id, url);
        }
      }
    };

    generateMissingThumbnails();
  }, [
    slides,
    appState,
    elements,
    binaryFiles,
    updateThumbnail,
    thumbnailCache,
  ]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, slideId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", slideId);
    setDraggedSlideId(slideId);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop to reorder
  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");

      if (!draggedId || draggedId === draggedSlideId) {
        return;
      }

      const currentIndex = slideOrder.indexOf(draggedId);
      if (currentIndex === -1) {
        return;
      }

      // Create new order
      const newOrder = [...slideOrder];
      newOrder.splice(currentIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);

      reorderSlides(newOrder);
      setDraggedSlideId(null);
      dragOverIndexRef.current = null;
    },
    [slideOrder, reorderSlides, draggedSlideId],
  );

  // Handle slide deletion
  const handleDeleteSlide = useCallback(
    (slideId: string) => {
      const newOrder = slideOrder.filter((id) => id !== slideId);
      reorderSlides(newOrder);
    },
    [slideOrder, reorderSlides],
  );

  // Count included slides
  const includedCount = useMemo(
    () => slides.filter((slide) => slide.isIncluded).length,
    [slides],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="presentation-sidebar">
      {/* Header */}
      <div className="presentation-sidebar__header">
        <div className="presentation-sidebar__header-title">
          <h3>Presentation</h3>
          <span className="presentation-sidebar__slide-counter">
            Slides ({includedCount}/{slides.length})
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="presentation-sidebar__toolbar">
        <button
          className="presentation-sidebar__btn presentation-sidebar__btn--icon"
          title="Create new slide"
          onClick={onCreateFrame}
          aria-label="Create new slide"
        >
          {PlusIcon}
        </button>
        <button
          className="presentation-sidebar__btn presentation-sidebar__btn--icon"
          title="Export presentation"
          onClick={onExportClick}
          aria-label="Export presentation"
        >
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M12 13v6M9 16h6" />
          </svg>
        </button>
        <button
          className="presentation-sidebar__btn presentation-sidebar__btn--icon"
          title="More options"
          aria-label="More options"
        >
          {DotsHorizontalIcon}
        </button>
      </div>

      {/* Slides list */}
      <div className="presentation-sidebar__slides">
        {slides.length === 0 ? (
          <div className="presentation-sidebar__empty">
            <p>No frames yet.</p>
            <p>Create a frame to get started.</p>
          </div>
        ) : (
          <div className="presentation-sidebar__slides-list">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={clsx("presentation-sidebar__slide", {
                  "presentation-sidebar__slide--dragging":
                    draggedSlideId === slide.id,
                  "presentation-sidebar__slide--excluded": !slide.isIncluded,
                })}
                draggable
                onDragStart={(e) => handleDragStart(e, slide.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragLeave={() => {
                  dragOverIndexRef.current = null;
                }}
              >
                {/* Thumbnail */}
                <div className="presentation-sidebar__slide-thumbnail">
                  {slide.thumbnail ? (
                    <img
                      src={slide.thumbnail}
                      alt={slide.name}
                      onClick={() => onZoomToFrame(slide.id)}
                    />
                  ) : (
                    <div className="presentation-sidebar__slide-placeholder">
                      <span>{index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Slide info */}
                <div className="presentation-sidebar__slide-info">
                  <div className="presentation-sidebar__slide-name">
                    {slide.name}
                  </div>
                  <div className="presentation-sidebar__slide-number">
                    #{index + 1}
                  </div>
                </div>

                {/* Slide controls */}
                <div className="presentation-sidebar__slide-controls">
                  <button
                    className={clsx(
                      "presentation-sidebar__btn",
                      "presentation-sidebar__btn--small",
                      {
                        "presentation-sidebar__btn--active": slide.isIncluded,
                      },
                    )}
                    title={
                      slide.isIncluded
                        ? "Exclude from presentation"
                        : "Include in presentation"
                    }
                    onClick={() => toggleSlideIncluded(slide.id)}
                    aria-label={
                      slide.isIncluded
                        ? "Exclude from presentation"
                        : "Include in presentation"
                    }
                  >
                    {slide.isIncluded ? eyeIcon : eyeClosedIcon}
                  </button>
                  <button
                    className="presentation-sidebar__btn presentation-sidebar__btn--small presentation-sidebar__btn--danger"
                    title="Delete slide"
                    onClick={() => handleDeleteSlide(slide.id)}
                    aria-label="Delete slide"
                  >
                    {TrashIcon}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Start presentation button */}
      <div className="presentation-sidebar__footer">
        <button
          className="presentation-sidebar__btn-primary"
          onClick={onStartPresentation}
          disabled={includedCount === 0}
          title={
            includedCount === 0
              ? "Include at least one slide to start"
              : "Start presentation"
          }
        >
          {playerPlayIcon}
          Start Presentation
        </button>
      </div>
    </div>
  );
};

export default PresentationSidebar;
