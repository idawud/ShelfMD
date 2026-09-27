use path_clean::PathClean;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq)]
pub enum LinkType {
    Markdown(PathBuf, Option<String>), // path + optional anchor
    Asset(PathBuf),
    External(String),
    Broken(String),
}

const MD_EXTENSIONS: &[&str] = &["md", "markdown", "mdown", "mkd"];

/// Resolve a link href relative to the current file's directory.
/// All path logic lives here in Rust, never in JS.
pub fn resolve_link(current_file: &Path, href: &str, book_root: Option<&Path>) -> LinkType {
    // Handle external links
    if href.starts_with("http://") || href.starts_with("https://") || href.starts_with("mailto:") {
        return LinkType::External(href.to_string());
    }

    // Split anchor
    let (path_part, anchor) = if let Some(pos) = href.find('#') {
        let (p, a) = href.split_at(pos);
        (p, Some(a[1..].to_string()))
    } else {
        (href, None)
    };

    // Pure anchor link (same file)
    if path_part.is_empty() {
        if let Some(a) = anchor {
            return LinkType::Markdown(current_file.to_path_buf(), Some(a));
        }
        return LinkType::Broken(href.to_string());
    }

    // URL-decode the path
    let decoded = urlencoding::decode(path_part).unwrap_or(std::borrow::Cow::Borrowed(path_part));

    // Normalise separators (accept both / and \)
    let normalised = decoded.replace('\\', "/");

    // Determine base directory and strip root slash
    let (base, rel) = if let Some(stripped) = normalised.strip_prefix('/') {
        // Root-relative: resolve against book root
        let base = if let Some(root) = book_root {
            root.to_path_buf()
        } else {
            current_file
                .parent()
                .unwrap_or(Path::new("."))
                .to_path_buf()
        };
        (base, stripped.to_string())
    } else {
        let base = current_file
            .parent()
            .unwrap_or(Path::new("."))
            .to_path_buf();
        (base, normalised.clone())
    };

    let candidate = base.join(&rel).clean();

    // Try as-is first
    if candidate.exists() {
        let ext = candidate
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if MD_EXTENSIONS.contains(&ext.as_str()) {
            return LinkType::Markdown(candidate, anchor);
        } else {
            return LinkType::Asset(candidate);
        }
    }

    // Try markdown extensions
    for ext in MD_EXTENSIONS {
        let with_ext = candidate.with_extension(ext);
        if with_ext.exists() {
            return LinkType::Markdown(with_ext, anchor);
        }
    }

    // Try <name>/README.md and <name>/index.md
    for index in &["README.md", "index.md"] {
        let index_path = candidate.join(index);
        if index_path.exists() {
            return LinkType::Markdown(index_path, anchor);
        }
    }

    // Windows case-insensitive fallback: scan parent directory
    #[cfg(target_os = "windows")]
    {
        if let Some(parent) = candidate.parent() {
            if parent.exists() {
                let stem = candidate
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                if let Ok(entries) = std::fs::read_dir(parent) {
                    for entry in entries.flatten() {
                        let name = entry.file_name();
                        let name_str = name.to_string_lossy().to_lowercase();
                        if name_str == stem
                            || MD_EXTENSIONS
                                .iter()
                                .any(|e| name_str == format!("{stem}.{e}"))
                        {
                            let p = entry.path();
                            let ext = p
                                .extension()
                                .and_then(|e| e.to_str())
                                .unwrap_or("")
                                .to_lowercase();
                            if MD_EXTENSIONS.contains(&ext.as_str()) {
                                return LinkType::Markdown(p, anchor);
                            }
                        }
                    }
                }
            }
        }
    }

    LinkType::Broken(href.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn p(s: &str) -> PathBuf {
        PathBuf::from(s)
    }

    #[test]
    fn external_links_pass_through() {
        assert!(matches!(
            resolve_link(&p("/book/ch01.md"), "https://example.com", None),
            LinkType::External(_)
        ));
        assert!(matches!(
            resolve_link(&p("/book/ch01.md"), "mailto:user@example.com", None),
            LinkType::External(_)
        ));
    }

    #[test]
    fn pure_anchor_same_file() {
        let result = resolve_link(&p("/book/ch01.md"), "#setup", None);
        assert_eq!(
            result,
            LinkType::Markdown(p("/book/ch01.md"), Some("setup".to_string()))
        );
    }

    #[test]
    fn broken_link_returns_broken() {
        let result = resolve_link(&p("/tmp/nonexistent_dir_xyz/ch01.md"), "missing.md", None);
        assert!(matches!(result, LinkType::Broken(_)));
    }
}
