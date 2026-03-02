import React from "react";
import { vi } from "vitest";
import { render, screen, fireEvent } from "../../tests/test-utils";
import { ExportOptions } from "./ExportOptions";
import type { ExportSettings } from "./types";

describe("ExportOptions", () => {
  const defaultSettings: ExportSettings = {
    format: "pdf",
    quality: "high",
    compression: 80,
    pdfMode: "screen",
    preserveAnimations: false,
    exportMode: "vectors",
    preserveHandDrawn: false,
  };

  const mockOnSettingsChange = vi.fn();

  describe("format selection", () => {
    it("renders PDF and PPTX radio buttons", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      expect(screen.getByLabelText("PDF")).toBeInTheDocument();
      expect(screen.getByLabelText("PPTX")).toBeInTheDocument();
    });

    it("calls onSettingsChange when format is changed to PPTX", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      const pptxRadio = screen.getByLabelText("PPTX");
      fireEvent.click(pptxRadio);

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        format: "pptx",
      });
    });
  });

  describe("PDF options", () => {
    it("shows PDF mode options when PDF is selected", () => {
      render(
        <ExportOptions
          settings={{ ...defaultSettings, format: "pdf" }}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      expect(screen.getByLabelText("Screen Viewing")).toBeInTheDocument();
      expect(screen.getByLabelText("Print Optimized")).toBeInTheDocument();
    });

    it("calls onSettingsChange when PDF mode is changed", () => {
      render(
        <ExportOptions
          settings={{ ...defaultSettings, format: "pdf" }}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      const printRadio = screen.getByLabelText("Print Optimized");
      fireEvent.click(printRadio);

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        pdfMode: "print",
      });
    });
  });

  describe("PPTX options", () => {
    it("shows preserve animations checkbox when PPTX is selected", () => {
      render(
        <ExportOptions
          settings={{ ...defaultSettings, format: "pptx" }}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      expect(screen.getByLabelText("Preserve Animations")).toBeInTheDocument();
    });

    it("calls onSettingsChange when preserve animations is toggled", () => {
      render(
        <ExportOptions
          settings={{ ...defaultSettings, format: "pptx" }}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      const checkbox = screen.getByLabelText("Preserve Animations");
      fireEvent.click(checkbox);

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        format: "pptx",
        preserveAnimations: true,
      });
    });
  });

  describe("quality selection", () => {
    it("renders quality dropdown with presets", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      const qualitySelect = screen.getByDisplayValue("High (2x)");
      expect(qualitySelect).toBeInTheDocument();
    });

    it("calls onSettingsChange when quality is changed", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      const qualitySelect = screen.getByDisplayValue("High (2x)");
      fireEvent.change(qualitySelect, { target: { value: "low" } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        quality: "low",
      });
    });
  });

  describe("compression slider", () => {
    it("renders compression slider with default value", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      const slider = screen.getByRole("slider");
      expect(slider).toHaveValue("80");
    });

    it("displays current compression value", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("calls onSettingsChange when compression slider is moved", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "60" } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        compression: 60,
      });
    });
  });

  describe("export mode", () => {
    it("renders vectors and rasterized radio buttons", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      expect(screen.getByLabelText("Vectors")).toBeInTheDocument();
      expect(screen.getByLabelText("Rasterized")).toBeInTheDocument();
    });

    it("calls onSettingsChange when export mode is changed", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      const rasterizedRadio = screen.getByLabelText("Rasterized");
      fireEvent.click(rasterizedRadio);

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        exportMode: "rasterized",
      });
    });
  });

  describe("hand-drawn shapes preservation", () => {
    it("renders preserve hand-drawn checkbox", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      expect(
        screen.getByLabelText("Preserve Hand-Drawn Shapes"),
      ).toBeInTheDocument();
    });

    it("shows help text for hand-drawn preservation", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      expect(
        screen.getByText(
          "Hand-drawn shapes exported as images, text remains selectable",
        ),
      ).toBeInTheDocument();
    });

    it("calls onSettingsChange when preserve hand-drawn is toggled", () => {
      render(
        <ExportOptions
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      const checkbox = screen.getByLabelText("Preserve Hand-Drawn Shapes");
      fireEvent.click(checkbox);

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        preserveHandDrawn: true,
      });
    });
  });
});
