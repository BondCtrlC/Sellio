'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings,
  Store,
  LogOut,
  X,
  BarChart3,
  Ticket,
  Users,
  Star,
  CalendarDays,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui';
import { logout } from '@/actions/auth';
import { getSidebarCounts, type SidebarCounts } from '@/actions/sidebar-counts';

const navItems = [
  {
    title: 'ภาพรวม',
    href: '/dashboard',
    icon: LayoutDashboard,
    countKey: null,
  },
  {
    title: 'สถิติ',
    href: '/dashboard/analytics',
    icon: BarChart3,
    countKey: null,
  },
  {
    title: 'ร้านค้าของฉัน',
    href: '/dashboard/my-store',
    icon: Store,
    countKey: null,
  },
  {
    title: 'สินค้า',
    href: '/dashboard/products',
    icon: Package,
    countKey: null,
  },
  {
    title: 'คำสั่งซื้อ',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    countKey: 'orders' as keyof SidebarCounts,
  },
  {
    title: 'ปฏิทิน',
    href: '/dashboard/calendar',
    icon: CalendarDays,
    countKey: 'calendar' as keyof SidebarCounts,
  },
  {
    title: 'คูปอง',
    href: '/dashboard/coupons',
    icon: Ticket,
    countKey: null,
  },
  {
    title: 'ลูกค้า',
    href: '/dashboard/customers',
    icon: Users,
    countKey: null,
  },
  {
    title: 'รีวิว',
    href: '/dashboard/reviews',
    icon: Star,
    countKey: 'reviews' as keyof SidebarCounts,
  },
  {
    title: 'ตั้งค่า',
    href: '/dashboard/settings',
    icon: Settings,
    countKey: null,
  },
];

interface SidebarProps {
  username?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ username, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<SidebarCounts>({ orders: 0, reviews: 0, calendar: 0 });

  // Fetch counts on mount and periodically
  useEffect(() => {
    const fetchCounts = async () => {
      const data = await getSidebarCounts();
      setCounts(data);
    };

    fetchCounts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refetch when pathname changes (e.g., after confirming an order)
  useEffect(() => {
    const fetchCounts = async () => {
      const data = await getSidebarCounts();
      setCounts(data);
    };
    fetchCounts();
  }, [pathname]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200',
          'lg:sticky lg:top-0 lg:translate-x-0 lg:z-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">Creator Store</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const count = item.countKey ? counts[item.countKey] : 0;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.title}</span>
                {count > 0 && (
                  <span 
                    className={cn(
                      'min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center',
                      isActive
                        ? 'bg-white text-primary'
                        : 'bg-red-500 text-white'
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-1">
          {/* Upgrade Banner - only show for free plan */}
          <Link
            href="/dashboard/upgrade"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 hover:from-amber-100 hover:to-orange-100 transition-colors mb-2"
          >
            <Crown className="h-5 w-5 text-amber-600" />
            <span className="flex-1">อัปเกรด Pro</span>
            <span className="text-xs bg-amber-200 px-1.5 py-0.5 rounded-full font-bold">99฿</span>
          </Link>
          
          {username && (
            <Link
              href={`/u/${username}`}
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors"
            >
              <Store className="h-5 w-5" />
              ดูหน้าร้าน
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
