import Link from "next/link";
import { KeyRound, ShieldCheck, WalletCards } from "lucide-react";
import Image from "next/image";

import { Panel } from "@/components/ui/Panel";
import logo from "@/app/assets/Design sem nome(16).png";
import watermark from "@/app/assets/watermark_sutil.png";

const highlights = [
  {
    icon: ShieldCheck,
    title: "Criptografia no browser",
    text: "Seus dados mais sensíveis recebem uma camada extra de proteção antes de serem exibidos ou compartilhados.",
  },
  {
    icon: KeyRound,
    title: "Acesso por projeto",
    text: "Cada cliente acessa apenas o que faz parte do seu projeto, de forma organizada, direta e sem depender de terceiros.",
  },
  {
    icon: WalletCards,
    title: "Cartões e credenciais",
    text: "Senhas, tokens, acessos e cartões ficam reunidos em um único lugar, com visual limpo e consulta rápida.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <header className="flex items-center justify-between py-4">
        <div className="relative">
          <Image src={watermark} alt="alanis.dev" className="pointer-events-none absolute -top-14 left-0 hidden w-72 opacity-10 md:block" />
          <Image src={logo} alt="alanis.dev" priority className="h-auto w-52 object-contain" />
          <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-tight text-brand-ink">
            Cofre para credenciais, cartões, tokens e acessos de projetos.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-mutedForeground">
            Um espaço pensado para centralizar informações importantes do projeto com mais clareza, menos atrito e acesso simples para quem realmente precisa.
          </p>
        </div>
        <Link href="/projects" className="rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-white">
          Entrar no dashboard
        </Link>
      </header>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {highlights.map(({ icon: Icon, title, text }) => (
          <Panel key={title} className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-brand-cyan/20 blur-2xl" />
            <Icon className="h-8 w-8 text-brand-ink" />
            <h2 className="mt-6 text-xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
          </Panel>
        ))}
      </section>
    </main>
  );
}
