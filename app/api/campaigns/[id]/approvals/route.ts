import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/campaigns/[id]/approvals
 * Retorna todas as aprovações de uma campanha
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('campaign_approvals')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * POST /api/campaigns/[id]/approvals
 * Cria uma nova aprovação (aprovar ou rejeitar)
 * Apenas clientes podem aprovar/rejeitar
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const supabase = await supabaseServer();

  // Validação
  if (!body.status || !['approved', 'rejected'].includes(body.status)) {
    return NextResponse.json(
      { error: 'status must be "approved" or "rejected"' },
      { status: 400 }
    );
  }

  // Obter usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Criar aprovação
  const { data, error } = await supabase
    .from('campaign_approvals')
    .insert({
      campaign_id: id,
      approver_id: user.id,
      status: body.status,
      comments: body.comments || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Salvar evento no timeline
  try {
    await supabase.from('campaign_events').insert({
      campaign_id: id,
      event_type: body.status === 'approved' ? 'campaign_approved' : 'campaign_rejected',
      payload: {
        approver_id: user.id,
        comments: body.comments,
      },
      user_id: user.id,
    });
  } catch (e) {
    console.error('Failed to save timeline event:', e);
  }

  return NextResponse.json(data);
}
