'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Crown,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui';
import { logout } from '@/actions/auth';
import { getSidebarCounts, type SidebarCounts } from '@/actions/sidebar-counts';
import { createClient } from '@/lib/supabase/client';

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
  isOpen?: boolean;
  onClose?: () => void;
}

interface CreatorInfo {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: string;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<SidebarCounts>({ orders: 0, reviews: 0, calendar: 0 });
  const [creator, setCreator] = useState<CreatorInfo | null>(null);

  // Fetch creator info
  useEffect(() => {
    const fetchCreator = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('creators')
        .select('username, display_name, avatar_url, plan')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCreator(data as CreatorInfo);
      }
    };

    fetchCreator();
  }, []);

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

  const isPro = creator?.plan === 'pro';

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
        {/* Logo - Sellio branding */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-sidebar-foreground">Sellio</span>
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
          {/* Upgrade / Manage Subscription */}
          {isPro ? (
            <Link
              href="/dashboard/upgrade"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors mb-2"
            >
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="flex-1">จัดการ Subscription</span>
            </Link>
          ) : (
            <Link
              href="/dashboard/upgrade"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 hover:from-amber-100 hover:to-orange-100 transition-colors mb-2"
            >
              <Crown className="h-5 w-5 text-amber-600" />
              <span className="flex-1">อัปเกรด Pro</span>
              <span className="text-xs bg-amber-200 px-1.5 py-0.5 rounded-full font-bold">99฿</span>
            </Link>
          )}
          
          {creator?.username && (
            <Link
              href={`/u/${creator.username}`}
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

          {/* User profile section */}
          {creator && (
            <div className="pt-2 mt-2 border-t border-sidebar-border">
              <Link
                href="/dashboard/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-hover transition-colors"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {creator.avatar_url ? (
                    <Image
                      src={creator.avatar_url}
                      alt={creator.display_name || creator.username}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold text-sm">
                      {(creator.display_name || creator.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Name + Pro badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-sidebar-foreground truncate">
                      {creator.display_name || creator.username}
                    </span>
                    {isPro && (
                      <span className="flex-shrink-0 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white px-1.5 py-0.5 rounded-full">
                        PRO
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-sidebar-foreground/50">@{creator.username}</span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
