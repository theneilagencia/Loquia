export default function Plans() {
  const plans = [
    {
      name: "Basic",
      price: "US$ 59",
      features: [
        "Até 10 intenções",
        "Presença IA essencial",
        "Feeds OpenAI e Perplexity",
        "Atualizações automáticas"
      ],
      cta: "Começar com Basic"
    },
    {
      name: "Pro",
      price: "US$ 79",
      features: [
        "Até 30 intenções",
        "Feeds OpenAI, Perplexity e Claude",
        "Atualizações diárias",
        "Add-ons opcionais"
      ],
      cta: "Começar com Pro"
    },
    {
      name: "Enterprise",
      price: "US$ 280",
      features: [
        "Intenções ilimitadas",
        "API completa",
        "Otimizações contínuas",
        "Intent Boost ilimitado",
        "Reputação IA ativa"
      ],
      cta: "Começar com Enterprise"
    }
  ];

  return (
    <section className="w-full bg-white py-24 px-6">
      <h2 className="text-center text-3xl font-bold mb-10 text-gray-900">
        Planos e Preços
      </h2>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((p) => (
          <div
            key={p.name}
            className="border border-gray-200 rounded-xl p-8 shadow-sm bg-white"
          >
            <h3 className="text-2xl font-bold text-gray-900">{p.name}</h3>
            <p className="text-4xl font-extrabold mt-4">{p.price}</p>

            <ul className="mt-6 space-y-2 text-gray-600">
              {p.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>

            <a
              href="/signup"
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
