'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { uploadProductImage } from '@/actions/products';
import { Camera, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 2048;
const COMPRESS_QUALITY = 0.85;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface ProductImageUploadProps {
  productId: string;
  currentImageUrl: string | null;
  productTitle: string;
}

export function ProductImageUpload({ productId, currentImageUrl, productTitle }: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('ProductEdit');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/gif') {
        resolve(file);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let { width, height } = img;

        if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size <= 2 * 1024 * 1024) {
          resolve(file);
          return;
        }

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const ext = outputType === 'image/png' ? 'png' : 'jpg';

        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          outputType === 'image/png' ? undefined : COMPRESS_QUALITY
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset
    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t('invalidImageType'));
      return;
    }

    // Validate file size (before compression)
    if (file.size > MAX_FILE_SIZE) {
      setError(t('fileTooLarge', { size: formatFileSize(file.size) }));
      return;
    }

    // Upload
    setIsUploading(true);

    try {
      const compressed = await compressImage(file);

      // Preview compressed version
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(compressed);

      const formData = new FormData();
      formData.append('image', compressed);

      const result = await uploadProductImage(productId, formData);

      if (!result.success && result.error) {
        setError(result.error);
        setPreviewUrl(currentImageUrl);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(t('uploadError'));
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div 
        className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt={productTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Package className="h-12 w-12" />
            <span className="text-sm">{t('clickToUpload')}</span>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          isLoading={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {isUploading ? t('uploading') : t('changeImage')}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t('imageHint')}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
