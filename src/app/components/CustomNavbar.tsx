"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function CustomNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo-black.png"
            alt="Loquia"
            width={120}
            height={32}
            className="hover:opacity-80 transition-opacity"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#como-funciona" className="text-sm text-gray-700 hover:text-black transition-colors">
            Como funciona
          </Link>
          <Link href="#planos" className="text-sm text-gray-700 hover:text-black transition-colors">
            Planos
          </Link>
          <Link href="#sobre" className="text-sm text-gray-700 hover:text-black transition-colors">
            Sobre
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Começar agora
          </Link>
        </div>
      </div>
    </nav>
  );
}
