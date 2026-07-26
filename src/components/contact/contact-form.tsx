"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ContactForm({ locale }: { locale: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    await fetch(`/${locale}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName: data.get("name"),
        contactEmail: data.get("email"),
        contactPhone: data.get("phone"),
        message: data.get("message"),
        source: "contact_form",
      }),
    });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <p className="mt-8 rounded-lg border border-deep-green/20 bg-deep-green/5 p-4 text-deep-green">
        Message envoyé. Un conseiller vous recontactera (démo).
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <input name="name" required placeholder="Nom" className="w-full rounded border border-charcoal/20 px-3 py-2" />
      <input name="email" type="email" required placeholder="Email" className="w-full rounded border border-charcoal/20 px-3 py-2" />
      <input name="phone" placeholder="Téléphone" className="w-full rounded border border-charcoal/20 px-3 py-2" />
      <textarea name="message" required rows={4} placeholder="Message" className="w-full rounded border border-charcoal/20 px-3 py-2" />
      <Button type="submit" disabled={loading}>
        {loading ? "Envoi…" : "Envoyer"}
      </Button>
    </form>
  );
}
