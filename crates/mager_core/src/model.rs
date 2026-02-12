use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NodeType {
    File {
        size: u64,
        is_binary: bool,
        extension: String,
        token_estimate: Option<usize>,
    },
    Directory,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ProjectNode {
    pub path: PathBuf,
    pub name: String,
    pub node_type: NodeType,
    pub checked: bool,
    pub children: Vec<ProjectNode>,
    pub depth: usize,
}

impl ProjectNode {
    pub fn new_file(path: PathBuf, name: String, size: u64, is_binary: bool, depth: usize) -> Self {
        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        Self {
            path,
            name,
            node_type: NodeType::File {
                size,
                is_binary,
                extension,
                token_estimate: None,
            },
            checked: true, // Default to checked
            children: vec![],
            depth,
        }
    }

    pub fn new_directory(path: PathBuf, name: String, depth: usize) -> Self {
        Self {
            path,
            name,
            node_type: NodeType::Directory,
            checked: true, // Default to checked
            children: vec![],
            depth,
        }
    }

    pub fn is_file(&self) -> bool {
        matches!(self.node_type, NodeType::File { .. })
    }

    pub fn is_directory(&self) -> bool {
        matches!(self.node_type, NodeType::Directory)
    }

    pub fn add_child(&mut self, child: ProjectNode) {
        if self.is_directory() {
            self.children.push(child);
        }
    }

    // Sort children: Directories first, then Files. Alphabetical within each group.
    pub fn sort_children(&mut self) {
        self.children.sort_by(|a, b| {
            match (&a.node_type, &b.node_type) {
                (NodeType::Directory, NodeType::File { .. }) => std::cmp::Ordering::Less,
                (NodeType::File { .. }, NodeType::Directory) => std::cmp::Ordering::Greater,
                _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
            }
        });

        for child in &mut self.children {
            if child.is_directory() {
                child.sort_children();
            }
        }
    }

    // Recursively set checked state
    pub fn set_checked(&mut self, checked: bool) {
        self.checked = checked;
        for child in &mut self.children {
            child.set_checked(checked);
        }
    }
}
