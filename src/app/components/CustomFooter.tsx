import Image from "next/image";
import Link from "next/link";

export default function CustomFooter() {
  return (
    <footer className="relative bg-white border-t border-gray-200 py-16 px-6 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-gray-50 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-yellow-50 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Logo and tagline */}
        <div>
          <Image
            src="/images/logo-black.png"
            alt="Loquia"
            width={120}
            height={32}
            className="mb-4"
          />
          <p className="text-sm text-gray-600">
            A voz da sua marca na era da IA
          </p>
        </div>

        {/* Produto */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-4">Produto</h3>
          <ul className="space-y-2">
            <li>
              <Link href="#" className="text-sm text-gray-600 hover:text-black transition-colors">
                Como funciona
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm text-gray-600 hover:text-black transition-colors">
                Planos
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm text-gray-600 hover:text-black transition-colors">
                Documentação
              </Link>
            </li>
          </ul>
        </div>

        {/* Empresa */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-4">Empresa</h3>
          <ul className="space-y-2">
            <li>
              <Link href="#" className="text-sm text-gray-600 hover:text-black transition-colors">
                Sobre
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm text-gray-600 hover:text-black transition-colors">
                Blog
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm text-gray-600 hover:text-black transition-colors">
                Contato
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-sm font-semibold text-black mb-4">Legal</h3>
          <ul className="space-y-2">
            <li>
              <Link href="#" className="text-sm text-gray-600 hover:text-black transition-colors">
                Privacidade
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm text-gray-600 hover:text-black transition-colors">
                Termos
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          © {new Date().getFullYear()} Loquia. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
