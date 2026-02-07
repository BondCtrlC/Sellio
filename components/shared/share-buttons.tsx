'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { Share2, Facebook, Copy, Check, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  compact?: boolean;
}

// Twitter/X Icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Line Icon
function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.89c.5 0 .909.408.909.909v.773c0 .5-.409.909-.909.909h-1.817v.818h1.817c.5 0 .909.409.909.909v.772c0 .501-.409.91-.909.91h-2.727c-.5 0-.909-.409-.909-.91V9.89c0-.5.409-.909.909-.909h2.727zm-4.545 0c.5 0 .909.408.909.909v4.09c0 .501-.409.91-.909.91h-.773c-.5 0-.909-.409-.909-.91V9.89c0-.5.409-.909.909-.909h.773zm-2.728 0c.5 0 .909.408.909.909v4.09c0 .501-.409.91-.909.91h-.773c-.402 0-.742-.259-.862-.618l-1.637-2.819v2.527c0 .501-.408.91-.909.91h-.773c-.5 0-.909-.409-.909-.91V9.89c0-.5.409-.909.909-.909h.773c.401 0 .741.259.862.618l1.636 2.818V9.89c0-.5.409-.909.909-.909h.773zm-6.363 0c.5 0 .909.408.909.909v4.09c0 .501-.409.91-.909.91h-2.727c-.5 0-.909-.409-.909-.91V9.89c0-.5.409-.909.909-.909h2.727zm-.909 1.818h-.909v2.454h.909v-2.454zM12 2C6.477 2 2 5.813 2 10.5c0 4.184 3.714 7.7 8.727 8.4.34.074.802.225.919.517.105.265.069.679.034.945l-.148.9c-.046.273-.21 1.071.94.584 1.148-.488 6.202-3.657 8.462-6.261C22.614 13.582 24 12.145 24 10.5 24 5.813 19.523 2 12 2z" />
    </svg>
  );
}

export function ShareButtons({ url, title, description, compact = false }: ShareButtonsProps) {
  const t = useTranslations('ShareButtons');
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Convert relative URL to absolute URL on client side
  const getFullUrl = () => {
    if (typeof window === 'undefined') return url;
    if (url.startsWith('http')) return url;
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const fullUrl = getFullUrl();
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  // Native share if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // User cancelled or error
        setIsOpen(true);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          {t('share')}
        </Button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute right-0 top-full mt-2 bg-card border rounded-lg shadow-lg p-2 z-50 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleShare('facebook')}
                className="h-9 w-9 text-[#1877F2] hover:bg-[#1877F2]/10"
                title="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleShare('twitter')}
                className="h-9 w-9 text-black hover:bg-black/10"
                title="X (Twitter)"
              >
                <XIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleShare('line')}
                className="h-9 w-9 text-[#00B900] hover:bg-[#00B900]/10"
                title="Line"
              >
                <LineIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-9 w-9"
                title={t('copyLink')}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('shareLabel')}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('facebook')}
        className="h-9 w-9 text-[#1877F2] hover:bg-[#1877F2]/10"
        title="Facebook"
      >
        <Facebook className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('twitter')}
        className="h-9 w-9 text-black hover:bg-black/10"
        title="X (Twitter)"
      >
        <XIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('line')}
        className="h-9 w-9 text-[#00B900] hover:bg-[#00B900]/10"
        title="Line"
      >
        <LineIcon className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="h-9 w-9"
        title={t('copyLink')}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

// Simple share button for product cards
export function ShareButton({ url, title }: { url: string; title: string }) {
  const t = useTranslations('ShareButtons');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        // Fall back to copy
      }
    }
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleShare();
      }}
      className="p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
      title={t('share')}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Share2 className="h-4 w-4 text-gray-600" />
      )}
    </button>
  );
}
