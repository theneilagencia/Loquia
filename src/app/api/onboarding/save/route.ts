import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "not authorized" }, { status: 401 });

  // Criar registro de estratégia inicial
  const week = new Date();
  const monday = week;
  monday.setDate(week.getDate() - week.getDay() + 1);

  await supabase.from("strategies").insert({
    tenant_id: user.id,
    week_reference: monday,
    objective: body.objective,
    recommended_budget: Number(body.budget),
    platforms: ["meta", "google", "tiktok"],
    segments: [],
    creative_requirements: [],
    status: "awaiting_integrations"
  });

  // Emitir evento ao Manus (Flow 1)
  await fetch(process.env.MANUS_WEBHOOK_FLOW1!, {
    method: "POST",
    body: JSON.stringify({
      type: "event",
      action: "onboarding_completed",
      user_id: user.id,
      tenant_id: user.id,
      payload: body
    }),
    headers: { "Content-Type": "application/json" }
  });

  return NextResponse.json({ ok: true });
}
