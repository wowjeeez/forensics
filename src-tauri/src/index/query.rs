use super::inverted::{InvertedIndex, SearchHit};
use super::extractors::ExtractorRegistry;
use super::schema::{FileCategory, TypedHit};
use anyhow::Result;
use serde::{Serialize, Deserialize};
use std::path::PathBuf;
use std::sync::Arc;

/// Federated query planner
/// Maps queries to the appropriate indexes and extractors
pub struct QueryPlanner {
    inverted_index: Arc<InvertedIndex>,
    extractor_registry: Arc<ExtractorRegistry>,
}

/// Query types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Query {
    /// Full-text search across all indexed content
    FullText {
        query: String,
        limit: Option<usize>,
    },

    /// Filter by metadata
    Metadata {
        /// Filter by file category
        category: Option<FileCategory>,
        /// Filter by MIME type
        mime_type: Option<String>,
        /// Minimum file size
        min_size: Option<u64>,
        /// Maximum file size
        max_size: Option<u64>,
        /// Filter by extension
        extension: Option<String>,
    },

    /// Search within structured data
    Structured {
        /// Type of structured query
        structured_type: StructuredQueryType,
        /// Query string
        query: String,
    },

    /// Combined query (metadata filters + full-text)
    Combined {
        metadata: Box<Query>,
        fulltext: Box<Query>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StructuredQueryType {
    /// Search SQLite table names or columns
    SqlTable,
    /// Search JSON paths
    JsonPath,
    /// Search CSV/Excel column names
    ColumnName,
}

/// Query result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    pub hits: Vec<TypedHit>,
    pub total: usize,
    pub query_time_ms: u64,
}

impl QueryPlanner {
    pub fn new(inverted_index: Arc<InvertedIndex>, extractor_registry: Arc<ExtractorRegistry>) -> Self {
        Self {
            inverted_index,
            extractor_registry,
        }
    }

    /// Execute a query
    pub fn execute(&self, query: &Query) -> Result<QueryResult> {
        let start = std::time::Instant::now();

        let hits = match query {
            Query::FullText { query, limit } => {
                self.execute_fulltext(query, limit.unwrap_or(100))?
            }
            Query::Metadata { category, mime_type, min_size, max_size, extension } => {
                self.execute_metadata_filter(
                    category.as_ref(),
                    mime_type.as_deref(),
                    *min_size,
                    *max_size,
                    extension.as_deref(),
                )?
            }
            Query::Structured { structured_type, query } => {
                self.execute_structured(structured_type, query)?
            }
            Query::Combined { metadata, fulltext } => {
                // Execute both queries and intersect results
                let metadata_results = self.execute(metadata)?;
                let fulltext_results = self.execute(fulltext)?;
                self.intersect_results(metadata_results.hits, fulltext_results.hits)
            }
        };

        let query_time_ms = start.elapsed().as_millis() as u64;

        Ok(QueryResult {
            total: hits.len(),
            hits,
            query_time_ms,
        })
    }

    /// Execute full-text search
    fn execute_fulltext(&self, query: &str, limit: usize) -> Result<Vec<TypedHit>> {
        let search_hits = self.inverted_index.search(query, limit)?;
        Ok(search_hits.into_iter().map(Self::search_hit_to_typed).collect())
    }

    /// Execute metadata filter
    fn execute_metadata_filter(
        &self,
        category: Option<&FileCategory>,
        mime_type: Option<&str>,
        _min_size: Option<u64>,
        _max_size: Option<u64>,
        extension: Option<&str>,
    ) -> Result<Vec<TypedHit>> {
        // Build Tantivy query for metadata filtering
        let mut query_parts = Vec::new();

        if let Some(cat) = category {
            query_parts.push(format!("category:{:?}", cat).to_lowercase());
        }

        if let Some(mime) = mime_type {
            query_parts.push(format!("mime_type:{}", mime));
        }

        if let Some(ext) = extension {
            query_parts.push(format!("extension:{}", ext));
        }

        // For size filtering, we'll need to post-filter since Tantivy range queries
        // are more complex. For now, just do the text filters.
        let query_str = if query_parts.is_empty() {
            "*".to_string()
        } else {
            query_parts.join(" AND ")
        };

        let hits = self.execute_fulltext(&query_str, 10000)?;

        Ok(hits)
    }

    /// Execute structured data query
    fn execute_structured(
        &self,
        structured_type: &StructuredQueryType,
        query: &str,
    ) -> Result<Vec<TypedHit>> {
        let field = match structured_type {
            StructuredQueryType::SqlTable => "tables",
            StructuredQueryType::JsonPath => "paths",
            StructuredQueryType::ColumnName => "columns",
        };

        // Search in the specific structured field
        let query_str = format!("{}:{}", field, query);
        self.execute_fulltext(&query_str, 100)
    }

    /// Intersect two result sets
    fn intersect_results(&self, mut a: Vec<TypedHit>, b: Vec<TypedHit>) -> Vec<TypedHit> {
        let b_ids: std::collections::HashSet<_> = b.iter().map(|hit| hit.id.clone()).collect();
        a.retain(|hit| b_ids.contains(&hit.id));
        a
    }

    /// Convert SearchHit to TypedHit
    fn search_hit_to_typed(hit: SearchHit) -> TypedHit {
        TypedHit {
            id: hit.id,
            path: hit.path,
            category: hit.category,
            location: None,
            snippet: hit.snippet,
            score: hit.score,
            schema: None,
        }
    }

    /// Lazy deep extraction on demand
    /// When a user wants detailed data from a specific file, extract it
    pub fn extract_deep(&self, path: &PathBuf, category: FileCategory, mime_type: &str) -> Result<String> {
        let output = self.extractor_registry.extract(path, category, mime_type)?;

        // Return formatted extraction result
        let mut result = String::new();

        if let Some(structured) = output.structured {
            result.push_str(&format!("Structured data: {:?}\n\n", structured));
        }

        if let Some(content) = output.content {
            result.push_str("Content:\n");
            result.push_str(&content);
        }

        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_serialization() {
        let query = Query::FullText {
            query: "test".to_string(),
            limit: Some(10),
        };

        let json = serde_json::to_string(&query).unwrap();
        let deserialized: Query = serde_json::from_str(&json).unwrap();

        matches!(deserialized, Query::FullText { .. });
    }
}
