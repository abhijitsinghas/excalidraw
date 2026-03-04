import jsPDF from "jspdf";
import {
  getNonDeletedElements,
  isFrameLikeElement,
  getFrameChildren,
  getBoundTextElement,
  isTextElement,
} from "@excalidraw/element";
import { arrayToMap } from "@excalidraw/common";

import type { ExcalidrawElement } from "@excalidraw/element/types";

import { Fonts } from "../fonts/Fonts";
import loadWoff2 from "../subset/woff2/woff2-loader";

import { exportToCanvas } from "./export";

import type { AppState, BinaryFiles } from "../types";

const toHex = (color: string) => {
  if (!color || color === "transparent") {
    return "";
  }
  return color.startsWith("#") ? color : `#${color}`;
};

export const exportToPDF = async (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
  exportOptions?: {
    quality?: number;
    scale?: number;
    orderedFrameIds?: string[];
    exportStyle?: "hand-drawn" | "vector";
  },
) => {
  const scale = exportOptions?.scale ?? 1;
  const exportStyle = exportOptions?.exportStyle ?? "vector";

  const allElements = getNonDeletedElements(elements);
  const elementsMap = arrayToMap(allElements);

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

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [frames[0].width, frames[0].height],
  });

  // --- Font Embedding ---
  const usedFamilies = new Set<number>();
  for (const element of allElements) {
    if (isTextElement(element)) {
      usedFamilies.add(element.fontFamily);
    }
  }

  if (usedFamilies.size > 0) {
    try {
      const woff2 = await loadWoff2();
      for (const familyId of usedFamilies) {
        const familyData = Fonts.registered.get(familyId);
        if (familyData && !familyData.metadata.local) {
          for (const face of familyData.fontFaces) {
            try {
              const fontBuffer = await face.fetchFont(face.urls[0]);
              const ttfBuffer = woff2.decompress(fontBuffer);

              let binaryString = "";
              const bytes = new Uint8Array(ttfBuffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binaryString += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binaryString);

              const fontName = face.fontFace.family;
              const fontStyle = (face as any).fontFace.style || "normal";
              const fileName = `${fontName}-${fontStyle}.ttf`;

              doc.addFileToVFS(fileName, base64);
              doc.addFont(fileName, fontName, fontStyle);
            } catch (e) {
              console.error(
                `Failed to embed font face for family ${familyId}`,
                e,
              );
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load woff2 decompressor", e);
    }
  }
  // ----------------------

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    if (i > 0) {
      doc.addPage([frame.width, frame.height]);
    }

    // Vector/Refined Rendering
    if (appState.exportBackground) {
      doc.setFillColor(toHex(appState.viewBackgroundColor));
      doc.rect(0, 0, frame.width, frame.height, "F");
    }

    const frameElements = getFrameChildren(allElements, frame.id);

    for (const element of frameElements) {
      const x = element.x - frame.x;
      const y = element.y - frame.y;

      doc.saveGraphicsState();

      if (element.angle !== 0) {
        const cos = Math.cos(element.angle);
        const sin = Math.sin(element.angle);

        const tx = x + element.width / 2;
        const ty = y + element.height / 2;

        const e = tx - tx * cos + ty * sin;
        const f = ty - tx * sin - ty * cos;

        (doc as any).internal.write(
          `${cos} ${sin} ${-sin} ${cos} ${e} ${f} cm`,
        );
      }

      doc.setGState(
        new (doc as any).GState({ opacity: element.opacity / 100 }),
      );

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
            doc.addImage(
              canvas.toDataURL("image/png"),
              "PNG",
              x,
              y,
              element.width,
              element.height,
            );
            doc.restoreGraphicsState();
            continue;
          } catch (e) {
            console.error(`Failed to rasterize element ${element.id}`, e);
          }
        }

        // Vector fallback or logic
        if (
          element.type === "rectangle" ||
          element.type === "ellipse" ||
          element.type === "diamond"
        ) {
          doc.setDrawColor(toHex(element.strokeColor));
          doc.setLineWidth(element.strokeWidth);

          if (element.backgroundColor !== "transparent") {
            doc.setFillColor(toHex(element.backgroundColor));
          }

          const style = element.backgroundColor !== "transparent" ? "FD" : "S";

          if (element.strokeStyle === "dashed") {
            doc.setLineDashPattern([5, 5], 0);
          } else if (element.strokeStyle === "dotted") {
            doc.setLineDashPattern([2, 2], 0);
          } else {
            doc.setLineDashPattern([], 0);
          }

          if (element.type === "rectangle") {
            if (element.roundness) {
              const radius = Math.min(element.width, element.height) * 0.1;
              doc.roundedRect(
                x,
                y,
                element.width,
                element.height,
                radius,
                radius,
                style,
              );
            } else {
              doc.rect(x, y, element.width, element.height, style);
            }
          } else if (element.type === "ellipse") {
            doc.ellipse(
              x + element.width / 2,
              y + element.height / 2,
              element.width / 2,
              element.height / 2,
              style,
            );
          } else if (element.type === "diamond") {
            doc.lines(
              [
                [element.width / 2, -element.height / 2],
                [element.width / 2, element.height / 2],
                [-element.width / 2, element.height / 2],
                [-element.width / 2, -element.height / 2],
              ],
              x + element.width / 2,
              y + element.height,
              [1, 1],
              style,
              true,
            );
          }

          const boundText = getBoundTextElement(element, elementsMap);
          if (boundText) {
            renderText(doc, boundText, frame);
          }
        } else if (element.type === "line" || element.type === "arrow") {
          doc.setDrawColor(toHex(element.strokeColor));
          doc.setLineWidth(element.strokeWidth);

          if (element.strokeStyle === "dashed") {
            doc.setLineDashPattern([5 * scale, 5 * scale], 0);
          } else if (element.strokeStyle === "dotted") {
            doc.setLineDashPattern([2 * scale, 2 * scale], 0);
          } else {
            doc.setLineDashPattern([], 0);
          }

          const points = element.points;
          if (points.length >= 2) {
            for (let j = 1; j < points.length; j++) {
              doc.line(
                x + points[j - 1][0],
                y + points[j - 1][1],
                x + points[j][0],
                y + points[j][1],
              );
            }
          }

          if (element.type === "arrow" && points.length >= 2) {
            const lastPoint = points[points.length - 1];
            const prevPoint = points[points.length - 2];
            const angle = Math.atan2(
              lastPoint[1] - prevPoint[1],
              lastPoint[0] - prevPoint[0],
            );
            const arrowSize = 10;

            if (element.endArrowhead) {
              doc.line(
                x + lastPoint[0],
                y + lastPoint[1],
                x + lastPoint[0] - arrowSize * Math.cos(angle - Math.PI / 6),
                y + lastPoint[1] - arrowSize * Math.sin(angle - Math.PI / 6),
              );
              doc.line(
                x + lastPoint[0],
                y + lastPoint[1],
                x + lastPoint[0] - arrowSize * Math.cos(angle + Math.PI / 6),
                y + lastPoint[1] - arrowSize * Math.sin(angle + Math.PI / 6),
              );
            }
          }
        }
      } else if (element.type === "text") {
        if (!element.containerId || !elementsMap.has(element.containerId)) {
          renderText(doc, element, frame);
        }
      } else if (element.type === "image") {
        const fileData = element.fileId ? files[element.fileId] : null;
        if (fileData) {
          doc.addImage(
            fileData.dataURL,
            "PNG",
            x,
            y,
            element.width,
            element.height,
            undefined,
            "FAST",
          );
        }
      } else {
        // Fallback
        try {
          const canvas = await exportToCanvas([element], appState, files, {
            exportBackground: false,
            viewBackgroundColor: appState.viewBackgroundColor,
            exportPadding: 0,
          });
          doc.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            x,
            y,
            element.width,
            element.height,
            undefined,
            "FAST",
          );
        } catch (e) {
          console.error(`Failed to export element ${element.id}`, e);
        }
      }

      doc.restoreGraphicsState();
    }
  }

  doc.save(`excalidraw-export-${Date.now()}.pdf`);
};

