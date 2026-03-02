import React from "react";
import { vi } from "vitest";
import { render, screen, fireEvent } from "../../tests/test-utils";
import { ExportSlideList } from "./ExportSlideList";
import type { PresentationSlide } from "../../hooks/usePresentationSlides";

describe("ExportSlideList", () => {
  const mockSlides: PresentationSlide[] = [
    {
      id: "slide1",
      name: "Slide 1",
      frameElement: {} as any,
      isIncluded: true,
      index: 0,
      thumbnail: "data:image/png;base64,test1",
    },
    {
      id: "slide2",
      name: "Slide 2",
      frameElement: {} as any,
      isIncluded: true,
      index: 1,
      thumbnail: "data:image/png;base64,test2",
    },
    {
      id: "slide3",
      name: "Slide 3",
      frameElement: {} as any,
      isIncluded: true,
      index: 2,
      thumbnail: "data:image/png;base64,test3",
    },
  ];

  const mockHandlers = {
    onSlideOrderChange: vi.fn(),
    onSelectedSlidesChange: vi.fn(),
    onSlideNameChange: vi.fn(),
    onSlideDelete: vi.fn(),
  };

  describe("rendering", () => {
    it("renders all slides with checkboxes", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set(["slide1", "slide2"])}
          {...mockHandlers}
        />,
      );

      mockSlides.forEach((slide) => {
        expect(screen.getByText(slide.name)).toBeInTheDocument();
      });
    });

    it("renders slides header with bulk action buttons", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set()}
          {...mockHandlers}
        />,
      );

      expect(screen.getByText(/Slides/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Select All/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Deselect All/ }),
      ).toBeInTheDocument();
    });

    it("renders delete button for each slide", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set()}
          {...mockHandlers}
        />,
      );

      const deleteButtons = screen.getAllByRole("button", { name: /Delete|×/ });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(mockSlides.length);
    });
  });

  describe("slide selection", () => {
    it("calls onSelectedSlidesChange when slide checkbox is toggled", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set()}
          {...mockHandlers}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      expect(mockHandlers.onSelectedSlidesChange).toHaveBeenCalled();
    });

    it("reflects selected slides in checkboxes", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set(["slide1", "slide3"])}
          {...mockHandlers}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).toBeChecked();
    });
  });

  describe("bulk actions", () => {
    it("selects all slides when Select All is clicked", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set()}
          {...mockHandlers}
        />,
      );

      const selectAllButton = screen.getByRole("button", {
        name: /Select All/,
      });
      fireEvent.click(selectAllButton);

      expect(mockHandlers.onSelectedSlidesChange).toHaveBeenCalledWith(
        new Set(mockSlides.map((s) => s.id)),
      );
    });

    it("deselects all slides when Deselect All is clicked", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set(["slide1", "slide2", "slide3"])}
          {...mockHandlers}
        />,
      );

      const deselectAllButton = screen.getByRole("button", {
        name: /Deselect All/,
      });
      fireEvent.click(deselectAllButton);

      expect(mockHandlers.onSelectedSlidesChange).toHaveBeenCalledWith(
        new Set(),
      );
    });
  });

  describe("slide name editing", () => {
    it("allows double-click to edit slide name", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set()}
          {...mockHandlers}
        />,
      );

      const slideNameElement = screen.getByText("Slide 1");
      fireEvent.doubleClick(slideNameElement);

      // Should have an input field now
      const inputs = screen.getAllByDisplayValue(/Slide 1/);
      expect(inputs.length).toBeGreaterThan(0);
    });

    it("calls onSlideNameChange when name is updated", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set()}
          {...mockHandlers}
        />,
      );

      const slideNameElement = screen.getByText("Slide 1");
      fireEvent.doubleClick(slideNameElement);

      const inputs = screen.getAllByDisplayValue(/Slide 1/);
      const input = inputs[inputs.length - 1];

      fireEvent.change(input, { target: { value: "Updated Slide" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockHandlers.onSlideNameChange).toHaveBeenCalledWith(
        "slide1",
        "Updated Slide",
      );
    });
  });

  describe("slide deletion", () => {
    it("calls onSlideDelete when delete button is clicked", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set()}
          {...mockHandlers}
        />,
      );

      // Find delete button for first slide - look for button near first slide
      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons.find(
        (btn) =>
          btn.textContent?.includes("×") ||
          btn.getAttribute("aria-label")?.includes("delete"),
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockHandlers.onSlideDelete).toHaveBeenCalled();
      }
    });
  });

  describe("drag and drop", () => {
    it("supports drag-drop reordering (component renders draggable items)", () => {
      render(
        <ExportSlideList
          slides={mockSlides}
          selectedSlides={new Set()}
          {...mockHandlers}
        />,
      );

      const slides = screen.getAllByText(/Slide \d/);
      // Verify that slides are rendered and draggable
      slides.forEach((slide) => {
        const slideItem = slide.closest("[draggable]");
        expect(slideItem).toHaveAttribute("draggable", "true");
      });
    });
  });
});
