# Change Log

All notable changes to the "mager-project-copier" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.4] - 2025-12-31

### Added
- **Modular Framework Detection**: Massive update to the detection engine. Now supports 25+ frameworks including **Next.js, Nuxt, SvelteKit, Astro, Remix, Flutter, React Native, Django, Spring Boot, Unity**, and more.
- **Smart Placeholders**: Binary files (images, archives) and large files (>1MB) are now visible in the tree with a specific label (e.g., `[Binary]`, `[Large]`). Their content is skipped in the snapshot to save tokens, but their existence is recorded for context.
- **Reset Selection**: Added a "Trash Icon" button in the footer to instantly uncheck all files.
- **Configurable Token Limit**: Users can now set their own warning threshold via `magerProject.tokenLimit` in VS Code settings.
- **Loading Indicators**: Visual feedback (button disabled + text change) during Copy/Export operations.

### Changed
- **Auto-Scan**: The extension now automatically scans the workspace upon opening, eliminating the empty initial state.
- **Search Performance**: Added **Debounce (300ms)** to the search bar to prevent UI lag on large projects.
- **Internal Architecture**: Refactored `htmlRenderer.ts` into modular components (`styles`, `scripts`, `components`) for better maintainability.
- **Framework Logic**: Moved hardcoded framework rules into a dedicated `frameworks.ts` definition file.

## [0.0.3] - 2025-12-23

### Added
- **Keyboard Navigation (UX)**: Full keyboard support for the file tree.
    - `Arrow Up/Down`: Navigate between rows.
    - `Arrow Right`: Expand folder or move to child.
    - `Arrow Left`: Collapse folder or move to parent.
    - `Space`: Toggle checkbox selection.
    - `Enter`: Open file or toggle folder.
- **Copy Tree Only**: New feature to copy only the project structure without file contents. Supports **ASCII Tree** (visual) and **Path List** (text) formats.
- **Search Highlighting**: Search results now highlight the matching text specifically, improving visibility.

### Changed
- **Output Format Selection**: Replaced specific "Target AI Model" selection with generic **Output Format** selection (**Markdown** vs **XML**).
- **UI Layout**: Updated sidebar action buttons to a 3-column grid to accommodate the new "Copy Tree" button.
- **Accessibility**: Added `tabindex` and focus styles to file tree rows for better accessibility.

## [0.0.2] - 2025-12-18

### Added
- **Auto Update System**: Integrated self-hosted auto-update mechanism via GitHub Releases.
- **Git Integration**: New "Scan Git" button to filter and select only modified/untracked files (-uall support).
- **Context Menu**: Added "Copy Snapshot" option to the Explorer context menu for quick folder copying.
- **Custom Templates**: Users can now define custom prompt templates via VS Code `settings.json`.
- **Search Bar**: Added real-time search filtering in the sidebar file tree.
- **Dynamic Output**: Automatically switches between Markdown and XML format.
- **Performance Safety**: Added auto-ignore logic for files larger than 1MB to prevent freezing.

### Changed
- **Modular Architecture**: Refactored `SidebarProvider` into separate handlers (`scanHandler`, `copyHandler`) and view renderers.
- **UI Improvements**: Updated Sidebar UI with a 2-column grid layout for Scan buttons.

## [0.0.1] - 2025-12-17

### Added
- **Sidebar Interface**: Implemented a dedicated view container in the Activity Bar.
- **Project Scanning**: Added `fileScanner` to recursively read workspace files.
- **Token Estimation**: Added logic to estimate token count for LLM context limits.
- **Snapshot Builder**: Core functionality to concatenate files into a single string format.
- **Framework Detection**: Basic detection for common project structures.
- **Ignore Logic**: Implementation of `.gitignore` parsing and custom ignore rules.