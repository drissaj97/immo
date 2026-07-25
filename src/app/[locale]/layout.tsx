import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DemoBanner } from "@/components/layout/footer";
import { getSession } from "@/lib/auth/session";
import { getMessages, isRtl, locales, type Locale } from "@/lib/i18n/config";
import "../globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

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
      <body className="min-h-full flex flex-col bg-ivory text-charcoal antialiased">
        <DemoBanner message={messages.demo} />
        <Header locale={typedLocale} messages={messages} user={user} />
        <main className="flex-1">{children}</main>
        <Footer messages={messages} locale={locale} />
      </body>
    </html>
  );
}
