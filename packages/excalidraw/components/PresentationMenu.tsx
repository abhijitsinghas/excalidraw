import React, { useMemo, useEffect, useState, useRef } from "react";

import { isFrameLikeElement, getFrameLikeTitle } from "@excalidraw/element";
import { THEME } from "@excalidraw/common";

import type {
  NonDeletedExcalidrawElement,
  ExcalidrawFrameLikeElement,
} from "@excalidraw/element/types";

import { useUIAppState } from "../context/ui-appState";

import { exportToCanvas } from "../scene/export";

import { ToolButton } from "./ToolButton";
import { PlusIcon, PlayIcon, ExportIcon } from "./icons";

import { useExcalidrawSetAppState } from "./App";

import "./PresentationMenu.scss";

import type { AppClassProperties, BinaryFiles } from "../types";

interface PresentationMenuProps {
  app: AppClassProperties;
  elements: readonly NonDeletedExcalidrawElement[];
}

const PresentationMenuSlide = ({
  frame,
  index,
  elements,
  appState,
  files,
  onClick,
  onPointerDown,
  isDragging,
  dragOffset,
  shiftOffset,
}: {
  frame: ExcalidrawFrameLikeElement;
  index: number;
  elements: readonly NonDeletedExcalidrawElement[];
  appState: any;
  files: BinaryFiles;
  onClick: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  isDragging: boolean;
  dragOffset: number;
  shiftOffset: number;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isUnmounted = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;
    const generatePreview = async () => {
      try {
        const canvas = await exportToCanvas(
          elements,
          { ...appState, exportWithDarkMode: appState.theme === THEME.DARK },
          files,
          {
            exportBackground: true,
            viewBackgroundColor: appState.viewBackgroundColor || "#ffffff",
            exportingFrame: frame,
          },
        );

        if (!isUnmounted.current) {
          setPreviewUrl(canvas.toDataURL());
        }
      } catch (e) {
        console.error("Failed to generate preview for frame", frame.id, e);
      }
    };

    generatePreview();

    return () => {
      isUnmounted.current = true;
    };
  }, [frame, elements, appState.theme, appState.viewBackgroundColor, files]);

  const frameName = getFrameLikeTitle(frame);
  const isDefaultFrameName =
    frameName === "Frame" || frameName.startsWith("Frame ");

  const translateY = isDragging ? dragOffset : shiftOffset;

  return (
    <div
      className={`PresentationMenu__slide-item ${
        isDragging ? "is-dragging" : ""
      }`}
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{
        transform: translateY !== 0 ? `translateY(${translateY}px)` : "none",
        zIndex: isDragging ? 100 : 1,
        transition: isDragging ? "none" : "transform 0.2s ease",
        position: "relative",
        userSelect: "none",
      }}
    >
      <div className="PresentationMenu__slide-preview">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={frameName}
            className="PresentationMenu__slide-preview-img"
            draggable={false}
          />
        ) : (
          <div className="PresentationMenu__slide-preview-placeholder" />
        )}
        {!isDefaultFrameName && (
          <div className="PresentationMenu__slide-preview-name">
            {frameName}
          </div>
        )}
        <div className="PresentationMenu__slide-preview-number">
          {index + 1}
        </div>
      </div>
    </div>
  );
};

