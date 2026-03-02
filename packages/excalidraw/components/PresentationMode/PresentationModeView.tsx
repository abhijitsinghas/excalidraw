import React, { useState, useEffect, useRef, useCallback } from "react";
import type { PresentationSlide } from "../../hooks/usePresentationSlides";
import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { AppState } from "../../types";
import type { BinaryFiles } from "../../types";
import { PresentationModeMenuBar } from "./PresentationModeMenuBar";

export interface PresentationModeViewProps {
  slides: PresentationSlide[];
  appState: AppState;
  elements: readonly ExcalidrawElement[];
  binaryFiles: BinaryFiles;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onExit: () => void;
  onSlideChange?: (slideIndex: number) => void;
  onRenderSlide: (
    frameId: string,
    canvasContext: CanvasRenderingContext2D,
  ) => Promise<void>;
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

  // Handle slide navigation
  const handleNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      const newIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [currentSlideIndex, slides.length, onSlideChange]);

  const handlePrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [currentSlideIndex, onSlideChange]);

  const handleToggleLaserPointer = useCallback(() => {
    setLaserPointerActive((prev) => !prev);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextSlide, handlePrevSlide, onExit]);

  // Render the current slide
  useEffect(() => {
    if (!currentSlide || !canvasRefInternal.current) {
      return;
    }

    const canvas = canvasRefInternal.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear canvas with black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Call the render callback
    onRenderSlide(currentSlide.id, ctx);
  }, [currentSlide, onRenderSlide]);

  return (
    <div ref={containerRef} className="presentation-mode" role="presentation">
      {/* Canvas for rendering slides */}
      <div className="presentation-mode__canvas-wrapper">
        <canvas ref={canvasRefInternal} className="presentation-mode__canvas" />
      </div>

      {/* Menu bar */}
      <PresentationModeMenuBar
        currentSlide={currentSlideIndex}
        totalSlides={slides.length}
        onNextSlide={handleNextSlide}
        onPrevSlide={handlePrevSlide}
        onExit={onExit}
        laserPointerActive={laserPointerActive}
        onToggleLaserPointer={handleToggleLaserPointer}
      />
    </div>
  );
};
