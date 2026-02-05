'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Calendar, X } from 'lucide-react';

interface DateFilterProps {
  currentFilter: string;
  customStart?: string;
  customEnd?: string;
}

const FILTER_OPTIONS = [
  { value: '7', label: '7 วัน' },
  { value: '14', label: '14 วัน' },
  { value: '30', label: '30 วัน' },
  { value: '90', label: '90 วัน' },
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'custom', label: 'กำหนดเอง' },
];

export function DateFilter({ currentFilter, customStart, customEnd }: DateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(currentFilter === 'custom');
  const [startDate, setStartDate] = useState(customStart || '');
  const [endDate, setEndDate] = useState(customEnd || '');

  const handleFilterChange = (value: string) => {
    if (value === 'custom') {
      setShowCustom(true);
      return;
    }
    
    setShowCustom(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('days', value);
    params.delete('start');
    params.delete('end');
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const handleCustomApply = () => {
    if (!startDate || !endDate) return;
    
    const params = new URLSearchParams();
    params.set('days', 'custom');
    params.set('start', startDate);
    params.set('end', endDate);
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const formatDateRange = () => {
    if (!customStart || !customEnd) return '';
    const start = new Date(customStart);
    const end = new Date(customEnd);
    return `${start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-3">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const isActive = currentFilter === option.value || 
            (option.value === '30' && !currentFilter);
          
          return (
            <Button
              key={option.value}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(option.value)}
              className="rounded-full"
            >
              {option.value === 'custom' && currentFilter === 'custom' && customStart
                ? formatDateRange()
                : option.label}
            </Button>
          );
        })}
      </div>

      {/* Custom Date Picker */}
      {showCustom && (
        <div className="flex items-end gap-3 p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <label className="text-sm font-medium">จากวันที่</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">ถึงวันที่</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleCustomApply} disabled={!startDate || !endDate}>
            ใช้งาน
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowCustom(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
