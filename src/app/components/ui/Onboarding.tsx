"use client";

import { useState } from "react";
import Button from "./Button";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Bem-vindo ao Loquia! 👋",
      description: "A plataforma que coloca sua marca na era da IA. Vamos configurar sua presença em 3 passos simples.",
      icon: (
        <svg className="w-16 h-16 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: "1. Adicione seu Catálogo 📦",
      description: "Comece adicionando produtos ou serviços ao seu catálogo. Isso permite que a IA entenda o que você oferece.",
      icon: (
        <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      title: "2. Gere Intenções 🎯",
      description: "A IA analisará seu catálogo e criará intenções de busca que seus clientes usam. Isso otimiza sua presença nas IAs.",
      icon: (
        <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: "3. Crie seus Feeds 🚀",
      description: "Gere feeds estruturados para OpenAI Search e Perplexity. Sua marca estará pronta para ser recomendada pelas IAs!",
      icon: (
        <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Passo {step} de {steps.length}</span>
            <button
              onClick={onComplete}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            {currentStep.icon}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{currentStep.title}</h2>
          <p className="text-lg text-gray-600 leading-relaxed">{currentStep.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>

          {step < steps.length ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition"
            >
              Próximo →
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
            >
              Começar! 🚀
            </Button>
          )}
        </div>

        {/* Skip button */}
        <div className="text-center mt-6">
          <button
            onClick={onComplete}
            className="text-sm text-gray-500 hover:text-gray-700 transition underline"
          >
            Pular tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
