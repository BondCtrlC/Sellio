'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Download, Loader2, Check, AlertCircle } from 'lucide-react';
import { recordDownload } from '@/actions/fulfillments';

interface DownloadButtonProps {
  token: string;
  fileName?: string;
}

export function DownloadButton({ token, fileName }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    const result = await recordDownload(token);

    if (!result.success) {
      setError(result.error || 'เกิดข้อผิดพลาด');
      setLoading(false);
      return;
    }

    // Open file URL in new tab or trigger download
    if (result.url) {
      window.open(result.url, '_blank');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleDownload}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            กำลังเตรียมไฟล์...
          </>
        ) : success ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            ดาวน์โหลดสำเร็จ
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            ดาวน์โหลด {fileName || 'ไฟล์'}
          </>
        )}
      </Button>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
