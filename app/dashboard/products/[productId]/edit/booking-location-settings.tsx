'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { updateProductLocationSettings } from '@/actions/products';
import { Video, Calendar, Save, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BookingLocationSettingsProps {
  productId: string;
  initialLocationType: 'online' | 'offline';
  initialMeetingPlatform: string;
  initialMeetingLink: string;
  initialLocationName: string;
  initialLocationAddress: string;
  initialLocationNotes: string;
}

export function BookingLocationSettings({
  productId,
  initialLocationType,
  initialMeetingPlatform,
  initialMeetingLink,
  initialLocationName,
  initialLocationAddress,
  initialLocationNotes,
}: BookingLocationSettingsProps) {
  const t = useTranslations('ProductForm');
  const tSettings = useTranslations('BookingSettings');

  const [locationType, setLocationType] = useState<'online' | 'offline'>(initialLocationType);
  const [meetingPlatform, setMeetingPlatform] = useState(initialMeetingPlatform);
  const [meetingLink, setMeetingLink] = useState(initialMeetingLink);
  const [locationName, setLocationName] = useState(initialLocationName);
  const [locationAddress, setLocationAddress] = useState(initialLocationAddress);
  const [locationNotes, setLocationNotes] = useState(initialLocationNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateProductLocationSettings(productId, {
        location_type: locationType,
        meeting_platform: meetingPlatform,
        meeting_link: meetingLink,
        location_name: locationName,
        location_address: locationAddress,
        location_notes: locationNotes,
      });

      if (result.success) {
        setMessage({ type: 'success', text: tSettings('savedSuccess') });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || tSettings('error') });
      }
    } catch {
      setMessage({ type: 'error', text: tSettings('error') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Online / Offline Toggle */}
      <div className="space-y-2">
        <Label>{t('format')}</Label>
        <div className="flex gap-2">
          <label
            className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
              locationType === 'online' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
            }`}
          >
            <input
              type="radio"
              value="online"
              checked={locationType === 'online'}
              onChange={() => setLocationType('online')}
              className="sr-only"
            />
            <Video className="h-4 w-4" />
            <span className="text-sm font-medium">Online</span>
          </label>
          <label
            className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
              locationType === 'offline' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
            }`}
          >
            <input
              type="radio"
              value="offline"
              checked={locationType === 'offline'}
              onChange={() => setLocationType('offline')}
              className="sr-only"
            />
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Offline</span>
          </label>
        </div>
      </div>

      {/* Online Settings */}
      {locationType === 'online' && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="loc_meeting_platform">{t('platform')}</Label>
            <select
              id="loc_meeting_platform"
              value={meetingPlatform}
              onChange={(e) => setMeetingPlatform(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t('selectPlatform')}</option>
              <option value="google_meet">Google Meet</option>
              <option value="zoom">Zoom</option>
              <option value="teams">Microsoft Teams</option>
              <option value="line">LINE Video Call</option>
              <option value="discord">Discord</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_meeting_link">{t('defaultMeetingLink')}</Label>
            <Input
              id="loc_meeting_link"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t('meetingLinkHint')}</p>
          </div>
        </div>
      )}

      {/* Offline Settings */}
      {locationType === 'offline' && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="loc_location_name">{t('locationName')}</Label>
            <Input
              id="loc_location_name"
              placeholder={t('locationNamePlaceholder')}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_location_address">{t('locationAddress')}</Label>
            <textarea
              id="loc_location_address"
              placeholder={t('locationAddressPlaceholder')}
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc_location_notes">{t('locationNotes')}</Label>
            <Input
              id="loc_location_notes"
              placeholder={t('locationNotesPlaceholder')}
              value={locationNotes}
              onChange={(e) => setLocationNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {tSettings('saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {tSettings('saveSettings')}
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
