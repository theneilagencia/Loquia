"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function loginAction(email: string, password: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        error: "Configuração do Supabase não encontrada",
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.session) {
      return {
        success: false,
        error: "Falha ao criar sessão",
      };
    }

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set("sb-access-token", data.session.access_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    cookieStore.set("sb-refresh-token", data.session.refresh_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      success: false,
      error: `Erro inesperado: ${err.message}`,
    };
  }
}

export async function signupAction(email: string, password: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://loquia-frontend.vercel.app'}/dashboard`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // If session is created, set cookies
    if (data.session) {
      const cookieStore = await cookies();
      cookieStore.set("sb-access-token", data.session.access_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      cookieStore.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return {
        success: true,
        needsConfirmation: false,
        user: {
          id: data.user!.id,
          email: data.user!.email,
        },
      };
    }

    return {
      success: true,
      needsConfirmation: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro inesperado: ${err.message}`,
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("sb-access-token");
  cookieStore.delete("sb-refresh-token");
  return { success: true };
}
