# Welcome to your VS Code Extension

## "mager-project-copier"

**Mager Project Copier** is a powerful tool to generate AI-ready project snapshots. This project uses **esbuild** for fast compilation and **ESLint** for code quality.

## Folder Structure (Modular)

* `src/`: Contains the source code.
    * `src/extension.ts`: The entry point (activates Sidebar & Context Menu).
    * `src/sidebar/`: UI & Interaction logic.
        * `src/sidebar/SidebarProvider.ts`: Main controller (Message passing).
        * `src/sidebar/view/htmlRenderer.ts`: HTML template with embedded JS/CSS for the Webview.
        * `src/sidebar/handlers/`: Logic for specific actions (copy, copy-tree, scan).
    * `src/core/`: Core business logic.
        * `fileScanner.ts`: Recursive file scanning with size limits.
        * `updateManager.ts`: Self-hosted auto-update logic via GitHub.
        * `templateManager.ts`: Prompt template management.
        * `snapshotBuilder.ts`: Markdown/XML output generator & Tree builder.
    * `src/utils/`: Helper functions (Git, FS, Semver).
    * `src/data/`: Static constants (Output Formats).
* `package.json`: Manifest file defining the extension, commands, and configuration.

## Features & Usage

### 1. Sidebar Panel
* **Scan All**: Scans the entire workspace respecting `.gitignore`.
* **Scan Git**: Scans only modified or untracked files (useful for code reviews).
* **Copy Tree**: Generates a lightweight structure-only snapshot (ASCII or Path List).
* **Keyboard Nav**: Full accessibility support for navigating the tree view.
* **Search**: Filter the file tree with visual highlighting.

### 2. Context Menu (Quick Copy)
* Right-click on any folder in the VS Code Explorer.
* Select **"Copy Snapshot (Mager Project)"**.
* The folder content is copied to your clipboard immediately.

### 3. Configuration (Custom Templates)
You can add your own prompts in `settings.json`:

```json
"magerProject.customTemplates": [
  {
    "id": "my-custom",
    "label": "My Custom Prompt",
    "description": "My personal prompt style",
    "prompt": "Review this code for performance:\n\n{context}"
  }
]