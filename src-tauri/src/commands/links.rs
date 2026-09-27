use serde::{Deserialize, Serialize};
use shelfmd_core::resolver::{resolve_link as do_resolve, LinkType};
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

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanEntry {
    pub href: String,
    pub line: u32,
    pub broken: bool,
}

/// LNK-21: Scan all internal markdown links in a file and report broken ones
#[tauri::command]
pub fn scan_links(file_path: String, book_root: Option<String>) -> Result<Vec<ScanEntry>, String> {
    use std::fs;
    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let current = PathBuf::from(&file_path);
    let root = book_root.as_deref().map(PathBuf::from);

    let mut entries = Vec::new();
    for (i, line) in content.lines().enumerate() {
        let mut pos = 0;
        while pos < line.len() {
            if let Some(rel) = line[pos..].find("](") {
                let href_start = pos + rel + 2;
                if let Some(href_end_rel) = line[href_start..].find(')') {
                    let href = &line[href_start..href_start + href_end_rel];
                    if !href.starts_with("http://")
                        && !href.starts_with("https://")
                        && !href.starts_with('#')
                        && !href.is_empty()
                    {
                        let result = do_resolve(&current, href, root.as_deref());
                        let broken = matches!(result, LinkType::Broken(_));
                        entries.push(ScanEntry {
                            href: href.to_string(),
                            line: (i + 1) as u32,
                            broken,
                        });
                    }
                    pos = href_start + href_end_rel + 1;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }
    Ok(entries)
}
