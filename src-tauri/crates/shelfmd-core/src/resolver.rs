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
mod fixture_tests {
    use super::*;
    use std::path::PathBuf;

    fn fixture_root() -> PathBuf {
        // Resolve relative to CARGO_MANIFEST_DIR
        let manifest = env!("CARGO_MANIFEST_DIR");
        PathBuf::from(manifest)
            .parent().unwrap() // crates/
            .parent().unwrap() // src-tauri/
            .parent().unwrap() // ShelfMD/
            .join("tests/fixtures/book")
    }

    fn fixture_file(rel: &str) -> PathBuf {
        fixture_root().join(rel)
    }

    // AT-01: ch01.md → [Next](../ch 02/README.md#setup)
    #[test]
    fn resolves_spaced_folder_with_anchor() {
        let current = fixture_file("part1/ch01/README.md");
        let root = fixture_root();
        let result = resolve_link(&current, "../ch 02/README.md#setup", Some(&root));
        match result {
            LinkType::Markdown(path, Some(anchor)) => {
                assert!(path.exists(), "resolved path must exist: {:?}", path);
                assert_eq!(anchor, "setup");
            }
            other => panic!("expected Markdown with anchor, got {:?}", other),
        }
    }

    // AT-03: extensionless link
    #[test]
    fn resolves_extensionless_link() {
        let current = fixture_file("README.md");
        let root = fixture_root();
        let result = resolve_link(&current, "intro", Some(&root));
        match result {
            LinkType::Markdown(path, None) => {
                assert!(path.exists(), "resolved path must exist: {:?}", path);
                assert!(path.to_string_lossy().ends_with("intro.md"));
            }
            other => panic!("expected Markdown, got {:?}", other),
        }
    }

    // Broken link stays broken
    #[test]
    fn broken_link_against_fixture() {
        let current = fixture_file("part1/ch01/README.md");
        let root = fixture_root();
        let result = resolve_link(&current, "../missing/chapter.md", Some(&root));
        assert!(matches!(result, LinkType::Broken(_)));
    }

    // URL-encoded space in path
    #[test]
    fn resolves_url_encoded_space() {
        let current = fixture_file("part1/ch01/README.md");
        let root = fixture_root();
        // URL-encoded version of "../ch 02/README.md"
        let result = resolve_link(&current, "../ch%2002/README.md", Some(&root));
        match result {
            LinkType::Markdown(path, None) => {
                assert!(path.exists(), "resolved path must exist: {:?}", path);
            }
            other => panic!("expected Markdown, got {:?}", other),
        }
    }

    // Root-relative path
    #[test]
    fn resolves_root_relative_path() {
        let current = fixture_file("part1/ch01/README.md");
        let root = fixture_root();
        let result = resolve_link(&current, "/GLOSSARY.md", Some(&root));
        match result {
            LinkType::Markdown(path, None) => {
                assert!(path.exists(), "resolved path must exist: {:?}", path);
                assert!(path.to_string_lossy().ends_with("GLOSSARY.md"));
            }
            other => panic!("expected Markdown, got {:?}", other),
        }
    }
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
