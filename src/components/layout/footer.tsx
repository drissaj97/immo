import type { Messages } from "@/lib/i18n/config";

export function DemoBanner({ message }: { message: string }) {
  if (process.env.DEMO_MODE === "false") return null;
  return (
    <div className="bg-bronze/10 border-b border-bronze/20 px-4 py-2 text-center text-xs text-charcoal/80">
      {message}
    </div>
  );
}

export function Footer({ messages, locale }: { messages: Messages; locale: string }) {
  const prefix = `/${locale}`;
  return (
    <footer className="mt-auto border-t border-charcoal/10 bg-charcoal text-ivory/90">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 lg:px-8">
        <div>
          <p className="font-serif text-xl">{messages.brand}</p>
          <p className="mt-2 text-sm text-ivory/70">{messages.tagline}</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-ivory/50">Plateforme</p>
          <ul className="space-y-2 text-sm">
            <li><a href={`${prefix}/acheter`} className="hover:text-bronze">{messages.nav.buy}</a></li>
            <li><a href={`${prefix}/investir`} className="hover:text-bronze">{messages.nav.invest}</a></li>
            <li><a href={`${prefix}/biens`} className="hover:text-bronze">Catalogue</a></li>
            <li><a href={`${prefix}/agregateur`} className="hover:text-bronze">Agrégateur Maroc</a></li>
            <li><a href={`${prefix}/samsar-ia`} className="hover:text-bronze">{messages.nav.ai}</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-ivory/50">Légal</p>
          <ul className="space-y-2 text-sm">
            <li><a href={`${prefix}/mentions-legales`} className="hover:text-bronze">{messages.footer.legal}</a></li>
            <li><a href={`${prefix}/confidentialite`} className="hover:text-bronze">Confidentialité</a></li>
            <li><a href={`${prefix}/conformite`} className="hover:text-bronze">Conformité CNDP</a></li>
            <li><a href={`${prefix}/conditions`} className="hover:text-bronze">Conditions</a></li>
            <li><a href={`${prefix}/developpeurs`} className="hover:text-bronze">API partenaires</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-ivory/50">Contact</p>
          <p className="text-sm text-ivory/70">contact@samsar.demo</p>
          <p className="mt-2 text-xs text-ivory/50">Données fictives — MVP démonstration</p>
        </div>
      </div>
    </footer>
  );
}
