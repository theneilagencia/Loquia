import OpenAI from 'openai';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface InsightGenerationParams {
  campaignId: string;
  campaignName: string;
  platform: string;
  objective: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  status: string;
}

export interface InsightResponse {
  summary: string;
  keyMetrics: {
    metric: string;
    value: string;
    insight: string;
  }[];
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  tokensUsed: number;
  cost: number;
}

export async function generateCampaignInsights(
  params: InsightGenerationParams
): Promise<InsightResponse> {
  const prompt = `Você é um especialista em marketing digital e análise de campanhas publicitárias.

Analise a seguinte campanha e forneça insights detalhados:

**Campanha:** ${params.campaignName}
**Plataforma:** ${params.platform}
**Objetivo:** ${params.objective}
**Orçamento:** ${params.budget ? `R$ ${params.budget.toLocaleString('pt-BR')}` : 'Não definido'}
**Período:** ${params.startDate || 'Não iniciada'} até ${params.endDate || 'Sem data de término'}
**Status:** ${params.status}

Forneça uma análise estruturada em JSON com o seguinte formato:
{
  "summary": "Resumo executivo da campanha (2-3 frases)",
  "keyMetrics": [
    {
      "metric": "Nome da métrica",
      "value": "Valor ou estimativa",
      "insight": "Insight sobre esta métrica"
    }
  ],
  "recommendations": ["Recomendação 1", "Recomendação 2", ...],
  "risks": ["Risco identificado 1", "Risco identificado 2", ...],
  "opportunities": ["Oportunidade 1", "Oportunidade 2", ...]
}

Seja específico, acionável e focado em resultados de negócio.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em marketing digital com foco em análise de campanhas e otimização de ROI.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const insights = JSON.parse(content);
    const tokensUsed = completion.usage?.total_tokens || 0;
    
    // Calcular custo (GPT-4o-mini: $0.15/1M input, $0.60/1M output)
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const cost = (inputTokens * 0.15 + outputTokens * 0.60) / 1000000;

    return {
      ...insights,
      tokensUsed,
      cost,
    };
  } catch (error) {
    console.error('Error generating insights with OpenAI:', error);
    throw new Error('Failed to generate insights');
  }
}

export async function generateOptimizationSuggestions(
  campaignData: InsightGenerationParams,
  currentInsights: any
): Promise<any> {
  const prompt = `Com base nos insights da campanha "${campaignData.campaignName}", sugira 3-5 otimizações específicas e acionáveis.

Insights atuais:
${JSON.stringify(currentInsights, null, 2)}

Forneça sugestões em JSON:
{
  "optimizations": [
    {
      "title": "Título da otimização",
      "description": "Descrição detalhada",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "expectedResult": "Resultado esperado"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em otimização de campanhas digitais.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  return JSON.parse(content);
}
