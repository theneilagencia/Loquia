"use client";

export default function CustomFinal() {
  return (
    <section className="relative py-24 px-6 bg-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-50 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-gray-50 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full mb-8">
          <span className="w-2 h-2 bg-black rounded-full"></span>
          <span className="text-sm text-gray-700">Seção Final — Chamada Final</span>
        </div>

        {/* Title */}
        <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
          O Google organizou a informação,<br />
          a IA organiza a intenção
        </h2>

        {/* Subtitle */}
        <p className="text-2xl md:text-3xl text-gray-700 mb-8">
          A sua marca está preparada para ser encontrada na nova internet?
        </p>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Em poucos minutos você ativa sua Presença IA<br />
          e começa a ser recomendado pelas IAs mais influentes do mundo
        </p>

        {/* CTA */}
        <button className="px-10 py-5 bg-yellow-400 text-black text-lg font-semibold rounded-lg hover:bg-yellow-500 transition-all duration-200 shadow-lg hover:shadow-xl">
          Criar minha Presença IA agora
        </button>
      </div>
    </section>
  );
}
