import "./globals.css";
import type { Metadata } from "next";
import { ToastProvider } from "./contexts/ToastContext";

export const metadata: Metadata = {
  title: "Loquia",
  description: "Sua empresa precisa existir na era da IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-gray-900">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
