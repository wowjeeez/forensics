use super::archive_settings::{ArchiveFormat, ArchiveSettings, UnpackedArchiveInfo};
use anyhow::{Context, Result};
use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use zip::ZipArchive;
use tar::Archive as TarArchive;
use flate2::read::GzDecoder;

/// Archive extractor that unpacks various archive formats
pub struct ArchiveExtractor {
    settings: ArchiveSettings,
}

impl ArchiveExtractor {
    pub fn new(settings: ArchiveSettings) -> Self {
        Self { settings }
    }

    /// Unpack an archive file
    pub fn unpack(
        &self,
        archive_path: &Path,
        project_appdata: &Path,
        nesting_level: u32,
    ) -> Result<UnpackedArchiveInfo> {
        // Check nesting level
        if nesting_level >= self.settings.max_nesting_level {
            anyhow::bail!(
                "Archive nesting level {} exceeds maximum {}",
                nesting_level,
                self.settings.max_nesting_level
            );
        }

        // Check file size
        let metadata = fs::metadata(archive_path)?;
        let size = metadata.len();

        if let Some(max_size) = self.settings.max_archive_size {
            if size > max_size {
                anyhow::bail!(
                    "Archive size {} exceeds maximum {}",
                    size,
                    max_size
                );
            }
        }

        // Detect format
        let format = self.detect_format(archive_path)?;

        if !format.is_supported() {
            anyhow::bail!("Unsupported archive format: {:?}", format);
        }

        // Determine extraction directory
        let extract_dir = self.get_extract_directory(archive_path, project_appdata)?;

        // Create extraction directory
        fs::create_dir_all(&extract_dir)?;

        // Extract based on format
        let (file_count, total_size) = match format {
            ArchiveFormat::Zip => self.extract_zip(archive_path, &extract_dir)?,
            ArchiveFormat::Tar => self.extract_tar(archive_path, &extract_dir)?,
            ArchiveFormat::TarGz => self.extract_tar_gz(archive_path, &extract_dir)?,
            ArchiveFormat::Gzip => self.extract_gzip(archive_path, &extract_dir)?,
            ArchiveFormat::SevenZ => self.extract_7z(archive_path, &extract_dir)?,
            _ => anyhow::bail!("Unsupported format: {:?}", format),
        };

        Ok(UnpackedArchiveInfo {
            archive_path: archive_path.to_path_buf(),
            unpacked_to: extract_dir,
            file_count,
            total_size,
            nesting_level,
            format,
        })
    }

    /// Detect archive format from file
    fn detect_format(&self, path: &Path) -> Result<ArchiveFormat> {
        // Try extension first
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if let Some(format) = ArchiveFormat::from_extension(ext) {
                return Ok(format);
            }
        }

        // Check full extension (e.g., .tar.gz)
        let filename = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

        if filename.ends_with(".tar.gz") {
            return Ok(ArchiveFormat::TarGz);
        } else if filename.ends_with(".tar.bz2") {
            return Ok(ArchiveFormat::TarBz2);
        } else if filename.ends_with(".tar.xz") {
            return Ok(ArchiveFormat::TarXz);
        }

        // Read magic bytes
        let mut file = File::open(path)?;
        let mut magic = [0u8; 8];
        file.read_exact(&mut magic).ok();

        // ZIP: PK\x03\x04
        if &magic[0..4] == b"PK\x03\x04" {
            return Ok(ArchiveFormat::Zip);
        }

        // Gzip: \x1f\x8b
        if &magic[0..2] == b"\x1f\x8b" {
            return Ok(ArchiveFormat::Gzip);
        }

        // 7z: 7z\xbc\xaf\x27\x1c
        if &magic[0..6] == b"7z\xbc\xaf\x27\x1c" {
            return Ok(ArchiveFormat::SevenZ);
        }

