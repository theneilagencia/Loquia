import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/campaigns/[id]/market-analysis
 * Retorna análises de mercado geradas via Apify
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  try {
    const { data, error } = await supabase
      .from('campaign_market_analysis')
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
 * POST /api/campaigns/[id]/market-analysis
 * Inicia uma nova análise de mercado via Apify
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  try {
    const body = await req.json();
    const { keywords, competitors, regions } = body;

    // Validações
    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required' },
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

    // Chamar Apify API
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      return NextResponse.json(
        { error: 'Apify API token not configured' },
        { status: 500 }
      );
    }

    const apifyResponse = await fetch('https://api.apify.com/v2/acts/apify~google-search-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apifyToken}`,
      },
      body: JSON.stringify({
        queries: keywords.join(', '),
        maxPagesPerQuery: 3,
        resultsPerPage: 10,
        mobileResults: false,
        languageCode: 'pt',
        countryCode: regions?.[0] || 'BR',
      }),
    });

    if (!apifyResponse.ok) {
      throw new Error('Failed to start Apify scraper');
    }

    const apifyData = await apifyResponse.json();
    const runId = apifyData.data.id;

    // Salvar análise no banco
    const { data: analysis, error } = await supabase
      .from('campaign_market_analysis')
      .insert({
        campaign_id: id,
        keywords,
        competitors,
        regions,
        apify_run_id: runId,
        status: 'running',
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
        event_type: 'market_analysis_started',
        payload: {
          analysis_id: analysis.id,
          keywords,
        },
        user_id: user.id,
      });
    } catch (e) {
      console.error('Failed to save timeline event:', e);
    }

    return NextResponse.json(analysis, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
