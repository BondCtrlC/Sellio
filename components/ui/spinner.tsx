import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function Spinner({ size = 'default', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        'animate-spin text-muted-foreground',
        {
          'h-4 w-4': size === 'sm',
          'h-6 w-6': size === 'default',
          'h-8 w-8': size === 'lg',
        },
        className
      )}
    />
  );
}

interface FullPageSpinnerProps {
  message?: string;
}

export function FullPageSpinner({ message = 'กำลังโหลด...' }: FullPageSpinnerProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
