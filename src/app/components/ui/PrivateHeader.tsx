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
          
          {/* User Info */}
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-300">
            <span className="text-sm text-gray-600">{userEmail}</span>
            
            {/* Botão Onboarding */}
            {onOpenOnboarding && (
              <Button
                onClick={onOpenOnboarding}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Play size={16} />
                Onboarding
              </Button>
            )}
            
            {/* Botão Admin */}
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
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <LogOut size={16} />
              Sair
            </Button>
          </div>
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
          <div className="pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">{userEmail}</p>
          </div>
          
          <Link href="/dashboard" className="text-gray-700 text-base" onClick={() => setOpen(false)}>
            Dashboard
          </Link>
          <Link href="/catalog" className="text-gray-700 text-base" onClick={() => setOpen(false)}>
            Catálogo
          </Link>
          <Link href="/intent" className="text-gray-700 text-base" onClick={() => setOpen(false)}>
            Intenções
          </Link>
          <Link href="/feeds" className="text-gray-700 text-base" onClick={() => setOpen(false)}>
            Feeds
          </Link>
          
          {onOpenOnboarding && (
            <Button
              onClick={() => {
                onOpenOnboarding();
                setOpen(false);
              }}
              variant="ghost"
              className="flex items-center gap-2 justify-start"
            >
              <Play size={16} />
              Iniciar Onboarding
            </Button>
          )}
          
          {isSuperAdmin && (
            <Button 
              onClick={() => {
                router.push("/admin");
                setOpen(false);
              }}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
            >
              ADMIN
            </Button>
          )}
          
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="flex items-center gap-2 justify-start text-red-600"
          >
            <LogOut size={16} />
            Sair
          </Button>
        </div>
      )}
    </header>
  );
}