const renderText = (doc: jsPDF, element: any, frame: any) => {
  const x = element.x - frame.x;
  const y = element.y - frame.y;

  doc.setTextColor(toHex(element.strokeColor));
  doc.setFontSize(element.fontSize);

  // Font mapping to embedded fonts
  const fontData = Fonts.registered.get(element.fontFamily);
  const fontName = fontData?.fontFaces[0]?.fontFace.family || "helvetica";
  const fontStyle = (fontData?.fontFaces[0] as any)?.fontFace.style || "normal";

  try {
    doc.setFont(fontName, fontStyle);
  } catch (e) {
    doc.setFont("helvetica");
  }

  const lines = element.text.split("\n");
  const lineHeight = element.fontSize * (element.lineHeight || 1.25);

  const options: any = {
    align:
      element.textAlign === "center"
        ? "center"
        : element.textAlign === "right"
        ? "right"
        : "left",
    angle: (element.angle * 180) / Math.PI,
  };

  let tx = x;
  if (options.align === "center") {
    tx = x + element.width / 2;
  } else if (options.align === "right") {
    tx = x + element.width;
  }

  lines.forEach((line: string, i: number) => {
    // Excalidraw text baseline is different, we adjust with fontSize
    doc.text(line, tx, y + element.fontSize + i * lineHeight, options);
  });
};
