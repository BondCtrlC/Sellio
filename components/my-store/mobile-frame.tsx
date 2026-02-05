'use client';

import { cn } from '@/lib/utils';

interface MobileFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileFrame({ children, className }: MobileFrameProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Phone Frame */}
      <div className="relative w-[320px] h-[640px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2.25rem] overflow-hidden">
          {/* Status Bar */}
          <div className="h-8 bg-white flex items-center justify-between px-6 text-xs font-medium">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l11 11c.18.18.43.29.71.29.28 0 .53-.11.71-.29l11-11c.18-.18.29-.43.29-.71 0-.28-.11-.53-.29-.71C20.66 4.78 16.54 3 12 3z" />
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 22h20V2z" />
              </svg>
              <svg className="w-6 h-3" fill="currentColor" viewBox="0 0 24 12">
                <rect x="0" y="0" width="22" height="12" rx="2" stroke="currentColor" fill="none" strokeWidth="1" />
                <rect x="2" y="2" width="16" height="8" rx="1" />
                <rect x="22" y="4" width="2" height="4" rx="1" />
              </svg>
            </div>
          </div>
          
          {/* Content */}
          <div className="h-[calc(100%-2rem)] overflow-y-auto">
            {children}
          </div>
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  );
}
