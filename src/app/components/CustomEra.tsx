"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomEra() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 px-6 bg-white overflow-hidden">
      {/* Animated background with modern graphics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient meshes */}
        <div className="absolute top-20 right-20 w-[600px] h-[600px] bg-gradient-to-bl from-gray-200 via-gray-100 to-transparent rounded-full opacity-30 animate-pulse blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-yellow-200 via-yellow-100 to-transparent rounded-full opacity-25 animate-pulse blur-3xl" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Floating grid pattern */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-gray-200 rounded-lg rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border-2 border-yellow-200 rounded-lg -rotate-12 animate-bounce" style={{ animationDuration: '5s' }}></div>
        
        {/* Dots pattern */}
        <div className="absolute top-1/3 right-1/3 grid grid-cols-3 gap-4 opacity-20">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full">
            <span className="w-2 h-2 bg-black rounded-full"></span>
            <span className="text-sm text-gray-700">O modelo antigo quebrou</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-5xl md:text-6xl font-bold text-black mb-6 text-center">
          O fim de uma era
        </h2>

        <p className="text-xl text-gray-700 mb-16 max-w-3xl mx-auto text-center">
          Antes as pessoas buscavam na internet, agora elas perguntam e a IA responde
        </p>

        {/* Comparison Cards */}
        <div className={`grid md:grid-cols-2 gap-8 mb-20 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Antes */}
          <div className="p-8 bg-white border border-gray-200 rounded-2xl">
            <div className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full mb-6">
              Antes
            </div>
            <h3 className="text-2xl font-bold text-black mb-6">Busca tradicional</h3>
            <p className="text-gray-600 mb-6">Palavras-chave + links</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-gray-400 mt-1">—</span>
                <span className="text-gray-700">Competição por cliques</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-400 mt-1">—</span>
                <span className="text-gray-700">Gasto por aquisição crescente</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-400 mt-1">—</span>
                <span className="text-gray-700">Dependência de rankings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-400 mt-1">—</span>
                <span className="text-gray-700">Fricção no processo</span>
              </li>
            </ul>
          </div>

          {/* Agora */}
          <div className="p-8 bg-black text-white rounded-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="inline-block px-3 py-1 bg-yellow-400 text-black text-sm font-bold rounded-full">
                Agora
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-6">Conversa com IA</h3>
            <p className="text-gray-300 mb-6">Intenção + contexto</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1">—</span>
                <span>Recomendação direta</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1">—</span>
                <span>Zero custo de aquisição</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1">—</span>
                <span>Relevância contextual</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1">—</span>
                <span>Jornada instantânea</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Use cases section */}
        <div className="mb-16">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              <span className="text-sm text-gray-700">O uso da IA no dia a dia</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4 text-center">
            Perguntas reais, intenções<br />comerciais claras
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto text-center">
            Milhões de decisões de compra acontecem assim, todos os dias, nos mais diferentes setores.
          </p>

          {/* Use cases grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                question: "Qual a melhor ferramenta de gestão de projetos para equipes remotas?",
                category: "B2B SaaS",
                intent: "High purchase intent"
              },
              {
                question: "Qual CRM se integra melhor com plataformas de e-commerce?",
                category: "Enterprise Software",
                intent: "Solution research"
              },
              {
                question: "Melhor armazenamento em nuvem para agências criativas?",
                category: "Cloud Services",
                intent: "Vendor comparison"
              },
              {
                question: "Principais soluções de cibersegurança para serviços financeiros?",
                category: "Security",
                intent: "Compliance-driven"
              },
              {
                question: "Qual plataforma de analytics lida melhor com dados em tempo real?",
                category: "Data & Analytics",
                intent: "Technical evaluation"
              },
              {
                question: "Qual ferramenta de automação de marketing escala com o crescimento?",
                category: "MarTech",
                intent: "Long-term investment"
              }
            ].map((item, index) => (
              <div
                key={index}
                className="p-6 bg-white border border-gray-200 rounded-xl hover:border-black hover:-translate-y-1 transition-all duration-200"
              >
                <p className="text-gray-900 font-medium mb-4">{item.question}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    {item.category}
                  </span>
                  <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">
                    {item.intent}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </section>
  );
}
