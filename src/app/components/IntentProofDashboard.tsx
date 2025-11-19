"use client";

import Image from "next/image";

export default function IntentProofDashboard() {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full mb-8">
            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-gray-700 tracking-wide">
              INTENT PROOF DASHBOARD™
            </span>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Não adianta prometer,<br />
            é preciso mostrar
          </h2>

          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            O Intent Proof Dashboard™ entrega transparência total e<br />
            prova real de que sua empresa está sendo usada pelas IAs
          </p>
        </div>

        {/* Description */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-700 max-w-5xl mx-auto leading-relaxed">
            Acompanhe em tempo real como as IAs veem, consultam e recomendam sua empresa com métricas 
            detalhadas, logs de intenção, provas técnicas, visualização do feed e analytics completos de 
            consultas, ativações e leads
          </p>
        </div>

        {/* AI Logos - Padronizadas */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {/* ChatGPT */}
          <div className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
            <Image
              src="/logos/chatgpt.png"
              alt="ChatGPT"
              width={160}
              height={40}
              className="h-10 w-auto object-contain"
              style={{ maxHeight: '40px' }}
            />
          </div>

          {/* Claude */}
          <div className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
            <Image
              src="/logos/claude.png"
              alt="Claude"
              width={160}
              height={40}
              className="h-10 w-auto object-contain"
              style={{ maxHeight: '40px' }}
            />
          </div>

          {/* Gemini */}
          <div className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
            <Image
              src="/logos/gemini.png"
              alt="Gemini"
              width={160}
              height={40}
              className="h-10 w-auto object-contain"
              style={{ maxHeight: '40px' }}
            />
          </div>

          {/* Perplexity */}
          <div className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
            <Image
              src="/logos/perplexity.png"
              alt="Perplexity"
              width={160}
              height={40}
              className="h-10 w-auto object-contain"
              style={{ maxHeight: '40px' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
