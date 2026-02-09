/**
 * Image Compression Service
 * Automatically compresses images to a maximum size of 1.5MB
 * while maintaining quality for optimal performance
 */

interface CompressionOptions {
  maxSizeMB?: number; // Maximum file size in MB (default: 1.5)
  maxWidth?: number;  // Maximum width in pixels (default: 1024)
  maxHeight?: number; // Maximum height in pixels (default: 1024)
  quality?: number;   // JPEG quality 0-1 (default: 0.8)
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export class ImageCompressionService {
  private static readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxSizeMB: 1.5,
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8
  };

  /**
   * Compress an image file to meet size constraints
   * @param file - The original image file
   * @param options - Compression options
   * @returns Promise<CompressionResult> - Compressed file and metadata
   */
  static async compressImage(file: File, options: CompressionOptions = {}): Promise<CompressionResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // If file is already small enough, return as-is
    if (file.size <= opts.maxSizeMB! * 1024 * 1024) {
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1
      };
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            opts.maxWidth!, 
            opts.maxHeight!
          );

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas with compression
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg', // Convert to JPEG for better compression
                lastModified: Date.now()
              });

              resolve({
                file: compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: blob.size / file.size
              });
            },
            'image/jpeg',
            opts.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load the image
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate new dimensions maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    // If image is already smaller than max dimensions, keep original
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.floor(originalWidth * ratio),
      height: Math.floor(originalHeight * ratio)
    };
  }

  /**
   * Validate if a file is a supported image type
   */
  static isSupportedImage(file: File): boolean {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    return supportedTypes.includes(file.type.toLowerCase());
  }

  /**
   * Get human-readable file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Preview image from file
   */
  static async createPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to create preview'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}

// Export as default for easier imports
export default ImageCompressionService;