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

    // Verificar se há itens no catálogo
    const { data: catalogItems, error: catalogError } = await supabase
      .from("catalog")
      .select("*")
      .eq("tenant_id", user.id);

    if (catalogError) {
      return NextResponse.json({ error: catalogError.message }, { status: 500 });
    }

    if (!catalogItems || catalogItems.length === 0) {
      return NextResponse.json(
        { error: "Você precisa adicionar itens ao catálogo primeiro" },
        { status: 400 }
      );
    }

    // TODO: Executar o workflow Python intent_graph_lite_loquia.py
    // Por enquanto, retornamos sucesso simulado
    
    return NextResponse.json({
      success: true,
      message: "Workflow de geração de intenções iniciado",
      catalogItemsCount: catalogItems.length,
      note: "Esta funcionalidade requer integração com o script Python. Por enquanto, apenas validamos os dados.",
    });
  } catch (error: any) {
    console.error("Erro ao executar workflow:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
