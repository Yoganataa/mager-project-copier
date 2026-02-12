use crate::model::{ProjectNode, NodeType};
use crate::error::Result;
use std::io::Write;
use std::fs;

pub trait SnapshotGenerator {
    fn generate<W: Write>(&self, root: &ProjectNode, writer: &mut W) -> Result<()>;
}

pub struct MarkdownGenerator;

impl SnapshotGenerator for MarkdownGenerator {
    fn generate<W: Write>(&self, root: &ProjectNode, writer: &mut W) -> Result<()> {
        writeln!(writer, "# Project Structure\n")?;
        self.write_tree(root, writer, "", true)?;

        writeln!(writer, "\n---\n")?;

        self.write_contents(root, root, writer)?;

        Ok(())
    }
}

impl MarkdownGenerator {
    fn write_tree<W: Write>(
        &self,
        node: &ProjectNode,
        writer: &mut W,
        prefix: &str,
        is_last: bool
    ) -> Result<()> {
        // Skip unchecked nodes, UNLESS they are directories that contain checked children
        if !self.should_show_in_tree(node) {
            return Ok(());
        }

        if node.depth > 0 { // Don't print root node connector
             let connector = if is_last { "└── " } else { "├── " };
             writeln!(writer, "{}{}{}", prefix, connector, self.format_name(node))?;
        } else {
             writeln!(writer, "{}/", node.name)?;
        }

        if let NodeType::Directory = node.node_type {
            let visible_children: Vec<&ProjectNode> = node.children.iter()
                .filter(|c| self.should_show_in_tree(c))
                .collect();

            let count = visible_children.len();
            for (i, child) in visible_children.into_iter().enumerate() {
                let is_child_last = i == count - 1;
                let child_prefix = if node.depth > 0 {
                    format!("{}{}", prefix, if is_last { "    " } else { "│   " })
                } else {
                    prefix.to_string()
                };
                self.write_tree(child, writer, &child_prefix, is_child_last)?;
            }
        }

        Ok(())
    }

    fn should_show_in_tree(&self, node: &ProjectNode) -> bool {
        if node.checked {
            return true;
        }
        // If directory, show if any child is checked
        if let NodeType::Directory = node.node_type {
             return node.children.iter().any(|c| self.should_show_in_tree(c));
        }
        false
    }

    fn format_name(&self, node: &ProjectNode) -> String {
        match &node.node_type {
            NodeType::Directory => format!("{}/", node.name),
            NodeType::File { is_binary, size, .. } => {
                let mut name = node.name.clone();
                if *is_binary {
                    name.push_str(" [Binary]");
                }
                if *size > 1024 * 1024 { // 1MB
                    name.push_str(" [Large]");
                }
                name
            }
        }
    }

    fn write_contents<W: Write>(&self, root: &ProjectNode, node: &ProjectNode, writer: &mut W) -> Result<()> {
        match &node.node_type {
            NodeType::Directory => {
                for child in &node.children {
                    // Only recurse if the directory itself is checked or has checked children
                    // Actually, for content, we only care about CHECKED FILES.
                    self.write_contents(root, child, writer)?;
                }
            }
            NodeType::File { is_binary, size, extension, .. } => {
                 if !node.checked {
                    return Ok(());
                }

                // pathdiff works with Paths, not necessarily existing files, but we have real paths here.
                let relative_path = pathdiff::diff_paths(&node.path, &root.path)
                    .unwrap_or_else(|| node.path.clone());

                writeln!(writer, "\n## {}\n", relative_path.display())?;

                if *is_binary {
                    writeln!(writer, "> [Skipped: Binary file]")?;
                } else if *size > 1024 * 1024 {
                     writeln!(writer, "> [Skipped: File too large (>1MB)]")?;
                } else {
                    match fs::read_to_string(&node.path) {
                        Ok(content) => {
                            let lang = self.map_language(extension);
                            writeln!(writer, "```{}\n{}\n```", lang, content)?;
                        }
                        Err(e) => {
                             writeln!(writer, "> [Error reading file: {}]", e)?;
                        }
                    }
                }
            }
        }
        Ok(())
    }

    fn map_language(&self, ext: &str) -> &str {
        match ext {
            "rs" => "rust",
            "ts" | "tsx" => "typescript",
            "js" | "jsx" => "javascript",
            "py" => "python",
            "yml" | "yaml" => "yaml",
            "json" => "json",
            "md" => "markdown",
            "toml" => "toml",
            "sh" => "bash",
            "go" => "go",
            "c" | "h" => "c",
            "cpp" | "hpp" | "cc" => "cpp",
            "java" => "java",
            _ => "",
        }
    }
}
