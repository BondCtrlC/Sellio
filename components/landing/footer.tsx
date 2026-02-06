import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Youtube, Mail } from 'lucide-react';

const footerLinks = {
  product: {
    title: 'ผลิตภัณฑ์',
    links: [
      { label: 'ฟีเจอร์', href: '#features' },
      { label: 'ราคา', href: '#pricing' },
      { label: 'วิธีใช้งาน', href: '#how-it-works' },
      { label: 'Changelog', href: '#' },
    ]
  },
  resources: {
    title: 'แหล่งข้อมูล',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'บล็อก', href: '#' },
      { label: 'วิดีโอสอนใช้งาน', href: '#' },
      { label: 'API Docs', href: '#' },
    ]
  },
  company: {
    title: 'บริษัท',
    links: [
      { label: 'เกี่ยวกับเรา', href: '#' },
      { label: 'ติดต่อเรา', href: '#' },
      { label: 'ร่วมงานกับเรา', href: '#' },
      { label: 'Press Kit', href: '#' },
    ]
  },
  legal: {
    title: 'กฎหมาย',
    links: [
      { label: 'เงื่อนไขการใช้งาน', href: '/terms' },
      { label: 'นโยบายความเป็นส่วนตัว', href: '/privacy' },
      { label: 'นโยบายคุกกี้', href: '/privacy#cookies' },
      { label: 'นโยบายคืนเงิน', href: '/terms#refund' },
    ]
  }
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'X (Twitter)' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center mb-2">
                <Image src="/logo-black.png" alt="Sellio" width={120} height={40} className="h-10 w-auto" />
              </Link>
              <p className="text-gray-600 text-sm mb-6 max-w-xs">
                แพลตฟอร์มขายสินค้าดิจิทัลที่ออกแบบมาสำหรับ Content Creator ไทย
              </p>
              
              {/* Newsletter */}
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="อีเมลของคุณ"
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
              © 2026 Sellio. All rights reserved.
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
