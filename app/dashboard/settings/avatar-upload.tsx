'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { updateAvatar } from '@/actions/settings';
import { Camera, User } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  displayName: string;
}

export function AvatarUpload({ currentAvatarUrl, displayName }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const formData = new FormData();
    formData.append('avatar', file);

    const result = await updateAvatar(formData);

    if (!result.success && result.error) {
      setError(result.error);
      setPreviewUrl(currentAvatarUrl); // Reset preview
    }

    setIsUploading(false);
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
          {isUploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
        </Button>
        <p className="text-sm text-muted-foreground">
          JPG, PNG หรือ GIF ขนาดไม่เกิน 5MB
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
