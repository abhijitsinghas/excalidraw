import { DefaultSidebar, Sidebar } from "@excalidraw/excalidraw";
import {
  messageCircleIcon,
  presentationIcon,
} from "@excalidraw/excalidraw/components/icons";
import { PresentationSidebar } from "@excalidraw/excalidraw/components/PresentationSidebar/PresentationSidebar";
import { useUIAppState } from "@excalidraw/excalidraw/context/ui-appState";

import "./AppSidebar.scss";

export const AppSidebar = () => {
  const { openSidebar } = useUIAppState();

  return (
    <DefaultSidebar>
      <DefaultSidebar.TabTriggers>
        <Sidebar.TabTrigger
          tab="comments"
          style={{ opacity: openSidebar?.tab === "comments" ? 1 : 0.4 }}
        >
          {messageCircleIcon}
        </Sidebar.TabTrigger>
        <Sidebar.TabTrigger
          tab="presentation"
          style={{ opacity: openSidebar?.tab === "presentation" ? 1 : 0.4 }}
        >
          {presentationIcon}
        </Sidebar.TabTrigger>
      </DefaultSidebar.TabTriggers>
      <Sidebar.Tab tab="comments">
        <div className="app-sidebar-promo-container">
          <div className="app-sidebar-promo-image" />
          <div className="app-sidebar-promo-text">Comments coming soon</div>
        </div>
      </Sidebar.Tab>
      <Sidebar.Tab tab="presentation" className="px-3">
        <PresentationSidebar />
      </Sidebar.Tab>
    </DefaultSidebar>
  );
};
