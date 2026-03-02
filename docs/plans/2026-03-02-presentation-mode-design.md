# Presentation Mode & Export Feature - Design Document

## Overview

This document outlines the design for enhanced Presentation Mode and Export features in Excalidraw, including:

- Updated Presentation Sidebar with frame thumbnails and controls
- Full-screen Presentation Mode with slide navigation and laser pointer
- Export Dialog for PDF and PPTX with slide management and quality options

## Architecture

### Components Involved

1. **Presentation Sidebar** (Updated)

   - Remove all Excalidraw+ subscription content
   - Display frames as slides with thumbnails
   - Real-time thumbnail caching with manual refresh
   - Drag-and-drop reordering of slides
   - Create slide, export, and menu buttons

2. **Presentation Mode (Full Screen)**

   - Activate via "Start Presentation" button
   - Exit via Escape key or "End Presentation" button
   - Bottom menu bar with navigation controls
   - Integrated laser pointer (reuses existing canvas logic)
   - Zoom-to-fit frame functionality
   - Arrow key and Space navigation

3. **Export Dialog**
   - Left panel: Slide thumbnails with reordering, selection, renaming
   - Right panel: Format options (PDF/PPTX) with quality/compression settings
   - Bulk operations: Select All, Deselect All, Delete from Export

## Feature Requirements

### Presentation Sidebar

- Display all frames as slides
- Show slide counter (e.g., "Slides (2/5)")
- Real-time thumbnail updates (debounced ~300ms)
- Manual "Refresh Thumbnails" button
- Drag-and-drop reordering
- Toggle frames as slides (eye icon or checkbox)
- Create new slide button
- Export button
- Menu button for additional options

### Presentation Mode

- Full-screen display
- Bottom menu bar with:
  - Left: Previous/Next arrows + slide counter
  - Center: Laser pointer button
  - Right: "End Presentation" button
- Navigation: Arrow keys (Left/Right), Space bar (next slide), Escape (exit)
- Laser pointer: visible to all, fades after 3-5 seconds (reuses existing config)
- Zoom to fit frame in viewport

### Export Dialog

- **Left Panel**:
  - Thumbnail list with preview
  - Drag-and-drop reordering
  - Checkbox for each slide
  - Rename slide functionality
  - Bulk actions: Select All, Deselect All, Delete
- **Right Panel**:
  - Format selection: PDF or PPTX
  - PDF options: Print optimized vs Screen viewing
  - PPTX options: Preserve animations
  - Quality: Preset (Low/Medium/High) - default High (2x scale)
  - Compression slider: 0-100% - default 80%
  - Export mode: Vectors vs Rasterized
  - Hand-drawn preservation: separate raster + copyable text
  - Export button

## Theme Support

- Light/dark mode support using existing Excalidraw theme system
- Color palette matches existing UI (blues, grays)
- Icons from existing icon library
- CSS-in-JS styling with theme inheritance

## Implementation Phases

1. **Phase 1**: Update Presentation Sidebar
2. **Phase 2**: Presentation Mode (Full Screen)
3. **Phase 3**: Export Dialog & Features

All features will be implemented in a single iteration with both sidebar and export dialog available together.

## Success Criteria

- All frames display as editable slides in sidebar
- Presentation mode is fullscreen with proper navigation
- Export dialog provides all quality/format options
- Light/dark themes work correctly
- No premium/subscription references remain in presentation UI
- Laser pointer behavior matches existing canvas laser pointer
