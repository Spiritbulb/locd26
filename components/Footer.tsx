'use client';
import React from 'react';
import Link from 'next/link';
import {
  Heart,
  Instagram,
  Facebook,
  Twitter,
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-white to-gray-50 border-t border-gray-200/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8a6e5d]/20 via-transparent to-[#7e4507]/20"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-6">
          {/* Brand Section - Links to Homepage */}
          <Link href="/" className="flex items-center gap-2 group transition-all duration-300 hover:scale-105">
            <img
              src="/logoloc.png"
              alt="Loc'd Essence Logo"
              className="h-12 w-auto object-contain"
            />
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#8a6e5d] via-[#a38776] to-[#7e4507] bg-clip-text text-transparent">
                Loc'd Essence
              </span>
              <div className="text-xs text-gray-500 -mt-1">
                Hair • Jewelry • Beauty
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/products"
              className="text-gray-600 hover:text-[#8a6e5d] transition-colors duration-300"
            >
              Products
            </Link>
            <Link
              href="/collections"
              className="text-gray-600 hover:text-[#8a6e5d] transition-colors duration-300"
            >
              Collections
            </Link>
            <Link
              href="/cart"
              className="text-gray-600 hover:text-[#8a6e5d] transition-colors duration-300"
            >
              Cart
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-[#8a6e5d] transition-colors duration-300"
            >
              About
            </Link>
          </nav>

          {/* Social Media */}
          <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {[
              { icon: Instagram, href: 'https://instagram.com/locd_essence', label: 'Instagram' },
            ].map((social, index) => (
              <Link
                key={index}
                href={social.href}
                className="p-2 text-gray-600 hover:text-white bg-gray-100 hover:bg-gradient-to-r hover:from-[#8a6e5d] hover:to-[#7e4507] rounded-lg transition-all duration-300"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4" />
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="mailto:locdessencenatural@gmail.com"
              className="text-gray-600 hover:text-[#8a6e5d] transition-colors duration-300"
            >
              Email
            </Link>
            <Link
              href="tel:+254791357078"
              className="text-gray-600 hover:text-[#8a6e5d] transition-colors duration-300"
            >
              Call
            </Link>
          </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-6 border-t border-gray-200/50">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} Loc'd Essence. Made with
            <Heart className="w-4 h-4 text-[#8a6e5d] inline mx-1" />
            for natural beauty.
          </p>
        </div>
      </div>
    </footer>
  );
}