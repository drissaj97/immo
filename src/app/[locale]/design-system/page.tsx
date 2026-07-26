import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DESIGN_SYSTEM !== "true") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8 space-y-12">
      <div>
        <h1 className="font-serif text-4xl">Design System — DarBladi</h1>
        <Badge variant="demo" className="mt-2">Dev only</Badge>
      </div>

      <section>
        <h2 className="font-serif text-2xl mb-4">Couleurs</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["Ivoire", "bg-ivory border"],
            ["Sable", "bg-sand"],
            ["Charbon", "bg-charcoal"],
            ["Vert profond", "bg-deep-green"],
            ["Bronze", "bg-bronze"],
          ].map(([name, cls]) => (
            <div key={name} className={`h-20 rounded-lg ${cls}`} title={name} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl mb-4">Typographies</h2>
        <p className="font-serif text-3xl">Cormorant Garamond — titres éditoriaux</p>
        <p className="mt-2 text-base">DM Sans — interface et corps de texte</p>
      </section>

      <section>
        <h2 className="font-serif text-2xl mb-4">Boutons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="bronze">Bronze</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl mb-4">Badges</h2>
        <div className="flex gap-2">
          <Badge>Default</Badge>
          <Badge variant="verified">Vérifié</Badge>
          <Badge variant="warning">À vérifier</Badge>
          <Badge variant="demo">Démo</Badge>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl mb-4">Formulaires</h2>
        <Input placeholder="Champ texte" className="max-w-sm" />
      </section>
    </div>
  );
}
