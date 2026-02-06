'use client';

import Link from 'next/link';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui';
import type { PlanType } from '@/types';
import { hasFeature, type PlanFeature } from '@/lib/plan';

interface ProGateProps {
  plan: PlanType;
  feature: PlanFeature;
  children: React.ReactNode;
  /** What to show when locked. Defaults to overlay */
  fallback?: 'overlay' | 'hide' | 'badge';
  /** Custom message */
  message?: string;
}

/**
 * Wraps content that requires Pro plan.
 * If user is on Free plan, shows upgrade prompt instead.
 */
export function ProGate({ plan, feature, children, fallback = 'overlay', message }: ProGateProps) {
  const allowed = hasFeature(plan, feature);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback === 'hide') {
    return null;
  }

  if (fallback === 'badge') {
    return (
      <div className="relative inline-flex items-center gap-1.5">
        <span className="opacity-50 pointer-events-none">{children}</span>
        <Link href="/dashboard/upgrade">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full border border-amber-200 hover:from-amber-200 hover:to-orange-200 transition-colors cursor-pointer">
            <Crown className="h-3 w-3" />
            Pro
          </span>
        </Link>
      </div>
    );
  }

  // Overlay fallback
  return (
    <div className="relative">
      {/* Upgrade prompt - always visible at top */}
      <div className="mb-6 bg-white border border-amber-200 rounded-xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-7 w-7 text-amber-600" />
        </div>
        <h3 className="font-semibold text-xl mb-2">ฟีเจอร์สำหรับ Pro</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          {message || 'อัปเกรดเป็น Pro เพื่อใช้งานฟีเจอร์นี้'}
        </p>
        <Link href="/dashboard/upgrade">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Crown className="h-4 w-4 mr-1.5" />
            อัปเกรด 99 บาท/เดือน
          </Button>
        </Link>
      </div>
      {/* Blurred content preview */}
      <div className="opacity-20 pointer-events-none blur-[2px] max-h-[400px] overflow-hidden" aria-hidden>
        {children}
      </div>
    </div>
  );
}

/**
 * Simple badge showing "Pro" tag on locked features
 */
export function ProBadge() {
  return (
    <Link href="/dashboard/upgrade">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full border border-amber-200 hover:from-amber-200 hover:to-orange-200 transition-colors cursor-pointer">
        <Crown className="h-3 w-3" />
        Pro
      </span>
    </Link>
  );
}
