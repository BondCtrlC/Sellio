'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { updateProductBookingSettings } from '@/actions/products';
import { Clock, Save, Loader2, Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('BookingSettings');

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const result = await updateProductBookingSettings(productId, {
        minimum_advance_hours: minimumAdvanceHours,
        buffer_minutes: bufferMinutes,
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: t('savedSuccess') });
      } else {
        setMessage({ type: 'error', text: result.error || t('error') });
      }
    } catch {
      setMessage({ type: 'error', text: t('error') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minimum_advance_hours">{t('minAdvanceHours')}</Label>
          <Input
            id="minimum_advance_hours"
            type="number"
            min={0}
            max={168}
            value={minimumAdvanceHours}
            onChange={(e) => setMinimumAdvanceHours(parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            {t('minAdvanceHint')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buffer_minutes">{t('bufferMinutes')}</Label>
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
            {t('bufferHint')}
          </p>
        </div>
      </div>

      {(minimumAdvanceHours > 0 || bufferMinutes > 0) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 space-y-1">
          {minimumAdvanceHours > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>{t('advanceInfo', { hours: minimumAdvanceHours })}</span>
            </div>
          )}
          {bufferMinutes > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4" />
              <span>{t('bufferInfo', { minutes: bufferMinutes })}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('saveSettings')}
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
