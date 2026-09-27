use anyhow::Result;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
use tantivy::schema::*;
use tantivy::{doc, Index, IndexWriter, ReloadPolicy, TantivyDocument};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub file_path: String,
    pub title: String,
    pub snippet: String,
    pub line: u64,
    pub score: f32,
}

struct BookIndex {
    index: Index,
    schema: Schema,
}

static INDEXES: Lazy<Mutex<HashMap<i64, BookIndex>>> = Lazy::new(|| Mutex::new(HashMap::new()));

fn build_schema() -> Schema {
    let mut builder = Schema::builder();
    builder.add_text_field("path", STRING | STORED);
    builder.add_text_field("title", TEXT | STORED);
    builder.add_text_field("body", TEXT);
    builder.add_u64_field("line", INDEXED | STORED);
    builder.build()
}

/// Build (or rebuild) the search index for a book in the background.
/// `files` is a list of (abs_path, title_hint) pairs.
pub fn build_index(book_id: i64, files: Vec<(PathBuf, Option<String>)>) -> Result<()> {
    let schema = build_schema();
    let index = Index::create_in_ram(schema.clone());
    let mut writer: IndexWriter = index.writer(50_000_000)?;

    let path_field = schema.get_field("path").unwrap();
    let title_field = schema.get_field("title").unwrap();
    let body_field = schema.get_field("body").unwrap();
    let line_field = schema.get_field("line").unwrap();

    for (abs_path, title_hint) in &files {
        let content = match std::fs::read_to_string(abs_path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let title = title_hint.clone().unwrap_or_else(|| {
            content
                .lines()
                .find(|l| l.starts_with("# "))
                .map(|l| l[2..].trim().to_string())
                .unwrap_or_else(|| {
                    abs_path
                        .file_stem()
                        .map(|s| s.to_string_lossy().into_owned())
                        .unwrap_or_default()
                })
        });

        // Index each paragraph as a separate document for better snippets
        let path_str = abs_path.to_string_lossy().into_owned();
        let mut para_lines: Vec<&str> = Vec::new();
        let mut para_start: u64 = 0;

        for (line_num, line) in (0_u64..).zip(content.lines()) {
            if line.trim().is_empty() {
                if !para_lines.is_empty() {
                    let para = para_lines.join(" ");
                    writer.add_document(doc!(
                        path_field => path_str.clone(),
                        title_field => title.clone(),
                        body_field => para,
                        line_field => para_start,
                    ))?;
                    para_lines.clear();
                }
                para_start = line_num + 1;
            } else {
                para_lines.push(line);
            }
        }
        if !para_lines.is_empty() {
            let para = para_lines.join(" ");
            writer.add_document(doc!(
                path_field => path_str,
                title_field => title,
                body_field => para,
                line_field => para_start,
            ))?;
        }
    }

    writer.commit()?;

    let mut indexes = INDEXES
        .lock()
        .map_err(|_| anyhow::anyhow!("lock poisoned"))?;
    indexes.insert(book_id, BookIndex { index, schema });

    Ok(())
}

/// Search a book index. Returns up to 20 results.
pub fn search(book_id: i64, query_str: &str) -> Result<Vec<SearchResult>> {
    let indexes = INDEXES
        .lock()
        .map_err(|_| anyhow::anyhow!("lock poisoned"))?;
    let book_index = match indexes.get(&book_id) {
        Some(i) => i,
        None => return Ok(vec![]),
    };

    let schema = &book_index.schema;
    let reader = book_index
        .index
        .reader_builder()
        .reload_policy(ReloadPolicy::OnCommitWithDelay)
        .try_into()?;
    let searcher = reader.searcher();

    let body_field = schema.get_field("body").unwrap();
    let title_field = schema.get_field("title").unwrap();
    let path_field = schema.get_field("path").unwrap();
    let line_field = schema.get_field("line").unwrap();

    let query_parser = QueryParser::for_index(&book_index.index, vec![body_field, title_field]);
    let query = query_parser.parse_query(query_str)?;

    let top_docs = searcher.search(&query, &TopDocs::with_limit(20))?;

    let mut results = Vec::new();
    for (score, doc_address) in top_docs {
        let doc: TantivyDocument = searcher.doc(doc_address)?;
        let path = doc
            .get_first(path_field)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let title = doc
            .get_first(title_field)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let snippet = doc
            .get_first(body_field)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .chars()
            .take(200)
            .collect::<String>();
        let line = doc
            .get_first(line_field)
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        results.push(SearchResult {
            file_path: path,
            title,
            snippet,
            line,
            score,
        });
    }

    Ok(results)
}
