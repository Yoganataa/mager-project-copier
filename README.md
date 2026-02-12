# Mager Project Copier

Mager is a high-performance **Rust-based TUI and CLI tool** for scanning project structures and copying their contents into a format optimized for LLMs (Large Language Models).

![Mager TUI](https://raw.githubusercontent.com/mager-project/copier/main/assets/tui-demo.gif)

## Features

- **Blazing Fast**: Uses the `ignore` crate (same engine as `ripgrep`) for efficient, parallel file scanning.
- **Smart Filtering**: Respects `.gitignore`, hidden files, and automatically detects binary/large files to skip.
- **Interactive TUI**: Navigate your project tree, toggle files/folders, and preview content before copying.
- **Headless CLI**: Automate snapshot generation for CI/CD or scripts.
- **Token Efficient**: Estimates token usage and warns about large files.
- **Deterministic**: Always produces the same output structure for the same project state.

## Installation

### From Binary
Download the latest release for your platform from the [Releases](https://github.com/mager-project/copier/releases) page.

### From Source
```bash
cargo install --path crates/mager_tui
cargo install --path crates/mager_cli
```

## Usage

### TUI (Interactive Mode)
Launch the interactive interface to explore and select files.

```bash
mager_tui [path]
```

- **Up/Down**: Navigate the file tree.
- **Space**: Toggle selection of file or directory (recursive).
- **s**: Rescan the project.
- **c**: Copy the generated snapshot to clipboard.
- **q**: Quit.

### CLI (Headless Mode)
Generate a snapshot directly to a file or stdout.

```bash
mager_cli --path . --output context.md
```

Options:
- `--path <PATH>`: Root directory to scan (default: `.`)
- `--output <FILE>`: Output file path. If omitted, prints to stdout.
- `--verbose`: Enable debug logging.
- `--template <ID>`: Apply a prompt template (e.g., `default`, `review`, `explain`).

## Architecture

The project is organized as a Rust workspace:

- `mager_core`: The business logic library. Handles file scanning, ignore rules, tree state management, and snapshot generation. UI-agnostic.
- `mager_tui`: The interactive frontend using `ratatui` and `crossterm`.
- `mager_cli`: The command-line interface using `clap`.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## License

MIT
