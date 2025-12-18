# Mager Project Copier

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/Visual%20Studio%20Code-007ACC?logo=visual-studio-code&logoColor=white)](https://code.visualstudio.com/)
[![GitHub Release](https://img.shields.io/github/v/release/yoganataa/mager-project-copier?label=latest%20release)](https://github.com/yoganataa/mager-project-copier/releases)

**Mager Project Copier** is a powerful VS Code extension designed to streamline the process of sharing your code context with AI Large Language Models (LLMs) like Claude, GPT-4, and Gemini.

Stop manually copying files one by one. Create a comprehensive, AI-ready snapshot of your entire project (or just the git changes) with a single click.

## ✨ Key Features

* **🚀 One-Click Snapshot**: Instantly copy your project structure and file contents into the clipboard.
* **🧠 Model-Aware Output**: Automatically formats the output based on your target AI:
    * **XML Format** for **Claude** (Optimized for long-context reasoning).
    * **Markdown** for **GPT-4** & **Gemini**.
* **Git Integration**: Use **"Scan Git"** to copy *only* modified and untracked files. Perfect for Code Reviews!
* **⚡ Auto-Update**: Self-hosted auto-update system. The extension automatically checks GitHub Releases for new versions.
* **🎨 Custom Templates**: Add your own prompts via `settings.json` (e.g., "Senior Java Review", "Security Audit").
* **🛡️ Smart Filtering**:
    * Respects `.gitignore` rules.
    * Auto-hides sensitive files (`.env`, secrets).
    * **Performance Guard**: Automatically ignores large files (>1MB) to prevent freezing.
* **🔍 Search & Navigate**: Real-time filter bar in the sidebar tree view.
* **📂 Context Menu**: Right-click any folder in Explorer to **"Copy Snapshot"** instantly.

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
* **Templates**: Select a preset (e.g., "Code Review") or a custom template.
* **Copy**: Copies the snapshot to your clipboard.

### 2. Quick Copy (Context Menu)
Right-click on any folder in your file explorer and select **"Copy Snapshot (Mager Project)"**.

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