'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Copy, Check, ExternalLink, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function StoreLink() {
  const [username, setUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUsername = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: creator } = await supabase
        .from('creators')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (creator) {
        setUsername(creator.username);
      }
    };

    fetchUsername();
  }, []);

  const storeUrl = username ? `${window.location.origin}/u/${username}` : '';

  const handleCopy = async () => {
    if (!storeUrl) return;
    
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!username) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Store URL Display */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
        <Store className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground max-w-[200px] truncate">
          /u/{username}
        </span>
        
        {/* Copy Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
          title="คัดลอกลิงก์"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Open Store Link */}
        <Link href={`/u/${username}`} target="_blank">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="เปิดร้านค้า"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Mobile: Just icon buttons */}
      <div className="flex sm:hidden items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          title="คัดลอกลิงก์ร้านค้า"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
