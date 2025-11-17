"use client";

import Section from "./ui/Section";
import { H2, Body, H3 } from "./ui/Typography";
import { CheckCircle } from "lucide-react";

const steps = [
  {
    title: "1. Você cadastra sua empresa",
    text: "Simples e rápido. Basta inserir seus dados básicos.",
  },
  {
    title: "2. Criamos seu Intent Graph",
    text: "O mapa do que sua empresa resolve — com intenções reais que as pessoas usam ao conversar com a IA.",
  },
  {
    title: "3. Geramos feeds para cada IA",
    text: "OpenAI, Perplexity, Claude, SGE e muito mais. Cada uma recebe a versão ideal.",
  },
  {
    title: "4. Sua empresa começa a aparecer",
    text: "Sempre que alguém faz uma pergunta relacionada ao que você entrega.",
  },
  {
    title: "5. Os leads começam a chegar",
    text: "De forma automática, contínua e previsível.",
  },
];

export default function HowItWorks() {
  return (
    <Section id="como-funciona" className="bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">

        <H2>Como funciona</H2>
        <Body>
          Um processo simples, direto e totalmente otimizado para você aparecer nas respostas das IAs.
        </Body>

        {/* Grid dos passos */}
        <div className="grid md:grid-cols-2 gap-10 mt-14">
          {steps.map((step, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-left">
              <CheckCircle className="text-yellow-400 mb-4" size={32} />
              <H3 className="mb-2">{step.title}</H3>
              <Body className="mb-0">{step.text}</Body>
            </div>
          ))}
        </div>

      </div>
    </Section>
  );
}
