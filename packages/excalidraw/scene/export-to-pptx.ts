import pptxgen from "pptxgenjs";
import {
  getNonDeletedElements,
  isFrameLikeElement,
  getFrameLikeTitle,
  getFrameChildren,
  getBoundTextElement,
} from "@excalidraw/element";
import { arrayToMap } from "@excalidraw/common";

import type { ExcalidrawElement } from "@excalidraw/element/types";

import { exportToCanvas } from "./export";

import type { AppState, BinaryFiles } from "../types";

const SLIDE_WIDTH = 10;
const SLIDE_HEIGHT = 7.5;

const toHex = (color: string) => {
  if (!color || color === "transparent") {
    return "";
  }
  return color.replace("#", "").substring(0, 6);
};

export const exportToPPTX = async (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
  exportOptions?: {
    orderedFrameIds?: string[];
    exportStyle?: "hand-drawn" | "vector";
  },
) => {
  const pres = new pptxgen();
  const allElements = getNonDeletedElements(elements);
  const elementsMap = arrayToMap(allElements);
  const exportStyle = exportOptions?.exportStyle ?? "vector";

  let frames = allElements.filter((element) => isFrameLikeElement(element));

  if (exportOptions?.orderedFrameIds) {
    const orderMap = new Map(
      exportOptions.orderedFrameIds.map((id, index) => [id, index]),
    );
    frames = frames
      .filter((f) => orderMap.has(f.id))
      .sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);
  } else {
    frames = frames.sort((a, b) => {
      if (a.y === b.y) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });
  }

  if (frames.length === 0) {
    throw new Error("No frames found to export");
  }

  for (const frame of frames) {
    const slide = pres.addSlide();

    // Calculate scale to fit frame into slide while maintaining aspect ratio
    const scale = Math.min(
      SLIDE_WIDTH / frame.width,
      SLIDE_HEIGHT / frame.height,
    );

    // Center frame on slide
    const offsetX = (SLIDE_WIDTH - frame.width * scale) / 2;
    const offsetY = (SLIDE_HEIGHT - frame.height * scale) / 2;

    const frameElements = getFrameChildren(allElements, frame.id);

    // Add slide title if available
    const name = getFrameLikeTitle(frame);
    if (name) {
      slide.addText(name, {
        x: offsetX,
        y: 0,
        w: frame.width * scale,
        h: Math.max(offsetY, 0.4),
        fontSize: 18,
        align: "center",
        color: "999999",
      });
    }

    const mapCoords = (x: number, y: number, w: number, h: number) => ({
      x: offsetX + (x - frame.x) * scale,
      y: offsetY + (y - frame.y) * scale,
      w: w * scale,
      h: h * scale,
    });

    for (const element of frameElements) {
      const coords = mapCoords(
        element.x,
        element.y,
        element.width,
        element.height,
      );
      const commonProps: any = {
        ...coords,
        rotate: (element.angle * 180) / Math.PI,
        transparency: 100 - element.opacity,
      };

      if (
        element.type === "rectangle" ||
        element.type === "ellipse" ||
        element.type === "diamond" ||
        element.type === "line" ||
        element.type === "arrow" ||
        element.type === "freedraw"
      ) {
        // If hand-drawn style and sketchy, rasterize the individual element
        const isSketchy = (element as any).roughness > 0;
        if (
          exportStyle === "hand-drawn" &&
          (isSketchy || element.type === "freedraw")
        ) {
          try {
            const canvas = await exportToCanvas([element], appState, files, {
              exportBackground: false,
              viewBackgroundColor: appState.viewBackgroundColor,
              exportPadding: 0,
            });
            slide.addImage({
              data: canvas.toDataURL("image/png"),
              ...coords,
              rotate: (element.angle * 180) / Math.PI,
            });
            continue;
          } catch (e) {
            console.error(`Failed to rasterize element ${element.id}`, e);
          }
        }

        if (
          element.type === "rectangle" ||
          element.type === "ellipse" ||
          element.type === "diamond"
        ) {
          const shapeType =
            element.type === "rectangle"
              ? pres.ShapeType.rect
              : element.type === "ellipse"
              ? pres.ShapeType.ellipse
              : pres.ShapeType.diamond;

          const boundText = getBoundTextElement(element, elementsMap);
          const props: any = {
            ...commonProps,
            fill:
              element.backgroundColor !== "transparent"
                ? { color: toHex(element.backgroundColor) }
                : undefined,
            line: {
              color: toHex(element.strokeColor),
              width: element.strokeWidth * 0.75, // pxl to pt conversion approx
              dashType:
                element.strokeStyle === "dashed"
                  ? "dash"
                  : element.strokeStyle === "dotted"
                  ? "sysDot"
                  : "solid",
            },
          };

          if (boundText) {
            slide.addText(boundText.text, {
              ...props,
              shape: shapeType,
              align: boundText.textAlign,
              valign:
                boundText.verticalAlign === "middle"
                  ? "middle"
                  : boundText.verticalAlign === "bottom"
                  ? "bottom"
                  : "top",
              fontSize: boundText.fontSize,
              fontFace:
                boundText.fontFamily === 1
                  ? "Comic Sans MS"
                  : boundText.fontFamily === 3
                  ? "Courier New"
                  : "Arial",
              color: toHex(boundText.strokeColor),
            });
          } else {
            slide.addShape(shapeType, props);
          }
        } else if (element.type === "line" || element.type === "arrow") {
          slide.addShape(pres.ShapeType.line, {
            ...commonProps,
            line: {
              color: toHex(element.strokeColor),
              width: element.strokeWidth * 0.75,
              dashType:
                element.strokeStyle === "dashed"
                  ? "dash"
                  : element.strokeStyle === "dotted"
                  ? "sysDot"
                  : "solid",
              beginArrowType:
                element.type === "arrow" && element.startArrowhead
                  ? "arrow"
                  : "none",
              endArrowType:
                element.type === "arrow" && element.endArrowhead
                  ? "arrow"
                  : "none",
            },
            flipH: element.width < 0,
            flipV: element.height < 0,
          });
        }
      } else if (element.type === "text") {
        // Skip if it's a bound text (already handled by container)
        if (element.containerId && elementsMap.has(element.containerId)) {
          continue;
        }

        slide.addText(element.text, {
          ...commonProps,
          align: element.textAlign,
          valign:
            element.verticalAlign === "middle"
              ? "middle"
              : element.verticalAlign === "bottom"
              ? "bottom"
              : "top",
          fontSize: element.fontSize,
          fontFace:
            element.fontFamily === 1
              ? "Comic Sans MS"
              : element.fontFamily === 3
              ? "Courier New"
              : "Arial",
          color: toHex(element.strokeColor),
        });
      } else if (element.type === "image") {
        const fileData = element.fileId ? files[element.fileId] : null;
        if (fileData) {
          slide.addImage({
            data: fileData.dataURL,
            ...coords,
            rotate: (element.angle * 180) / Math.PI,
          });
        }
      } else {
        // Fallback for complex elements (freedraw, iframe, etc.)
        try {
          const canvas = await exportToCanvas([element], appState, files, {
            exportBackground: false,
            viewBackgroundColor: appState.viewBackgroundColor,
            exportPadding: 0,
          });
          slide.addImage({
            data: canvas.toDataURL("image/png"),
            ...coords,
            rotate: (element.angle * 180) / Math.PI,
          });
        } catch (e) {
          console.error(
            `Failed to export element ${element.id} of type ${element.type}`,
            e,
          );
        }
      }
    }
  }

  pres.writeFile({ fileName: `excalidraw-export-${Date.now()}.pptx` });
};
