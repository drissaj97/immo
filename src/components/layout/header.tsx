"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { BrandLogo } from "@/components/layout/brand-logo";
import type { Locale, Messages } from "@/lib/i18n/config";
import type { SessionUser } from "@/lib/auth/session";

export function Header({
  locale,
  messages,
  user,
}: {
  locale: Locale;
  messages: Messages;
  user: SessionUser | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const prefix = `/${locale}`;

  const links = [
    { href: `${prefix}/acheter`, label: messages.nav.buy },
    { href: `${prefix}/louer`, label: messages.nav.rent },
    { href: `${prefix}/neuf`, label: messages.nav.new },
    { href: `${prefix}/professionnels`, label: "Professionnels" },
    { href: `${prefix}/promoteurs`, label: "Promoteurs" },
    { href: `${prefix}/carte`, label: messages.nav.map },
    { href: `${prefix}/investir`, label: messages.nav.invest },
    { href: `${prefix}/darbladi`, label: messages.nav.ai },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-charcoal/10 bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link
          href={prefix}
          className="flex shrink-0 items-center"
          aria-label={messages.brand}
        >
          <BrandLogo priority />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors hover:text-deep-green ${
                pathname.startsWith(link.href) ? "text-deep-green font-medium" : "text-charcoal/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher locale={locale} />
          <CurrencySwitcher />
          <Link href={`${prefix}/deposer-annonce`}>
            <Button variant="outline" size="sm">
              Déposer une annonce
            </Button>
          </Link>
          <Link href={`${prefix}/dashboard/favoris`}>
            <Button variant="ghost" size="icon" aria-label="Favoris">
              <Heart className="h-4 w-4" />
            </Button>
          </Link>
          {user ? (
            <>
              <Link href={`${prefix}/dashboard`}>
                <Button variant="outline" size="sm">
                  {user.fullName}
                </Button>
              </Link>
              <form action={`${prefix}/api/auth/logout`} method="POST">
                <Button variant="ghost" size="sm" type="submit">
                  {messages.auth.logout}
                </Button>
              </form>
            </>
          ) : (
            <Link href={`${prefix}/connexion`}>
              <Button size="sm">{messages.auth.login}</Button>
            </Link>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-charcoal/10 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm">
                {link.label}
              </Link>
            ))}
            <Link
              href={`${prefix}/deposer-annonce`}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-deep-green"
            >
              Déposer une annonce
            </Link>
            <div className="flex gap-2 pt-2">
              <LocaleSwitcher locale={locale} />
              <CurrencySwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
