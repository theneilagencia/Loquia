"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import { ToastProvider } from "./contexts/ToastContext";
import PublicHeader from "./components/ui/PublicHeader";
import PrivateHeader from "./components/ui/PrivateHeader";
import Footer from "./components/ui/Footer";
import Onboarding from "./components/ui/Onboarding";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Rotas públicas (mostram PublicHeader)
  const publicRoutes = ["/", "/login", "/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      // Verificar se é superadmin
      const adminEmails = ['admin@loquia.com'];
      if (user.email && adminEmails.includes(user.email)) {
        setIsSuperAdmin(true);
      }
      
      // Verificar se deve mostrar onboarding (apenas em rotas privadas)
      if (!isPublicRoute) {
        const hasSeenOnboarding = localStorage.getItem("loquia_onboarding_completed");
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      }
    }
    
    setLoading(false);
  }

  function handleOpenOnboarding() {
    setShowOnboarding(true);
  }

  function handleCompleteOnboarding() {
    localStorage.setItem("loquia_onboarding_completed", "true");
    setShowOnboarding(false);
  }

  if (loading && !isPublicRoute) {
    return (
      <html lang="pt-BR">
        <body className="bg-white text-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR">
      <body className="bg-white text-gray-900">
        <ToastProvider>
          {isPublicRoute ? (
            <>
              <PublicHeader />
              {children}
              <Footer />
            </>
          ) : (
            <>
              <PrivateHeader 
                userEmail={user?.email} 
                isSuperAdmin={isSuperAdmin}
                onOpenOnboarding={handleOpenOnboarding}
              />
              {children}
              {showOnboarding && (
                <Onboarding onComplete={handleCompleteOnboarding} />
              )}
            </>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
