'use client';

import { useState } from 'react';
import { Button, Input, Label, Badge } from '@/components/ui';
import { 
  createBookingSlot, 
  createMultipleSlots,
  createRecurringSlots,
  updateBookingSlot,
  deleteBookingSlot,
  bulkDeleteSlots,
  bulkToggleSlots,
  toggleSlotAvailability 
} from '@/actions/booking-slots';
import { updateBookingDuration } from '@/actions/products';
import { Plus, Trash2, Calendar, Clock, Eye, EyeOff, Repeat, CalendarPlus, Pencil, Check, X, CheckSquare, Square } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface BookingSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_booked: boolean;
  max_bookings: number;
  current_bookings: number;
}

interface BookingSlotsManagerProps {
  productId: string;
  durationMinutes: number;
  initialSlots: BookingSlot[];
}

export function BookingSlotsManager({ 
  productId, 
  durationMinutes: initialDuration,
  initialSlots 
}: BookingSlotsManagerProps) {
  const t = useTranslations('BookingSlots');
  const [slots, setSlots] = useState<BookingSlot[]>(initialSlots);
  const [isAdding, setIsAdding] = useState(false);
  const [slotMode, setSlotMode] = useState<'single' | 'batch' | 'recurring'>('single');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration);
  const [isSavingDuration, setIsSavingDuration] = useState(false);
  
  // Form state
  const [slotDate, setSlotDate] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('17');
  const [endMinute, setEndMinute] = useState('00');
  const [maxBookings, setMaxBookings] = useState(1);

  // Recurring form state
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [numberOfWeeks, setNumberOfWeeks] = useState(4);
  const [recurringRangeMode, setRecurringRangeMode] = useState<'weeks' | 'dateRange'>('weeks');
  const [rangeStartDate, setRangeStartDate] = useState('');
  const [rangeEndDate, setRangeEndDate] = useState('');

  // Multi-select state
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Edit state
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editStartHour, setEditStartHour] = useState('');
  const [editStartMinute, setEditStartMinute] = useState('');
  const [editEndHour, setEditEndHour] = useState('');
  const [editEndMinute, setEditEndMinute] = useState('');
  const [editMaxBookings, setEditMaxBookings] = useState(1);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Combine hour and minute to get time string
  const startTime = `${startHour}:${startMinute}`;
  const endTime = `${endHour}:${endMinute}`;

  // Generate options for dropdowns
  const hoursOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const dayNames = [
    { value: 0, label: t('daySun'), fullLabel: t('daySunFull') },
    { value: 1, label: t('dayMon'), fullLabel: t('dayMonFull') },
    { value: 2, label: t('dayTue'), fullLabel: t('dayTueFull') },
    { value: 3, label: t('dayWed'), fullLabel: t('dayWedFull') },
    { value: 4, label: t('dayThu'), fullLabel: t('dayThuFull') },
    { value: 5, label: t('dayFri'), fullLabel: t('dayFriFull') },
    { value: 6, label: t('daySat'), fullLabel: t('daySatFull') },
  ];

  // ===================== Duration =====================
  const handleDurationInput = (value: string) => {
    const num = parseInt(value) || 0;
    setDurationMinutes(num);
  };

  const handleDurationSave = async () => {
    const validDuration = Math.min(480, Math.max(5, durationMinutes));
    if (validDuration !== durationMinutes) {
      setDurationMinutes(validDuration);
    }
    setIsSavingDuration(true);
    await updateBookingDuration(productId, validDuration);
    setIsSavingDuration(false);
  };

  // ===================== Add Slots =====================
  const handleAddSingleSlot = async () => {
    if (!slotDate || !startTime) {
      setError(t('fillDateAndTime'));
      return;
    }

    setIsAdding(true);
    setError(null);
    setSuccessMessage(null);

    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + durationMinutes;
    const endHrs = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const calculatedEndTime = `${String(endHrs).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    const result = await createBookingSlot({
      productId,
      slotDate,
      startTime,
      endTime: calculatedEndTime,
      maxBookings,
    });

    if (!result.success) {
      setError(result.error || t('error'));
    } else {
      setSlots([...slots, {
        id: result.slotId!,
        slot_date: slotDate,
        start_time: startTime,
        end_time: calculatedEndTime,
        is_available: true,
        is_booked: false,
        max_bookings: maxBookings,
        current_bookings: 0,
      }].sort((a, b) => {
        if (a.slot_date !== b.slot_date) return a.slot_date.localeCompare(b.slot_date);
        return a.start_time.localeCompare(b.start_time);
      }));
      setSlotDate('');
    }

    setIsAdding(false);
  };

  const handleAddBatchSlots = async () => {
    if (!slotDate || !startTime || !endTime) {
      setError(t('fillAllFields'));
      return;
    }

    setIsAdding(true);
    setError(null);
    setSuccessMessage(null);

    const result = await createMultipleSlots({
      productId,
      slotDate,
      startTime,
      endTime,
      slotDuration: durationMinutes,
      maxBookings,
    });

    if (!result.success) {
      setError(result.error || t('error'));
    } else {
      window.location.reload();
    }

    setIsAdding(false);
  };

  const handleAddRecurringSlots = async () => {
    if (selectedDays.length === 0) {
      setError(t('selectAtLeastOneDay'));
      return;
    }

    if (recurringRangeMode === 'dateRange' && (!rangeStartDate || !rangeEndDate)) {
      setError(t('selectDateRange'));
      return;
    }

    setIsAdding(true);
    setError(null);
    setSuccessMessage(null);

    const result = await createRecurringSlots({
      productId,
      selectedDays,
      startTime,
      endTime,
      slotDuration: durationMinutes,
      numberOfWeeks,
      maxBookings,
      rangeMode: recurringRangeMode,
      rangeStartDate: recurringRangeMode === 'dateRange' ? rangeStartDate : undefined,
      rangeEndDate: recurringRangeMode === 'dateRange' ? rangeEndDate : undefined,
    });

    if (!result.success) {
      setError(result.error || t('error'));
    } else {
      const desc = recurringRangeMode === 'dateRange'
        ? t('recurringDateRangeSuccess', { count: result.slotsCreated ?? 0, start: rangeStartDate, end: rangeEndDate })
        : t('recurringSuccess', { count: result.slotsCreated ?? 0, weeks: numberOfWeeks });
      setSuccessMessage(desc);
      window.location.reload();
    }

    setIsAdding(false);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  // ===================== Single Actions =====================
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm(t('confirmDeleteSlot'))) return;

    const result = await deleteBookingSlot(slotId);
    if (result.success) {
      setSlots(slots.filter(s => s.id !== slotId));
      selectedSlotIds.delete(slotId);
      setSelectedSlotIds(new Set(selectedSlotIds));
    } else {
      setError(result.error || t('cannotDelete'));
    }
  };

  const handleToggleAvailability = async (slotId: string, currentValue: boolean) => {
    const result = await toggleSlotAvailability(slotId, !currentValue);
    if (result.success) {
      setSlots(slots.map(s => 
        s.id === slotId ? { ...s, is_available: !currentValue } : s
      ));
    }
  };

  // ===================== Multi-select =====================
  const toggleSlotSelection = (slotId: string) => {
    const newSet = new Set(selectedSlotIds);
    if (newSet.has(slotId)) {
      newSet.delete(slotId);
    } else {
      newSet.add(slotId);
    }
    setSelectedSlotIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedSlotIds.size === slots.length) {
      setSelectedSlotIds(new Set());
    } else {
      setSelectedSlotIds(new Set(slots.map(s => s.id)));
    }
  };

  const toggleSelectDate = (dateSlots: BookingSlot[]) => {
    const dateIds = dateSlots.map(s => s.id);
    const allSelected = dateIds.every(id => selectedSlotIds.has(id));
    const newSet = new Set(selectedSlotIds);
    if (allSelected) {
      dateIds.forEach(id => newSet.delete(id));
    } else {
      dateIds.forEach(id => newSet.add(id));
    }
    setSelectedSlotIds(newSet);
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedSlotIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedSlotIds);
    if (ids.length === 0) return;
    if (!confirm(t('confirmBulkDelete', { count: ids.length }))) return;

    setIsBulkProcessing(true);
    setError(null);

    const result = await bulkDeleteSlots(ids);
    if (result.success) {
      const deletedSet = new Set(ids);
      setSlots(slots.filter(s => !deletedSet.has(s.id) || s.current_bookings > 0));
      setSelectedSlotIds(new Set());
      if (result.error) {
        setSuccessMessage(result.error);
      } else {
        setSuccessMessage(t('bulkDeleteSuccess', { count: result.deletedCount ?? 0 }));
      }
    } else {
      setError(result.error || t('error'));
    }

    setIsBulkProcessing(false);
  };

  const handleBulkHide = async () => {
    const ids = Array.from(selectedSlotIds);
    if (ids.length === 0) return;

    setIsBulkProcessing(true);
    setError(null);

    const result = await bulkToggleSlots(ids, false);
    if (result.success) {
      setSlots(slots.map(s => ids.includes(s.id) ? { ...s, is_available: false } : s));
      setSuccessMessage(t('bulkHideSuccess', { count: result.updatedCount ?? 0 }));
      setSelectedSlotIds(new Set());
    } else {
      setError(result.error || t('error'));
    }

    setIsBulkProcessing(false);
  };

  const handleBulkShow = async () => {
    const ids = Array.from(selectedSlotIds);
    if (ids.length === 0) return;

    setIsBulkProcessing(true);
    setError(null);

    const result = await bulkToggleSlots(ids, true);
    if (result.success) {
      setSlots(slots.map(s => ids.includes(s.id) ? { ...s, is_available: true } : s));
      setSuccessMessage(t('bulkShowSuccess', { count: result.updatedCount ?? 0 }));
      setSelectedSlotIds(new Set());
    } else {
      setError(result.error || t('error'));
    }

    setIsBulkProcessing(false);
  };

  // ===================== Edit Slot =====================
  const startEditing = (slot: BookingSlot) => {
    setEditingSlotId(slot.id);
    const [sh, sm] = slot.start_time.slice(0, 5).split(':');
    const [eh, em] = slot.end_time.slice(0, 5).split(':');
    setEditStartHour(sh);
    setEditStartMinute(sm);
    setEditEndHour(eh);
    setEditEndMinute(em);
    setEditMaxBookings(slot.max_bookings);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingSlotId(null);
    setError(null);
  };

  const handleSaveEdit = async (slotId: string) => {
    setIsSavingEdit(true);
    setError(null);

    const newStartTime = `${editStartHour}:${editStartMinute}`;
    const newEndTime = `${editEndHour}:${editEndMinute}`;

    const result = await updateBookingSlot(slotId, {
      startTime: newStartTime,
      endTime: newEndTime,
      maxBookings: editMaxBookings,
    });

    if (result.success) {
      setSlots(slots.map(s =>
        s.id === slotId
          ? { ...s, start_time: newStartTime, end_time: newEndTime, max_bookings: editMaxBookings }
          : s
      ).sort((a, b) => {
        if (a.slot_date !== b.slot_date) return a.slot_date.localeCompare(b.slot_date);
        return a.start_time.localeCompare(b.start_time);
      }));
      setEditingSlotId(null);
    } else {
      setError(result.error || t('cannotUpdate'));
    }

    setIsSavingEdit(false);
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) {
      acc[slot.slot_date] = [];
    }
    acc[slot.slot_date].push(slot);
    return acc;
  }, {} as Record<string, BookingSlot[]>);

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Duration Setting */}
      <div className="p-4 border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{t('durationTitle')}</h4>
            <p className="text-sm text-muted-foreground">{t('durationDesc')}</p>
          </div>
          {isSavingDuration && (
            <span className="text-xs text-muted-foreground">{t('saving')}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min="5"
            max="480"
            step="1"
            value={durationMinutes}
            onChange={(e) => handleDurationInput(e.target.value)}
            onBlur={handleDurationSave}
            onKeyDown={(e) => e.key === 'Enter' && handleDurationSave()}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">{t('minutes')}</span>
          <div className="flex gap-2 ml-auto">
            {[30, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={async () => {
                  setDurationMinutes(mins);
                  setIsSavingDuration(true);
                  await updateBookingDuration(productId, mins);
                  setIsSavingDuration(false);
                }}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  durationMinutes === mins
                    ? 'bg-primary text-white border-primary'
                    : 'hover:border-primary'
                }`}
              >
                {mins >= 60 ? `${mins / 60} ${t('hours')}` : `${mins} ${t('mins')}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Slot Form */}
      <div className="p-4 border rounded-lg space-y-4">
        {/* Mode Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => { setSlotMode('single'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
              slotMode === 'single'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            {t('singleMode')}
          </button>
          <button
            type="button"
            onClick={() => { setSlotMode('batch'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
              slotMode === 'batch'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('batchMode')}
          </button>
          <button
            type="button"
            onClick={() => { setSlotMode('recurring'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
              slotMode === 'recurring'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
            {t('recurringMode')}
          </button>
        </div>

        {/* Single Slot Mode */}
        {slotMode === 'single' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slot-date">{t('date')}</Label>
              <Input
                id="slot-date"
                type="date"
                min={today}
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-bookings">{t('seats')}</Label>
              <Input
                id="max-bookings"
                type="number"
                min="1"
                max="100"
                value={maxBookings}
                onChange={(e) => setMaxBookings(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">{t('seatsPerSlot')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('startTime')}</Label>
              <div className="flex items-center gap-1">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {hoursOptions.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {minutesOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('slotDuration', { duration: durationMinutes })}
              </p>
            </div>
          </div>
        )}

        {/* Batch Mode */}
        {slotMode === 'batch' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slot-date-batch">{t('date')}</Label>
              <Input
                id="slot-date-batch"
                type="date"
                min={today}
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-bookings-batch">{t('seats')}</Label>
              <Input
                id="max-bookings-batch"
                type="number"
                min="1"
                max="100"
                value={maxBookings}
                onChange={(e) => setMaxBookings(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">{t('seatsPerSlot')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('startTimeLabel')}</Label>
              <div className="flex items-center gap-1">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {hoursOptions.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {minutesOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('endTime')}</Label>
              <div className="flex items-center gap-1">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {hoursOptions.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {minutesOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">
                {t('batchDesc', { duration: durationMinutes, start: startTime, end: endTime })}
              </p>
            </div>
          </div>
        )}

        {/* Recurring Mode */}
        {slotMode === 'recurring' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('selectDays')}</Label>
              <div className="flex gap-2">
                {dayNames.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    title={day.fullLabel}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                      selectedDays.includes(day.value)
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setSelectedDays([1, 2, 3, 4, 5])} className="text-xs text-primary hover:underline">{t('monFri')}</button>
                <button type="button" onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])} className="text-xs text-primary hover:underline">{t('everyday')}</button>
                <button type="button" onClick={() => setSelectedDays([0, 6])} className="text-xs text-primary hover:underline">{t('satSun')}</button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('startTimeLabel')}</Label>
                <div className="flex items-center gap-1">
                  <select value={startHour} onChange={(e) => setStartHour(e.target.value)} className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {hoursOptions.map((h) => (<option key={h} value={h}>{h}</option>))}
                  </select>
                  <span>:</span>
                  <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {minutesOptions.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('endTime')}</Label>
                <div className="flex items-center gap-1">
                  <select value={endHour} onChange={(e) => setEndHour(e.target.value)} className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {hoursOptions.map((h) => (<option key={h} value={h}>{h}</option>))}
                  </select>
                  <span>:</span>
                  <select value={endMinute} onChange={(e) => setEndMinute(e.target.value)} className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {minutesOptions.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
              </div>
              {/* Range mode toggle */}
              <div className="sm:col-span-2 space-y-3">
                <Label>{t('rangeSettingLabel')}</Label>
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRecurringRangeMode('weeks')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
                      recurringRangeMode === 'weeks'
                        ? 'bg-background shadow-sm font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Repeat className="h-3.5 w-3.5" />
                    {t('weeksMode')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringRangeMode('dateRange')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
                      recurringRangeMode === 'dateRange'
                        ? 'bg-background shadow-sm font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {t('dateRangeMode')}
                  </button>
                </div>
              </div>

              {/* Weeks mode */}
              {recurringRangeMode === 'weeks' && (
                <div className="space-y-2">
                  <Label htmlFor="num-weeks">{t('weeksAhead')}</Label>
                  <div className="flex items-center gap-2">
                    <Input id="num-weeks" type="number" min="1" max="52" value={numberOfWeeks} onChange={(e) => setNumberOfWeeks(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))} className="w-20" />
                    <span className="text-sm text-muted-foreground">{t('weeks')}</span>
                  </div>
                  <div className="flex gap-2">
                    {[2, 4, 8, 12].map((w) => (
                      <button key={w} type="button" onClick={() => setNumberOfWeeks(w)} className={`px-3 py-1 text-xs rounded-full border transition-colors ${numberOfWeeks === w ? 'bg-primary text-white border-primary' : 'hover:border-primary'}`}>
                        {w} {t('weeks')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date range mode */}
              {recurringRangeMode === 'dateRange' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="range-start-date">{t('rangeStartDate')}</Label>
                    <Input
                      id="range-start-date"
                      type="date"
                      min={today}
                      value={rangeStartDate}
                      onChange={(e) => {
                        setRangeStartDate(e.target.value);
                        // Auto-adjust end date if it's before start date
                        if (rangeEndDate && e.target.value > rangeEndDate) {
                          setRangeEndDate(e.target.value);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="range-end-date">{t('rangeEndDate')}</Label>
                    <Input
                      id="range-end-date"
                      type="date"
                      min={rangeStartDate || today}
                      value={rangeEndDate}
                      onChange={(e) => setRangeEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="max-bookings-recurring">{t('seats')}</Label>
                <Input id="max-bookings-recurring" type="number" min="1" max="100" value={maxBookings} onChange={(e) => setMaxBookings(Math.max(1, parseInt(e.target.value) || 1))} className="w-24" />
                <p className="text-xs text-muted-foreground">{t('seatsPerSlot')}</p>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p>{t('batchDesc', { duration: durationMinutes, start: startTime, end: endTime })}</p>
              {recurringRangeMode === 'weeks' ? (
                <p>{t('recurringDesc', { days: selectedDays.map((d) => dayNames[d].fullLabel).join(', '), weeks: numberOfWeeks })}</p>
              ) : (
                <p>{t('recurringDateRangeDesc', { days: selectedDays.map((d) => dayNames[d].fullLabel).join(', '), start: rangeStartDate || '...', end: rangeEndDate || '...' })}</p>
              )}
            </div>
          </div>
        )}

        {error && !editingSlotId && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {successMessage && (
          <p className="text-sm text-green-600">{successMessage}</p>
        )}

        <Button
          onClick={
            slotMode === 'recurring'
              ? handleAddRecurringSlots
              : slotMode === 'batch'
              ? handleAddBatchSlots
              : handleAddSingleSlot
          }
          disabled={isAdding}
          isLoading={isAdding}
        >
          {slotMode === 'recurring' ? (
            <Repeat className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {slotMode === 'recurring'
            ? t('addRecurring')
            : slotMode === 'batch'
            ? t('addBatch')
            : t('addSlot')}
        </Button>
      </div>

      {/* Slots List */}
      {slots.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t('noSlots')}</p>
          <p className="text-sm">{t('noSlotsHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar: Select Mode Toggle + Bulk Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('totalSlots', { count: slots.length })}</span>
            </div>
            <div className="flex items-center gap-2">
              {isSelectMode ? (
                <>
                  <span className="text-sm font-medium">
                    {t('selectedItems', { count: selectedSlotIds.size })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedSlotIds.size === slots.length ? t('deselectAll') : t('selectAll')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkShow}
                    disabled={selectedSlotIds.size === 0 || isBulkProcessing}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {t('show')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkHide}
                    disabled={selectedSlotIds.size === 0 || isBulkProcessing}
                  >
                    <EyeOff className="h-3.5 w-3.5 mr-1" />
                    {t('hide')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedSlotIds.size === 0 || isBulkProcessing}
                    isLoading={isBulkProcessing}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    {t('delete')} ({selectedSlotIds.size})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitSelectMode}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSelectMode(true)}
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1" />
                  {t('selectMultiple')}
                </Button>
              )}
            </div>
          </div>

          {/* Error/Success for bulk actions */}
          {error && editingSlotId === null && isSelectMode && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {Object.entries(slotsByDate).map(([date, dateSlots]) => {
            const allDateSelected = dateSlots.every(s => selectedSlotIds.has(s.id));
            return (
            <div key={date} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 font-medium flex items-center gap-2">
                {isSelectMode && (
                  <button
                    type="button"
                    onClick={() => toggleSelectDate(dateSlots)}
                    className="flex-shrink-0"
                  >
                    {allDateSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                )}
                <Calendar className="h-4 w-4" />
                {formatDate(date)}
                <span className="text-xs text-muted-foreground font-normal ml-auto">
                  {dateSlots.length} slot
                </span>
              </div>
              <div className="divide-y">
                {dateSlots.map((slot) => {
                  const isFull = slot.current_bookings >= slot.max_bookings;
                  const isEditing = editingSlotId === slot.id;
                  const isSelected = selectedSlotIds.has(slot.id);

                  if (isEditing) {
                    return (
                      <div key={slot.id} className="px-4 py-3 bg-primary/5 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Pencil className="h-3.5 w-3.5" />
                          {t('editSlot')}
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">{t('startTime')}</Label>
                            <div className="flex items-center gap-1">
                              <select value={editStartHour} onChange={(e) => setEditStartHour(e.target.value)} className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                {hoursOptions.map((h) => (<option key={h} value={h}>{h}</option>))}
                              </select>
                              <span>:</span>
                              <select value={editStartMinute} onChange={(e) => setEditStartMinute(e.target.value)} className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                {minutesOptions.map((m) => (<option key={m} value={m}>{m}</option>))}
                              </select>
                            </div>
                          </div>
                          <span className="text-muted-foreground pb-1">-</span>
                          <div className="space-y-1">
                            <Label className="text-xs">{t('endTime')}</Label>
                            <div className="flex items-center gap-1">
                              <select value={editEndHour} onChange={(e) => setEditEndHour(e.target.value)} className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                {hoursOptions.map((h) => (<option key={h} value={h}>{h}</option>))}
                              </select>
                              <span>:</span>
                              <select value={editEndMinute} onChange={(e) => setEditEndMinute(e.target.value)} className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                {minutesOptions.map((m) => (<option key={m} value={m}>{m}</option>))}
                              </select>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t('seatCount')}</Label>
                            <Input
                              type="number"
                              min={Math.max(1, slot.current_bookings)}
                              max="100"
                              value={editMaxBookings}
                              onChange={(e) => setEditMaxBookings(Math.max(Math.max(1, slot.current_bookings), parseInt(e.target.value) || 1))}
                              className="w-16 h-9"
                            />
                          </div>
                          <div className="flex gap-1 pb-0.5">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(slot.id)}
                              disabled={isSavingEdit}
                              isLoading={isSavingEdit}
                              className="h-9"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              {t('save')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={isSavingEdit}
                              className="h-9"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {error && editingSlotId === slot.id && (
                          <p className="text-sm text-destructive">{error}</p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={slot.id} 
                      className={`px-4 py-3 flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelectMode && (
                          <button
                            type="button"
                            onClick={() => toggleSlotSelection(slot.id)}
                            className="flex-shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({slot.current_bookings}/{slot.max_bookings} {t('seatCount')})
                        </span>
                        {!slot.is_available ? (
                          <Badge variant="outline">{t('statusClosed')}</Badge>
                        ) : isFull ? (
                          <Badge variant="secondary">{t('statusFull')}</Badge>
                        ) : slot.current_bookings > 0 ? (
                          <Badge variant="warning">{t('statusBooked')}</Badge>
                        ) : (
                          <Badge variant="success">{t('statusAvailable')}</Badge>
                        )}
                      </div>
                      {!isSelectMode && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(slot)}
                            title={t('editSlotTitle')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {slot.current_bookings === 0 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleAvailability(slot.id, slot.is_available)}
                                title={slot.is_available ? t('closeSlot') : t('openSlot')}
                              >
                                {slot.is_available ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
