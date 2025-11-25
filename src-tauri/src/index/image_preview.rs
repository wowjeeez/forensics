use anyhow::{Context, Result};
use image::{DynamicImage, GenericImageView, ImageError, ImageFormat};
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{BufReader, BufWriter};
use std::path::{Path, PathBuf};

/// Image preview configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewConfig {
    /// Maximum dimension (width or height) for thumbnails
    pub thumbnail_size: u32,

    /// JPEG quality (1-100)
    pub jpeg_quality: u8,

    /// Whether to generate previews for all images
    pub enabled: bool,

    /// Supported image formats
    pub supported_formats: Vec<String>,
}

impl Default for PreviewConfig {
    fn default() -> Self {
        Self {
            thumbnail_size: 256,
            jpeg_quality: 85,
            enabled: false,
            supported_formats: vec![
                "jpg".to_string(),
                "jpeg".to_string(),
                "png".to_string(),
                "gif".to_string(),
                "bmp".to_string(),
                "webp".to_string(),
                "tiff".to_string(),
                "tif".to_string(),
                "ico".to_string(),
            ],
        }
    }
}

/// Image metadata and preview information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageInfo {
    pub width: u32,
    pub height: u32,
    pub format: String,
    pub has_alpha: bool,
    pub color_type: String,
    pub thumbnail_path: Option<PathBuf>,
}

/// Image preview generator
pub struct ImagePreviewGenerator {
    config: PreviewConfig,
    preview_dir: PathBuf,
}

impl ImagePreviewGenerator {
    pub fn new(config: PreviewConfig, preview_dir: PathBuf) -> Result<Self> {
        fs::create_dir_all(&preview_dir)?;

        Ok(Self {
            config,
            preview_dir,
        })
    }

    /// Check if file is a supported image format
    pub fn is_image(&self, path: &Path) -> bool {
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            self.config.supported_formats.contains(&ext.to_lowercase())
        } else {
            false
        }
    }

    /// Generate preview and extract metadata
    pub fn generate_preview(&self, image_path: &Path) -> Result<ImageInfo> {
        if !self.config.enabled {
            return self.extract_metadata_only(image_path);
        }

        // Load image
        let img = self.load_image(image_path)?;

        // Extract metadata
        let width = img.width();
        let height = img.height();
        let color_type = format!("{:?}", img.color());
        let has_alpha = img.color().has_alpha();

        let format = self.detect_format(image_path)?;

        // Generate thumbnail
        let thumbnail_path =
            if width > self.config.thumbnail_size || height > self.config.thumbnail_size {
                Some(self.create_thumbnail(&img, image_path)?)
            } else {
                None
            };

        Ok(ImageInfo {
            width,
            height,
            format,
            has_alpha,
            color_type,
            thumbnail_path,
        })
    }

    /// Load image with support for various formats
    fn load_image(&self, path: &Path) -> Result<DynamicImage> {
        // Try standard loading
        match image::open(path) {
            Ok(img) => Ok(img),
            Err(ImageError::Unsupported(_)) => {
                // Try WebP if standard loading failed
                if self.is_webp(path) {
                    self.load_webp(path)
                } else {
                    Err(ImageError::Unsupported(
                        image::error::UnsupportedError::from_format_and_kind(
                            image::error::ImageFormatHint::Unknown,
                            image::error::UnsupportedErrorKind::Format(
                                image::error::ImageFormatHint::Unknown,
                            ),
                        ),
                    )
                    .into())
                }
            }
            Err(e) => Err(e.into()),
        }
    }

    /// Load WebP image
    fn load_webp(&self, path: &Path) -> Result<DynamicImage> {
        let data = fs::read(path)?;
        let decoder = webp::Decoder::new(&data);
        let decoded = decoder
            .decode()
            .ok_or_else(|| anyhow::anyhow!("Failed to decode WebP"))?;

        // Convert to DynamicImage
        let width = decoded.width();
        let height = decoded.height();

        // Convert WebP decoded image to RGBA bytes
        let rgba_bytes = decoded.to_owned().to_vec();

        Ok(DynamicImage::ImageRgba8(
            image::RgbaImage::from_raw(width, height, rgba_bytes)
                .ok_or_else(|| anyhow::anyhow!("Failed to create RGBA image"))?,
        ))
    }

    /// Check if file is WebP
    fn is_webp(&self, path: &Path) -> bool {
        path.extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase() == "webp")
            .unwrap_or(false)
    }

    /// Create thumbnail
    fn create_thumbnail(&self, img: &DynamicImage, original_path: &Path) -> Result<PathBuf> {
        // Calculate thumbnail dimensions
        let (width, height) = img.dimensions();
        let max_dim = self.config.thumbnail_size;

        let (thumb_width, thumb_height) = if width > height {
            (max_dim, (max_dim * height) / width)
        } else {
            ((max_dim * width) / height, max_dim)
        };

        // Resize image
        let thumbnail = img.resize(
            thumb_width,
            thumb_height,
            image::imageops::FilterType::Lanczos3,
        );

        // Generate thumbnail filename
        let filename = self.generate_thumbnail_filename(original_path)?;
        let thumbnail_path = self.preview_dir.join(&filename);

        // Save as JPEG
        let file = File::create(&thumbnail_path)?;
        let mut writer = BufWriter::new(file);

        thumbnail
            .write_to(&mut writer, ImageFormat::Jpeg)
            .context("Failed to write thumbnail")?;

        Ok(thumbnail_path)
    }

    /// Generate thumbnail filename
    fn generate_thumbnail_filename(&self, original_path: &Path) -> Result<String> {
        use sha2::{Digest, Sha256};

        let mut hasher = Sha256::new();
        hasher.update(original_path.to_string_lossy().as_bytes());
        let hash = format!("{:x}", hasher.finalize())[..16].to_string();

        Ok(format!("thumb_{}.jpg", hash))
    }

    /// Extract metadata without generating thumbnail
    fn extract_metadata_only(&self, path: &Path) -> Result<ImageInfo> {
        let img = self.load_image(path)?;

        Ok(ImageInfo {
            width: img.width(),
            height: img.height(),
            format: self.detect_format(path)?,
            has_alpha: img.color().has_alpha(),
            color_type: format!("{:?}", img.color()),
            thumbnail_path: None,
        })
    }

    /// Detect image format
    fn detect_format(&self, path: &Path) -> Result<String> {
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            Ok(ext.to_lowercase())
        } else {
            // Read magic bytes
            let file = File::open(path)?;
            let reader = BufReader::new(file);
            let format = image::io::Reader::new(reader)
                .with_guessed_format()?
                .format();

            Ok(format
                .map(|f| format!("{:?}", f).to_lowercase())
                .unwrap_or_else(|| "unknown".to_string()))
        }
    }

    /// Get thumbnail path for an image
    pub fn get_thumbnail_path(&self, original_path: &Path) -> Result<PathBuf> {
        let filename = self.generate_thumbnail_filename(original_path)?;
        Ok(self.preview_dir.join(filename))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_is_image() {
        let temp_dir = TempDir::new().unwrap();
        let config = PreviewConfig::default();
        let generator = ImagePreviewGenerator::new(config, temp_dir.path().to_path_buf()).unwrap();

        assert!(generator.is_image(Path::new("test.jpg")));
        assert!(generator.is_image(Path::new("test.png")));
        assert!(generator.is_image(Path::new("test.webp")));
        assert!(!generator.is_image(Path::new("test.txt")));
    }
}
