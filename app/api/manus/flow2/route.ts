import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { generateCampaignInsights as generateWithGemini, InsightGenerationParams } from "@/lib/gemini";
import { generateCampaignInsights as generateWithOpenAI } from "@/lib/openai";

/**
 * Flow 2 - Insights Inteligentes (Google Gemini 2.0 Flash)
 * 
 * Gera insights estruturados para uma campanha usando Google Gemini (GRATUITO)
 * Fallback para OpenAI se Gemini falhar
 * Implementa cache de 24h para reduzir chamadas
 * Salva em campaign_insights e notifica o webhook Manus
 */

interface InsightData {
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  metadata: Record<string, any>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { campaign_id, tenant_id, reprocess = false } = body;

    if (!campaign_id || !tenant_id) {
      return NextResponse.json({
        error: "missing_required_fields",
        message: "campaign_id e tenant_id são obrigatórios"
      }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // 1. Notificar início
    await notifyWebhook({
      event_type: "insights_started",
      flow_id: `flow2_${campaign_id}_${Date.now()}`,
      data: { campaign_id, tenant_id, reprocess },
      status: "processing"
    });

    // 2. Buscar campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (campaignError || !campaign) {
      await notifyWebhook({
        event_type: "insights_error",
        flow_id: `flow2_${campaign_id}_${Date.now()}`,
        data: { campaign_id, error: "campaign_not_found" },
        status: "error"
      });
      return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
    }

    // 3. Verificar cache (se não for reprocessamento)
    if (!reprocess) {
      const { data: cachedInsight } = await supabase
        .from('insights_cache')
        .select('*')
        .eq('campaign_id', campaign_id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cachedInsight) {
        console.log('[Flow 2] Usando insight em cache');
        return NextResponse.json({
          success: true,
          cached: true,
          insights: cachedInsight.insights_data,
          tokens_used: cachedInsight.tokens_used,
          cost_usd: parseFloat(cachedInsight.cost_usd),
          model: cachedInsight.model,
          generated_at: cachedInsight.created_at
        });
      }
    }

    // 4. Gerar insights com Gemini (ou OpenAI como fallback)
    console.log('[Flow 2] Gerando novos insights...');
    const params: InsightGenerationParams = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      platform: campaign.platform,
      objective: campaign.objective,
      budget: campaign.budget,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      status: campaign.status
    };

    let aiInsights;
    let model = 'gemini-2.0-flash';
    
    try {
      // Tentar Gemini primeiro (GRATUITO)
      console.log('[Flow 2] Tentando Gemini...');
      aiInsights = await generateWithGemini(params);
      console.log('[Flow 2] ✅ Gemini gerou insights com sucesso');
    } catch (geminiError) {
      console.error('[Flow 2] ⚠️ Gemini falhou, usando OpenAI como fallback:', geminiError);
      
      // Fallback para OpenAI
      try {
        aiInsights = await generateWithOpenAI(params);
        model = 'gpt-4o-mini';
        console.log('[Flow 2] ✅ OpenAI gerou insights com sucesso');
      } catch (openaiError) {
        console.error('[Flow 2] ❌ OpenAI também falhou:', openaiError);
        throw new Error('Both Gemini and OpenAI failed to generate insights');
      }
    }

    // 5. Converter para formato do banco
    const insights: InsightData[] = [];
    
    // Adicionar métricas chave como insights
    aiInsights.keyMetrics.forEach((metric, index) => {
      insights.push({
        type: 'metric',
        title: metric.metric,
        description: metric.insight,
        impact: index < 2 ? 'high' : 'medium',
        confidence: 0.85,
        metadata: { value: metric.value }
      });
    });

    // Adicionar recomendações
    aiInsights.recommendations.forEach((rec, index) => {
      insights.push({
        type: 'recommendation',
        title: `Recomendação ${index + 1}`,
        description: rec,
        impact: 'high',
        confidence: 0.80,
        metadata: {}
      });
    });

    // Adicionar riscos
    aiInsights.risks.forEach((risk, index) => {
      insights.push({
        type: 'risk',
        title: `Risco Identificado ${index + 1}`,
        description: risk,
        impact: 'medium',
        confidence: 0.75,
        metadata: {}
      });
    });

    // Adicionar oportunidades
    aiInsights.opportunities.forEach((opp, index) => {
      insights.push({
        type: 'opportunity',
        title: `Oportunidade ${index + 1}`,
        description: opp,
        impact: 'high',
        confidence: 0.78,
        metadata: {}
      });
    });

    // 6. Salvar insights no banco
    const { data: savedInsights, error: insertError } = await supabase
      .from('campaign_insights')
      .insert(
        insights.map(insight => ({
          tenant_id,
          campaign_id,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          confidence: insight.confidence,
          metadata: insight.metadata
        }))
      )
      .select();

    if (insertError) {
      await notifyWebhook({
        event_type: "insights_error",
        flow_id: `flow2_${campaign_id}_${Date.now()}`,
        data: { campaign_id, error: insertError.message },
        status: "error"
      });
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 7. Salvar no cache
    await supabase.from('insights_cache').insert({
      campaign_id,
      insights_data: {
        summary: aiInsights.summary,
        insights: savedInsights,
        keyMetrics: aiInsights.keyMetrics,
        recommendations: aiInsights.recommendations,
        risks: aiInsights.risks,
        opportunities: aiInsights.opportunities
      },
      tokens_used: aiInsights.tokensUsed,
      cost_usd: aiInsights.cost,
      model
    });

    // 8. Criar evento de timeline
    await supabase.from('campaign_events').insert({
      tenant_id,
      campaign_id,
      event_type: 'insights_generated',
      user_id: null,
      metadata: {
        insights_count: savedInsights?.length || 0,
        tokens_used: aiInsights.tokensUsed,
        cost_usd: aiInsights.cost,
        model,
        reprocessed: reprocess
      }
    });

    // 9. Notificar conclusão
    await notifyWebhook({
      event_type: "insights_completed",
      flow_id: `flow2_${campaign_id}_${Date.now()}`,
      data: {
        campaign_id,
        tenant_id,
        insights_count: savedInsights?.length || 0,
        tokens_used: aiInsights.tokensUsed,
        cost_usd: aiInsights.cost,
        model,
        insights: savedInsights
      },
      status: "success"
    });

    return NextResponse.json({
      success: true,
      cached: false,
      summary: aiInsights.summary,
      insights_count: savedInsights?.length || 0,
      insights: savedInsights,
      tokens_used: aiInsights.tokensUsed,
      cost_usd: aiInsights.cost,
      model
    });

  } catch (error) {
    console.error('[Flow 2] Erro inesperado:', error);
    return NextResponse.json({
      error: 'internal_error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Notifica o webhook Manus
 */
async function notifyWebhook(payload: any) {
  if (!process.env.MANUS_WEBHOOK_URL) return;

  try {
    await fetch(process.env.MANUS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('[Flow 2] Erro ao notificar webhook:', error);
  }
}
