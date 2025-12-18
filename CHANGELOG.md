# Change Log

All notable changes to the "mager-project-copier" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial development and testing.

## [0.0.1] - 2025-12-18

### Added
- **Sidebar Interface**: Implemented a dedicated view container in the Activity Bar.
- **Project Scanning**: Added `fileScanner` to recursively read workspace files.
- **Token Estimation**: Added logic to estimate token count for LLM context limits.
- **Snapshot Builder**: Core functionality to concatenate files into a single string format.
- **Framework Detection**: Basic detection for common project structures.
- **Ignore Logic**: Implementation of `.gitignore` parsing and custom ignore rules.