        anyhow::bail!("Could not detect archive format for {:?}", path)
    }

    /// Get extraction directory based on settings
    fn get_extract_directory(
        &self,
        archive_path: &Path,
        project_appdata: &Path,
    ) -> Result<PathBuf> {
        if self.settings.unpack_to_host {
            // Unpack next to the archive
            let parent = archive_path.parent()
                .ok_or_else(|| anyhow::anyhow!("Archive has no parent directory"))?;

            let stem = archive_path.file_stem()
                .and_then(|s| s.to_str())
                .ok_or_else(|| anyhow::anyhow!("Invalid archive filename"))?;

            Ok(parent.join(format!("{}_unpacked", stem)))
        } else {
            // Unpack to project appdata
            let extract_base = project_appdata.join("unpacked_archives");
            fs::create_dir_all(&extract_base)?;

            // Use hash of archive path to create unique directory
            use sha2::{Sha256, Digest};
            let mut hasher = Sha256::new();
            hasher.update(archive_path.to_string_lossy().as_bytes());
            let hash = format!("{:x}", hasher.finalize())[..16].to_string();

            let stem = archive_path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("archive");

            Ok(extract_base.join(format!("{}_{}", stem, hash)))
        }
    }

    /// Extract ZIP archive
    fn extract_zip(&self, archive_path: &Path, extract_dir: &Path) -> Result<(usize, u64)> {
        let file = File::open(archive_path)?;
        let mut archive = ZipArchive::new(file)?;

        let mut file_count = 0;
        let mut total_size = 0u64;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let outpath = extract_dir.join(file.name());

            if file.is_dir() {
                fs::create_dir_all(&outpath)?;
            } else {
                if let Some(parent) = outpath.parent() {
                    fs::create_dir_all(parent)?;
                }

                let mut outfile = File::create(&outpath)?;
                io::copy(&mut file, &mut outfile)?;

                file_count += 1;
                total_size += file.size();
            }
        }

        Ok((file_count, total_size))
    }

    /// Extract TAR archive
    fn extract_tar(&self, archive_path: &Path, extract_dir: &Path) -> Result<(usize, u64)> {
        let file = File::open(archive_path)?;
        let mut archive = TarArchive::new(file);

        let mut file_count = 0;
        let mut total_size = 0u64;

        for entry_result in archive.entries()? {
            let mut entry = entry_result?;
            let path = entry.path()?;
            let outpath = extract_dir.join(path);

            entry.unpack(&outpath)?;

            if entry.header().entry_type().is_file() {
                file_count += 1;
                total_size += entry.header().size()?;
            }
        }

        Ok((file_count, total_size))
    }

    /// Extract TAR.GZ archive
    fn extract_tar_gz(&self, archive_path: &Path, extract_dir: &Path) -> Result<(usize, u64)> {
        let file = File::open(archive_path)?;
        let decoder = GzDecoder::new(file);
        let mut archive = TarArchive::new(decoder);

        let mut file_count = 0;
        let mut total_size = 0u64;

        for entry_result in archive.entries()? {
            let mut entry = entry_result?;
            let path = entry.path()?;
            let outpath = extract_dir.join(path);

            entry.unpack(&outpath)?;

            if entry.header().entry_type().is_file() {
                file_count += 1;
                total_size += entry.header().size()?;
            }
        }

        Ok((file_count, total_size))
    }

    /// Extract GZIP file (single file compression)
    fn extract_gzip(&self, archive_path: &Path, extract_dir: &Path) -> Result<(usize, u64)> {
        let file = File::open(archive_path)?;
        let mut decoder = GzDecoder::new(file);

        // Get output filename (remove .gz extension)
        let stem = archive_path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("decompressed");

        let outpath = extract_dir.join(stem);
        let mut outfile = File::create(&outpath)?;

        let size = io::copy(&mut decoder, &mut outfile)?;

        Ok((1, size))
    }

    /// Extract 7z archive
    fn extract_7z(&self, archive_path: &Path, extract_dir: &Path) -> Result<(usize, u64)> {
        use sevenz_rust::decompress_file;

        decompress_file(archive_path, extract_dir)
            .context("Failed to extract 7z archive")?;

        // Count files and calculate size
        let (file_count, total_size) = self.count_extracted_files(extract_dir)?;

        Ok((file_count, total_size))
    }

    /// Count files and calculate total size in a directory
    fn count_extracted_files(&self, dir: &Path) -> Result<(usize, u64)> {
        let mut file_count = 0;
        let mut total_size = 0u64;

        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let metadata = entry.metadata()?;

            if metadata.is_file() {
                file_count += 1;
                total_size += metadata.len();
            } else if metadata.is_dir() {
                let (sub_count, sub_size) = self.count_extracted_files(&entry.path())?;
                file_count += sub_count;
                total_size += sub_size;
            }
        }

        Ok((file_count, total_size))
    }

    /// Check if path is an archive based on settings
    pub fn is_archive(&self, path: &Path) -> bool {
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            self.settings.archive_extensions.contains(&ext.to_lowercase())
        } else {
            false
        }
    }
}
