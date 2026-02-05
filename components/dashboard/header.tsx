'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui';
import { NotificationBell } from './notification-bell';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  notificationCount?: number;
}

export function Header({ title = 'Dashboard', onMenuClick, notificationCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
      
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {/* Notification Bell */}
      <NotificationBell initialCount={notificationCount} />
    </header>
  );
}
