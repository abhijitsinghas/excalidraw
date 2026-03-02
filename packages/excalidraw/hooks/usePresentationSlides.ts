import { useCallback, useMemo, useState } from "react";
import type { ExcalidrawFrameLikeElement } from "@excalidraw/element/types";
import { getNonDeletedElements } from "@excalidraw/element";
import { isFrameLikeElement } from "@excalidraw/element/typeChecks";
import type { ExcalidrawElement } from "@excalidraw/element/types";

/**
 * Represents a single presentation slide
 */
export interface PresentationSlide {
  /** Unique identifier for the slide (frame element id) */
  id: string;
  /** Display name of the slide */
  name: string;
  /** Reference to the frame element */
  frameElement: ExcalidrawFrameLikeElement;
  /** Whether this slide is included in the presentation */
  isIncluded: boolean;
  /** Position in the presentation order */
  index: number;
  /** Optional thumbnail image data (base64 or data URL) */
  thumbnail?: string;
}

/**
 * Return type for the usePresentationSlides hook
 */
export interface UsePresentationSlidesReturn {
  /** Array of all slides in presentation order */
  slides: PresentationSlide[];
  /** Array of frame IDs in the current presentation order */
  slideOrder: string[];
  /** Update the order of slides */
  reorderSlides: (newOrder: string[]) => void;
  /** Toggle whether a frame is included in the presentation */
  toggleSlideIncluded: (frameId: string) => void;
  /** Update the thumbnail for a slide */
  updateThumbnail: (frameId: string, imageData: string) => void;
  /** Get the thumbnail for a slide */
  getThumbnail: (frameId: string) => string | undefined;
  /** Cache of thumbnails by frame ID */
  thumbnailCache: Map<string, string>;
  /** Rename a slide */
  renameSlide: (frameId: string, newName: string) => void;
}

/**
 * Custom hook to manage presentation slides
 * Extracts frames from elements, maintains slide order, handles visibility,
 * and manages thumbnails and renames.
 *
 * @param elements - Array of all elements in the scene
 * @returns Object containing slide management methods and state
 */
export const usePresentationSlides = (
  elements: readonly ExcalidrawElement[],
): UsePresentationSlidesReturn => {
  // State for custom slide order (frame IDs in presentation order)
  const [slideOrder, setSlideOrder] = useState<string[]>([]);

  // State for tracking which frames are included in the presentation
  const [includedFrames, setIncludedFrames] = useState<Set<string>>(new Set());

  // State for thumbnail cache
  const [thumbnailCache, setThumbnailCache] = useState<Map<string, string>>(
    new Map(),
  );

  // State for custom slide names (frame ID -> custom name)
  const [slideNames, setSlideNames] = useState<Map<string, string>>(new Map());

  // Extract and memoize frame elements from the elements array
  const frameElements = useMemo(() => {
    const nonDeleted = getNonDeletedElements(elements);
    return nonDeleted.filter((el): el is ExcalidrawFrameLikeElement =>
      isFrameLikeElement(el),
    );
  }, [elements]);

  // Initialize slide order on first load
  useMemo(() => {
    if (slideOrder.length === 0 && frameElements.length > 0) {
      const initialOrder = frameElements.map((frame) => frame.id);
      setSlideOrder(initialOrder);
      // Initialize all frames as included by default
      setIncludedFrames(new Set(initialOrder));
    }
  }, [frameElements.length, slideOrder.length]);

  // Build the slides array, respecting the custom order
  const slides = useMemo(() => {
    // Create a map of frame ID to frame element for quick lookup
    const frameMap = new Map(frameElements.map((frame) => [frame.id, frame]));

    // Use custom order if available, otherwise use natural order
    const orderedFrameIds =
      slideOrder.length > 0 ? slideOrder : frameElements.map((f) => f.id);

    return orderedFrameIds
      .map((frameId, index) => {
        const frameElement = frameMap.get(frameId);
        if (!frameElement) {
          return null;
        }

        return {
          id: frameId,
          name:
            slideNames.get(frameId) ||
            frameElement.name ||
            `Slide ${index + 1}`,
          frameElement,
          isIncluded: includedFrames.has(frameId),
          index,
          thumbnail: thumbnailCache.get(frameId),
        } as PresentationSlide;
      })
      .filter((slide): slide is PresentationSlide => slide !== null);
  }, [frameElements, slideOrder, includedFrames, thumbnailCache, slideNames]);

  // Callback to reorder slides
  const reorderSlides = useCallback((newOrder: string[]) => {
    setSlideOrder(newOrder);
  }, []);

  // Callback to toggle slide inclusion
  const toggleSlideIncluded = useCallback((frameId: string) => {
    setIncludedFrames((prev) => {
      const next = new Set(prev);
      if (next.has(frameId)) {
        next.delete(frameId);
      } else {
        next.add(frameId);
      }
      return next;
    });
  }, []);

  // Callback to update thumbnail
  const updateThumbnail = useCallback((frameId: string, imageData: string) => {
    setThumbnailCache((prev) => {
      const next = new Map(prev);
      next.set(frameId, imageData);
      return next;
    });
  }, []);

  // Callback to get thumbnail
  const getThumbnail = useCallback(
    (frameId: string) => thumbnailCache.get(frameId),
    [thumbnailCache],
  );

  // Callback to rename slide
  const renameSlide = useCallback((frameId: string, newName: string) => {
    setSlideNames((prev) => {
      const next = new Map(prev);
      next.set(frameId, newName);
      return next;
    });
  }, []);

  return {
    slides,
    slideOrder,
    reorderSlides,
    toggleSlideIncluded,
    updateThumbnail,
    getThumbnail,
    thumbnailCache,
    renameSlide,
  };
};
