import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * POST /api/campaigns/[id]/duplicate
 * Duplica uma campanha existente
 * Cria uma nova campanha com os mesmos dados, mas com nome diferente
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  try {
    // Buscar campanha original
    const { data: originalCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !originalCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
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

    // Criar nova campanha (cópia)
    const newCampaign = {
      name: `${originalCampaign.name} (Cópia)`,
      goal: originalCampaign.goal,
      description: originalCampaign.description,
      budget: originalCampaign.budget,
      start_date: originalCampaign.start_date,
      end_date: originalCampaign.end_date,
      platform: originalCampaign.platform,
      status: 'draft', // Sempre começa como draft
      targeting: originalCampaign.targeting,
      creatives: originalCampaign.creatives,
      tenant_id: originalCampaign.tenant_id,
      created_by: user.id,
    };

    const { data: duplicatedCampaign, error: createError } = await supabase
      .from('campaigns')
      .insert(newCampaign)
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    // Salvar evento no timeline da campanha original
    try {
      await supabase.from('campaign_events').insert({
        campaign_id: id,
        event_type: 'campaign_duplicated',
        payload: {
          duplicated_to: duplicatedCampaign.id,
          duplicated_name: duplicatedCampaign.name,
        },
        user_id: user.id,
      });
    } catch (e) {
      console.error('Failed to save timeline event:', e);
    }

    // Salvar evento no timeline da campanha duplicada
    try {
      await supabase.from('campaign_events').insert({
        campaign_id: duplicatedCampaign.id,
        event_type: 'campaign_created',
        payload: {
          duplicated_from: id,
          original_name: originalCampaign.name,
        },
        user_id: user.id,
      });
    } catch (e) {
      console.error('Failed to save timeline event:', e);
    }

    return NextResponse.json(duplicatedCampaign);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
