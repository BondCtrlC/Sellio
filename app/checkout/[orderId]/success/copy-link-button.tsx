'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Copy, Check } from 'lucide-react';

interface CopyLinkButtonProps {
  orderId: string;
}

export function CopyLinkButton({ orderId }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/checkout/${orderId}/success`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          คัดลอกแล้ว
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          คัดลอกลิงก์
        </>
      )}
    </Button>
  );
}
