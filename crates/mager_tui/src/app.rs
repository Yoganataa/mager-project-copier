use crossterm::event::{KeyCode, KeyEventKind};
use ratatui::{
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, List, ListItem, ListState, Paragraph, Wrap},
    Frame,
};
use mager_core::{
    model::{ProjectNode, NodeType},
    scanner::{Scanner, ScanOptions},
    snapshot::MarkdownGenerator,
    snapshot::SnapshotGenerator,
    tree_ops,
};
use std::path::PathBuf;
use arboard::Clipboard;

#[derive(Debug, PartialEq)]
enum AppMode {
    Normal,
    // Future: TemplateSelect, FrameworkSelect
}

pub struct App {
    mode: AppMode,
    pub tree_root: Option<ProjectNode>,
    pub flat_tree: Vec<ProjectNode>, // Flattened visible tree for List widget
    pub list_state: ListState,
    pub root_path: PathBuf,
    pub should_quit: bool,
    pub status_message: String,

    // Preview cache
    pub preview_content: String,
}

impl App {
    pub fn new(path: PathBuf) -> Self {
        Self {
            mode: AppMode::Normal,
            tree_root: None,
            flat_tree: Vec::new(),
            list_state: ListState::default(),
            root_path: path,
            should_quit: false,
            status_message: "Press 's' to scan, 'SPACE' to toggle, 'c' to copy, 'q' to quit".to_string(),
            preview_content: String::new(),
        }
    }

    pub fn scan(&mut self) -> anyhow::Result<()> {
        self.status_message = "Scanning...".to_string();
        // Sync scan for now (should be async in real world, but for TUI init it's ok)
        let scanner = Scanner::new(ScanOptions {
            root_path: self.root_path.clone(),
            ..Default::default()
        });

        let root = scanner.scan().map_err(|e| anyhow::anyhow!(e))?;
        self.tree_root = Some(root.clone());
        self.rebuild_flat_tree();
        self.list_state.select(Some(0));
        self.update_preview();

        if let Some(r) = &self.tree_root {
            self.status_message = format!("Scanned {} files. Ready.", tree_ops::count_total_files(r));
        }

        Ok(())
    }

    fn rebuild_flat_tree(&mut self) {
        self.flat_tree.clear();
        // Clone root to avoid borrow checker issues during recursion
        if let Some(root) = &self.tree_root {
            let root_clone = root.clone();
            self.flatten_recursive(&root_clone, 0);
        }
    }

    fn flatten_recursive(&mut self, node: &ProjectNode, depth: usize) {
        // Create a visual copy with depth info
        let mut visual_node = node.clone();
        visual_node.depth = depth;
        self.flat_tree.push(visual_node);

        if let NodeType::Directory = node.node_type {
            // If we had expanded state, we'd check it here.
            // For now, assume expanded.
            for child in &node.children {
                self.flatten_recursive(child, depth + 1);
            }
        }
    }

    pub fn on_tick(&mut self) {}

    pub fn on_key(&mut self, key: crossterm::event::KeyEvent) {
        if key.kind != KeyEventKind::Press {
            return;
        }

        match key.code {
            KeyCode::Char('q') => self.should_quit = true,
            KeyCode::Char('s') => {
                if let Err(e) = self.scan() {
                    self.status_message = format!("Error: {}", e);
                }
            },
            KeyCode::Char(' ') => self.toggle_selection(),
            KeyCode::Char('c') => {
                 if let Err(e) = self.copy_snapshot() {
                     self.status_message = format!("Copy Error: {}", e);
                 } else {
                     self.status_message = "Snapshot copied to clipboard!".to_string();
                 }
            },
            KeyCode::Down => self.move_selection(1),
            KeyCode::Up => self.move_selection(-1),
            _ => {}
        }
    }

