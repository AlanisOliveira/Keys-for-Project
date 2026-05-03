import { CardForm } from "@/components/cards/CardForm";

export default function NewCardPage() {
  return (
    <main>
      <header className="border-b border-border pb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-mutedForeground">Novo cartão</div>
        <h1 className="mt-2 text-4xl font-semibold text-brand-ink">Criação com Luhn e criptografia</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-mutedForeground">
          Cadastre cartões de forma mais organizada, com validação automática e proteção para os dados mais sensíveis.
        </p>
      </header>
      <section className="mt-8">
        <CardForm />
      </section>
    </main>
  );
}
