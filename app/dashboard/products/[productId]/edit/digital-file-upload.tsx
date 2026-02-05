'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { deleteDigitalFile, saveDigitalFileInfo, saveDigitalRedirectInfo } from '@/actions/products';
import { createClient } from '@/lib/supabase/client';
import { Upload, FileText, Trash2, Download, File, Loader2, Link2, Pencil } from 'lucide-react';

type DeliveryType = 'file' | 'redirect';

interface DigitalFileUploadProps {
  productId: string;
  creatorId: string;
  currentFileUrl: string | null;
  currentFileName: string | null;
  currentDeliveryType?: DeliveryType;
  currentRedirectUrl?: string | null;
  currentRedirectName?: string | null;
}

export function DigitalFileUpload({ 
  productId, 
  creatorId,
  currentFileUrl, 
  currentFileName,
  currentDeliveryType = 'file',
  currentRedirectUrl,
  currentRedirectName,
}: DigitalFileUploadProps) {
  const router = useRouter();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(currentDeliveryType);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ url: string | null; name: string | null }>({
    url: currentFileUrl,
    name: currentFileName,
  });
  const [redirectUrl, setRedirectUrl] = useState(currentRedirectUrl || '');
  const [redirectName, setRedirectName] = useState(currentRedirectName || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update delivery type when props change
  useEffect(() => {
    if (currentDeliveryType) {
      setDeliveryType(currentDeliveryType);
    }
  }, [currentDeliveryType]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError('ไฟล์ต้องไม่เกิน 500MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Generate file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${creatorId}/${productId}/${Date.now()}.${fileExt}`;

      // Upload directly to Supabase Storage from client
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('digital-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError(`ไม่สามารถอัปโหลดไฟล์ได้: ${uploadError.message}`);
        setIsUploading(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('digital-files')
        .getPublicUrl(fileName);

      // Save file info to database via server action
      const result = await saveDigitalFileInfo(productId, {
        url: publicUrl,
        name: file.name,
        path: fileName,
      });

      if (!result.success) {
        setError(result.error || 'ไม่สามารถบันทึกข้อมูลไฟล์ได้');
      } else {
        setFileInfo({ url: publicUrl, name: file.name });
        setError(null);
        router.refresh();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('เกิดข้อผิดพลาดในการอัปโหลด');
    }

    setIsUploading(false);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('ต้องการลบไฟล์นี้ใช่หรือไม่?')) return;

    setIsDeleting(true);
    setError(null);

    const result = await deleteDigitalFile(productId);

    if (!result.success && result.error) {
      setError(result.error);
    } else {
      setFileInfo({ url: null, name: null });
    }

    setIsDeleting(false);
  };

  const handleSaveRedirect = async () => {
    if (!redirectUrl.trim()) {
      setError('กรุณาใส่ URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(redirectUrl);
    } catch {
      setError('URL ไม่ถูกต้อง');
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await saveDigitalRedirectInfo(productId, {
      redirect_url: redirectUrl.trim(),
      redirect_name: redirectName.trim() || null,
    });

    if (!result.success) {
      setError(result.error || 'ไม่สามารถบันทึกได้');
    } else {
      router.refresh();
    }

    setIsSaving(false);
  };

  const handleDeliveryTypeChange = (type: DeliveryType) => {
    setDeliveryType(type);
    setError(null);
  };

  const getFileIcon = (fileName: string | null) => {
    if (!fileName) return <File className="h-8 w-8" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'zip':
      case 'rar':
        return <File className="h-8 w-8 text-yellow-500" />;
      case 'mp4':
      case 'mov':
        return <File className="h-8 w-8 text-purple-500" />;
      case 'mp3':
      case 'wav':
        return <File className="h-8 w-8 text-green-500" />;
      default:
        return <File className="h-8 w-8 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Delivery Type Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleDeliveryTypeChange('file')}
          className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border transition-all ${
            deliveryType === 'file'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-muted-foreground border-input hover:bg-muted/50'
          }`}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => handleDeliveryTypeChange('redirect')}
          className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border transition-all ${
            deliveryType === 'redirect'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-muted-foreground border-input hover:bg-muted/50'
          }`}
        >
          <Link2 className="h-4 w-4 inline mr-2" />
          Redirect to URL
        </button>
      </div>

      {/* File Upload Section */}
      {deliveryType === 'file' && (
        <>
          {fileInfo.url ? (
            // File exists
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              {getFileIcon(fileInfo.name)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{fileInfo.name || 'ไฟล์ดิจิทัล'}</p>
                <p className="text-sm text-muted-foreground">ไฟล์พร้อมส่งให้ลูกค้า</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(fileInfo.url!, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            // No file - upload area
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isUploading 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 mx-auto text-primary mb-3 animate-spin" />
                  <p className="font-medium mb-1">กำลังอัปโหลด...</p>
                  <p className="text-sm text-muted-foreground">
                    กรุณารอสักครู่
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium mb-1">คลิกเพื่ออัปโหลดไฟล์</p>
                  <p className="text-sm text-muted-foreground">
                    รองรับ PDF, ZIP, MP4, MP3 และอื่นๆ (สูงสุด 500MB)
                  </p>
                </>
              )}
            </div>
          )}

          {/* Upload new file button (when file exists) */}
          {fileInfo.url && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนไฟล์'}
            </Button>
          )}
        </>
      )}

      {/* Redirect URL Section */}
      {deliveryType === 'redirect' && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <Link2 className="h-4 w-4 inline mr-1" />
              URL ปลายทาง <span className="text-destructive">*</span>
            </label>
            <Input
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://..."
              className="bg-white"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL ที่ลูกค้าจะถูก redirect ไปหลังชำระเงิน
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              <Pencil className="h-4 w-4 inline mr-1" />
              ชื่อที่แสดง (ไม่บังคับ)
            </label>
            <Input
              type="text"
              value={redirectName}
              onChange={(e) => setRedirectName(e.target.value)}
              placeholder='เช่น "Course 101"'
              className="bg-white"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ชื่อที่จะแสดงให้ลูกค้าเห็น แทนที่จะแสดง URL ตรงๆ
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSaveRedirect}
            isLoading={isSaving}
            className="w-full"
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก Redirect URL'}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.zip,.rar,.mp4,.mov,.mp3,.wav,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.epub,.txt"
      />
    </div>
  );
}
