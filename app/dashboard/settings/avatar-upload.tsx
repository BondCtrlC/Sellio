'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { updateAvatar } from '@/actions/settings';
import { Camera, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

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
