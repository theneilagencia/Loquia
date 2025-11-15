import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/campaigns
 * Lista todas as campanhas do tenant do usuário
 */
export async function GET(req: Request) {
  const supabase = await supabaseServer();

  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Buscar perfil do usuário para obter tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Buscar campanhas do tenant (RLS aplica automaticamente)
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(campaigns || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns
 * Cria uma nova campanha
 */
export async function POST(req: Request) {
  const supabase = await supabaseServer();

  try {
    const body = await req.json();
    const {
      name,
      goal,
      description,
      budget,
      start_date,
      end_date,
      platform,
      status,
      targeting,
      creatives,
    } = body;

    // Validações
    if (!name || !platform) {
      return NextResponse.json(
        { error: 'Name and platform are required' },
        { status: 400 }
      );
    }

    if (budget && budget < 0) {
      return NextResponse.json(
        { error: 'Budget must be positive' },
        { status: 400 }
      );
    }

    if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
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

    // Buscar perfil do usuário para obter tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Criar campanha
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        name,
        goal,
        description,
        budget,
        start_date,
        end_date,
        platform,
        status: status || 'draft',
        targeting,
        creatives,
        tenant_id: profile.tenant_id,
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
        campaign_id: campaign.id,
        event_type: 'campaign_created',
        payload: {
          name: campaign.name,
          platform: campaign.platform,
        },
        user_id: user.id,
      });
    } catch (e) {
      console.error('Failed to save timeline event:', e);
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
