export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col justify-center items-center p-10">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          Sua empresa precisa existir na era da IA.
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Loquia Intent Engine conecta o seu negócio ao OpenAI Search,
          Perplexity, Claude e Google SGE — permitindo que sua marca seja
          recomendada sempre que alguém perguntar algo que você resolve.
        </p>

        <a
          href="/signup"
          className="px-8 py-4 bg-yellow-400 text-black rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-all"
        >
          Criar minha Presença IA agora
        </a>
      </div>
    </main>
  );
}
