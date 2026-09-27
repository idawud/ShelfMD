use crate::resolver::{resolve_link as do_resolve, LinkType};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

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
