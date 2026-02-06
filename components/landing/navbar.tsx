'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/logo-black.png" alt="Sellio" width={100} height={32} className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-600 hover:text-black transition-colors">
              ฟีเจอร์
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-black transition-colors">
              วิธีใช้งาน
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-black transition-colors">
              ราคา
            </Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-black transition-colors">
              รีวิว
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/signup">
              <Button>เริ่มต้นฟรี</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              <Link 
                href="#features" 
                className="text-gray-600 hover:text-black transition-colors px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                ฟีเจอร์
              </Link>
              <Link 
                href="#how-it-works" 
                className="text-gray-600 hover:text-black transition-colors px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                วิธีใช้งาน
              </Link>
              <Link 
                href="#pricing" 
                className="text-gray-600 hover:text-black transition-colors px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                ราคา
              </Link>
              <Link 
                href="#testimonials" 
                className="text-gray-600 hover:text-black transition-colors px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                รีวิว
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                <Link href="/login">
                  <Button variant="outline" className="w-full">เข้าสู่ระบบ</Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full">เริ่มต้นฟรี</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
