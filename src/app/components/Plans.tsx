"use client";

import Section from "./ui/Section";
import { H2, Body } from "./ui/Typography";
import Button from "./ui/Button";
import Link from "next/link";

export default function Plans() {
  return (
    <Section id="planos" className="bg-gray-50">
      <div className="text-center max-w-4xl mx-auto mb-16">
        <H2>Escolha o plano certo para começar agora</H2>
        <Body>Ative sua Presença IA em poucos minutos.</Body>
      </div>

      {/* Grid de Planos */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

        {/* PLANO BASIC */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex flex-col">
          <h3 className="text-2xl font-bold mb-2 text-gray-900">Basic</h3>
          <p className="text-gray-600 mb-6">Para pequenos negócios locais.</p>

          <p className="text-4xl font-bold mb-1">US$ 59</p>
          <p className="text-gray-500 mb-6 text-sm">por mês</p>

          <ul className="text-gray-700 space-y-2 mb-8 text-sm leading-relaxed">
            <li>✔ até 10 intenções ativas</li>
            <li>✔ presença IA essencial</li>
            <li>✔ feed OpenAI e Perplexity</li>
            <li>✔ atualizações automáticas</li>
            <li className="text-red-400">✘ sem Intent Boost</li>
            <li className="text-red-400">✘ sem API</li>
          </ul>

          <Link href="/signup" className="mt-auto">
            <Button size="lg" className="w-full">Começar com Basic</Button>
          </Link>
        </div>

        {/* PLANO PRO — PLANO MAIS VENDIDO */}
        <div className="bg-white border-2 border-yellow-400 rounded-2xl shadow-md p-8 flex flex-col relative">
          
          {/* Badge do mais vendido */}
          <span className="absolute -top-3 right-4 bg-yellow-400 text-gray-900 text-xs font-semibold px-3 py-1 rounded-full shadow">
            Mais vendido
          </span>

          <h3 className="text-2xl font-bold mb-2 text-gray-900">Pro</h3>
          <p className="text-gray-600 mb-6">Perfeito para quem quer dominar sua região.</p>

          <p className="text-4xl font-bold mb-1">US$ 79</p>
          <p className="text-gray-500 mb-6 text-sm">por mês</p>

          <ul className="text-gray-700 space-y-2 mb-8 text-sm leading-relaxed">
            <li>✔ até 30 intenções ativas</li>
            <li>✔ feeds OpenAI, Perplexity e Claude</li>
            <li>✔ atualizações diárias</li>
            <li>✔ Intent Boost e Reputação IA opcionais</li>
            <li className="text-red-400">✘ sem API</li>
          </ul>

          <Link href="/signup" className="mt-auto">
            <Button size="lg" className="w-full bg-yellow-400 hover:bg-yellow-300">
              Começar com Pro
            </Button>
          </Link>
        </div>

        {/* PLANO ENTERPRISE */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex flex-col">
          <h3 className="text-2xl font-bold mb-2 text-gray-900">Enterprise</h3>
          <p className="text-gray-600 mb-6">Para quem quer presença IA ilimitada e total controle.</p>

          <p className="text-4xl font-bold mb-1">US$ 280</p>
          <p className="text-gray-500 mb-6 text-sm">por mês</p>

          <ul className="text-gray-700 space-y-2 mb-8 text-sm leading-relaxed">
            <li>✔ intenções ilimitadas</li>
            <li>✔ API completa</li>
            <li>✔ Reputação IA ativa</li>
            <li>✔ Intent Boost ilimitado</li>
            <li>✔ prioridade em todos os feeds</li>
            <li>✔ suporte premium</li>
          </ul>

          <Link href="/signup" className="mt-auto">
            <Button size="lg" className="w-full">Começar com Enterprise</Button>
          </Link>
        </div>

      </div>
    </Section>
  );
}
              className="block mt-8 px-6 py-3 bg-yellow-400 text-black rounded-lg font-semibold text-center hover:bg-yellow-300 transition"
            >
              {p.cta}
            </a>
          </div>
        ))}
      </div>

      {/* Pacote avançado */}
      <div className="max-w-3xl mx-auto mt-20 text-center p-10 bg-gray-50 rounded-xl border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900">Pacote Avançado</h3>
        <p className="text-gray-600 mt-3">
          Inclui integração completa com todas as IAs (Claude, SGE, agentes
          autônomos), add-ons internos e feed premium otimizado.  <br />
          (Indisponível na V1)
        </p>

        <a
          href="/advanced"
          className="inline-block mt-6 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          Clique para saber mais
        </a>
      </div>
    </section>
  );
}
