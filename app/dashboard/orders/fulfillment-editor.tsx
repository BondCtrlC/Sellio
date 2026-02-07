'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Label, Input } from '@/components/ui';
import { Video, MapPin, Loader2, Check, Link as LinkIcon } from 'lucide-react';
import { updateFulfillment, getFulfillmentByOrderId, type Fulfillment } from '@/actions/fulfillments';
import { useTranslations } from 'next-intl';

interface FulfillmentEditorProps {
  orderId: string;
  productType: string;
  onSuccess?: () => void;
  isPendingConfirmation?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function FulfillmentEditor({ orderId, productType, onSuccess, isPendingConfirmation, onValidationChange }: FulfillmentEditorProps) {
  const t = useTranslations('Fulfillment');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillment, setFulfillment] = useState<Fulfillment | null>(null);

  // Booking form state
  const [meetingType, setMeetingType] = useState<'online' | 'offline'>('online');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Live form state
  const [platform, setPlatform] = useState('');
  const [accessUrl, setAccessUrl] = useState('');
  const [accessCode, setAccessCode] = useState('');

  // Check if required fields are filled
  const isValid = productType === 'booking'
    ? (meetingType === 'online' ? !!meetingUrl.trim() : !!location.trim())
    : !!accessUrl.trim();

  // Notify parent of validation status
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  useEffect(() => {
    loadFulfillment();
  }, [orderId]);

  const loadFulfillment = async () => {
    setLoading(true);
    const data = await getFulfillmentByOrderId(orderId);
    setFulfillment(data);

    if (data) {
      const content = data.content as any;
      if (data.type === 'booking_details') {
        setMeetingType(content.meeting_type || 'online');
        setMeetingUrl(content.meeting_url || '');
        setMeetingPlatform(content.meeting_platform || '');
        setLocation(content.location || '');
        setNotes(content.notes || '');
      } else if (data.type === 'live_access') {
        setPlatform(content.platform || '');
        setAccessUrl(content.access_url || '');
        setAccessCode(content.access_code || '');
        setNotes(content.notes || '');
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    let content: Record<string, unknown> = {};

    if (productType === 'booking') {
      content = {
        meeting_type: meetingType,
        meeting_url: meetingUrl,
        meeting_platform: meetingPlatform,
        location,
        notes,
      };
    } else if (productType === 'live') {
      content = {
        platform,
        access_url: accessUrl,
        access_code: accessCode,
        notes,
      };
    }

    const result = await updateFulfillment(orderId, content);

    if (!result.success) {
      setError(result.error || t('error'));
      setSaving(false);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
    onSuccess?.();
  };

  if (loading) {
    return (
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  if (!fulfillment) {
    return null;
  }

  // Booking Details Form
  if (productType === 'booking') {
    const needsInput = meetingType === 'online' ? !meetingUrl.trim() : !location.trim();
    
    return (
      <Card className={`border-indigo-200 ${isPendingConfirmation && needsInput ? 'bg-amber-50 border-amber-300' : 'bg-indigo-50'}`}>
        <CardContent className="p-4 space-y-4">
          <h4 className={`font-semibold text-sm flex items-center gap-2 ${isPendingConfirmation && needsInput ? 'text-amber-700' : 'text-indigo-800'}`}>
            <Video className="h-4 w-4" />
            {t('bookingDetails')}
          </h4>

          {/* Warning if pending and no info */}
          {isPendingConfirmation && needsInput && (
            <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ {meetingType === 'online' ? t('fillMeetingLink') : t('fillLocation')}
            </div>
          )}

          {/* Meeting Type */}
          <div className="space-y-2">
            <Label className="text-sm">{t('meetingType')}</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMeetingType('online')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  meetingType === 'online'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <Video className="h-4 w-4 inline mr-1" />
                {t('online')}
              </button>
              <button
                type="button"
                onClick={() => setMeetingType('offline')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  meetingType === 'offline'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <MapPin className="h-4 w-4 inline mr-1" />
                {t('offline')}
              </button>
            </div>
          </div>

          {meetingType === 'online' ? (
            <>
              {/* Platform */}
              <div className="space-y-2">
                <Label className="text-sm">{t('platform')}</Label>
                <Input
                  value={meetingPlatform}
                  onChange={(e) => setMeetingPlatform(e.target.value)}
                  placeholder={t('platformPlaceholder')}
                  className="bg-white"
                />
              </div>

              {/* Meeting URL */}
              <div className="space-y-2">
                <Label className="text-sm">{t('meetingLink')}</Label>
                <Input
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="bg-white"
                />
              </div>
            </>
          ) : (
            <>
              {/* Location */}
              <div className="space-y-2">
                <Label className="text-sm">{t('location')}</Label>
                <textarea
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('locationPlaceholder')}
                  className="w-full px-3 py-2 border rounded-lg resize-none h-20 text-sm bg-white"
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm">{t('additionalNotes')}</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full px-3 py-2 border rounded-lg resize-none h-16 text-sm bg-white"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('saved')}
              </>
            ) : (
              t('saveData')
            )}
          </Button>

          <p className="text-xs text-indigo-600 text-center">
            {t('customerVisibleNote')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Live Access Form
  if (productType === 'live') {
    const needsInput = !accessUrl.trim();
    
    return (
      <Card className={`border-pink-200 ${isPendingConfirmation && needsInput ? 'bg-amber-50 border-amber-300' : 'bg-pink-50'}`}>
        <CardContent className="p-4 space-y-4">
          <h4 className={`font-semibold text-sm flex items-center gap-2 ${isPendingConfirmation && needsInput ? 'text-amber-700' : 'text-pink-800'}`}>
            <Video className="h-4 w-4" />
            {t('liveInfo')}
          </h4>

          {/* Warning if pending and no info */}
          {isPendingConfirmation && needsInput && (
            <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ {t('fillAccessLink')}
            </div>
          )}

          {/* Platform */}
          <div className="space-y-2">
            <Label className="text-sm">{t('platform')}</Label>
            <Input
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder={t('livePlatformPlaceholder')}
              className="bg-white"
            />
          </div>

          {/* Access URL */}
          <div className="space-y-2">
            <Label className="text-sm">{t('accessLink')}</Label>
            <Input
              value={accessUrl}
              onChange={(e) => setAccessUrl(e.target.value)}
              placeholder="https://..."
              className="bg-white"
            />
          </div>

          {/* Access Code */}
          <div className="space-y-2">
            <Label className="text-sm">{t('accessCode')}</Label>
            <Input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder={t('accessCodePlaceholder')}
              className="bg-white"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm">{t('additionalNotes')}</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('viewerNotesPlaceholder')}
              className="w-full px-3 py-2 border rounded-lg resize-none h-16 text-sm bg-white"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-pink-600 hover:bg-pink-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('saved')}
              </>
            ) : (
              t('saveData')
            )}
          </Button>

          <p className="text-xs text-pink-600 text-center">
            {t('customerVisibleNote')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
