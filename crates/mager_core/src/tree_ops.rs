use crate::model::{ProjectNode, NodeType};
use std::path::Path;

/// Updates the check state of a node at `target_path`.
/// - If the node is found, its state (and all descendants) is set to `checked`.
/// - Parent directory states are automatically updated to reflect the new state of children.
pub fn update_node_check_state(root: &mut ProjectNode, target_path: &Path, checked: bool) {
    update_node_recursive(root, target_path, checked);
}

fn update_node_recursive(node: &mut ProjectNode, target_path: &Path, checked: bool) -> bool {
    // 1. Check if this is the target node
    if node.path == target_path {
        set_recursive(node, checked);
        return true;
    }

    // 2. If it's a directory, search children
    let mut found_in_subtree = false;
    if let NodeType::Directory = node.node_type {
        for child in &mut node.children {
            if update_node_recursive(child, target_path, checked) {
                found_in_subtree = true;
                // Since paths are unique, we can stop searching other branches
                break;
            }
        }

        // 3. If the target was found in our subtree, we must re-evaluate our own state.
        // A directory is checked if and only if ALL of its children are checked.
        if found_in_subtree {
            if node.children.is_empty() {
                // Keep existing state or default to true/false?
                // Logic: An empty directory's state is manual.
            } else {
                node.checked = node.children.iter().all(|c| c.checked);
            }
        }
    }

    found_in_subtree
}

fn set_recursive(node: &mut ProjectNode, checked: bool) {
    node.checked = checked;
    if let NodeType::Directory = node.node_type {
        for child in &mut node.children {
            set_recursive(child, checked);
        }
    }
}

pub fn count_checked_files(node: &ProjectNode) -> usize {
    match node.node_type {
        NodeType::File { .. } => {
            if node.checked { 1 } else { 0 }
        }
        NodeType::Directory => {
            node.children.iter().map(count_checked_files).sum()
        }
    }
}

pub fn count_total_files(node: &ProjectNode) -> usize {
    match node.node_type {
        NodeType::File { .. } => 1,
        NodeType::Directory => {
            node.children.iter().map(count_total_files).sum()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn create_test_tree() -> ProjectNode {
        // root
        // ├── dir1
        // │   ├── file1.txt
        // │   └── file2.txt
        // └── file3.txt
        let mut root = ProjectNode::new_directory(PathBuf::from("root"), "root".to_string(), 0);

        let mut dir1 = ProjectNode::new_directory(PathBuf::from("root/dir1"), "dir1".to_string(), 1);
        let file1 = ProjectNode::new_file(PathBuf::from("root/dir1/file1.txt"), "file1.txt".to_string(), 10, false, 2);
        let file2 = ProjectNode::new_file(PathBuf::from("root/dir1/file2.txt"), "file2.txt".to_string(), 10, false, 2);

        dir1.children.push(file1);
        dir1.children.push(file2);
        root.children.push(dir1);

        let file3 = ProjectNode::new_file(PathBuf::from("root/file3.txt"), "file3.txt".to_string(), 10, false, 1);
        root.children.push(file3);

        root
    }

    #[test]
    fn test_update_check_state() {
        let mut root = create_test_tree();

        // Initial state: all checked
        assert!(root.checked);
        assert!(root.children[0].checked); // dir1

        // Uncheck file1.txt
        update_node_check_state(&mut root, Path::new("root/dir1/file1.txt"), false);

        // dir1 should be unchecked because not all children are checked
        let dir1 = &root.children[0];
        assert!(!dir1.checked);
        // file2 should still be checked
        assert!(dir1.children[1].checked);

        // root should be unchecked
        assert!(!root.checked);

        // check file1.txt again
        update_node_check_state(&mut root, Path::new("root/dir1/file1.txt"), true);
        assert!(root.checked);
    }

    #[test]
    fn test_recursive_uncheck() {
        let mut root = create_test_tree();

        // Uncheck dir1
        update_node_check_state(&mut root, Path::new("root/dir1"), false);

        // Children of dir1 should be unchecked
        let dir1 = &root.children[0];
        assert!(!dir1.children[0].checked);
        assert!(!dir1.children[1].checked);

        // root should be unchecked
        assert!(!root.checked);
    }
}
