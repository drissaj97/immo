"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterForm({ locale }: { locale: string }) {
  return (
    <form
      className="mx-auto max-w-md space-y-4 rounded-lg border border-charcoal/10 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch(`/${locale}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: fd.get("email"),
            password: fd.get("password"),
            fullName: fd.get("fullName"),
          }),
        });
        window.location.href = `/${locale}/connexion`;
      }}
    >
      <h1 className="font-serif text-2xl">Inscription</h1>
      <Input name="fullName" placeholder="Nom complet" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Mot de passe" required minLength={8} />
      <Button type="submit" className="w-full">Créer un compte</Button>
      <p className="text-sm text-center">
        <Link href={`/${locale}/connexion`} className="text-deep-green hover:underline">Déjà inscrit ?</Link>
      </p>
    </form>
  );
}
