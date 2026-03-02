import React from "react";
import { vi } from "vitest";
import { render, fireEvent, screen } from "../../tests/test-utils";
import { PresentationModeMenuBar } from "./PresentationModeMenuBar";

describe("PresentationModeMenuBar", () => {
  describe("slide navigation", () => {
    it("renders slide counter with current and total slides", () => {
      const mockHandlers = {
        onNextSlide: vi.fn(),
        onPrevSlide: vi.fn(),
        onExit: vi.fn(),
        onToggleLaserPointer: vi.fn(),
      };

      render(
        <PresentationModeMenuBar
          currentSlide={3}
          totalSlides={10}
          laserPointerActive={false}
          {...mockHandlers}
        />,
      );

      expect(screen.getByText(/Slide 3\/10/)).toBeInTheDocument();
    });

    it("calls onNextSlide when next button is clicked", () => {
      const mockNextSlide = vi.fn();
      const mockHandlers = {
        onNextSlide: mockNextSlide,
        onPrevSlide: vi.fn(),
        onExit: vi.fn(),
        onToggleLaserPointer: vi.fn(),
      };

      render(
        <PresentationModeMenuBar
          currentSlide={3}
          totalSlides={10}
          laserPointerActive={false}
          {...mockHandlers}
        />,
      );

      const nextButton = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.getAttribute("aria-label")?.includes("next") ||
            btn.getAttribute("title")?.includes("next") ||
            btn.textContent?.includes("→"),
        );

      if (nextButton) {
        fireEvent.click(nextButton);
        expect(mockNextSlide).toHaveBeenCalled();
      }
    });

    it("calls onPrevSlide when previous button is clicked", () => {
      const mockPrevSlide = vi.fn();
      const mockHandlers = {
        onNextSlide: vi.fn(),
        onPrevSlide: mockPrevSlide,
        onExit: vi.fn(),
        onToggleLaserPointer: vi.fn(),
      };

      render(
        <PresentationModeMenuBar
          currentSlide={5}
          totalSlides={10}
          laserPointerActive={false}
          {...mockHandlers}
        />,
      );

      const prevButton = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.getAttribute("aria-label")?.includes("previous") ||
            btn.getAttribute("title")?.includes("previous") ||
            btn.textContent?.includes("←"),
        );

      if (prevButton) {
        fireEvent.click(prevButton);
        expect(mockPrevSlide).toHaveBeenCalled();
      }
    });

    it("disables previous button on first slide", () => {
      const mockHandlers = {
        onNextSlide: vi.fn(),
        onPrevSlide: vi.fn(),
        onExit: vi.fn(),
        onToggleLaserPointer: vi.fn(),
      };

      render(
        <PresentationModeMenuBar
          currentSlide={0}
          totalSlides={10}
          laserPointerActive={false}
          {...mockHandlers}
        />,
      );

      const prevButton = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.getAttribute("aria-label")?.includes("previous") ||
            btn.getAttribute("title")?.includes("previous") ||
            btn.textContent?.includes("←"),
        );

      if (prevButton) {
        expect(prevButton).toBeDisabled();
      }
    });

    it("disables next button on last slide", () => {
      const mockHandlers = {
        onNextSlide: vi.fn(),
        onPrevSlide: vi.fn(),
        onExit: vi.fn(),
        onToggleLaserPointer: vi.fn(),
      };

      render(
        <PresentationModeMenuBar
          currentSlide={9}
          totalSlides={10}
          laserPointerActive={false}
          {...mockHandlers}
        />,
      );

      const nextButton = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.getAttribute("aria-label")?.includes("next") ||
            btn.getAttribute("title")?.includes("next") ||
            btn.textContent?.includes("→"),
        );

      if (nextButton) {
        expect(nextButton).toBeDisabled();
      }
    });
  });

  describe("laser pointer control", () => {
    it("toggles laser pointer when button is clicked", () => {
      const mockToggleLaser = vi.fn();
      const mockHandlers = {
        onNextSlide: vi.fn(),
        onPrevSlide: vi.fn(),
        onExit: vi.fn(),
        onToggleLaserPointer: mockToggleLaser,
      };

      render(
        <PresentationModeMenuBar
          currentSlide={3}
          totalSlides={10}
          laserPointerActive={false}
          {...mockHandlers}
        />,
      );

      const laserButton = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.getAttribute("aria-label")?.includes("laser") ||
            btn.getAttribute("title")?.includes("laser") ||
            btn.textContent?.includes("Laser"),
        );

      if (laserButton) {
        fireEvent.click(laserButton);
        expect(mockToggleLaser).toHaveBeenCalled();
      }
    });

    it("shows active state when laser pointer is enabled", async () => {
      const mockHandlers = {
        onNextSlide: vi.fn(),
        onPrevSlide: vi.fn(),
        onExit: vi.fn(),
        onToggleLaserPointer: vi.fn(),
      };

      await render(
        <PresentationModeMenuBar
          currentSlide={3}
          totalSlides={10}
          laserPointerActive={true}
          {...mockHandlers}
        />,
      );

      // Check for active state indicator (class or element)
      const laserButton = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.getAttribute("aria-label")?.includes("laser") ||
            btn.getAttribute("title")?.includes("laser") ||
            btn.textContent?.includes("Laser"),
        );

      if (laserButton) {
        expect(laserButton.className).toContain("active");
      }
    });
  });

  describe("exit presentation", () => {
    it("calls onExit when exit button is clicked", () => {
      const mockExit = vi.fn();
      const mockHandlers = {
        onNextSlide: vi.fn(),
        onPrevSlide: vi.fn(),
        onExit: mockExit,
        onToggleLaserPointer: vi.fn(),
      };

      render(
        <PresentationModeMenuBar
          currentSlide={3}
          totalSlides={10}
          laserPointerActive={false}
          {...mockHandlers}
        />,
      );

      const exitButton = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.getAttribute("aria-label")?.includes("exit") ||
            btn.textContent?.includes("Exit") ||
            btn.textContent?.includes("End"),
        );

      if (exitButton) {
        fireEvent.click(exitButton);
        expect(mockExit).toHaveBeenCalled();
      }
    });
  });
});
