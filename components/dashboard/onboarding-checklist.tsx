'use client';

import Link from 'next/link';
import { 
  Check, 
  User, 
  Wallet, 
  Package, 
  Store, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  href: string;
  color: string;
}

interface OnboardingChecklistProps {
  hasProfile: boolean;
  hasPayment: boolean;
  hasProduct: boolean;
  isPublished: boolean;
}

export function OnboardingChecklist({ 
  hasProfile, 
  hasPayment, 
  hasProduct, 
  isPublished 
}: OnboardingChecklistProps) {
  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'ตั้งค่าโปรไฟล์',
      description: 'เพิ่มรูปภาพและข้อมูลของคุณ',
      icon: User,
      completed: hasProfile,
      href: '/dashboard/settings',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'payment',
      title: 'ตั้งค่าการรับเงิน',
      description: 'เชื่อมต่อ PromptPay หรือบัญชีธนาคาร',
      icon: Wallet,
      completed: hasPayment,
      href: '/dashboard/settings?tab=payments',
      color: 'bg-green-100 text-green-700',
    },
    {
      id: 'product',
      title: 'สร้างสินค้าแรก',
      description: 'เพิ่มสินค้าหรือบริการที่ต้องการขาย',
      icon: Package,
      completed: hasProduct,
      href: '/dashboard/products/new',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'publish',
      title: 'เปิดร้านค้า',
      description: 'เผยแพร่หน้าร้านให้ลูกค้าเข้าถึงได้',
      icon: Store,
      completed: isPublished,
      href: '/dashboard/settings?tab=store',
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const allDone = completedCount === totalSteps;

  // Don't show if all steps are completed
  if (allDone) return null;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">เริ่มต้นใช้งาน Sellio</CardTitle>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount}/{totalSteps} เสร็จแล้ว
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div 
            className="bg-primary rounded-full h-2 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.id}
                href={step.completed ? '#' : step.href}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  step.completed 
                    ? 'opacity-60 cursor-default' 
                    : 'hover:bg-muted/80 cursor-pointer'
                }`}
                onClick={(e) => step.completed && e.preventDefault()}
              >
                {/* Step Number / Check */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.completed 
                    ? 'bg-green-100' 
                    : step.color
                }`}>
                  {step.completed ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>

                {/* Arrow */}
                {!step.completed && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
