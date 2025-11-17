"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";

export default function CustomHowItWorks() {
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

  const steps = [
    {
      title: "1. Você cadastra sua empresa",
      text: "Em poucos minutos seu negócio passa a ter uma identidade clara e estruturada para o novo ecossistema digital. Basta inserir as informações iniciais e seguimos a partir daí.",
    },
    {
      title: "2. Criamos seu Intent Graph",
      text: "Identificamos exatamente o que sua empresa resolve e organizamos tudo de forma inteligente. Suas soluções passam a ser compreendidas com precisão por qualquer sistema que interpreta intenções humanas.",
    },
    {
      title: "3. Geramos feeds otimizados para cada ambiente inteligente",
      text: "Cada plataforma recebe a versão ideal do que você oferece. O conteúdo é preparado sob medida para que sua empresa seja reconhecida como a resposta certa.",
    },
    {
      title: "4. Sua empresa começa a aparecer",
      text: "Sempre que alguém busca por algo relacionado ao que você entrega, seu negócio ganha destaque automático. Sem anúncios e sem técnicas antigas de visibilidade. Apenas relevância genuína.",
    },
  ];

  return (
    <section ref={sectionRef} className="relative py-24 px-6 bg-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-yellow-50 rounded-full opacity-30 animate-pulse"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full mb-8 mx-auto block w-fit">
          <span className="w-2 h-2 bg-black rounded-full"></span>
          <span className="text-sm text-gray-700">A era da intenção</span>
        </div>

        {/* Title */}
        <h2 className="text-5xl md:text-6xl font-bold text-black mb-6 text-center">
          Entenda como funciona
        </h2>

        <p className="text-xl text-gray-700 mb-16 max-w-3xl mx-auto text-center">
          Uma plataforma que entende intenção,<br />
          contexto e relevância comercial
        </p>

        {/* Steps Grid */}
        <div className={`grid md:grid-cols-2 gap-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {steps.map((step, index) => (
            <div
              key={index}
              className="p-8 bg-white border border-gray-200 rounded-2xl hover:border-black hover:-translate-y-1 transition-all duration-200"
            >
              <CheckCircle className="text-yellow-400 mb-4" size={36} />
              <h3 className="text-xl font-bold text-black mb-4">{step.title}</h3>
              <p className="text-gray-700 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
