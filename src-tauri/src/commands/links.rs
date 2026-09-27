use shelfmd_core::resolver::{resolve_link as do_resolve, LinkType};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Check if a resolved markdown file has a given heading slug.
/// Used by frontend to mark broken anchors.
#[tauri::command]
pub fn check_anchor_exists(file_path: String, slug: String) -> bool {
    use std::fs;
    let content = match fs::read_to_string(&file_path) {
        Ok(c) => c,
        Err(_) => return false,
    };
    // Check for heading with matching slug
    for line in content.lines() {
        if let Some(text) = line.strip_prefix('#') {
            let text = text.trim_start_matches('#').trim();
            let file_slug = shelfmd_core::slugs::slugify(text);
            if file_slug == slug {
                return true;
            }
        }
    }
    // Also check explicit <a id="..."> anchors
    content.contains(&format!("id=\"{}\"", slug)) || content.contains(&format!("name=\"{}\"", slug))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResolveResult {
    pub resolved: Option<String>,
    pub anchor: Option<String>,
    pub link_type: String, // "md" | "asset" | "external" | "broken"
}

#[tauri::command]
pub fn resolve_link(
    current_file: String,
    href: String,
    book_root: Option<String>,
) -> ResolveResult {
    let current = PathBuf::from(&current_file);
    let root = book_root.as_deref().map(PathBuf::from);

    match do_resolve(&current, &href, root.as_deref()) {
        LinkType::Markdown(path, anchor) => ResolveResult {
            resolved: Some(path.to_string_lossy().into_owned()),
            anchor,
            link_type: "md".into(),
        },
        LinkType::Asset(path) => ResolveResult {
            resolved: Some(path.to_string_lossy().into_owned()),
            anchor: None,
            link_type: "asset".into(),
        },
        LinkType::External(url) => ResolveResult {
            resolved: Some(url),
            anchor: None,
            link_type: "external".into(),
        },
        LinkType::Broken(_broken_href) => ResolveResult {
            resolved: None,
            anchor: None,
            link_type: "broken".into(),
        },
    }
}
