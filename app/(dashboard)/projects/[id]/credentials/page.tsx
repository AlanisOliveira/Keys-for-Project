import { CredentialCard } from "@/components/credentials/CredentialCard";
import type { CredentialRecord } from "@/lib/types";

const credentials: CredentialRecord[] = [
  {
    id: "cred-1",
    project_id: "demo-project-1",
    type: "api_token",
    label: "Stripe Live Secret",
    preview: "sk_•••",
    encrypted_data: { iv: "", salt: "", ciphertext: "" },
    tags: ["stripe", "payments"],
    environment: "production",
    expires_at: null,
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cred-2",
    project_id: "demo-project-1",
    type: "smtp",
    label: "SMTP Transacional",
    preview: "mai•••",
    encrypted_data: { iv: "", salt: "", ciphertext: "" },
    tags: ["email"],
    environment: "staging",
    expires_at: null,
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function ProjectCredentialsPage() {
  return (
    <main>
      <header className="border-b border-slate-200 pb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Credenciais</div>
        <h1 className="mt-2 text-4xl font-semibold text-brand-ink">Cofre mascarado</h1>
      </header>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {credentials.map((credential) => (
          <CredentialCard key={credential.id} credential={credential} />
        ))}
      </section>
    </main>
  );
}
