import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 mt-20 py-12 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

        {/* Coluna 1 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Loquia</h3>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed">
            Sua empresa precisa existir na era da IA.  
            Conectamos sua marca ao OpenAI Search, Perplexity, Claude e SGE.
          </p>
        </div>

        {/* Coluna 2 */}
        <div>
          <h4 className="text-base font-semibold text-gray-900">Produto</h4>
          <ul className="mt-3 space-y-2 text-gray-600 text-sm">
            <li><Link href="#como-funciona">Como funciona</Link></li>
            <li><Link href="#planos">Planos</Link></li>
            <li><Link href="#dashboard">Dashboard</Link></li>
          </ul>
        </div>

        {/* Coluna 3 */}
        <div>
          <h4 className="text-base font-semibold text-gray-900">Conta</h4>
          <ul className="mt-3 space-y-2 text-gray-600 text-sm">
            <li><Link href="/login">Entrar</Link></li>
            <li><Link href="/signup">Criar conta</Link></li>
          </ul>
        </div>
      </div>

      {/* Rodapé pequeno */}
      <div className="max-w-6xl mx-auto mt-10 border-t border-gray-200 pt-6 text-sm text-gray-500 text-center">
        © {new Date().getFullYear()} Loquia — Todos os direitos reservados.
      </div>
    </footer>
  );
}
