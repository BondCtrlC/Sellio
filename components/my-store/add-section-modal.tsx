'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { X, FolderPlus } from 'lucide-react';
import { createSection } from '@/actions/store-layout';
import type { StoreSectionWithItems } from '@/types';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSectionCreated: (section: StoreSectionWithItems) => void;
}

export function AddSectionModal({ isOpen, onClose, onSectionCreated }: AddSectionModalProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('กรุณาใส่ชื่อ Section');
      return;
    }

    setLoading(true);
    setError('');

    const result = await createSection(title.trim());
    
    if (result.success && result.data) {
      onSectionCreated({
        ...result.data,
        items: [],
      });
      setTitle('');
    } else {
      setError(result.error || 'เกิดข้อผิดพลาด');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setTitle('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">สร้าง Section ใหม่</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-title">ชื่อ Section</Label>
              <Input
                id="section-title"
                placeholder="เช่น Links, Downloads, Services"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Section ช่วยจัดกลุ่มสินค้าให้เป็นระเบียบ เช่น แยกประเภท Digital, Booking หรือ Links ออกจากกัน
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังสร้าง...' : 'สร้าง Section'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
