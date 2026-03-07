import React, { useState, useEffect, useRef, useCallback } from "react";
import type { PresentationSlide } from "../../hooks/usePresentationSlides";
import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { AppState } from "../../types";
import type { BinaryFiles } from "../../types";
import { PresentationModeMenuBar } from "./PresentationModeMenuBar";
import { getNormalizedZoom } from "../../scene/normalize";
import {
  getCommonBounds,
  getElementsOverlappingFrame,
} from "@excalidraw/element";
import { exportToCanvas } from "../../scene/export";
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

export interface PresentationModeViewProps {
  slides: PresentationSlide[];
  appState: AppState;
  elements: readonly ExcalidrawElement[];
  binaryFiles: BinaryFiles;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onExit: () => void;
  onSlideChange?: (slideIndex: number) => void;
  onRenderSlide?: (
    frameId: string,
  ) => Promise<{ canvas: HTMLCanvasElement } | null>;
}

export const PresentationModeView: React.FC<PresentationModeViewProps> = ({
  slides,
  appState,
  elements,
  binaryFiles,
  canvasRef,
  onExit,
  onSlideChange,
  onRenderSlide,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [laserPointerActive, setLaserPointerActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefInternal = useRef<HTMLCanvasElement>(null);

  const currentSlide = slides[currentSlideIndex];
  const includedSlides = slides.filter((s) => s.isIncluded);
  const currentIncludedIndex = includedSlides.findIndex(
    (s) => s.id === currentSlide?.id,
  );

  // Enter fullscreen when component mounts
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Try to enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen().catch((err) => {
          console.log("Fullscreen request failed:", err);
        });
      }
    }

    // Exit fullscreen on unmount
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.log("Exit fullscreen failed:", err);
        });
      }
    };
  }, []);

  // Handle slide navigation
  const handleNextSlide = useCallback(() => {
    if (currentIncludedIndex < includedSlides.length - 1) {
      const newIndex = includedSlides[currentIncludedIndex + 1].index;
      setCurrentSlideIndex(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [currentIncludedIndex, includedSlides, onSlideChange]);

  const handlePrevSlide = useCallback(() => {
    if (currentIncludedIndex > 0) {
      const newIndex = includedSlides[currentIncludedIndex - 1].index;
      setCurrentSlideIndex(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [currentIncludedIndex, includedSlides, onSlideChange]);

  const handleToggleLaserPointer = useCallback(() => {
    setLaserPointerActive((prev) => !prev);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          handleNextSlide();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevSlide();
          break;
        case "Escape":
          e.preventDefault();
          onExit();
          break;
        default:
          break;
      }
    };

    // Use capture phase to ensure we get the event
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [handleNextSlide, handlePrevSlide, onExit]);

  // Render the current slide
  useEffect(() => {
    const renderCurrentSlide = async () => {
      if (!currentSlide || !canvasRefInternal.current) {
        return;
      }

      const canvas = canvasRefInternal.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      // Set canvas size to window size
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Get frame element
      const frameElement = currentSlide.frameElement;

      // Get elements within the frame
      const frameElements = getElementsOverlappingFrame(
        elements as NonDeletedExcalidrawElement[],
        frameElement,
      );

      if (frameElements.length === 0) {
        // No content in frame, show placeholder
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#666";
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Empty slide", width / 2, height / 2);
        return;
      }

      // Calculate bounds
      const [minX, minY, maxX, maxY] = getCommonBounds(frameElements);
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      if (contentWidth === 0 || contentHeight === 0) {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, width, height);
        return;
      }

      // Calculate zoom to fit frame in viewport with padding
      const padding = 40;
      const availableWidth = width - padding * 2;
      const availableHeight = height - padding * 2 - 60; // Leave room for menu bar

      const scaleX = availableWidth / contentWidth;
      const scaleY = availableHeight / contentHeight;
      const scale = Math.min(scaleX, scaleY, 2); // Max 2x zoom

      // Calculate centered position
      const scaledWidth = contentWidth * scale;
      const scaledHeight = contentHeight * scale;
      const offsetX = (width - scaledWidth) / 2;
      const offsetY = (height - scaledHeight) / 2 - 30; // Slight offset for menu bar

      // Create export state
      const exportAppState: AppState = {
        ...appState,
        exportScale: scale,
        scrollX: 0,
        scrollY: 0,
        zoom: { value: getNormalizedZoom(scale) },
        theme: appState.theme || "light",
        viewBackgroundColor: "#1a1a1a",
        frameRendering: {
          enabled: true,
          outline: false,
          name: false,
          clip: true,
        },
      };

      try {
        // Export frame to canvas
        const exportedCanvas = await exportToCanvas(
          frameElements as NonDeletedExcalidrawElement[],
          exportAppState,
          binaryFiles,
          {
            exportBackground: true,
            exportPadding: 0,
            viewBackgroundColor: "#1a1a1a",
            exportingFrame: frameElement,
          },
        );

        // Clear and draw
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        // Draw the exported canvas scaled
        ctx.drawImage(
          exportedCanvas,
          0,
          0,
          exportedCanvas.width,
          exportedCanvas.height,
          offsetX,
          offsetY,
          scaledWidth,
          scaledHeight,
        );
      } catch (err) {
        console.error("Error rendering slide:", err);
        // Show error placeholder
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#ff4444";
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Error rendering slide", width / 2, height / 2);
      }
    };

    renderCurrentSlide();
  }, [currentSlide, elements, appState, binaryFiles]);

  return (
    <div
      ref={containerRef}
      className="presentation-mode"
      role="presentation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Canvas for rendering slides */}
      <div
        className="presentation-mode__canvas-wrapper"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRefInternal}
          className="presentation-mode__canvas"
          style={{ display: "block" }}
        />
      </div>

      {/* Menu bar */}
      <PresentationModeMenuBar
        currentSlide={currentIncludedIndex + 1}
        totalSlides={includedSlides.length}
        onNextSlide={handleNextSlide}
        onPrevSlide={handlePrevSlide}
        onExit={onExit}
        laserPointerActive={laserPointerActive}
        onToggleLaserPointer={handleToggleLaserPointer}
      />
    </div>
  );
};
