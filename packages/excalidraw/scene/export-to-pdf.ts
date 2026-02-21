import jsPDF from "jspdf";
import { getNonDeletedElements, isFrameLikeElement } from "@excalidraw/element";

import type { ExcalidrawElement } from "@excalidraw/element/types";

import { exportToCanvas } from "./export";

import type { AppState, BinaryFiles } from "../types";

export const exportToPDF = async (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
  exportOptions?: {
    quality?: number;
    scale?: number;
    orderedFrameIds?: string[];
  },
) => {
  // Default export options
  const quality = exportOptions?.quality ?? 0.8;
  const scale = exportOptions?.scale ?? 1;

  let frames = getNonDeletedElements(elements).filter((element) =>
    isFrameLikeElement(element),
  );

  if (exportOptions?.orderedFrameIds) {
    const orderMap = new Map(
      exportOptions.orderedFrameIds.map((id, index) => [id, index]),
    );
    frames = frames
      .filter((f) => orderMap.has(f.id))
      .sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);
  } else {
    frames = frames.sort((a, b) => {
      // Sort by y position then x position
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

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    // Add new page for subsequent frames
    if (i > 0) {
      doc.addPage([frame.width, frame.height]);
    }

    const canvas = await exportToCanvas(
      getNonDeletedElements(elements),
      { ...appState, exportScale: scale },
      files,
      {
        exportBackground: appState.exportBackground,
        viewBackgroundColor: appState.viewBackgroundColor,
        exportingFrame: frame,
      },
    );

    const imgData = canvas.toDataURL("image/jpeg", quality);

    doc.addImage(imgData, "JPEG", 0, 0, frame.width, frame.height);
  }

  doc.save(`excalidraw-export-${Date.now()}.pdf`);
};
