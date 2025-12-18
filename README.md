# Mager Project Copier

**Mager Project Copier** is a VS Code extension designed to streamline the process of sharing your code context with AI Large Language Models (LLMs). It allows you to create a comprehensive, AI-ready snapshot of your entire project (or selected parts) with a single click.

## Features

* **One-Click Snapshot**: Instantly copy your project structure and file contents into the clipboard.
* **Token Estimation**: Real-time estimation of token usage to ensure your context fits within LLM context windows (powered by `tokenEstimator`).
* **Smart Selection**:
    * **Framework Detection**: Automatically detects the project framework (e.g., React, Node.js) to apply optimal settings.
    * **Ignore Patterns**: Respects `.gitignore` and allows custom exclusion rules via `ignoreResolver`.
    * **Tree View**: Interactively select or deselect specific files and folders via the Sidebar.
* **Optimized Output**: Formats the output specifically for AI ingestion, including file paths and content delimiters.
* **Snapshot Splitting**: Automatically handles large projects by splitting snapshots if necessary (via `snapshotSplitter`).

## Usage

1.  Open the **Mager Project** view in the Activity Bar (look for the icon).
2.  Wait for the extension to scan your workspace.
3.  Review the file selection in the tree view.
4.  Check the estimated token count at the bottom.
5.  Click the **"Copy Snapshot"** button to copy the context to your clipboard.
6.  Paste it into ChatGPT, Claude, or Gemini.

## Requirements

* VS Code version 1.107.0 or higher.

## Extension Settings

Currently, this extension uses intelligent defaults based on your project type. Future versions will include configurable settings in `settings.json`.

## Known Issues

* Please report any issues on the [GitHub Repository](https://github.com/Yoganataa/mager-project-copier/issues).

## Release Notes

### 0.0.1
* Initial release of Mager Project Copier.
* Added Sidebar view with file tree.
* Added token estimation and clipboard copying functionality.

---

**Enjoy coding efficiently!**