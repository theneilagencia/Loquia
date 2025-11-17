"use client";

import Section from "./ui/Section";
import { H2, Body } from "./ui/Typography";

export default function SeoEnded() {
  return (
    <Section className="bg-white" id="seo-acabou">
      <div className="max-w-4xl mx-auto text-center">

        <H2>Por que SEO acabou</H2>

        <Body>
          As IAs não navegam em páginas. Elas consomem estruturas inteligentes.
        </Body>

        <Body>
          SEO foi criado para mecanismos de busca que liam textos.  
          A IA trabalha de outra forma. Ela usa:
        </Body>

        {/* Lista formatada */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm max-w-xl mx-auto my-8">
          <p className="text-gray-700 leading-relaxed">
            • intenção <br />
            • contexto <br />
            • semântica <br />
            • relevância comercial <br />
            • feeds estruturados <br />
            • dados validados <br />
            • perfis comportamentais individuais
          </p>
        </div>

        <Body>
          SEO não aparece no OpenAI Search.  
          SEO não aparece no Perplexity.  
          SEO não aparece no Claude.  
          SEO não aparece no Google SGE.  
          SEO não aparece nos agentes autônomos.
        </Body>

        <Body>
          O mundo mudou.  
          As empresas ainda não perceberam.  
          Você está prestes a sair na frente.
        </Body>

      </div>
    </Section>
  );
}
