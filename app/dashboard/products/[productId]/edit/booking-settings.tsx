'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { updateProductBookingSettings } from '@/actions/products';
import { Clock, Save, Loader2, Timer } from 'lucide-react';

interface BookingSettingsProps {
  productId: string;
  initialMinimumAdvanceHours: number;
  initialBufferMinutes: number;
}

export function BookingSettings({ 
  productId, 
  initialMinimumAdvanceHours,
  initialBufferMinutes
}: BookingSettingsProps) {
  const [minimumAdvanceHours, setMinimumAdvanceHours] = useState(initialMinimumAdvanceHours);
  const [bufferMinutes, setBufferMinutes] = useState(initialBufferMinutes);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const result = await updateProductBookingSettings(productId, {
        minimum_advance_hours: minimumAdvanceHours,
        buffer_minutes: bufferMinutes,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minimum_advance_hours">จองล่วงหน้าอย่างน้อย (ชั่วโมง)</Label>
          <Input
            id="minimum_advance_hours"
            type="number"
            min={0}
            max={168}
            value={minimumAdvanceHours}
            onChange={(e) => setMinimumAdvanceHours(parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            ตั้ง 0 = ไม่จำกัด (เช่น ตั้ง 24 = ต้องจองก่อน 24 ชม.)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buffer_minutes">เว้นช่วงระหว่างนัด (นาที)</Label>
          <Input
            id="buffer_minutes"
            type="number"
            min={0}
            max={120}
            step={5}
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            ตั้ง 0 = ไม่เว้น (เช่น ตั้ง 15 = เว้น 15 นาที)
          </p>
        </div>
      </div>

      {(minimumAdvanceHours > 0 || bufferMinutes > 0) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 space-y-1">
          {minimumAdvanceHours > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>ลูกค้าต้องจองล่วงหน้าอย่างน้อย {minimumAdvanceHours} ชั่วโมง</span>
            </div>
          )}
          {bufferMinutes > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4" />
              <span>Slot ที่ติดกับนัดที่มีคนจองแล้วจะถูกบล็อก {bufferMinutes} นาที</span>
            </div>
          )}
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
