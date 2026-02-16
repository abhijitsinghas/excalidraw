import { Tabs as RadixTabs } from "radix-ui";

import {
  LIBRARY_SIDEBAR_TAB,
  PRESENTATION_SIDEBAR_TAB,
} from "@excalidraw/common";

import { useUIAppState } from "../../context/ui-appState";
import { useExcalidrawSetAppState } from "../App";

export const SidebarTabs = ({
  children,
  ...rest
}: {
  children: React.ReactNode;
} & Omit<React.RefAttributes<HTMLDivElement>, "onSelect">) => {
  const appState = useUIAppState();
  const setAppState = useExcalidrawSetAppState();

  if (!appState.openSidebar) {
    return null;
  }

  const { name } = appState.openSidebar;

  const handleTabChange = (tab: string) => {
    // Track the last opened sidebar tab
    const sidebarTabs = [LIBRARY_SIDEBAR_TAB, PRESENTATION_SIDEBAR_TAB];
    if (sidebarTabs.includes(tab)) {
      setAppState((state) => ({
        ...state,
        lastSidebarTab: tab,
        openSidebar: { ...state.openSidebar, name, tab },
      }));
    } else {
      setAppState((state) => ({
        ...state,
        openSidebar: { ...state.openSidebar, name, tab },
      }));
    }
  };

  return (
    <RadixTabs.Root
      className="sidebar-tabs-root"
      value={appState.openSidebar.tab}
      onValueChange={handleTabChange}
      {...rest}
    >
      {children}
    </RadixTabs.Root>
  );
};
SidebarTabs.displayName = "SidebarTabs";
