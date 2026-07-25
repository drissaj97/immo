"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ locale }: { locale: string }) {
  const [error, setError] = useState("");
  const router = useRouter();

  return (
    <form
      className="mx-auto max-w-md space-y-4 rounded-lg border border-charcoal/10 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const fd = new FormData(e.currentTarget);
        const res = await fetch(`/${locale}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
        });
        if (!res.ok) {
          setError("Identifiants invalides");
          return;
        }
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }}
    >
      <h1 className="font-serif text-2xl">Connexion</h1>
      <p className="text-sm text-charcoal/60">Comptes démo : admin@samsar.demo / Admin123!</p>
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Mot de passe" required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full">Se connecter</Button>
      <p className="text-sm text-center">
        <Link href={`/${locale}/inscription`} className="text-deep-green hover:underline">Créer un compte</Link>
      </p>
    </form>
  );
}
