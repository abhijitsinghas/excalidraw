import React from "react";

export interface PresentationModeMenuBarProps {
  currentSlide: number;
  totalSlides: number;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onExit: () => void;
  laserPointerActive: boolean;
  onToggleLaserPointer: () => void;
}

export const PresentationModeMenuBar: React.FC<
  PresentationModeMenuBarProps
> = ({
  currentSlide,
  totalSlides,
  onNextSlide,
  onPrevSlide,
  onExit,
  laserPointerActive,
  onToggleLaserPointer,
}) => {
  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === totalSlides - 1;

  return (
    <div className="presentation-mode__menu-bar">
      {/* Left section: Navigation */}
      <div className="presentation-mode__menu-section presentation-mode__menu-section--left">
        <button
          className="presentation-mode__nav-button presentation-mode__nav-button--prev"
          onClick={onPrevSlide}
          disabled={isFirstSlide}
          aria-label="Previous slide"
          title="Previous slide (← or ←arrow)"
        >
          ←
        </button>

        <span className="presentation-mode__slide-counter">
          Slide {currentSlide + 1}/{totalSlides}
        </span>

        <button
          className="presentation-mode__nav-button presentation-mode__nav-button--next"
          onClick={onNextSlide}
          disabled={isLastSlide}
          aria-label="Next slide"
          title="Next slide (→ or Space)"
        >
          →
        </button>
      </div>

      {/* Center section: Laser pointer */}
      <div className="presentation-mode__menu-section presentation-mode__menu-section--center">
        <button
          className={`presentation-mode__laser-button ${
            laserPointerActive ? "presentation-mode__laser-button--active" : ""
          }`}
          onClick={onToggleLaserPointer}
          aria-label="Toggle laser pointer"
          title="Toggle laser pointer (L)"
        >
          <span className="presentation-mode__laser-indicator"></span>
          Laser
        </button>
      </div>

      {/* Right section: Exit */}
      <div className="presentation-mode__menu-section presentation-mode__menu-section--right">
        <button
          className="presentation-mode__exit-button"
          onClick={onExit}
          aria-label="Exit presentation"
          title="Exit presentation (Escape)"
        >
          Exit Presentation
        </button>
      </div>
    </div>
  );
};
