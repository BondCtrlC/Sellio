'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/trysellio', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/trysellio', label: 'Instagram' },
  { icon: Twitter, href: 'https://x.com/sellio_me', label: 'X (Twitter)' },
];

export function Footer() {
  const t = useTranslations('Footer');

  const footerLinks = {
    product: {
      title: t('product'),
      links: [
        { label: t('features'), href: '#features' },
        { label: t('pricing'), href: '#pricing' },
        { label: t('howItWorks'), href: '#how-it-works' },
      ]
    },
    support: {
      title: t('support'),
      links: [
        { label: t('contactUs'), href: 'mailto:support@trysellio.com' },
        { label: t('getStarted'), href: '/signup' },
      ]
    },
    legal: {
      title: t('legal'),
      links: [
        { label: t('terms'), href: '/terms' },
        { label: t('privacy'), href: '/privacy' },
        { label: t('cookies'), href: '/privacy#cookies' },
        { label: t('refund'), href: '/terms#refund' },
      ]
    }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center mb-2">
                <Image src="/logo-black.png" alt="Sellio" width={120} height={40} className="h-10 w-auto" />
              </Link>
              <p className="text-gray-600 text-sm mb-6 max-w-xs">
                {t('description')}
              </p>
              
              {/* Newsletter */}
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                />
                <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Links Columns */}
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h4 className="font-semibold text-gray-900 mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              {t('copyright')}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
