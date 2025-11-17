"use client";

const plans = [
  {
    name: "Basic",
    price: "R$ 49/mês",
    features: [
      "Presença IA para 1 produto/serviço",
      "Monitoramento básico",
      "Atualizações mensais",
    ],
    cta: "Começar com Basic",
    link: "/signup?plan=basic",
  },
  {
    name: "Pro",
    price: "R$ 129/mês",
    features: [
      "Presença IA para 5 produtos/serviços",
      "Monitoramento avançado",
      "Atualizações semanais",
      "Dashboard inteligente",
    ],
    cta: "Assinar Pro",
    link: "/signup?plan=pro",
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    features: [
      "Presença IA ilimitada",
      "Integração premium com motores de IA",
      "Monitoramento em tempo real",
      "Equipe dedicada",
    ],
    cta: "Falar com vendas",
    link: "https://calendly.com/la-guimaraes/30min",
  },
];

export default function Plans() {
  return (
    <section className="w-full py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-10 text-gray-900">
          Planos para todos os tipos de negócio
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {plans.map((p) => (
            <div
              key={p.name}
              className="bg-white shadow-lg rounded-2xl p-8 border border-gray-200 flex flex-col"
            >
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {p.name}
              </h3>

              <p className="text-3xl font-semibold text-indigo-600 mb-6">
                {p.price}
              </p>

              <ul className="text-left text-gray-700 space-y-3 mb-8 flex-1">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={p.link}
                className="block mt-8 px-6 py-3 bg-yellow-400 text-black rounded-lg font-semibold text-center hover:bg-yellow-300 transition"
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
