import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se há intenções no intent_graph
    const { data: intents, error: intentError } = await supabase
      .from("intent_graph")
      .select("*")
      .eq("tenant_id", user.id);

    if (intentError) {
      return NextResponse.json({ error: intentError.message }, { status: 500 });
    }

    if (!intents || intents.length === 0) {
      return NextResponse.json(
        { error: "Você precisa gerar intenções primeiro" },
        { status: 400 }
      );
    }

    // TODO: Executar o workflow Python commerce_feed_generator.py
    // Por enquanto, retornamos sucesso simulado
    
    return NextResponse.json({
      success: true,
      message: "Workflow de geração de feeds iniciado",
      intentsCount: intents.length,
      note: "Esta funcionalidade requer integração com o script Python. Por enquanto, apenas validamos os dados.",
    });
  } catch (error: any) {
    console.error("Erro ao executar workflow:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