export const PresentationMenu = ({ app, elements }: PresentationMenuProps) => {
  const appState = useUIAppState();
  const setAppState = useExcalidrawSetAppState();
  // @ts-ignore
  const files = app.files || {};

  const frames = useMemo(() => {
    return elements.filter((element): element is ExcalidrawFrameLikeElement =>
      isFrameLikeElement(element),
    );
  }, [elements]);

  const sortedFrames = useMemo(() => {
    if (appState.presentationSlideOrder) {
      const frameMap = new Map(frames.map((f) => [f.id, f]));
      const ordered = appState.presentationSlideOrder
        .map((id) => frameMap.get(id))
        .filter((f): f is ExcalidrawFrameLikeElement => !!f);

      const orderedIds = new Set(ordered.map((f) => f.id));
      const remaining = frames.filter((f) => !orderedIds.has(f.id));
      remaining.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 50) {
          return a.y - b.y;
        }
        return a.x - b.x;
      });

      return [...ordered, ...remaining];
    }

    return [...frames].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 50) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });
  }, [frames, appState.presentationSlideOrder]);

  useEffect(() => {
    const currentOrder = appState.presentationSlideOrder;
    const newOrder = sortedFrames.map((f) => f.id);

    const isSame =
      currentOrder &&
      currentOrder.length === newOrder.length &&
      currentOrder.every((id, i) => id === newOrder[i]);
    if (!isSame) {
      setAppState({ presentationSlideOrder: newOrder });
    }
  }, [
    frames.length,
    appState.presentationSlideOrder,
    setAppState,
    sortedFrames,
  ]);

  // ─── Drag State ────────────────────────────────────────────────────────────
  // All mutable drag data lives in refs so event handlers never go stale.
  const dragStateRef = useRef<{
    active: boolean;
    draggedId: string | null;
    draggedIndex: number;
    startY: number;
    currentTargetIndex: number;
    itemHeight: number;
    frameCount: number;
  }>({
    active: false,
    draggedId: null,
    draggedIndex: -1,
    startY: 0,
    currentTargetIndex: -1,
    itemHeight: 120,
    frameCount: 0,
  });

  const sortedFramesRef = useRef(sortedFrames);
  const setAppStateRef = useRef(setAppState);
  useEffect(() => {
    sortedFramesRef.current = sortedFrames;
    dragStateRef.current.frameCount = sortedFrames.length;
  }, [sortedFrames]);
  useEffect(() => {
    setAppStateRef.current = setAppState;
  }, [setAppState]);

  // React state only for triggering re-renders
  const [dragRenderState, setDragRenderState] = useState<{
    draggedId: string | null;
    dragOffset: number;
    targetIndex: number | null;
  }>({ draggedId: null, dragOffset: 0, targetIndex: null });

  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Register global pointer handlers once.
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds.active) {
        return;
      }

      const deltaY = e.clientY - ds.startY;

      // Compute new target index
      const shiftIndex = Math.round(deltaY / ds.itemHeight);
      let newTarget = ds.draggedIndex + shiftIndex;
      newTarget = Math.max(0, Math.min(ds.frameCount - 1, newTarget));

      ds.currentTargetIndex = newTarget;

      // Update React state so the component re-renders
      setDragRenderState({
        draggedId: ds.draggedId,
        dragOffset: deltaY,
        targetIndex: newTarget,
      });
    };

    const onPointerUp = () => {
      const ds = dragStateRef.current;
      if (!ds.active) {
        return;
      }

      const fromIndex = ds.draggedIndex;
      const toIndex = ds.currentTargetIndex;

      if (toIndex !== -1 && fromIndex !== toIndex) {
        const newOrder = [...sortedFramesRef.current];
        const [removed] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, removed);
        setAppStateRef.current({
          presentationSlideOrder: newOrder.map((f) => f.id),
        });
      }

      // Reset
      ds.active = false;
      ds.draggedId = null;
      ds.draggedIndex = -1;
      ds.currentTargetIndex = -1;
      setDragRenderState({ draggedId: null, dragOffset: 0, targetIndex: null });
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []); // Empty deps – handlers use refs and are stable.

  const handlePointerDown = (
    e: React.PointerEvent,
    id: string,
    index: number,
  ) => {
    if (e.button !== 0) {
      return;
    }
    e.preventDefault(); // Prevent native image drag from hijacking pointer events

    // Measure the item height now (accurate at drag start)
    let itemHeight = 120;
    if (
      itemsContainerRef.current &&
      itemsContainerRef.current.children[index]
    ) {
      const child = itemsContainerRef.current.children[index] as HTMLElement;
      itemHeight = child.offsetHeight + 8; // +8px gap
    }

    dragStateRef.current = {
      active: true,
      draggedId: id,
      draggedIndex: index,
      startY: e.clientY,
      currentTargetIndex: index,
      itemHeight,
      frameCount: sortedFramesRef.current.length,
    };

    setDragRenderState({ draggedId: id, dragOffset: 0, targetIndex: index });
  };

  const createSlide = () => {
    app.setActiveTool({ type: "frame" });
    setAppState({ openSidebar: null });
  };

  const { draggedId, dragOffset, targetIndex } = dragRenderState;

  return (
    <div className="PresentationMenu">
      <div className="PresentationMenu__header">
        <div className="PresentationMenu__header-title">
          <h2 className="PresentationMenu__title">Presentation</h2>
          <p className="PresentationMenu__subtitle">
            {sortedFrames.length}{" "}
            {sortedFrames.length === 1 ? "slide" : "slides"}
          </p>
        </div>
        <div className="PresentationMenu__header-actions">
          <ToolButton
            type="button"
            icon={ExportIcon}
            title="Export slides"
            aria-label="Export slides"
            onClick={() => setAppState({ openDialog: { name: "frameExport" } })}
            className="PresentationMenu__export-btn"
          />
          <ToolButton
            type="button"
            icon={PlusIcon}
            title="Create slide"
            aria-label="Create slide"
            onClick={createSlide}
            className="PresentationMenu__create-btn"
          />
        </div>
      </div>
      <div className="PresentationMenu__content">
        <div className="PresentationMenu__slides-list" ref={itemsContainerRef}>
          {sortedFrames.map((frame, index) => {
            const isDragging = draggedId === frame.id;
            const dragIndex = dragStateRef.current.draggedIndex;

            let shiftOffset = 0;
            if (
              draggedId &&
              !isDragging &&
              targetIndex !== null &&
              dragIndex !== -1
            ) {
              if (
                dragIndex < targetIndex &&
                index > dragIndex &&
                index <= targetIndex
              ) {
                // Dragged down: non-dragged items in the range slide UP
                shiftOffset = -dragStateRef.current.itemHeight;
              } else if (
                dragIndex > targetIndex &&
                index >= targetIndex &&
                index < dragIndex
              ) {
                // Dragged up: non-dragged items in the range slide DOWN
                shiftOffset = dragStateRef.current.itemHeight;
              }
            }

            return (
              <PresentationMenuSlide
                key={frame.id}
                frame={frame}
                index={index}
                elements={elements}
                appState={appState}
                files={files}
                onClick={() => {
                  if (draggedId) {
                    return;
                  } // Prevent click during/after drag
                  app.scrollToContent(frame, {
                    animate: true,
                    fitToViewport: true,
                    viewportZoomFactor: 1,
                    canvasOffsets: app.getEditorUIOffsets(),
                  });
                  setAppState({ selectedElementIds: { [frame.id]: true } });
                }}
                onPointerDown={(e) => handlePointerDown(e, frame.id, index)}
                isDragging={isDragging}
                dragOffset={dragOffset}
                shiftOffset={shiftOffset}
              />
            );
          })}
          {sortedFrames.length === 0 && (
            <div className="PresentationMenu__empty-state">
              <p>No slides yet.</p>
              <button onClick={createSlide}>Create your first slide</button>
            </div>
          )}
        </div>
      </div>
      <div className="PresentationMenu__footer">
        <button
          className="PresentationMenu__start-btn"
          onClick={() => {
            app.startPresentation();
          }}
        >
          {PlayIcon} Start presentation
        </button>
      </div>
    </div>
  );
};
