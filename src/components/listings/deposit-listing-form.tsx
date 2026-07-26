"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  locale: string;
  /** Mode agent dashboard vs dépôt public type SemsarAI */
  variant?: "public" | "dashboard";
  defaultContactName?: string;
  defaultContactEmail?: string;
  allowPublishNow?: boolean;
};

export function DepositListingForm({
  locale,
  variant = "public",
  defaultContactName = "",
  defaultContactEmail = "",
  allowPublishNow = false,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        const fd = new FormData(e.currentTarget);
        const payload: Record<string, unknown> = Object.fromEntries(fd.entries());
        if (imageUrl) payload.imageUrl = imageUrl;
        payload.publishNow = fd.get("publishNow") === "on";

        const res = await fetch(`/${locale}/api/listings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          message?: string;
          error?: string;
          listing?: { slug: string; status: string };
        };
        setLoading(false);

        if (!res.ok) {
          setError(data.error ?? "Envoi impossible.");
          return;
        }

        setMessage(data.message ?? "Annonce enregistrée.");
        if (data.listing?.status === "published" && data.listing.slug) {
          router.push(`/${locale}/biens/${data.listing.slug}`);
          return;
        }
        if (variant === "dashboard") {
          router.push(`/${locale}/dashboard`);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select name="transactionType" required defaultValue="sale">
          <option value="sale">À vendre</option>
          <option value="long_term_rent">À louer</option>
        </Select>
        <Select name="listingType" required defaultValue="apartment">
          <option value="apartment">Appartement</option>
          <option value="villa">Villa</option>
          <option value="riad">Riad</option>
          <option value="land">Terrain</option>
          <option value="commercial">Local commercial</option>
        </Select>
      </div>

      <Input name="title" placeholder="Titre de l'annonce" required />
      <Textarea name="description" placeholder="Description détaillée du bien" required rows={5} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="price" type="number" min={1} placeholder="Prix (MAD)" required />
        <Input name="livingArea" type="number" min={1} placeholder="Surface m²" />
        <Input name="bedrooms" type="number" min={0} placeholder="Chambres" />
        <Input name="bathrooms" type="number" min={0} placeholder="Salles de bain" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="city" placeholder="Ville (ex. Casablanca)" required />
        <Input name="neighborhood" placeholder="Quartier (ex. Anfa)" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="contactName"
          placeholder="Nom du contact"
          defaultValue={defaultContactName}
          required={variant === "public"}
        />
        <Input
          name="contactEmail"
          type="email"
          placeholder="Email de contact"
          defaultValue={defaultContactEmail}
          required={variant === "public"}
        />
        <Input name="contactPhone" placeholder="Téléphone / WhatsApp" className="sm:col-span-2" />
      </div>

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

      {allowPublishNow && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="publishNow" className="rounded border-charcoal/30" />
          Publier immédiatement (admin)
        </label>
      )}

      <Button type="submit" disabled={loading || uploading} className="w-full sm:w-auto">
        {loading ? "Envoi…" : "Déposer mon annonce DarBladi"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-deep-green">{message}</p>}
    </form>
  );
}
