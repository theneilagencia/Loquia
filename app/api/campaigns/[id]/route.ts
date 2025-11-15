import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/campaigns/[id]
 * Retorna uma campanha específica
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'PGRST116' ? 404 : 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * PUT /api/campaigns/[id]
 * Atualiza uma campanha existente
 * Apenas agências podem editar campanhas
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const supabase = await supabaseServer();

  // Validação básica
  if (!body.name || !body.platform) {
    return NextResponse.json(
      { error: 'name and platform are required' },
      { status: 400 }
    );
  }

  // Validar datas
  if (body.start_date && body.end_date) {
    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    if (end < start) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 }
      );
    }
  }

  // Validar budget
  if (body.budget && body.budget < 0) {
    return NextResponse.json(
      { error: 'budget must be positive' },
      { status: 400 }
    );
  }

  // Atualizar campanha
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      name: body.name,
      goal: body.goal,
      description: body.description,
      budget: body.budget,
      start_date: body.start_date,
      end_date: body.end_date,
      targeting: body.targeting || {},
      creatives: body.creatives || [],
      platform: body.platform,
      status: body.status,
      metadata: body.metadata || {},
    })
    .eq('id', id)
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
      event_type: 'campaign_updated',
      payload: {
        updated_fields: Object.keys(body),
        previous_values: {},
      },
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });
  } catch (e) {
    // Evento não crítico, apenas log
    console.error('Failed to save timeline event:', e);
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/campaigns/[id]
 * Remove uma campanha (soft delete via status)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  // Soft delete: mudar status para 'archived'
  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: 'archived' })
    .eq('id', id)
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
      event_type: 'campaign_archived',
      payload: {},
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });
  } catch (e) {
    console.error('Failed to save timeline event:', e);
  }

  return NextResponse.json(data);
}
