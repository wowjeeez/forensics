import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Loader2 } from 'lucide-react';
import heic2any from 'heic2any';

interface ImageViewerProps {
  src: string | ArrayBuffer;
  alt?: string;
  fileName?: string;
}

export function ImageViewer({ src, alt = 'Image', fileName }: ImageViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    loadImage();
  }, [src, fileName]);

  const loadImage = async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof src === 'string') {
        // If src is a URL or data URL, use directly
        if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) {
          setImageSrc(src);
          setLoading(false);
          return;
        }
      }

      // Check if file is HEIC/HEIF format
      const isHeic = fileName?.toLowerCase().match(/\.(heic|heif)$/);

      if (isHeic && src instanceof ArrayBuffer) {
        // Convert HEIC to JPEG
        const blob = new Blob([src], { type: 'image/heic' });
        const convertedBlob = await heic2any({
          blob,
          toType: 'image/jpeg',
          quality: 0.9,
        });

        const url = URL.createObjectURL(
          Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
        );
        setImageSrc(url);
      } else if (src instanceof ArrayBuffer) {
        // Create blob URL for other image formats
        const blob = new Blob([src]);
        const url = URL.createObjectURL(blob);
        setImageSrc(url);
      } else {
        setImageSrc(src as string);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setLoading(false);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageInfo({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-ide-blue animate-spin" />
          <span className="text-sm text-gray-400">Loading image...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-ide-red mb-2">Error loading image</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-editor-bg">
      {/* Toolbar */}
      <div className="h-10 border-b border-editor-border flex items-center gap-2 px-4">
        {imageInfo && (
          <span className="text-xs text-gray-500">
            {imageInfo.width} × {imageInfo.height}
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setZoom(z => Math.max(10, z - 10))}
          className="p-1.5 hover:bg-editor-toolbar rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-gray-300" />
        </button>

        <span className="text-sm text-gray-400 min-w-[60px] text-center">
          {zoom}%
        </span>

        <button
          onClick={() => setZoom(z => Math.min(500, z + 10))}
          className="p-1.5 hover:bg-editor-toolbar rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-gray-300" />
        </button>

        <button
          onClick={() => setZoom(100)}
          className="p-1.5 hover:bg-editor-toolbar rounded transition-colors"
          title="Actual Size"
        >
          <Maximize2 className="w-4 h-4 text-gray-300" />
        </button>

        <div className="w-px h-6 bg-editor-border mx-2" />

        <button
          onClick={() => setRotation(r => (r + 90) % 360)}
          className="p-1.5 hover:bg-editor-toolbar rounded transition-colors"
          title="Rotate"
        >
          <RotateCw className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Image container */}
      <div className="flex-1 overflow-auto scrollbar-thin flex items-center justify-center p-8">
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleImageLoad}
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease',
          }}
          className="max-w-none"
        />
      </div>
    </div>
  );
}
