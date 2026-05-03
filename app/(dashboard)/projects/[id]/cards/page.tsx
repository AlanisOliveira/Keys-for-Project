import { CreditCardDisplay } from "@/components/cards/CreditCardDisplay";
import type { CardRecord } from "@/lib/types";

const cards: CardRecord[] = [
  {
    id: "card-1",
    project_id: "demo-project-1",
    nickname: "Stripe Test Checkout",
    brand: "visa",
    last_four: "4242",
    cardholder_name: "ATELIE SOLAR",
    expiry_month: "12",
    expiry_year: "30",
    bank: "Demo Bank",
    card_type: "credit",
    environment: "test",
    encrypted_number: { iv: "", salt: "", ciphertext: "" },
    encrypted_cvv: { iv: "", salt: "", ciphertext: "" },
    notes: "Cartão de homologação",
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function ProjectCardsPage() {
  return (
    <main>
      <header className="border-b border-slate-200 pb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Cartões</div>
        <h1 className="mt-2 text-4xl font-semibold text-brand-ink">Cards de pagamento</h1>
      </header>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {cards.map((card) => (
          <CreditCardDisplay key={card.id} card={card} />
        ))}
      </section>
    </main>
  );
}
