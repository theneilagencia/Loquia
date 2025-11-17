"use client";

import Section from "./ui/Section";
import { H2, Body } from "./ui/Typography";

export default function Era() {
  return (
    <Section id="como-funciona" className="bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        
        <H2>O fim de uma era</H2>

        <Body>
          SEO e anúncios pagos chegaram ao limite.  
          O tráfego se fragmentou. A atenção mudou de lugar.
        </Body>

        <Body>
          As buscas agora acontecem dentro da IA.
          Antes, as pessoas digitavam no Google.  
          Hoje, conversam com a IA.
        </Body>

        <Body>
          E as perguntas são diretas:
        </Body>

        <div className="bg-white border border-gray-200 rounded-xl p-6 text-left shadow-sm max-w-xl mx-auto my-8">
          <p className="text-gray-700 leading-relaxed">
            • Qual a melhor pousada em Tiradentes? <br />
            • Um dentista bom e rápido perto de mim? <br />
            • Qual CRM atende pequenas empresas com mais eficiência? <br />
            • Onde encontro clínica estética especializada em melasma?
          </p>
        </div>

        <Body>
          A resposta não vem mais de uma lista de links.  
          Vem de um modelo de IA que entende intenção, contexto e relevância comercial.
        </Body>

        <Body>
          Se a sua empresa não existe nesse ecossistema,  
          ela deixa de existir para a nova economia da atenção.
        </Body>

      </div>
    </Section>
  );
}
