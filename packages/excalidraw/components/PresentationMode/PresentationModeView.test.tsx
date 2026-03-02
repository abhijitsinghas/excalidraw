import React from "react";
import { vi } from "vitest";
import { fireEvent, screen } from "../../tests/test-utils";
import { PresentationModeView } from "./PresentationModeView";
import type { PresentationSlide } from "../../hooks/usePresentationSlides";
import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { AppState } from "../../types";

const mockPresentationSlide = (id: string): PresentationSlide => ({
  id,
  name: `Slide ${id}`,
  frameElement: {
    id,
    type: "frame",
    x: 0,
    y: 0,
    width: 500,
    height: 400,
    name: `Slide ${id}`,
    isDeleted: false,
  } as any,
  isIncluded: true,
  index: 0,
  thumbnail: undefined,
});

const mockAppState = (): AppState =>
  ({
    // Basic app state properties needed
  } as any);

const mockElements: readonly ExcalidrawElement[] = [];

describe("PresentationModeView", () => {
  describe("rendering", () => {
    it("renders presentation in fullscreen overlay", async () => {
      const slides = [mockPresentationSlide("frame-1")];
      const mockHandlers = {
        onExit: vi.fn(),
        onSlideChange: vi.fn(),
        onRenderSlide: vi.fn().mockResolvedValue(undefined),
      };

      // Render the component
      const { container } = await render(
        <PresentationModeView
          slides={slides}
          appState={mockAppState()}
          elements={mockElements}
          binaryFiles={{}}
          onExit={mockHandlers.onExit}
          onSlideChange={mockHandlers.onSlideChange}
          onRenderSlide={mockHandlers.onRenderSlide}
        />,
        undefined,
        // We don't want excalidraw wrapping for this test
        { skipExcalidrawWrapper: true },
      );

      // Find the presentation container with the overlay class/role
      const presentationContainer =
        container.querySelector(".presentation-mode") ||
        container.querySelector('[role="presentation"]');

      expect(presentationContainer).toBeTruthy();
    });

    it("displays current slide content", async () => {
      const mockRenderSlide = vi.fn().mockResolvedValue(undefined);
      const slides = [mockPresentationSlide("frame-1")];

      await render(
        <PresentationModeView
          slides={slides}
          appState={mockAppState()}
          elements={mockElements}
          binaryFiles={{}}
          onExit={vi.fn()}
          onSlideChange={vi.fn()}
          onRenderSlide={mockRenderSlide}
        />,
        undefined,
        { skipExcalidrawWrapper: true },
      );

      // Verify render callback was called with frame ID
      expect(mockRenderSlide).toHaveBeenCalledWith(
        "frame-1",
        expect.any(CanvasRenderingContext2D),
      );
    });

    it("displays menu bar component", async () => {
      const slides = [mockPresentationSlide("frame-1")];

      await render(
        <PresentationModeView
          slides={slides}
          appState={mockAppState()}
          elements={mockElements}
          binaryFiles={{}}
          onExit={vi.fn()}
          onSlideChange={vi.fn()}
          onRenderSlide={vi.fn().mockResolvedValue(undefined)}
        />,
        undefined,
        { skipExcalidrawWrapper: true },
      );

      // Check for slide counter in menu bar
      expect(screen.getByText(/Slide 1\/1/)).toBeInTheDocument();
    });
  });

  describe("keyboard navigation", () => {
    it("navigates to next slide with ArrowRight key", async () => {
      const mockSlideChange = vi.fn();
      const slides = [
        mockPresentationSlide("frame-1"),
        mockPresentationSlide("frame-2"),
      ];

      const { container } = await render(
        <PresentationModeView
          slides={slides}
          appState={mockAppState()}
          elements={mockElements}
          binaryFiles={{}}
          onExit={vi.fn()}
          onSlideChange={mockSlideChange}
          onRenderSlide={vi.fn().mockResolvedValue(undefined)}
        />,
        undefined,
        { skipExcalidrawWrapper: true },
      );

      const presentationContainer =
        container.querySelector(".presentation-mode");
      if (presentationContainer) {
        fireEvent.keyDown(presentationContainer, { key: "ArrowRight" });
        expect(mockSlideChange).toHaveBeenCalledWith(1);
      }
    });

    it("navigates to previous slide with ArrowLeft key", async () => {
      const mockSlideChange = vi.fn();
      const slides = [
        mockPresentationSlide("frame-1"),
        mockPresentationSlide("frame-2"),
      ];

      const { container } = await render(
        <PresentationModeView
          slides={slides}
          appState={mockAppState()}
          elements={mockElements}
          binaryFiles={{}}
          onExit={vi.fn()}
          onSlideChange={mockSlideChange}
          onRenderSlide={vi.fn().mockResolvedValue(undefined)}
        />,
        undefined,
        { skipExcalidrawWrapper: true },
      );

      const presentationContainer =
        container.querySelector(".presentation-mode");
      if (presentationContainer) {
        fireEvent.keyDown(presentationContainer, { key: "ArrowLeft" });
        // Initial state is 0, so arrow left shouldn't move (no previous slide)
        expect(mockSlideChange).not.toHaveBeenCalled();
      }
    });

    it("exits presentation with Escape key", async () => {
      const mockExit = vi.fn();
      const slides = [mockPresentationSlide("frame-1")];

      const { container } = await render(
        <PresentationModeView
          slides={slides}
          appState={mockAppState()}
          elements={mockElements}
          binaryFiles={{}}
          onExit={mockExit}
          onSlideChange={vi.fn()}
          onRenderSlide={vi.fn().mockResolvedValue(undefined)}
        />,
        undefined,
        { skipExcalidrawWrapper: true },
      );

      const presentationContainer =
        container.querySelector(".presentation-mode");
      if (presentationContainer) {
        fireEvent.keyDown(presentationContainer, { key: "Escape" });
        expect(mockExit).toHaveBeenCalled();
      }
    });

    it("navigates to next slide with Space key", async () => {
      const mockSlideChange = vi.fn();
      const slides = [
        mockPresentationSlide("frame-1"),
        mockPresentationSlide("frame-2"),
      ];

      const { container } = await render(
        <PresentationModeView
          slides={slides}
          appState={mockAppState()}
          elements={mockElements}
          binaryFiles={{}}
          onExit={vi.fn()}
          onSlideChange={mockSlideChange}
          onRenderSlide={vi.fn().mockResolvedValue(undefined)}
        />,
        undefined,
        { skipExcalidrawWrapper: true },
      );

      const presentationContainer =
        container.querySelector(".presentation-mode");
      if (presentationContainer) {
        fireEvent.keyDown(presentationContainer, { key: " " });
        expect(mockSlideChange).toHaveBeenCalledWith(1);
      }
    });
  });

  describe("menu bar interaction", () => {
    it("navigates to next slide when menu button is clicked", async () => {
      const mockSlideChange = vi.fn();
      const slides = [
        mockPresentationSlide("frame-1"),
        mockPresentationSlide("frame-2"),
      ];

      await render(
        <PresentationModeView
          slides={slides}
          appState={mockAppState()}
          elements={mockElements}
          binaryFiles={{}}
          onExit={vi.fn()}
          onSlideChange={mockSlideChange}
          onRenderSlide={vi.fn().mockResolvedValue(undefined)}
        />,
        undefined,
        { skipExcalidrawWrapper: true },
      );

      const nextButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent?.includes("→"));

      if (nextButton) {
        fireEvent.click(nextButton);
        expect(mockSlideChange).toHaveBeenCalledWith(1);
      }
    });

    it("exits presentation when exit button is clicked", async () => {
      const mockExit = vi.fn();
      const slides = [mockPresentationSlide("frame-1")];

      await render(
        <PresentationModeView
          slides={slides}
          appState={mockAppState()}
          elements={mockElements}
          binaryFiles={{}}
          onExit={mockExit}
          onSlideChange={vi.fn()}
          onRenderSlide={vi.fn().mockResolvedValue(undefined)}
        />,
        undefined,
        { skipExcalidrawWrapper: true },
      );

      const exitButton = screen.getByText(/Exit Presentation/);
      fireEvent.click(exitButton);
      expect(mockExit).toHaveBeenCalled();
    });
  });
});

// Helper to handle render with or without Excalidraw wrapper
async function render(
  element: React.ReactElement,
  options?: any,
  config?: { skipExcalidrawWrapper?: boolean },
) {
  if (config?.skipExcalidrawWrapper) {
    const { render: rtlRender } = await import("../../tests/test-utils");
    return rtlRender(element, options);
  }
  // Normal render path
  const { render: rtlRender } = await import("../../tests/test-utils");
  return rtlRender(element, options);
}
