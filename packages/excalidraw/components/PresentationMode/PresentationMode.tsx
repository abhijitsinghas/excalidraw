import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getFrameLikeElements, getFrameChildren } from "@excalidraw/element";

import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

import {
  useExcalidrawAppState,
  useExcalidrawElements,
  useExcalidrawSetAppState,
  useApp,
} from "../App";
import { t } from "../../i18n";

import "./PresentationMode.scss";

export const PresentationMode = () => {
  const appState = useExcalidrawAppState();
  const elements = useExcalidrawElements();
  const setAppState = useExcalidrawSetAppState();
  const app = useApp();

  const frames = useMemo(() => {
    return getFrameLikeElements(
      elements as readonly NonDeletedExcalidrawElement[],
    );
  }, [elements]);

  const [slideOrder] = useState<string[]>(() => {
    return frames.map((f) => f.id);
  });

  const currentFrame = useMemo(() => {
    if (
      appState.currentSlideIndex >= 0 &&
      appState.currentSlideIndex < slideOrder.length
    ) {
      const frameId = slideOrder[appState.currentSlideIndex];
      return frames.find((f) => f.id === frameId);
    }
    return null;
  }, [appState.currentSlideIndex, slideOrder, frames]);

  const goToNextSlide = useCallback(() => {
    if (appState.currentSlideIndex < slideOrder.length - 1) {
      setAppState({ currentSlideIndex: appState.currentSlideIndex + 1 });
    }
  }, [appState.currentSlideIndex, slideOrder.length, setAppState]);

  const goToPrevSlide = useCallback(() => {
    if (appState.currentSlideIndex > 0) {
      setAppState({ currentSlideIndex: appState.currentSlideIndex - 1 });
    }
  }, [appState.currentSlideIndex, setAppState]);

  const exitPresentation = useCallback(() => {
    setAppState({ presentationModeEnabled: false });
  }, [setAppState]);

  const toggleLaser = useCallback(() => {
    setAppState({ laserPointerEnabled: !appState.laserPointerEnabled });
    if (!appState.laserPointerEnabled) {
      (app as any).setActiveTool({ type: "laser" });
    } else {
      (app as any).setActiveTool({ type: "selection" });
    }
  }, [appState.laserPointerEnabled, setAppState, app]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
        case " ":
          event.preventDefault();
          goToNextSlide();
          break;
        case "ArrowLeft":
          event.preventDefault();
          goToPrevSlide();
          break;
        case "Escape":
          event.preventDefault();
          exitPresentation();
          break;
        case "l":
        case "L":
          event.preventDefault();
          toggleLaser();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, exitPresentation, toggleLaser]);

  useEffect(() => {
    if (currentFrame) {
      const frameElements = getFrameChildren(
        elements as readonly NonDeletedExcalidrawElement[],
        currentFrame.id,
      );
      if (frameElements.length > 0) {
        (app as any).scene.scrollToContent([currentFrame], {
          fitToContent: true,
        });
      }
    }
  }, [appState.currentSlideIndex, currentFrame, elements, app]);

  const handleClick = useCallback(() => {
    goToNextSlide();
  }, [goToNextSlide]);

  if (!appState.presentationModeEnabled) {
    return null;
  }

  return (
    <div className="presentation-mode" onClick={handleClick}>
      <div className="presentation-mode__content">
        {currentFrame && (
          <div className="presentation-mode__frame-label">
            {currentFrame.name || `Slide ${appState.currentSlideIndex + 1}`}
          </div>
        )}
      </div>

      <div className="presentation-mode__nav-bar">
        <button
          className="presentation-mode__nav-button"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevSlide();
          }}
          disabled={appState.currentSlideIndex === 0}
        >
          {t("presentation.previous")}
        </button>

        <span className="presentation-mode__counter">
          {appState.currentSlideIndex + 1} / {slideOrder.length}
        </span>

        <button
          className={`presentation-mode__laser-button ${
            appState.laserPointerEnabled
              ? "presentation-mode__laser-button--active"
              : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleLaser();
          }}
        >
          {t("presentation.laser")}
        </button>

        <button
          className="presentation-mode__nav-button presentation-mode__nav-button--primary"
          onClick={(e) => {
            e.stopPropagation();
            goToNextSlide();
          }}
          disabled={appState.currentSlideIndex === slideOrder.length - 1}
        >
          {t("presentation.next")}
        </button>

        <button
          className="presentation-mode__exit-button"
          onClick={(e) => {
            e.stopPropagation();
            exitPresentation();
          }}
        >
          {t("presentation.exit")}
        </button>
      </div>
    </div>
  );
};
