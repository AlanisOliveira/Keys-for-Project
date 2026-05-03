import { CredentialForm } from "@/components/credentials/CredentialForm";

export default function NewCredentialPage() {
  return (
    <main>
      <header className="border-b border-border pb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-mutedForeground">Nova credencial</div>
        <h1 className="mt-2 text-4xl font-semibold text-brand-ink">Criação com criptografia client-side</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-mutedForeground">
          Preencha os dados desta credencial e mantenha as informações sensíveis protegidas desde o momento do cadastro.
        </p>
      </header>
      <section className="mt-8">
        <CredentialForm />
      </section>
    </main>
  );
}
