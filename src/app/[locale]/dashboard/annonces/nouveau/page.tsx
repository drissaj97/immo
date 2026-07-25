"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewListingPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "fr";
  const [message, setMessage] = useState("");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Créer une annonce</h1>
      <p className="mt-2 text-sm text-charcoal/60">Brouillon soumis à validation admin (données démo).</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const res = await fetch(`/${locale}/api/listings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(fd.entries())),
          });
          if (res.ok) {
            setMessage("Annonce soumise pour validation.");
            router.push(`/${locale}/dashboard`);
          }
        }}
      >
        <Input name="title" placeholder="Titre de l'annonce" required />
        <Textarea name="description" placeholder="Description" required rows={5} />
        <Select name="listingType" required>
          <option value="apartment">Appartement</option>
          <option value="villa">Villa</option>
          <option value="land">Terrain</option>
        </Select>
        <Select name="transactionType" required>
          <option value="sale">Vente</option>
          <option value="long_term_rent">Location</option>
        </Select>
        <Input name="price" type="number" placeholder="Prix (MAD)" required />
        <Input name="city" placeholder="Ville" required />
        <Input name="neighborhood" placeholder="Quartier" required />
        <Input name="livingArea" type="number" placeholder="Surface m²" />
        <Input name="bedrooms" type="number" placeholder="Chambres" />
        <Button type="submit">Soumettre pour validation</Button>
        {message && <p className="text-sm text-deep-green">{message}</p>}
      </form>
    </div>
  );
}
