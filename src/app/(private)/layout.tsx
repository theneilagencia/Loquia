"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PrivateHeader from "../components/ui/PrivateHeader";
import Onboarding from "../components/ui/Onboarding";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);
    
    // Verificar se é superadmin
    const adminEmails = ['admin@loquia.com'];
    if (user.email && adminEmails.includes(user.email)) {
      setIsSuperAdmin(true);
    }
    
    // Verificar se deve mostrar onboarding
    const hasSeenOnboarding = localStorage.getItem("loquia_onboarding_completed");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
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
  );
}
