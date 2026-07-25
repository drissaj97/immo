"use client";

import { Suspense, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewListingPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "fr";
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/${locale}/api/upload/media`, { method: "POST", body: fd });
    if (res.ok) {
      const data = (await res.json()) as { url: string };
      setImageUrl(data.url);
    }
    setUploading(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Créer une annonce</h1>
      <p className="mt-2 text-sm text-charcoal/60">Brouillon soumis à validation admin (données démo).</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const payload = Object.fromEntries(fd.entries()) as Record<string, string>;
          if (imageUrl) payload.imageUrl = imageUrl;
          const res = await fetch(`/${locale}/api/listings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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
        <div>
          <label className="text-sm font-medium">Photo (max 5 MB)</label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-1"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
            }}
            disabled={uploading}
          />
          {uploading && <p className="mt-1 text-xs text-charcoal/60">Upload en cours…</p>}
          {imageUrl && <p className="mt-1 text-xs text-deep-green">Image uploadée ✓</p>}
        </div>
        <Button type="submit">Soumettre pour validation</Button>
        {message && <p className="text-sm text-deep-green">{message}</p>}
      </form>
    </div>
  );
}
