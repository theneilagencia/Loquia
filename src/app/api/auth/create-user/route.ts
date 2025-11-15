import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = await supabaseServer();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No auth user" }, { status: 401 });
  }

  await supabase.from("users").insert({
    id: user.id,
    email: body.email,
    name: body.name,
    tenant_id: user.id,        // O tenant inicial == usuário
    role: "owner"
  });

  await supabase.from("tenants").insert({
    id: user.id,
    name: body.name,
    type: "client"
  });

  return NextResponse.json({ ok: true });
}
