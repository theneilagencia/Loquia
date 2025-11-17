
import "./globals.css";
import type { Metadata } from "next";

import Navbar from "./components/ui/Navbar";
import Footer from "./components/ui/Footer";

export const metadata: Metadata = {
  title: "Loquia",
  description: "Sua empresa precisa existir na era da IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-gray-900">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
