import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar cliente Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

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
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
    }
  });

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
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No content received from Gemini');
    }

    const insights = JSON.parse(text);
    
    // Gemini não retorna contagem de tokens diretamente na resposta
    // Estimativa baseada no tamanho do texto
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = Math.ceil(text.length / 4);
    const tokensUsed = estimatedInputTokens + estimatedOutputTokens;
    
    // Gemini 2.0 Flash é GRATUITO até 15 RPM / 1500 RPD
    // Custo = 0 dentro do tier gratuito
    const cost = 0;

    return {
      ...insights,
      tokensUsed,
      cost,
    };
  } catch (error) {
    console.error('Error generating insights with Gemini:', error);
    throw new Error('Failed to generate insights with Gemini');
  }
}

export async function generateOptimizationSuggestions(
  campaignData: InsightGenerationParams,
  currentInsights: any
): Promise<any> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1500,
      responseMimeType: 'application/json',
    }
  });

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

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  
  if (!text) {
    throw new Error('No content received from Gemini');
  }

  return JSON.parse(text);
}
