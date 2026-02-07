'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Check, 
  User, 
  Wallet, 
  Package, 
  Store, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
  MessageCircle,
  SkipForward,
  X
} from 'lucide-react';
import { getOnboardingStatus, type OnboardingStatus } from '@/actions/onboarding';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  href: string;
  color: string;
  required: boolean;
  skipped?: boolean;
}

export function OnboardingOverlay() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [lineSkipped, setLineSkipped] = useState(false);

  // Load status on mount and periodically
  useEffect(() => {
    // Check if LINE skip was saved
    const skipped = localStorage.getItem('sellio_line_notify_skipped');
    if (skipped === 'true') setLineSkipped(true);

    loadStatus();
    const interval = setInterval(loadStatus, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getOnboardingStatus();
      setStatus(data);
    } catch (e) {
      console.error('Onboarding status error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipLine = () => {
    setLineSkipped(true);
    localStorage.setItem('sellio_line_notify_skipped', 'true');
  };

  if (loading || !status || dismissed) return null;

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'ตั้งค่าโปรไฟล์',
      description: 'เพิ่มรูปภาพและชื่อที่แสดง',
      icon: User,
      completed: status.hasProfile,
      href: '/dashboard/settings',
      color: 'bg-blue-100 text-blue-700',
      required: true,
    },
    {
      id: 'contact',
      title: 'เพิ่มช่องทางติดต่อ',
      description: 'เบอร์โทร, Line, IG หรืออีเมล',
      icon: Phone,
      completed: status.hasContact,
      href: '/dashboard/settings',
      color: 'bg-cyan-100 text-cyan-700',
      required: true,
    },
    {
      id: 'payment',
      title: 'ตั้งค่าการรับเงิน',
      description: 'PromptPay หรือบัญชีธนาคาร',
      icon: Wallet,
      completed: status.hasPayment,
      href: '/dashboard/settings?tab=payments',
      color: 'bg-green-100 text-green-700',
      required: true,
    },
    {
      id: 'product',
      title: 'สร้างสินค้าแรก',
      description: 'เพิ่มสินค้าหรือบริการ',
      icon: Package,
      completed: status.hasProduct,
      href: '/dashboard/products/new',
      color: 'bg-purple-100 text-purple-700',
      required: true,
    },
    {
      id: 'publish',
      title: 'เปิดร้านค้า',
      description: 'เผยแพร่หน้าร้านให้ลูกค้าเข้าถึง',
      icon: Store,
      completed: status.isPublished,
      href: '/dashboard/settings?tab=store',
      color: 'bg-orange-100 text-orange-700',
      required: true,
    },
    {
      id: 'line_notify',
      title: 'ตั้งค่าแจ้งเตือนผ่าน LINE',
      description: 'รับแจ้งเตือนเมื่อมีออเดอร์ใหม่',
      icon: MessageCircle,
      completed: status.hasLineNotify,
      href: '/dashboard/settings?tab=notifications',
      color: 'bg-emerald-100 text-emerald-700',
      required: false,
      skipped: lineSkipped,
    },
  ];

  const requiredSteps = steps.filter(s => s.required);
  const requiredCompleted = requiredSteps.filter(s => s.completed).length;
  const allRequiredDone = requiredCompleted === requiredSteps.length;

  // Hide overlay when all required steps are done AND optional is done or skipped
  const optionalStep = steps.find(s => !s.required);
  const optionalHandled = !optionalStep || optionalStep.completed || optionalStep.skipped;
  if (allRequiredDone && optionalHandled) return null;

  const totalRequired = requiredSteps.length;
  const progressPercent = Math.round((requiredCompleted / totalRequired) * 100);

  // Find the next uncompleted required step
  const nextStep = requiredSteps.find(s => !s.completed);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)]">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header - always visible */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">เริ่มต้นใช้งาน Sellio</p>
              <p className="text-xs text-muted-foreground">
                {requiredCompleted}/{totalRequired} ขั้นตอน
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mini progress */}
            <div className="w-12 bg-gray-100 rounded-full h-1.5">
              <div 
                className="bg-primary rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {collapsed ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Expanded content */}
        {!collapsed && (
          <div className="px-4 pb-4 space-y-1.5 max-h-[60vh] overflow-y-auto">
            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Required steps */}
            {requiredSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.id}
                  href={step.completed ? '#' : step.href}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    step.completed 
                      ? 'opacity-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={(e) => step.completed && e.preventDefault()}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.completed ? 'bg-green-100' : step.color
                  }`}>
                    {step.completed ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-xs ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{step.description}</p>
                  </div>
                  {!step.completed && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                </Link>
              );
            })}

            {/* Optional: LINE Notify */}
            {optionalStep && !optionalStep.skipped && (
              <>
                <div className="border-t my-2" />
                <div className="flex items-center gap-3 p-2.5 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    optionalStep.completed ? 'bg-green-100' : optionalStep.color
                  }`}>
                    {optionalStep.completed ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-medium text-xs ${optionalStep.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {optionalStep.title}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        ไม่บังคับ
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{optionalStep.description}</p>
                  </div>
                  {optionalStep.completed ? null : (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link
                        href={optionalStep.href}
                        className="text-[11px] text-primary font-medium hover:underline"
                      >
                        ตั้งค่า
                      </Link>
                      <span className="text-gray-300 mx-0.5">|</span>
                      <button
                        onClick={handleSkipLine}
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        ข้าม
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Dismiss when all required done */}
            {allRequiredDone && !optionalHandled && (
              <button
                onClick={() => setDismissed(true)}
                className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ปิดหน้าต่างนี้
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Keep the old inline component for backward compatibility (not used anymore)
export function OnboardingChecklist({ 
  hasProfile, hasPayment, hasProduct, isPublished 
}: { hasProfile: boolean; hasPayment: boolean; hasProduct: boolean; isPublished: boolean }) {
  return null; // Replaced by OnboardingOverlay
}
