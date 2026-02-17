'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { updateAvatar } from '@/actions/settings';
import { Camera, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

const MAX_AVATAR_DIMENSION = 512;
const COMPRESS_QUALITY = 0.85;

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  displayName: string;
}

export function AvatarUpload({ currentAvatarUrl, displayName }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('Settings');

  const compressAvatar = (file: File): Promise<File> => {
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

        if (width <= MAX_AVATAR_DIMENSION && height <= MAX_AVATAR_DIMENSION && file.size <= 500 * 1024) {
          resolve(file);
          return;
        }

        if (width > MAX_AVATAR_DIMENSION || height > MAX_AVATAR_DIMENSION) {
          const ratio = Math.min(MAX_AVATAR_DIMENSION / width, MAX_AVATAR_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          COMPRESS_QUALITY
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

    setIsUploading(true);
    setError(null);

    try {
      const compressed = await compressAvatar(file);

      // Preview compressed version
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(compressed);

      const formData = new FormData();
      formData.append('avatar', compressed);

      const result = await updateAvatar(formData);

      if (!result.success && result.error) {
        setError(result.error);
        setPreviewUrl(currentAvatarUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {
      setError(t('avatarUploadFailed'));
      setPreviewUrl(currentAvatarUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      {/* Avatar Preview */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary-hover transition-colors"
          disabled={isUploading}
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Info */}
      <div className="space-y-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          isLoading={isUploading}
        >
          {isUploading ? t('avatarUploading') : t('avatarChange')}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t('avatarFormats')}
        </p>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

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
