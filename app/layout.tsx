import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VaultManager",
  description: "Gerenciador de credenciais e cartões com criptografia client-side.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
