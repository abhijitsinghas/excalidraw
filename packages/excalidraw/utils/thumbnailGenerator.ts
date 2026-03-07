import { exportToCanvas } from "../scene/export";
import { getNormalizedZoom } from "../scene/normalize";
import { getCommonBounds } from "@excalidraw/element";
import { getElementsOverlappingFrame } from "@excalidraw/element";
import type {
  ExcalidrawElement,
  ExcalidrawFrameLikeElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/element/types";
import type { AppState, BinaryFiles } from "../types";

const DEFAULT_THUMBNAIL_WIDTH = 200;
const DEFAULT_THUMBNAIL_HEIGHT = 150;

/**
 * Generates a thumbnail image (data URL) for a frame element.
 *
 * @param frameElement - The frame element to generate a thumbnail for
 * @param appState - Current application state (optional, will use defaults if not provided)
 * @param allElements - All elements in the scene
 * @param width - Thumbnail width in pixels (default: 200)
 * @param height - Thumbnail height in pixels (default: 150)
 * @param files - Binary files for images (optional)
 * @returns Promise resolving to a data URL string, or empty string on error
 */
export const generateFrameThumbnail = async (
  frameElement: ExcalidrawFrameLikeElement,
  appState: AppState | null | undefined,
  allElements: readonly ExcalidrawElement[],
  width: number = DEFAULT_THUMBNAIL_WIDTH,
  height: number = DEFAULT_THUMBNAIL_HEIGHT,
  files: BinaryFiles = {},
): Promise<string> => {
  try {
    // Filter elements that are within the frame
    const frameElements = getElementsOverlappingFrame(
      allElements as NonDeletedExcalidrawElement[],
      frameElement,
    );

    // Need at least the frame itself
    if (frameElements.length === 0) {
      return "";
    }

    // Calculate aspect ratio to maintain proportions
    const [minX, minY, maxX, maxY] = getCommonBounds(frameElements);
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Determine canvas size based on aspect ratio
    let canvasWidth = width;
    let canvasHeight = height;

    if (contentWidth > 0 && contentHeight > 0) {
      const contentAspect = contentWidth / contentHeight;
      const thumbnailAspect = width / height;

      if (contentAspect > thumbnailAspect) {
        // Content is wider, fit to width
        canvasHeight = Math.round(width / contentAspect);
      } else {
        // Content is taller, fit to height
        canvasWidth = Math.round(height * contentAspect);
      }
    }

    // Get theme from appState or default to light
    const theme = appState?.theme || "light";
    const viewBackgroundColor = appState?.viewBackgroundColor || "#ffffff";

    // Create a minimal appState for thumbnail rendering
    const thumbnailAppState: AppState = {
      ...(appState || {}),
      // Disable various UI elements for cleaner thumbnails
      exportScale: canvasWidth / (frameElement.width || width),
      scrollX: 0,
      scrollY: 0,
      zoom: { value: getNormalizedZoom(1) },
      theme,
      viewBackgroundColor,
      frameRendering: {
        enabled: true,
        outline: false,
        name: false,
        clip: true,
      },
    } as AppState;

    // Export the frame to canvas
    const canvas = await exportToCanvas(
      frameElements as NonDeletedExcalidrawElement[],
      thumbnailAppState,
      files,
      {
        exportBackground: true,
        exportPadding: 0,
        viewBackgroundColor: thumbnailAppState.viewBackgroundColor,
        exportingFrame: frameElement,
      },
      // Custom canvas creator to ensure correct size
      () => {
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        return { canvas, scale: 1 };
      },
    );

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl;
  } catch (error) {
    console.error(
      `Failed to generate thumbnail for frame ${frameElement.id}:`,
      error,
    );
    return "";
  }
};

/**
 * Creates a thumbnail generator with caching and debouncing capabilities.
 *
 * Usage:
 * ```
 * const generator = createThumbnailGenerator();
 *
 * // Generate thumbnail immediately
 * const url = await generator.generateThumbnail(frame, appState, elements);
 *
 * // Or use debounced version for real-time updates
 * generator.debouncedGenerate(frame, appState, elements, (url) => {
 *   // Update state with thumbnail URL
 * });
 *
 * // Clear cache when frame is deleted or modified
 * generator.clearCache(frameId);
 * ```
 */
export const createThumbnailGenerator = () => {
  const cache = new Map<string, string>();
  const pendingTimeouts = new Map<string, NodeJS.Timeout>();

  return {
    /**
     * Generate a thumbnail immediately, using cache if available
     */
    generateThumbnail: async (
      frameElement: ExcalidrawFrameLikeElement,
      appState: AppState,
      allElements: readonly ExcalidrawElement[],
      width?: number,
      height?: number,
      files?: BinaryFiles,
    ): Promise<string> => {
      // Check cache first
      if (cache.has(frameElement.id)) {
        return cache.get(frameElement.id)!;
      }

      const dataUrl = await generateFrameThumbnail(
        frameElement,
        appState,
        allElements,
        width,
        height,
        files,
      );

      if (dataUrl) {
        cache.set(frameElement.id, dataUrl);
      }

      return dataUrl;
    },

    /**
     * Generate a thumbnail with debouncing (useful for real-time updates)
     * Cancels previous pending generation for the same frame.
     */
    debouncedGenerate: (
      frameElement: ExcalidrawFrameLikeElement,
      appState: AppState,
      allElements: readonly ExcalidrawElement[],
      onGenerated: (url: string) => void,
      debounceMs: number = 300,
      width?: number,
      height?: number,
      files?: BinaryFiles,
    ): (() => void) => {
      // Cancel pending timeout for this frame
      const pendingTimeout = pendingTimeouts.get(frameElement.id);
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
      }

      // Schedule new generation
      const timeout = setTimeout(async () => {
        const dataUrl = await generateFrameThumbnail(
          frameElement,
          appState,
          allElements,
          width,
          height,
          files,
        );

        if (dataUrl) {
          cache.set(frameElement.id, dataUrl);
        }

        onGenerated(dataUrl);
        pendingTimeouts.delete(frameElement.id);
      }, debounceMs);

      pendingTimeouts.set(frameElement.id, timeout);

      // Return cancellation function
      return () => {
        const timeout = pendingTimeouts.get(frameElement.id);
        if (timeout) {
          clearTimeout(timeout);
          pendingTimeouts.delete(frameElement.id);
        }
      };
    },

    /**
     * Clear cached thumbnail for a frame
     */
    clearCache: (frameId: string): void => {
      cache.delete(frameId);
      const timeout = pendingTimeouts.get(frameId);
      if (timeout) {
        clearTimeout(timeout);
        pendingTimeouts.delete(frameId);
      }
    },

    /**
     * Clear all cached thumbnails
     */
    clearAllCache: (): void => {
      cache.clear();
      pendingTimeouts.forEach((timeout) => clearTimeout(timeout));
      pendingTimeouts.clear();
    },

    /**
     * Generate thumbnails for multiple frames in batch
     */
    generateBatch: async (
      frames: ExcalidrawFrameLikeElement[],
      appState: AppState,
      allElements: readonly ExcalidrawElement[],
      width?: number,
      height?: number,
      files?: BinaryFiles,
    ): Promise<Map<string, string>> => {
      const results = new Map<string, string>();

      for (const frame of frames) {
        const dataUrl = await generateFrameThumbnail(
          frame,
          appState,
          allElements,
          width,
          height,
          files,
        );

        if (dataUrl) {
          cache.set(frame.id, dataUrl);
          results.set(frame.id, dataUrl);
        } else {
          results.set(frame.id, "");
        }
      }

      return results;
    },
  };
};
