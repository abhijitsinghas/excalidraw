import React from "react";
import { vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "../../tests/test-utils";
import { ExportDialog } from "./ExportDialog";
import type { PresentationSlide } from "../../hooks/usePresentationSlides";

describe("ExportDialog", () => {
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
  ];

  let mockHandlers: {
    onClose: ReturnType<typeof vi.fn>;
    onExport: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHandlers = {
      onClose: vi.fn(),
      onExport: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe("rendering", () => {
    it("renders dialog with title and close button", () => {
      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      expect(screen.getByText("Export Presentation")).toBeInTheDocument();
      const closeButton = screen.getByLabelText("Close");
      expect(closeButton).toBeInTheDocument();
    });

    it("renders Cancel and Export buttons in footer", () => {
      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Export" }),
      ).toBeInTheDocument();
    });

    it("renders slide list panel and options panel", () => {
      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      // Check for slides header and format options
      expect(screen.getByText("Slides")).toBeInTheDocument();
      expect(screen.getByText("Format")).toBeInTheDocument();
    });
  });

  describe("dialog interactions", () => {
    it("calls onClose when close button is clicked", () => {
      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      const closeButton = screen.getByLabelText("Close");
      fireEvent.click(closeButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    it("calls onClose when Cancel button is clicked", () => {
      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    it("disables Export button if no slides are selected", () => {
      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      const exportButton = screen.getByRole("button", { name: "Export" });
      expect(exportButton).toBeDisabled();
    });
  });

  describe("export functionality", () => {
    it("calls onExport with selected slides and settings when Export is clicked", async () => {
      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      // First, select some slides
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      const exportButton = screen.getByRole("button", { name: "Export" });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockHandlers.onExport).toHaveBeenCalled();
      });

      const callArgs = mockHandlers.onExport.mock.calls[0];
      expect(callArgs[0]).toEqual([mockSlides[0]]); // Only first slide selected
      expect(callArgs[1]).toHaveProperty("format");
      expect(callArgs[1]).toHaveProperty("quality");
      expect(callArgs[1]).toHaveProperty("compression");
    });

    it("shows loading state during export", async () => {
      mockHandlers.onExport.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      const exportButton = screen.getByRole("button", { name: "Export" });
      fireEvent.click(exportButton);

      // Check for loading state (button text changes)
      await waitFor(() => {
        const button = screen.getByRole("button", { name: "Exporting..." });
        expect(button).toBeDisabled();
      });
    });

    it("closes dialog after successful export", async () => {
      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      const exportButton = screen.getByRole("button", { name: "Export" });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockHandlers.onClose).toHaveBeenCalled();
      });
    });

    it("handles export error gracefully", async () => {
      const exportError = new Error("Export failed");
      mockHandlers.onExport.mockRejectedValueOnce(exportError);

      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      const exportButton = screen.getByRole("button", { name: "Export" });
      fireEvent.click(exportButton);

      await waitFor(() => {
        // Dialog should stay open on error
        expect(screen.getByText("Export Presentation")).toBeInTheDocument();
      });

      // onClose should not have been called
      expect(mockHandlers.onClose).not.toHaveBeenCalled();
    });
  });

  describe("overlay", () => {
    it("renders semi-transparent dark overlay", () => {
      render(<ExportDialog slides={mockSlides} {...mockHandlers} />);

      const overlay = screen
        .getByText("Export Presentation")
        .closest(".export-dialog-overlay");
      expect(overlay).toBeInTheDocument();
    });
  });
});
