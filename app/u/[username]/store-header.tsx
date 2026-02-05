'use client';

import { Instagram, Phone, Mail, MessageCircle } from 'lucide-react';
import { DEFAULT_STORE_DESIGN, type StoreDesign } from '@/types';

interface Creator {
  id: string;
  display_name: string | null;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  contact_phone?: string | null;
  contact_line?: string | null;
  contact_ig?: string | null;
  contact_email?: string | null;
  store_design?: StoreDesign | null;
}

interface StoreHeaderProps {
  creator: Creator;
}

// Custom TikTok icon since lucide doesn't have one
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

// Custom Line icon
function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  );
}

export function StoreHeader({ creator }: StoreHeaderProps) {
  const design = creator.store_design || DEFAULT_STORE_DESIGN;
  const profileLayout = design.profile_layout || 'centered';
  
  // Avatar size based on design
  const avatarSizeMap = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-24 h-24 text-3xl',
  };
  const avatarSize = avatarSizeMap[design.avatar_size || 'lg'];
  
  // Build contact links from fields
  const contactLinks: { type: string; url: string; icon: React.ComponentType<{ className?: string }> }[] = [];

  if (creator.contact_ig) {
    const igUsername = creator.contact_ig.replace('@', '');
    contactLinks.push({
      type: 'Instagram',
      url: `https://instagram.com/${igUsername}`,
      icon: Instagram,
    });
  }

  if (creator.contact_line) {
    const lineId = creator.contact_line.replace('@', '');
    contactLinks.push({
      type: 'Line',
      url: `https://line.me/ti/p/~${lineId}`,
      icon: LineIcon,
    });
  }

  if (creator.contact_email) {
    contactLinks.push({
      type: 'Email',
      url: `mailto:${creator.contact_email}`,
      icon: Mail,
    });
  }

  if (creator.contact_phone) {
    contactLinks.push({
      type: 'Phone',
      url: `tel:${creator.contact_phone}`,
      icon: Phone,
    });
  }

  // Hero Layout - Avatar as full background
  if (profileLayout === 'hero') {
    return (
      <header className="relative h-72 sm:h-80">
        {/* Background Image */}
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt={creator.display_name || creator.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ backgroundColor: design.theme_color }}
          />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-center drop-shadow-lg">
            {creator.display_name || creator.username}
          </h1>
          
          {creator.bio && (
            <p className="text-base sm:text-lg text-center text-white/90 mt-2 max-w-md drop-shadow">
              {creator.bio}
            </p>
          )}

          {/* Contact/Social Links */}
          {contactLinks.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              {contactLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.type}
                    href={link.url}
                    target={link.type === 'Email' || link.type === 'Phone' ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                    title={link.type}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </header>
    );
  }

  // With Cover Layout
  if (profileLayout === 'with_cover') {
    return (
      <header>
        {/* Cover */}
        <div 
          className="h-32 w-full"
          style={{ backgroundColor: design.theme_color }}
        />
        
        <div className="max-w-2xl mx-auto px-4 -mt-12 pb-6">
          <div className="text-center">
            {/* Avatar */}
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.display_name || creator.username}
                className={`${avatarSize} rounded-full mx-auto object-cover border-4 border-white shadow-lg`}
              />
            ) : (
              <div 
                className={`${avatarSize} rounded-full mx-auto flex items-center justify-center text-white font-bold border-4 border-white shadow-lg`}
                style={{ backgroundColor: design.theme_color }}
              >
                {(creator.display_name || creator.username).charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name */}
            <h1 className="text-2xl font-bold text-foreground mt-3 mb-1">
              {creator.display_name || creator.username}
            </h1>
            
            {/* Username */}
            <p className="text-muted-foreground text-sm mb-3">
              @{creator.username}
            </p>

            {/* Bio */}
            {creator.bio && (
              <p className="text-foreground/80 max-w-md mx-auto mb-4 whitespace-pre-line">
                {creator.bio}
              </p>
            )}

            {/* Contact/Social Links */}
            {contactLinks.length > 0 && (
              <div className="flex items-center justify-center gap-3">
                {contactLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.type}
                      href={link.url}
                      target={link.type === 'Email' || link.type === 'Phone' ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                      title={link.type}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Minimal Layout
  if (profileLayout === 'minimal') {
    return (
      <header className="pt-6 pb-4">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.display_name || creator.username}
                className={`${avatarSize} rounded-full object-cover border-2 border-white shadow`}
              />
            ) : (
              <div 
                className={`${avatarSize} rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow`}
                style={{ backgroundColor: design.theme_color }}
              >
                {(creator.display_name || creator.username).charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Name */}
              <h1 className="text-xl font-bold text-foreground truncate">
                {creator.display_name || creator.username}
              </h1>
              
              {/* Username */}
              <p className="text-muted-foreground text-sm">
                @{creator.username}
              </p>

              {/* Contact/Social Links */}
              {contactLinks.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {contactLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.type}
                        href={link.url}
                        target={link.type === 'Email' || link.type === 'Phone' ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                        title={link.type}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bio - below for minimal */}
          {creator.bio && (
            <p className="text-foreground/80 mt-3 whitespace-pre-line text-sm">
              {creator.bio}
            </p>
          )}
        </div>
      </header>
    );
  }

  // Default: Centered Layout
  return (
    <header className="pt-8 pb-6">
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* Avatar */}
        <div className="mb-4">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.display_name || creator.username}
              className={`${avatarSize} rounded-full mx-auto object-cover border-4 border-white shadow-lg`}
            />
          ) : (
            <div 
              className={`${avatarSize} rounded-full mx-auto flex items-center justify-center text-white font-bold border-4 border-white shadow-lg`}
              style={{ backgroundColor: design.theme_color }}
            >
              {(creator.display_name || creator.username).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {creator.display_name || creator.username}
        </h1>
        
        {/* Username */}
        <p className="text-muted-foreground text-sm mb-3">
          @{creator.username}
        </p>

        {/* Bio */}
        {creator.bio && (
          <p className="text-foreground/80 max-w-md mx-auto mb-4 whitespace-pre-line">
            {creator.bio}
          </p>
        )}

        {/* Contact/Social Links */}
        {contactLinks.length > 0 && (
          <div className="flex items-center justify-center gap-3">
            {contactLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.type}
                  href={link.url}
                  target={link.type === 'Email' || link.type === 'Phone' ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                  title={link.type}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
