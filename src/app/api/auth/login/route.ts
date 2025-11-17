import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("Login attempt for:", email);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("Supabase URL:", supabaseUrl);
    console.log("Supabase Key exists:", !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuração do Supabase não encontrada" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          error: error.message,
          errorCode: error.status,
          errorDetails: error.name
        },
        { status: 400 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: "Falha ao criar sessão" },
        { status: 400 }
      );
    }

    console.log("Login successful for:", email);

    // Return session data
    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (err: any) {
    console.error("Unexpected error in login API:", err);
    return NextResponse.json(
      { error: `Erro inesperado: ${err.message}` },
      { status: 500 }
    );
  }
}
