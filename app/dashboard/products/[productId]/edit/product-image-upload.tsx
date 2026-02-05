'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { uploadProductImage } from '@/actions/products';
import { Camera, Package } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset
    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`ไฟล์ใหญ่เกินไป (${formatFileSize(file.size)}) กรุณาเลือกไฟล์ไม่เกิน 10MB`);
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const result = await uploadProductImage(productId, formData);

      if (!result.success && result.error) {
        setError(result.error);
        setPreviewUrl(currentImageUrl);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่');
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
      // Reset input
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
            <span className="text-sm">คลิกเพื่ออัปโหลดรูป</span>
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
          {isUploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปสินค้า'}
        </Button>
        <p className="text-sm text-muted-foreground">
          JPG, PNG, WebP ขนาดไม่เกิน 10MB
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
