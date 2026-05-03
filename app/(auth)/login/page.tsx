import Link from "next/link";
import Image from "next/image";

import logo from "@/app/assets/Design sem nome(16).png";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/85 p-8 shadow-panel backdrop-blur">
        <div className="flex items-center justify-between">
          <Image src={logo} alt="alanis.dev" className="h-auto w-40 object-contain" />
        </div>
        <div className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-mutedForeground">Acesso</div>
        <h1 className="mt-3 text-3xl font-semibold text-brand-ink">Entrar na area administrativa</h1>
        <p className="mt-3 text-sm leading-6 text-mutedForeground">
          Este acesso e exclusivo para administracao. Clientes entram diretamente pelo link do projeto e usam a senha do projeto apenas para revelar informacoes sensiveis.
        </p>
        <LoginForm />
        <Link href="/" className="mt-6 inline-block text-sm text-mutedForeground underline-offset-4 hover:underline">
          Voltar para a home
        </Link>
      </div>
    </main>
  );
}
