'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { cancelBooking, rescheduleBooking, getAvailableSlotsForReschedule } from '@/actions/orders';
import { X, Calendar, Loader2, AlertTriangle, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ManageBookingProps {
  orderId: string;
  canManage: boolean; // Only if status is confirmed or pending_confirmation
  currentDate: string;
  currentTime: string;
  rescheduleCount?: number; // How many times rescheduled (max 1)
}

type Slot = {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  remaining: number;
};

const MAX_RESCHEDULES = 1;

export function ManageBooking({ orderId, canManage, currentDate, currentTime, rescheduleCount = 0 }: ManageBookingProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Reschedule state
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  if (!canManage) return null;

  const handleOpenReschedule = async () => {
    setShowRescheduleModal(true);
    setLoadingSlots(true);
    setError(null);
    
    const result = await getAvailableSlotsForReschedule(orderId);
    if (result.success && result.slots) {
      setSlots(result.slots);
    } else {
      setError(result.error || 'ไม่สามารถโหลดเวลาว่างได้');
    }
    setLoadingSlots(false);
  };

  const handleCancel = async () => {
    if (!confirm('ยืนยันยกเลิกการจอง? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) return;
    
    setIsLoading(true);
    setError(null);
    
    console.log('Calling cancelBooking with orderId:', orderId);
    const result = await cancelBooking(orderId, cancelReason || undefined);
    console.log('cancelBooking result:', result);
    
    if (result.success) {
      setSuccess('ยกเลิกการจองเรียบร้อยแล้ว');
      setShowCancelModal(false);
      // Reload page to show updated status
      window.location.reload();
    } else {
      setError(result.error || 'เกิดข้อผิดพลาด');
    }
    
    setIsLoading(false);
  };

  const handleReschedule = async () => {
    if (!selectedSlot) {
      setError('กรุณาเลือกเวลาใหม่');
      return;
    }
    
    if (!confirm('ยืนยันเปลี่ยนเวลานัดหมาย?')) return;
    
    setIsLoading(true);
    setError(null);
    
    const result = await rescheduleBooking(orderId, selectedSlot);
    
    if (result.success) {
      setSuccess('เปลี่ยนเวลานัดหมายเรียบร้อยแล้ว');
      setShowRescheduleModal(false);
      // Reload page to show updated booking time
      window.location.reload();
    } else {
      setError(result.error || 'เกิดข้อผิดพลาด');
    }
    
    setIsLoading(false);
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) {
      acc[slot.slot_date] = [];
    }
    acc[slot.slot_date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  // Don't render anything if can't manage (order cancelled, etc.)
  if (!canManage) {
    return null;
  }

  const canReschedule = rescheduleCount < MAX_RESCHEDULES;

  return (
    <>
      {/* Warning about reschedule limit */}
      {canReschedule && (
        <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          สามารถเปลี่ยนเวลานัดหมายได้ 1 ครั้งเท่านั้น
        </p>
      )}
      
      {/* Already rescheduled message */}
      {!canReschedule && (
        <p className="text-xs text-muted-foreground mt-3">
          คุณได้เปลี่ยนเวลานัดหมายไปแล้ว 1 ครั้ง
        </p>
      )}

      {/* Manage Buttons */}
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenReschedule}
          disabled={!canReschedule}
          className={`flex-1 ${!canReschedule ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          เปลี่ยนเวลา
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCancelModal(true)}
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-2" />
          ยกเลิกนัด
        </Button>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">ยกเลิกการจอง</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(currentDate)} เวลา {currentTime?.slice(0, 5)} น.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">เหตุผลการยกเลิก (ไม่บังคับ)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="ระบุเหตุผล..."
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-24"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={isLoading}
                className="flex-1"
              >
                ย้อนกลับ
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'ยืนยันยกเลิก'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">เปลี่ยนเวลานัดหมาย</h3>
                  <p className="text-sm text-muted-foreground">
                    เวลาเดิม: {formatDate(currentDate)} {currentTime?.slice(0, 5)} น.
                  </p>
                </div>
              </div>
              {/* Warning about one-time reschedule */}
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>คุณสามารถเปลี่ยนเวลานัดหมายได้ <strong>1 ครั้งเท่านั้น</strong> กรุณาเลือกเวลาที่แน่ใจ</span>
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  ไม่มีเวลาว่างอื่นให้เลือก
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                    <div key={date}>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {formatDate(date)}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {dateSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={`px-3 py-2 text-sm rounded-lg border-2 font-medium transition-colors ${
                              selectedSlot === slot.id
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                            }`}
                          >
                            <div>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</div>
                            <div className={`text-xs mt-0.5 ${
                              selectedSlot === slot.id ? 'text-white/80' : 'text-muted-foreground'
                            }`}>
                              ว่าง {slot.remaining} ที่นั่ง
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 mt-4">{error}</p>
              )}
            </div>

            <div className="p-6 border-t flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedSlot(null);
                  setError(null);
                }}
                disabled={isLoading}
                className="flex-1"
              >
                ย้อนกลับ
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={isLoading || !selectedSlot}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    ยืนยันเปลี่ยน
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50">
          {success}
        </div>
      )}
    </>
  );
}
