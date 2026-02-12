use crate::model::ProjectNode;
use crate::error::{Error, Result};
use ignore::WalkBuilder;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::io::Read;

const MAX_FILE_SIZE: u64 = 1 * 1024 * 1024; // 1MB
const MAX_TOTAL_FILES: usize = 50_000;
const BINARY_CHECK_BYTES: usize = 8192;

/// Configuration for the scanner.
#[derive(Debug, Clone)]
pub struct ScanOptions {
    pub root_path: PathBuf,
    pub use_gitignore: bool,
    pub exclude_hidden: bool,
    pub max_file_size: u64,
}

impl Default for ScanOptions {
    fn default() -> Self {
        Self {
            root_path: PathBuf::from("."),
            use_gitignore: true,
            exclude_hidden: true,
            max_file_size: MAX_FILE_SIZE,
        }
    }
}

pub struct Scanner {
    options: ScanOptions,
}

impl Scanner {
    pub fn new(options: ScanOptions) -> Self {
        Self { options }
    }

    pub fn scan(&self) -> Result<ProjectNode> {
        let root_path = fs::canonicalize(&self.options.root_path)?;

        let mut walker_builder = WalkBuilder::new(&root_path);
        walker_builder
            .standard_filters(self.options.use_gitignore)
            .hidden(self.options.exclude_hidden)
            .require_git(false); // Do not require a .git folder to respect .gitignore

        // We collect all entries first to sort them deterministically
        // Key: Parent Path, Value: List of Child Nodes
        let mut tree_map: HashMap<PathBuf, Vec<ProjectNode>> = HashMap::new();
        let mut file_count = 0;

        for result in walker_builder.build() {
            if file_count > MAX_TOTAL_FILES {
                return Err(Error::Scan(format!(
                    "File limit exceeded ({} files). Please narrow your scan or add ignore rules.",
                    MAX_TOTAL_FILES
                )));
            }

            let entry = match result {
                Ok(e) => e,
                Err(err) => {
                    tracing::warn!("Error walking entry: {}", err);
                    continue;
                }
            };

            let path = entry.path().to_path_buf();

            // Skip the root folder itself in the iteration, we construct it manually at the end
            if path == root_path {
                continue;
            }

            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue, // Skip if we can't get metadata
            };

            let parent = path.parent().unwrap_or(&root_path).to_path_buf();
            let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
            let depth = path.components().count(); // Approximate depth

            let node = if metadata.is_dir() {
                 ProjectNode::new_directory(path.clone(), name, depth)
            } else {
                file_count += 1;
                let size = metadata.len();
                let is_binary = self.is_binary(&path, size)?;

                ProjectNode::new_file(path.clone(), name, size, is_binary, depth)
            };

            tree_map.entry(parent).or_default().push(node);
        }

        // Now reconstruct the tree recursively
        let mut root_node = ProjectNode::new_directory(
            root_path.clone(),
            root_path.file_name().unwrap_or_default().to_string_lossy().to_string(),
            0
        );

        self.build_tree_recursive(&mut root_node, &mut tree_map);

        Ok(root_node)
    }

    fn build_tree_recursive(&self, node: &mut ProjectNode, tree_map: &mut HashMap<PathBuf, Vec<ProjectNode>>) {
        if let Some(mut children) = tree_map.remove(&node.path) {
            // Deterministic sort: Directories first, then alphabetical
            children.sort_by(|a, b| {
                match (a.is_directory(), b.is_directory()) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                }
            });

            for mut child in children {
                if child.is_directory() {
                    self.build_tree_recursive(&mut child, tree_map);
                }
                node.add_child(child);
            }
        }
    }

    fn is_binary(&self, path: &Path, size: u64) -> Result<bool> {
        // 1. Check extension
        if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
            if self.is_binary_extension(ext) {
                return Ok(true);
            }
        }

        // 2. Check size
        if size == 0 {
            return Ok(false);
        }

        if size > self.options.max_file_size {
             return Ok(false);
        }

        // 3. Read start of file
        let mut file = fs::File::open(path)?;
        let mut buffer = [0; BINARY_CHECK_BYTES];
        let n = file.read(&mut buffer).unwrap_or(0);

        if buffer[..n].contains(&0) {
            return Ok(true);
        }

        Ok(false)
    }

    fn is_binary_extension(&self, ext: &str) -> bool {
        matches!(ext.to_lowercase().as_str(),
            "png" | "jpg" | "jpeg" | "gif" | "ico" | "svg" | "webp" |
            "zip" | "tar" | "gz" | "7z" | "rar" |
            "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" |
            "exe" | "dll" | "so" | "dylib" | "bin" | "iso" |
            "pyc" | "class" | "jar" | "war" | "db" | "sqlite"
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use tempfile::tempdir;

    #[test]
    fn test_scan_simple_dir() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("hello.txt");
        let mut file = File::create(file_path).unwrap();
        writeln!(file, "Hello world").unwrap();

        let options = ScanOptions {
            root_path: dir.path().to_path_buf(),
            ..Default::default()
        };
        let scanner = Scanner::new(options);
        let root = scanner.scan().unwrap();

        assert_eq!(root.children.len(), 1);
        assert_eq!(root.children[0].name, "hello.txt");
    }

    #[test]
    fn test_binary_detection() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("binary.bin");
        let mut file = File::create(file_path).unwrap();
        file.write_all(&[0, 1, 2, 3, 0]).unwrap(); // Null bytes

        let options = ScanOptions {
            root_path: dir.path().to_path_buf(),
            ..Default::default()
        };
        let scanner = Scanner::new(options);
        let root = scanner.scan().unwrap();

        if let NodeType::File { is_binary, .. } = root.children[0].node_type {
            assert!(is_binary);
        } else {
            panic!("Should be a file");
        }
    }

    #[test]
    fn test_ignore_git() {
        let dir = tempdir().unwrap();

        // Create .gitignore
        let gitignore_path = dir.path().join(".gitignore");
        let mut gitignore = File::create(gitignore_path).unwrap();
        writeln!(gitignore, "secret.txt").unwrap();

        // Create ignored file
        let secret_path = dir.path().join("secret.txt");
        File::create(secret_path).unwrap();

        // Create normal file
        let normal_path = dir.path().join("normal.txt");
        File::create(normal_path).unwrap();

        let options = ScanOptions {
            root_path: dir.path().to_path_buf(),
            use_gitignore: true,
            // .gitignore is hidden by default in ignore crate unless explicitly un-hidden or hidden(false) is set?
            // Actually, "standard_filters" includes hidden file filtering if not configured otherwise.
            // But .gitignore itself is usually desired in the tree.
            // The ignore crate hides .git/ but shows .gitignore by default unless it's in .gitignore?
            // Let's check `exclude_hidden`.
            exclude_hidden: false,
            ..Default::default()
        };

        let scanner = Scanner::new(options);
        let root = scanner.scan().unwrap();

        let names: Vec<_> = root.children.iter().map(|n| n.name.as_str()).collect();
        assert!(names.contains(&"normal.txt"));
        assert!(names.contains(&".gitignore"));
        assert!(!names.contains(&"secret.txt"));
    }
}
