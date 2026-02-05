'use client';

import { useState } from 'react';
import { Button, Input, Label, Badge } from '@/components/ui';
import { 
  createBookingSlot, 
  createMultipleSlots,
  deleteBookingSlot,
  toggleSlotAvailability 
} from '@/actions/booking-slots';
import { updateBookingDuration } from '@/actions/products';
import { Plus, Trash2, Calendar, Clock, Eye, EyeOff } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
  const [slots, setSlots] = useState<BookingSlot[]>(initialSlots);
  const [isAdding, setIsAdding] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration);
  const [isSavingDuration, setIsSavingDuration] = useState(false);
  
  // Form state
  const [slotDate, setSlotDate] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('17');
  const [endMinute, setEndMinute] = useState('00');
  const [maxBookings, setMaxBookings] = useState(1);

  // Combine hour and minute to get time string
  const startTime = `${startHour}:${startMinute}`;
  const endTime = `${endHour}:${endMinute}`;

  // Generate options for dropdowns
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleDurationInput = (value: string) => {
    const num = parseInt(value) || 0;
    setDurationMinutes(num);
  };

  const handleDurationSave = async () => {
    const validDuration = Math.min(480, Math.max(5, durationMinutes)); // Clamp between 5-480
    if (validDuration !== durationMinutes) {
      setDurationMinutes(validDuration);
    }
    setIsSavingDuration(true);
    await updateBookingDuration(productId, validDuration);
    setIsSavingDuration(false);
  };

  const handleAddSingleSlot = async () => {
    if (!slotDate || !startTime) {
      setError('กรุณากรอกวันที่และเวลา');
      return;
    }

    setIsAdding(true);
    setError(null);

    // Calculate end time based on duration
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const calculatedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    const result = await createBookingSlot({
      productId,
      slotDate,
      startTime,
      endTime: calculatedEndTime,
      maxBookings,
    });

    if (!result.success) {
      setError(result.error || 'เกิดข้อผิดพลาด');
    } else {
      // Add to local state
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
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    setIsAdding(true);
    setError(null);

    const result = await createMultipleSlots({
      productId,
      slotDate,
      startTime,
      endTime,
      slotDuration: durationMinutes,
      maxBookings,
    });

    if (!result.success) {
      setError(result.error || 'เกิดข้อผิดพลาด');
    } else {
      // Refresh page to get updated slots
      window.location.reload();
    }

    setIsAdding(false);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('ต้องการลบ slot นี้?')) return;

    const result = await deleteBookingSlot(slotId);
    if (result.success) {
      setSlots(slots.filter(s => s.id !== slotId));
    } else {
      setError(result.error || 'ไม่สามารถลบได้');
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
            <h4 className="font-medium">ระยะเวลาต่อ Slot</h4>
            <p className="text-sm text-muted-foreground">กำหนดความยาวของแต่ละ slot</p>
          </div>
          {isSavingDuration && (
            <span className="text-xs text-muted-foreground">กำลังบันทึก...</span>
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
          <span className="text-sm text-muted-foreground">นาที</span>
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
                {mins >= 60 ? `${mins / 60} ชม.` : `${mins} น.`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Slot Form */}
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">เพิ่ม Slot ใหม่</h4>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isBatchMode}
              onChange={(e) => setIsBatchMode(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            สร้างหลาย slot พร้อมกัน
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="slot-date">วันที่</Label>
            <Input
              id="slot-date"
              type="date"
              min={today}
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-bookings">จำนวนที่นั่ง</Label>
            <Input
              id="max-bookings"
              type="number"
              min="1"
              max="100"
              value={maxBookings}
              onChange={(e) => setMaxBookings(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">จำนวนคนที่สามารถจองได้ต่อ slot</p>
          </div>
          
          {isBatchMode ? (
            <>
              <div className="space-y-2">
                <Label>เวลาเริ่มต้น</Label>
                <div className="flex items-center gap-1">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span>:</span>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {minutes.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>เวลาสิ้นสุด</Label>
                <div className="flex items-center gap-1">
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span>:</span>
                  <select
                    value={endMinute}
                    onChange={(e) => setEndMinute(e.target.value)}
                    className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {minutes.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  ระบบจะสร้าง slot ทุก {durationMinutes} นาที ตั้งแต่ {startTime} ถึง {endTime}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>เวลาเริ่ม</Label>
              <div className="flex items-center gap-1">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Slot จะยาว {durationMinutes} นาที
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          onClick={isBatchMode ? handleAddBatchSlots : handleAddSingleSlot}
          disabled={isAdding}
          isLoading={isAdding}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isBatchMode ? 'สร้างหลาย Slot' : 'เพิ่ม Slot'}
        </Button>
      </div>

      {/* Slots List */}
      {slots.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>ยังไม่มี slot</p>
          <p className="text-sm">เพิ่ม slot วัน/เวลาที่คุณว่างด้านบน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(slotsByDate).map(([date, dateSlots]) => (
            <div key={date} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(date)}
              </div>
              <div className="divide-y">
                {dateSlots.map((slot) => {
                  const isFull = slot.current_bookings >= slot.max_bookings;
                  return (
                  <div 
                    key={slot.id} 
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({slot.current_bookings}/{slot.max_bookings} ที่นั่ง)
                      </span>
                      {!slot.is_available ? (
                        <Badge variant="outline">ปิด</Badge>
                      ) : isFull ? (
                        <Badge variant="secondary">เต็ม</Badge>
                      ) : slot.current_bookings > 0 ? (
                        <Badge variant="warning">มีจอง</Badge>
                      ) : (
                        <Badge variant="success">ว่าง</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.current_bookings === 0 && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAvailability(slot.id, slot.is_available)}
                            title={slot.is_available ? 'ปิด slot' : 'เปิด slot'}
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
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
