'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { updateProductBookingSettings } from '@/actions/products';
import { Clock, Save, Loader2 } from 'lucide-react';

interface BookingSettingsProps {
  productId: string;
  initialMinimumAdvanceHours: number;
}

export function BookingSettings({ 
  productId, 
  initialMinimumAdvanceHours
}: BookingSettingsProps) {
  const [minimumAdvanceHours, setMinimumAdvanceHours] = useState(initialMinimumAdvanceHours);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const result = await updateProductBookingSettings(productId, {
        minimum_advance_hours: minimumAdvanceHours,
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'บันทึกเรียบร้อยแล้ว' });
      } else {
        setMessage({ type: 'error', text: result.error || 'เกิดข้อผิดพลาด' });
      }
    } catch {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="minimum_advance_hours">จองล่วงหน้าอย่างน้อย (ชั่วโมง)</Label>
        <Input
          id="minimum_advance_hours"
          type="number"
          min={0}
          max={168}
          value={minimumAdvanceHours}
          onChange={(e) => setMinimumAdvanceHours(parseInt(e.target.value) || 0)}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          ตั้ง 0 หากไม่ต้องการจำกัด (เช่น ตั้ง 24 = ลูกค้าต้องจองก่อน 24 ชม.)
        </p>
      </div>

      {minimumAdvanceHours > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            ลูกค้าจะต้องจองล่วงหน้าอย่างน้อย {minimumAdvanceHours} ชั่วโมง
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              บันทึกการตั้งค่า
            </>
          )}
        </Button>
        
        {message && (
          <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