    fn toggle_selection(&mut self) {
        if let Some(i) = self.list_state.selected() {
            if let Some(node) = self.flat_tree.get(i) {
                let target_path = node.path.clone();
                let new_state = !node.checked;

                // 1. Mutate the tree root
                if let Some(root) = &mut self.tree_root {
                    tree_ops::update_node_check_state(root, &target_path, new_state);
                }

                // 2. Rebuild the flat visual tree to reflect changes (recursive check updates)
                self.rebuild_flat_tree();

                // 3. Update stats (requires immutable borrow of root)
                if let Some(root) = &self.tree_root {
                    let checked = tree_ops::count_checked_files(root);
                    self.status_message = format!("Selected {} files", checked);
                }
            }
        }
    }

    fn copy_snapshot(&mut self) -> anyhow::Result<()> {
        if let Some(root) = &self.tree_root {
            let mut buffer = Vec::new();
            let generator = MarkdownGenerator;
            generator.generate(root, &mut buffer)?;

            let content = String::from_utf8(buffer)?;

            // Clipboard
            let mut clipboard = Clipboard::new().map_err(|e| anyhow::anyhow!(e))?;
            clipboard.set_text(content).map_err(|e| anyhow::anyhow!(e))?;
        }
        Ok(())
    }

    fn move_selection(&mut self, delta: i32) {
        if self.flat_tree.is_empty() { return; }

        let i = match self.list_state.selected() {
            Some(i) => {
                let next = i as i32 + delta;
                if next < 0 {
                    0
                } else if next >= self.flat_tree.len() as i32 {
                    self.flat_tree.len() - 1
                } else {
                    next as usize
                }
            }
            None => 0,
        };
        self.list_state.select(Some(i));
        self.update_preview();
    }

    fn update_preview(&mut self) {
        if let Some(i) = self.list_state.selected() {
            if let Some(node) = self.flat_tree.get(i) {
                if let NodeType::File { size, is_binary, .. } = node.node_type {
                    if is_binary {
                        self.preview_content = "[Binary File]".to_string();
                    } else if size > 10 * 1024 {
                        self.preview_content = "[File too large for preview]".to_string();
                    } else {
                         // Read file content
                         match std::fs::read_to_string(&node.path) {
                             Ok(c) => self.preview_content = c,
                             Err(e) => self.preview_content = format!("Error reading file: {}", e),
                         }
                    }
                } else {
                    self.preview_content = format!("Directory: {}", node.name);
                }
            }
        }
    }
}

pub fn ui(frame: &mut Frame, app: &mut App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(0),
            Constraint::Length(1), // Status bar
        ])
        .split(frame.size());

    let main_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage(40), // Tree
            Constraint::Percentage(60), // Preview
        ])
        .split(chunks[0]);

    // Tree Widget
    let items: Vec<ListItem> = app.flat_tree.iter().map(|node| {
        let prefix = "  ".repeat(node.depth);
        let check_mark = if node.checked { "[x]" } else { "[ ]" };
        let icon = if node.is_directory() { "📁" } else { "📄" };
        let name = &node.name;

        let style = if node.checked {
             Style::default()
        } else {
             Style::default().fg(Color::DarkGray)
        };

        ListItem::new(format!("{}{} {} {}", prefix, check_mark, icon, name)).style(style)
    }).collect();

    let tree_list = List::new(items)
        .block(Block::default().borders(Borders::ALL).title("File Tree"))
        .highlight_style(Style::default().add_modifier(Modifier::REVERSED));

    frame.render_stateful_widget(tree_list, main_chunks[0], &mut app.list_state);

    // Preview Widget
    let preview = Paragraph::new(app.preview_content.as_str())
        .block(Block::default().borders(Borders::ALL).title("Preview"))
        .wrap(Wrap { trim: false });

    frame.render_widget(preview, main_chunks[1]);

    // Status Bar
    let status = Paragraph::new(app.status_message.as_str())
        .style(Style::default().bg(Color::Blue).fg(Color::White));
    frame.render_widget(status, chunks[1]);
}
