import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/campaigns/[id]/voice
 * Retorna interações por voz da campanha
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  try {
    const { data, error } = await supabase
      .from('campaign_voice_interactions')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns/[id]/voice
 * Inicia uma nova interação por voz via RetellAI
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  try {
    const body = await req.json();
    const { phone_number, agent_id } = body;

    // Validações
    if (!phone_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    // Buscar campanha
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Chamar RetellAI API
    const retellApiKey = process.env.RETELL_API_KEY;
    if (!retellApiKey) {
      return NextResponse.json(
        { error: 'RetellAI API key not configured' },
        { status: 500 }
      );
    }

    const retellResponse = await fetch('https://api.retellai.com/v1/create-phone-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${retellApiKey}`,
      },
      body: JSON.stringify({
        from_number: process.env.RETELL_FROM_NUMBER || '+5511999999999',
        to_number: phone_number,
        agent_id: agent_id || process.env.RETELL_DEFAULT_AGENT_ID,
        metadata: {
          campaign_id: id,
          campaign_name: campaign.name,
        },
      }),
    });

    if (!retellResponse.ok) {
      const errorData = await retellResponse.json();
      throw new Error(errorData.message || 'Failed to start voice call');
    }

    const retellData = await retellResponse.json();
    const callId = retellData.call_id;

    // Salvar interação no banco
    const { data: interaction, error } = await supabase
      .from('campaign_voice_interactions')
      .insert({
        campaign_id: id,
        phone_number,
        retell_call_id: callId,
        status: 'initiated',
        created_by: user.id,
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
        event_type: 'voice_call_initiated',
        payload: {
          interaction_id: interaction.id,
          phone_number,
        },
        user_id: user.id,
      });
    } catch (e) {
      console.error('Failed to save timeline event:', e);
    }

    return NextResponse.json(interaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
