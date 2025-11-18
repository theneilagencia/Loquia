"use client";

import Link from "next/link";
import Button from "./Button";
import Logo from "./Logo";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Logo size="md" href="/" />

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#como-funciona" className="text-gray-700 hover:text-gray-900 text-base">
            Como funciona
          </Link>
          <Link href="/#planos" className="text-gray-700 hover:text-gray-900 text-base">
            Planos
          </Link>
          <Link href="/#dashboard" className="text-gray-700 hover:text-gray-900 text-base">
            Dashboard
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="md">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button size="md">Criar conta</Button>
          </Link>
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4 flex flex-col gap-4">
          <Link href="/#como-funciona" className="text-gray-700 text-base" onClick={() => setOpen(false)}>
            Como funciona
          </Link>
          <Link href="/#planos" className="text-gray-700 text-base" onClick={() => setOpen(false)}>
            Planos
          </Link>
          <Link href="/#dashboard" className="text-gray-700 text-base" onClick={() => setOpen(false)}>
            Dashboard
          </Link>
          <Link href="/login" onClick={() => setOpen(false)}>
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/signup" onClick={() => setOpen(false)}>
            <Button>Criar conta</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
