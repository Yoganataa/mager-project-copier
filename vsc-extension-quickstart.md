# Welcome to your VS Code Extension

## "mager-project-copier"

This project uses **esbuild** for fast compilation and **ESLint** for code quality.

## Folder Structure

* `src/`: Contains the source code.
    * `src/extension.ts`: The entry point.
    * `src/sidebar/`: UI logic for the Webview/Sidebar.
    * `src/core/`: Core logic (File scanning, Token estimation, Snapshot building).
* `package.json`: Manifest file defining the extension and scripts.

## Get Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the extension**:
    * Press `F5` in VS Code.
    * This will start the `watch` task (which runs `esbuild --watch` and `tsc --watch`) and open a new window with your extension loaded.

3.  **Test the functionality**:
    * Open the newly opened VS Code window.
    * Open a folder/workspace.
    * Click on the **Mager Project** icon in the Activity Bar.
    * Verify that the file tree loads and the "Copy" button works.

## Scripts

* `npm run compile`: Compiles the extension (runs type checking, linting, and esbuild).
* `npm run watch`: Watches for changes and rebuilds automatically (for development).
* `npm run package`: Prepares the extension for production (minified build).
* `npm run test`: Runs the test suite.
* `npm run lint`: Runs ESLint to check for code style issues.

## Debugging

* Open `src/extension.ts`.
* Add breakpoints.
* Press `F5` to start debugging.
* Check the **Debug Console** for output.

## Changes

* If you change `package.json` (e.g., adding commands or views), you may need to reload the Extension Development Host window (`Ctrl+R` or `Cmd+R`).