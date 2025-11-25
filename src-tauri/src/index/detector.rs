use super::schema::FileCategory;
use std::io::{self, Read};
use std::fs::File;
use std::path::Path;

/// File type detection using magic bytes (like libmagic)
/// Never trust file extensions - always check the actual content
pub struct FileTypeDetector;

#[derive(Debug, Clone)]
pub struct DetectedFileType {
    pub mime_type: String,
    pub category: FileCategory,
    pub magic_header: String,
}

impl FileTypeDetector {
    /// Detect file type by reading magic bytes
    /// Reads only the first 512 bytes for efficiency
    pub fn detect(path: &Path) -> io::Result<DetectedFileType> {
        let mut file = File::open(path)?;
        let mut buffer = [0u8; 512];
        let bytes_read = file.read(&mut buffer)?;

        let magic_header = if bytes_read >= 16 {
            hex::encode(&buffer[..16])
        } else {
            hex::encode(&buffer[..bytes_read])
        };

        let (mime_type, category) = Self::identify_type(&buffer[..bytes_read]);

        Ok(DetectedFileType {
            mime_type: mime_type.to_string(),
            category,
            magic_header,
        })
    }

    /// Identify file type from magic bytes
    fn identify_type(bytes: &[u8]) -> (&'static str, FileCategory) {
        if bytes.is_empty() {
            return ("application/octet-stream", FileCategory::Binary);
        }

        // SQLite database
        if bytes.len() >= 16 && &bytes[0..16] == b"SQLite format 3\0" {
            return ("application/vnd.sqlite3", FileCategory::Database);
        }

        // LevelDB
        if bytes.len() >= 8 && &bytes[0..8] == b"leveldb/" {
            return ("application/x-leveldb", FileCategory::Database);
        }

        // ZIP/Office formats (XLSX, DOCX, etc.)
        if bytes.len() >= 4 && &bytes[0..4] == b"PK\x03\x04" {
            // Check if it's an Office file
            if bytes.len() >= 30 {
                if Self::contains_sequence(bytes, b"[Content_Types].xml") {
                    // Office Open XML format
                    if Self::contains_sequence(bytes, b"xl/") {
                        return ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", FileCategory::Document);
                    } else if Self::contains_sequence(bytes, b"word/") {
                        return ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", FileCategory::Document);
                    }
                }
            }
            return ("application/zip", FileCategory::Archive);
        }

        // PDF
        if bytes.len() >= 4 && &bytes[0..4] == b"%PDF" {
            return ("application/pdf", FileCategory::Document);
        }

        // Parquet
        if bytes.len() >= 4 && &bytes[0..4] == b"PAR1" {
            return ("application/vnd.apache.parquet", FileCategory::StructuredData);
        }

        // Images
        if bytes.len() >= 8 {
            // PNG
            if &bytes[0..8] == b"\x89PNG\r\n\x1a\n" {
                return ("image/png", FileCategory::Media);
            }
            // JPEG
            if &bytes[0..2] == b"\xFF\xD8" {
                return ("image/jpeg", FileCategory::Media);
            }
            // GIF
            if &bytes[0..6] == b"GIF87a" || &bytes[0..6] == b"GIF89a" {
                return ("image/gif", FileCategory::Media);
            }
            // WebP
            if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
                return ("image/webp", FileCategory::Media);
            }
        }

        // JSON (heuristic - starts with { or [, allowing whitespace)
        if let Some(&first_non_ws) = bytes.iter().find(|&&b| !b.is_ascii_whitespace()) {
            if first_non_ws == b'{' || first_non_ws == b'[' {
                // Try to confirm it's JSON by checking for valid JSON structure
                if let Ok(s) = std::str::from_utf8(bytes) {
                    if s.trim_start().starts_with('{') || s.trim_start().starts_with('[') {
                        return ("application/json", FileCategory::StructuredData);
                    }
                }
            }
        }

