# Mager Project Copier

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/Visual%20Studio%20Code-007ACC?logo=visual-studio-code&logoColor=white)](https://code.visualstudio.com/)
[![GitHub Release](https://img.shields.io/github/v/release/yoganataa/mager-project-copier?label=latest%20release)](https://github.com/yoganataa/mager-project-copier/releases)

**Mager Project Copier** is a powerful VS Code extension designed to streamline the process of sharing your code context with AI Large Language Models (LLMs) like Claude, GPT-4, and Gemini.

Stop manually copying files one by one. Create a comprehensive, AI-ready snapshot of your entire project (or just the git changes) with a single click.

## ✨ Key Features

* **🚀 Flexible Export Formats**: Choose between optimized formats based on your needs:
    * **Markdown**: Standard format, great for GPT-4, Gemini, and documentation.
    * **XML**: Structured format, optimized for Claude's long-context reasoning.
* **🌳 Copy Tree Only**: Need to ask AI about project structure? Copy just the folder tree in **ASCII** or **Path List** format to save tokens.
* **⌨️ Keyboard Navigation**: Fully navigable file tree using Arrow keys, Space to select, and Enter to open.
* **Git Integration**: Use **"Scan Git"** to copy *only* modified and untracked files. Perfect for Code Reviews!
* **⚡ Auto-Update**: Self-hosted auto-update system. The extension automatically checks GitHub Releases for new versions.
* **🎨 Custom Templates**: Add your own prompts via `settings.json` (e.g., "Senior Java Review", "Security Audit").
* **🛡️ Smart Filtering**:
    * Respects `.gitignore` rules.
    * Auto-hides sensitive files (`.env`, secrets).
    * **Performance Guard**: Automatically ignores large files (>1MB) to prevent freezing.
* **🔍 Search & Highlight**: Real-time filter bar with text highlighting for easy navigation.

## 📥 Installation

Since this extension is **Self-Hosted** (not in the Marketplace yet), you can install it manually:

1.  Go to the [**Releases**](https://github.com/yoganataa/mager-project-copier/releases) page.
2.  Download the latest `.vsix` file.
3.  In VS Code, open the Extensions view (`Ctrl+Shift+X`).
4.  Click the `...` menu (Views and More Actions) > **Install from VSIX...**
5.  Select the downloaded file.

## 📖 Usage

### 1. Sidebar Panel
Open the **Mager Project** view in the Activity Bar.
* **Scan All**: Scans the entire workspace.
* **Scan Git**: Scans only files that have changed (modified/new).
* **Format**: Select **Markdown** or **XML** output.
* **Copy All**: Copies the full snapshot (Structure + Content) to your clipboard.
* **Copy Tree**: Copies only the directory structure (ASCII/Path).

### 2. Keyboard Shortcuts
Navigate the file tree efficiently:
* `⬆️` / `⬇️`: Navigate rows.
* `➡️`: Expand folder / Move to child.
* `⬅️`: Collapse folder / Move to parent.
* `Space`: Check / Uncheck file.
* `Enter`: Open file in editor / Toggle folder.

### 3. Custom Templates
You can define your own reusable prompts in your VS Code `settings.json`:

```json
"magerProject.customTemplates": [
  {
    "id": "senior-review",
    "label": "Senior Dev Review",
    "description": "Strict code review mode",
    "prompt": "You are a Senior Engineer. Review this code strictly for performance:\n\n{context}"
  }
]