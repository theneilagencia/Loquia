export default function Hero() {
  return (
    <section className="w-full bg-white py-24 px-6 text-center">
      <h1 className="text-5xl font-extrabold text-gray-900 leading-tight max-w-4xl mx-auto">
        Sua empresa precisa existir na era da IA.
      </h1>

      <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-6">
        Loquia Intent Engine conecta sua marca ao OpenAI Search, Perplexity,
        Claude e Google SGE — permitindo que você seja recomendado sempre que
        alguém perguntar algo que você resolve.
      </p>

      <a
        href="/signup"
        className="inline-block mt-10 px-10 py-4 bg-yellow-400 text-black font-semibold rounded-lg shadow hover:bg-yellow-300 transition"
      >
        Criar minha Presença IA agora
      </a>
    </section>
  );
}
