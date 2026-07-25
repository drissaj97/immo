import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { PwaRegister } from "@/components/layout/pwa-register";
import { StyleRecovery } from "@/components/layout/style-recovery";
import { ReferralCapture } from "@/components/affiliates/referral-capture";
import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { getMessages, isRtl, locales, type Locale } from "@/lib/i18n/config";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

/** Filet de sécurité : identité visuelle si le CSS hashé Next est 404. */
const CRITICAL_CSS = `
:root{--ivory:#faf8f5;--sand:#e8e0d4;--charcoal:#1c1c1a;--deep-green:#1a4d3e;--bronze:#a67c52}
html,body{height:100%}
body{margin:0;background:var(--ivory);color:var(--charcoal);font-family:var(--font-dm-sans),system-ui,sans-serif;display:flex;flex-direction:column;min-height:100%}
a{color:inherit;text-decoration:none}
img{max-width:100%;height:auto;display:block}
.font-serif{font-family:var(--font-cormorant),Georgia,serif}
header{position:sticky;top:0;z-index:50;background:rgba(250,248,245,.95);border-bottom:1px solid rgba(28,28,26,.1)}
header>div{display:flex;align-items:center;justify-content:space-between;gap:1rem;max-width:80rem;margin:0 auto;padding:1rem 1.5rem}
header nav{display:none}
@media(min-width:1024px){header nav.hidden,header nav{display:flex!important;align-items:center;gap:1.5rem}header nav a{font-size:.875rem}}
main{flex:1}
footer{margin-top:auto;background:var(--charcoal);color:#faf8f5}
`;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const typedLocale = locale as Locale;
  const messages = getMessages(typedLocale);
  const user = await getSession();
  const dir = isRtl(typedLocale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${cormorant.variable} ${dmSans.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#1B4332" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="DarBladi" />
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      </head>
      <body className="min-h-full flex flex-col bg-ivory text-charcoal antialiased">
        <Header locale={typedLocale} messages={messages} user={user} />
        <main className="flex-1">{children}</main>
        <Footer messages={messages} locale={locale} />
        <CookieConsent locale={locale} />
        <StyleRecovery />
        <PwaRegister />
        <Suspense fallback={null}>
          <ReferralCapture locale={locale} />
        </Suspense>
      </body>
    </html>
  );
}
