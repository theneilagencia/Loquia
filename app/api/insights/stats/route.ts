import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * API para estatísticas de uso e custos de insights
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // dias

    const supabase = await supabaseServer();

    // Buscar estatísticas do período
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const { data: stats, error } = await supabase
      .from('insights_cache')
      .select('tokens_used, cost_usd, model, created_at')
      .gte('created_at', startDate.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calcular estatísticas
    const totalInsights = stats?.length || 0;
    const totalTokens = stats?.reduce((sum, s) => sum + s.tokens_used, 0) || 0;
    const totalCost = stats?.reduce((sum, s) => sum + parseFloat(s.cost_usd), 0) || 0;
    const avgTokensPerInsight = totalInsights > 0 ? totalTokens / totalInsights : 0;
    const avgCostPerInsight = totalInsights > 0 ? totalCost / totalInsights : 0;

    // Agrupar por dia
    const dailyStats = stats?.reduce((acc: any, stat) => {
      const date = new Date(stat.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { insights: 0, tokens: 0, cost: 0 };
      }
      acc[date].insights += 1;
      acc[date].tokens += stat.tokens_used;
      acc[date].cost += parseFloat(stat.cost_usd);
      return acc;
    }, {});

    return NextResponse.json({
      period: parseInt(period),
      summary: {
        total_insights: totalInsights,
        total_tokens: totalTokens,
        total_cost_usd: totalCost.toFixed(6),
        total_cost_brl: (totalCost * 5.5).toFixed(2),
        avg_tokens_per_insight: Math.round(avgTokensPerInsight),
        avg_cost_per_insight_usd: avgCostPerInsight.toFixed(6),
        avg_cost_per_insight_brl: (avgCostPerInsight * 5.5).toFixed(4)
      },
      daily: dailyStats,
      model_distribution: {
        'gpt-4o-mini': stats?.filter(s => s.model === 'gpt-4o-mini').length || 0,
        'gpt-4o': stats?.filter(s => s.model === 'gpt-4o').length || 0
      }
    });
  } catch (error) {
    console.error('[Insights Stats] Erro:', error);
    return NextResponse.json({
      error: 'internal_error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
