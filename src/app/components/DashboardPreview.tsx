"use client";

import Section from "./ui/Section";
import { H2, Body, H3 } from "./ui/Typography";
import { Activity, BarChart3, Sparkles, CheckCircle, SquareChartGantt } from "lucide-react";

export default function DashboardPreview() {
  return (
    <Section className="bg-white" id="dashboard">
      <div className="max-w-5xl mx-auto text-center">
        
        <H2>Intent Proof Dashboard™</H2>
        <Body>
          A prova visual e técnica de que sua empresa está sendo usada pelas IAs — 
          em tempo real.
        </Body>

        {/* GRID PRINCIPAL */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          
          {/* CARD 1 */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-left shadow-sm hover:shadow-md transition-all">
            <Activity className="text-yellow-400 mb-4" size={32} />
            <H3 className="mb-2">Status da Presença IA</H3>
            <Body className="mb-0">
              Veja a saúde do seu feed em OpenAI Search, Perplexity, Claude e Google SGE.
            </Body>
          </div>

          {/* CARD 2 */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-left shadow-sm hover:shadow-md transition-all">
            <Sparkles className="text-yellow-400 mb-4" size={32} />
            <H3 className="mb-2">Logs de intenção ativada</H3>
            <Body className="mb-0">
              Cada vez que uma IA recomenda sua empresa, você vê em tempo real.
            </Body>
          </div>

          {/* CARD 3 */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-left shadow-sm hover:shadow-md transition-all">
            <BarChart3 className="text-yellow-400 mb-4" size={32} />
            <H3 className="mb-2">Analytics completos</H3>
            <Body className="mb-0">
              Descubra quais intenções geram mais leads, quais IAs mais usam seu feed e muito mais.
            </Body>
          </div>

        </div>

        {/* SIMULAÇÃO DE FEED VIEWER */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 mt-16 shadow-sm text-left max-w-4xl mx-auto">
          <SquareChartGantt className="w-10 h-10 text-indigo-600" />
          <H3 className="mb-3">Feed Viewer — como as IAs veem sua marca</H3>
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm leading-relaxed shadow-sm">
            <p className="text-gray-700">
              <span className="text-green-600 font-semibold">✔ Intenção acionada:</span> “melhor clínica de estética para melasma”  
              <br /><br />
              <span className="text-green-600 font-semibold">✔ Recomendação gerada:</span> Sua empresa foi sugerida pelo modelo para este cenário.  
              <br /><br />
              <span className="text-green-600 font-semibold">✔ Origem:</span> OpenAI Search  
            </p>
          </div>
        </div>

      </div>
    </Section>
  );
}
