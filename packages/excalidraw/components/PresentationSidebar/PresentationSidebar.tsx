import React, { useCallback, useMemo, useState, useEffect } from "react";
import { getFrameLikeElements, getFrameChildren } from "@excalidraw/element";

import { exportToCanvas } from "@excalidraw/utils/export";

import { THEME } from "@excalidraw/common";

import type {
  ExcalidrawFrameLikeElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/element/types";

import {
  useApp,
  useExcalidrawAppState,
  useExcalidrawElements,
  useExcalidrawSetAppState,
} from "../App";
import { t } from "../../i18n";

import type { BinaryFiles } from "../../types";

import "./PresentationSidebar.scss";

interface SlideThumbnailProps {
  frame: ExcalidrawFrameLikeElement;
  index: number;
  elements: readonly NonDeletedExcalidrawElement[];
  files: BinaryFiles;
  appState: any;
  onSelect: () => void;
  isSelected: boolean;
}

const SlideThumbnail = ({
  frame,
  index,
  elements,
  files,
  appState,
  onSelect,
  isSelected,
}: SlideThumbnailProps) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const frameElements = useMemo(() => {
    return getFrameChildren(elements, frame.id);
  }, [elements, frame.id]);

  useEffect(() => {
    let cancelled = false;

    const generateThumbnail = async () => {
      if (frameElements.length === 0) {
        setIsLoading(false);
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
          maxWidthOrHeight: 200,
          exportingFrame: frame,
        });

        if (!cancelled) {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setThumbnailUrl(dataUrl);
        }
      } catch (error) {
        console.error("Failed to generate thumbnail:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    generateThumbnail();

    return () => {
      cancelled = true;
    };
  }, [frame.id, frameElements, files, appState.theme]);

  return (
    <div
      className={`presentation-sidebar__thumbnail ${
        isSelected ? "presentation-sidebar__thumbnail--selected" : ""
      }`}
      onClick={onSelect}
    >
      <div className="presentation-sidebar__thumbnail__number">{index + 1}</div>
      {isLoading ? (
        <div className="presentation-sidebar__thumbnail__loading" />
      ) : thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`Slide ${index + 1}`}
          className="presentation-sidebar__thumbnail__image"
          draggable={false}
        />
      ) : (
        <div className="presentation-sidebar__thumbnail__empty">
          {index + 1}
        </div>
      )}
    </div>
  );
};

export const PresentationSidebar = () => {
  const app = useApp();
  const appState = useExcalidrawAppState();
  const elements = useExcalidrawElements();
  const setAppState = useExcalidrawSetAppState();

  const frames = useMemo(() => {
    return getFrameLikeElements(
      elements as readonly NonDeletedExcalidrawElement[],
    );
  }, [elements]);

  const [slideOrder, setSlideOrder] = useState<string[]>([]);

  useEffect(() => {
    if (frames.length > 0 && slideOrder.length === 0) {
      setSlideOrder(frames.map((f) => f.id));
    } else if (frames.length > 0) {
      const existingIds = new Set(frames.map((f) => f.id));
      const newOrder = slideOrder.filter((id) => existingIds.has(id));
      frames.forEach((f) => {
        if (!newOrder.includes(f.id)) {
          newOrder.push(f.id);
        }
      });
      setSlideOrder(newOrder);
    }
  }, [frames]);

  const handleSlideSelect = useCallback(
    (frameId: string) => {
      const frameIndex = slideOrder.indexOf(frameId);
      if (frameIndex >= 0) {
        setAppState({ currentSlideIndex: frameIndex });

        const frame = frames.find((f) => f.id === frameId);
        if (frame && app) {
          const frameElements = getFrameChildren(
            elements as readonly NonDeletedExcalidrawElement[],
            frameId,
          );
          if (frameElements.length > 0) {
            (app as any).scene.scrollToContent([frame], { fitToContent: true });
          }
        }
      }
    },
    [slideOrder, frames, elements, appState, setAppState, app],
  );

  const handleStartPresentation = useCallback(() => {
    setAppState({ presentationModeEnabled: true });
  }, [setAppState]);

  const handleExportSlides = useCallback(() => {
    setAppState({ openDialog: { name: "slidesExport" as any } });
  }, [setAppState]);

  const handleCreateSlide = useCallback(() => {
    (app as any).setActiveTool({ type: "frame" });
  }, [app]);

  const orderedFrames = useMemo(() => {
    return slideOrder
      .map((id) => frames.find((f) => f.id === id))
      .filter((f): f is ExcalidrawFrameLikeElement => f !== undefined);
  }, [slideOrder, frames]);

  const files = (app as any).files || {};

  if (frames.length === 0) {
    return (
      <div className="presentation-sidebar presentation-sidebar--empty">
        <div className="presentation-sidebar__empty">
          <p>{t("presentation.noSlides")}</p>
          <button
            className="presentation-sidebar__create-button"
            onClick={handleCreateSlide}
          >
            {t("presentation.createSlide")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="presentation-sidebar">
      <div className="presentation-sidebar__header">
        <span className="presentation-sidebar__title">
          {t("presentation.title")}
        </span>
        <span className="presentation-sidebar__counter">
          {appState.currentSlideIndex + 1} / {orderedFrames.length}
        </span>
      </div>

      <div className="presentation-sidebar__actions">
        <button
          className="presentation-sidebar__button"
          onClick={handleCreateSlide}
        >
          {t("presentation.newSlide")}
        </button>
        <button
          className="presentation-sidebar__button presentation-sidebar__button--primary"
          onClick={handleExportSlides}
        >
          {t("presentation.export")}
        </button>
      </div>

      <div className="presentation-sidebar__slides">
        <div className="presentation-sidebar__grid">
          {orderedFrames.map((frame, index) => (
            <SlideThumbnail
              key={frame.id}
              frame={frame}
              index={index}
              elements={elements as readonly NonDeletedExcalidrawElement[]}
              files={files}
              appState={appState}
              onSelect={() => handleSlideSelect(frame.id)}
              isSelected={index === appState.currentSlideIndex}
            />
          ))}
        </div>
      </div>

      <div className="presentation-sidebar__footer">
        <button
          className="presentation-sidebar__start-button"
          onClick={handleStartPresentation}
        >
          {t("presentation.startPresentation")}
        </button>
      </div>
    </div>
  );
};
