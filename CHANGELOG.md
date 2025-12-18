# Change Log

All notable changes to the "mager-project-copier" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.2] - 2025-12-18

### Added
- **Auto Update System**: Integrated self-hosted auto-update mechanism via GitHub Releases.
- **Git Integration**: New "Scan Git" button to filter and select only modified/untracked files (-uall support).
- **Context Menu**: Added "Copy Snapshot" option to the Explorer context menu for quick folder copying.
- **Custom Templates**: Users can now define custom prompt templates via VS Code `settings.json`.
- **Search Bar**: Added real-time search filtering in the sidebar file tree.
- **Dynamic Output**: Automatically switches between Markdown and XML format based on the selected AI Model (e.g., XML for Claude).
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