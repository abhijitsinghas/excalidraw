import {
  KEYS,
  PRESENTATION_SIDEBAR_TAB,
  DEFAULT_SIDEBAR,
} from "@excalidraw/common";

import { CaptureUpdateAction } from "@excalidraw/element";

import { presentationIcon } from "../components/icons";

import { register } from "./register";

import type { AppState } from "../types";

export const actionTogglePresentationSidebar = register({
  name: "togglePresentationSidebar",
  icon: presentationIcon,
  keywords: ["presentation", "slides", "sidebar"],
  label: "presentation.title",
  viewMode: true,
  trackEvent: {
    category: "toolbar" as const,
    action: "toggle",
  },
  perform(elements, appState, _, app) {
    const isPresentationSidebarOpen =
      appState.openSidebar?.name === DEFAULT_SIDEBAR.name &&
      appState.openSidebar?.tab === PRESENTATION_SIDEBAR_TAB;

    if (isPresentationSidebarOpen) {
      return {
        appState: {
          ...appState,
          openSidebar: null,
        },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      };
    }

    // Use the last sidebar tab if available
    const sidebarTab = appState.lastSidebarTab || PRESENTATION_SIDEBAR_TAB;

    return {
      appState: {
        ...appState,
        openSidebar: {
          name: DEFAULT_SIDEBAR.name,
          tab:
            sidebarTab === PRESENTATION_SIDEBAR_TAB
              ? sidebarTab
              : PRESENTATION_SIDEBAR_TAB,
        },
        openDialog: null,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  checked: (appState: AppState) =>
    appState.openSidebar?.name === DEFAULT_SIDEBAR.name &&
    appState.openSidebar?.tab === PRESENTATION_SIDEBAR_TAB,
  keyTest: (event) => {
    // Use Ctrl+Shift+S as the shortcut
    return (
      (event[KEYS.CTRL_OR_CMD] || event.metaKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === "s"
    );
  },
});