        // XML
        if bytes.len() >= 5 {
            if let Ok(s) = std::str::from_utf8(&bytes[..bytes.len().min(100)]) {
                if s.trim_start().starts_with("<?xml") || s.trim_start().starts_with('<') {
                    return ("application/xml", FileCategory::StructuredData);
                }
            }
        }

        // CSV (heuristic - check for common patterns)
        if Self::looks_like_csv(bytes) {
            return ("text/csv", FileCategory::StructuredData);
        }

        // ELF binary (Unix executable)
        if bytes.len() >= 4 && &bytes[0..4] == b"\x7FELF" {
            return ("application/x-executable", FileCategory::Binary);
        }

        // Mach-O binary (macOS executable)
        if bytes.len() >= 4 {
            let magic = u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]);
            if magic == 0xFEEDFACE || magic == 0xFEEDFACF || magic == 0xCAFEBABE {
                return ("application/x-mach-binary", FileCategory::Binary);
            }
        }

        // PE binary (Windows executable)
        if bytes.len() >= 2 && &bytes[0..2] == b"MZ" {
            return ("application/x-dosexec", FileCategory::Binary);
        }

        // Check if it's text
        if Self::is_text(bytes) {
            return ("text/plain", FileCategory::Text);
        }

        // Default to binary
        ("application/octet-stream", FileCategory::Binary)
    }

    /// Check if bytes look like CSV
    fn looks_like_csv(bytes: &[u8]) -> bool {
        if let Ok(s) = std::str::from_utf8(&bytes[..bytes.len().min(1024)]) {
            let lines: Vec<&str> = s.lines().take(5).collect();
            if lines.len() >= 2 {
                // Check if lines have consistent comma/tab counts
                let first_commas = lines[0].matches(',').count();
                let first_tabs = lines[0].matches('\t').count();

                if first_commas >= 1 || first_tabs >= 1 {
                    return lines.iter().skip(1).all(|line| {
                        let commas = line.matches(',').count();
                        let tabs = line.matches('\t').count();
                        (commas > 0 && (commas == first_commas || (commas as i32 - first_commas as i32).abs() <= 1)) ||
                        (tabs > 0 && (tabs == first_tabs || (tabs as i32 - first_tabs as i32).abs() <= 1))
                    });
                }
            }
        }
        false
    }

    /// Check if bytes are valid UTF-8 text
    fn is_text(bytes: &[u8]) -> bool {
        // Check if valid UTF-8
        if std::str::from_utf8(bytes).is_err() {
            return false;
        }

        // Check for high percentage of printable ASCII
        let printable_count = bytes.iter().filter(|&&b| {
            b.is_ascii_graphic() || b.is_ascii_whitespace()
        }).count();

        let ratio = printable_count as f64 / bytes.len() as f64;
        ratio > 0.85
    }

    /// Helper to check if bytes contain a sequence
    fn contains_sequence(haystack: &[u8], needle: &[u8]) -> bool {
        haystack.windows(needle.len()).any(|window| window == needle)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_detect_sqlite() {
        let mut file = NamedTempFile::new().unwrap();
        file.write_all(b"SQLite format 3\0").unwrap();
        file.flush().unwrap();

        let detected = FileTypeDetector::detect(file.path()).unwrap();
        assert_eq!(detected.mime_type, "application/vnd.sqlite3");
        assert_eq!(detected.category, FileCategory::Database);
    }

    #[test]
    fn test_detect_json() {
        let mut file = NamedTempFile::new().unwrap();
        file.write_all(b"{\"key\": \"value\"}").unwrap();
        file.flush().unwrap();

        let detected = FileTypeDetector::detect(file.path()).unwrap();
        assert_eq!(detected.mime_type, "application/json");
        assert_eq!(detected.category, FileCategory::StructuredData);
    }

    #[test]
    fn test_detect_text() {
        let mut file = NamedTempFile::new().unwrap();
        file.write_all(b"This is plain text content").unwrap();
        file.flush().unwrap();

        let detected = FileTypeDetector::detect(file.path()).unwrap();
        assert_eq!(detected.mime_type, "text/plain");
        assert_eq!(detected.category, FileCategory::Text);
    }
}
