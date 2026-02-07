'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sidebar, NotificationBell, StoreLink } from '@/components/dashboard';
import { OnboardingOverlay } from '@/components/dashboard/onboarding-checklist';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header with notification */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Image src="/logo-black.png" alt="Sellio" width={100} height={32} className="h-8 w-auto lg:hidden" />
          <div className="flex-1" />
          <StoreLink />
          <NotificationBell />
        </header>
        
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Onboarding overlay - shows on all dashboard pages */}
      <OnboardingOverlay />
    </div>
  );
}
