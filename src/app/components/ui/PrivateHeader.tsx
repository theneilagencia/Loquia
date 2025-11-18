"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "./Logo";
import Button from "./Button";
import { Menu, X, LogOut, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/app/contexts/ToastContext";

interface PrivateHeaderProps {
  userEmail?: string;
  isSuperAdmin?: boolean;
  onOpenOnboarding?: () => void;
}

export default function PrivateHeader({ 
  userEmail, 
  isSuperAdmin = false,
  onOpenOnboarding 
}: PrivateHeaderProps) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    
    // Limpar localStorage
    localStorage.removeItem("loquia_onboarding_completed");
    localStorage.removeItem("sb-access-token");
    localStorage.removeItem("sb-refresh-token");
    
    showSuccess("Logout realizado com sucesso");
    router.push("/login");
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Logo size="md" href="/dashboard" />

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 text-base">
            Dashboard
          </Link>
          <Link href="/catalog" className="text-gray-700 hover:text-gray-900 text-base">
            Catálogo
          </Link>
          <Link href="/intent" className="text-gray-700 hover:text-gray-900 text-base">
            Intenções
          </Link>
          <Link href="/feeds" className="text-gray-700 hover:text-gray-900 text-base">
            Feeds
          </Link>
          <Link href="/intent-proof" className="text-yellow-600 hover:text-yellow-700 text-base font-semibold">
            Intent Proof™
          </Link>
          
          {/* User Info */}
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-300">
            <span className="text-sm text-gray-600">{userEmail}</span>
            
            {/* Botão Onboarding */}
            {onOpenOnboarding && (
              <Button
                onClick={onOpenOnboarding}
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-gray-900"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            
            {/* Botão ADMIN */}
            {isSuperAdmin && (
              <Button 
                onClick={() => router.push("/admin")} 
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold border-2 border-black"
                size="sm"
              >
                ADMIN
              </Button>
            )}
            
            {/* Botão Sair */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-gray-700 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-gray-700 hover:text-gray-900"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-6 py-4 space-y-3">
            <Link
              href="/dashboard"
              className="block text-gray-700 hover:text-gray-900 py-2"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/catalog"
              className="block text-gray-700 hover:text-gray-900 py-2"
              onClick={() => setOpen(false)}
            >
              Catálogo
            </Link>
            <Link
              href="/intent"
              className="block text-gray-700 hover:text-gray-900 py-2"
              onClick={() => setOpen(false)}
            >
              Intenções
            </Link>
            <Link
              href="/feeds"
              className="block text-gray-700 hover:text-gray-900 py-2"
              onClick={() => setOpen(false)}
            >
              Feeds
            </Link>
            <Link
              href="/intent-proof"
              className="block text-yellow-600 hover:text-yellow-700 py-2 font-semibold"
              onClick={() => setOpen(false)}
            >
              Intent Proof™
            </Link>
            
            <div className="border-t border-gray-200 pt-3 mt-3">
              <p className="text-sm text-gray-600 mb-3">{userEmail}</p>
              
              {onOpenOnboarding && (
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    setOpen(false);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-gray-900 py-2"
                >
                  Onboarding
                </button>
              )}
              
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    router.push("/admin");
                    setOpen(false);
                  }}
                  className="block w-full text-left bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded mt-2"
                >
                  ADMIN
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="block w-full text-left text-red-600 hover:text-red-700 py-2 mt-2"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
