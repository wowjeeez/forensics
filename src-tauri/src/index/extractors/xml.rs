use super::{Extractor, ExtractorOutput};
use crate::index::schema::{FileCategory, StructuredData};
use anyhow::{Result, Context};
use quick_xml::events::Event;
use quick_xml::Reader;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;

pub struct XmlExtractor;

impl Extractor for XmlExtractor {
    fn extract(&self, path: &Path) -> Result<ExtractorOutput> {
        let content = fs::read_to_string(path).context("Failed to read XML file")?;

        let mut reader = Reader::from_str(&content);
        reader.config_mut().trim_text(true);

        let mut root_element = String::new();
        let mut namespaces = HashSet::new();
        let mut element_count = 0;

        let mut buf = Vec::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(e)) | Ok(Event::Empty(e)) => {
                    element_count += 1;

                    // Get root element
                    if root_element.is_empty() {
                        root_element = String::from_utf8_lossy(e.name().as_ref()).to_string();
                    }

                    // Extract namespaces from attributes
                    for attr in e.attributes().flatten() {
                        let key = String::from_utf8_lossy(attr.key.as_ref());
                        if key.starts_with("xmlns") {
                            let ns = String::from_utf8_lossy(&attr.value).to_string();
                            namespaces.insert(ns);
                        }
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => {
                    return Err(anyhow::anyhow!("XML parse error at position {}: {:?}", reader.buffer_position(), e));
                }
                _ => {}
            }
            buf.clear();
        }

        let namespace_vec: Vec<String> = namespaces.into_iter().collect();

        // Build searchable fields
        let mut fields = HashMap::new();
        fields.insert("format".to_string(), "xml".to_string());
        fields.insert("root_element".to_string(), root_element.clone());
        fields.insert("element_count".to_string(), element_count.to_string());
        fields.insert("namespaces".to_string(), namespace_vec.join(", "));

        // Create preview
        let preview = if content.len() > 500 {
            format!("{}\n...", &content[..497])
        } else {
            content.clone()
        };

        Ok(ExtractorOutput {
            structured: Some(StructuredData::Xml {
                root_element,
                namespaces: namespace_vec,
                element_count,
            }),
            content: Some(content),
            preview,
            fields,
        })
    }

    fn can_handle(&self, category: FileCategory, mime_type: &str) -> bool {
        category == FileCategory::StructuredData
            && (mime_type == "application/xml" || mime_type == "text/xml")
    }

    fn name(&self) -> &'static str {
        "xml"
    }
}
