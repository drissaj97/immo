"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AFFILIATE_PROFILES } from "@/lib/data/affiliates";

type Stats = { total: number; visits: number; signups: number; leads: number; deposits: number };

export default function AffiliationDashboardPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "fr";
  const [code, setCode] = useState(AFFILIATE_PROFILES[0]?.code ?? "");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/${locale}/api/affiliates/track?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = (await res.json()) as { stats: Stats };
        setStats(data.stats);
      }
    }
    void load();
  }, [code, locale]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Dashboard affiliation</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>

      <div className="mt-6">
        <label className="text-sm font-medium">Code affilié</label>
        <select
          className="mt-1 w-full rounded border border-charcoal/20 px-3 py-2 text-sm"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        >
          {AFFILIATE_PROFILES.map((a) => (
            <option key={a.code} value={a.code}>
              {a.code} — {a.agentName}
            </option>
          ))}
        </select>
      </div>

      {stats && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(
            [
              ["Total", stats.total],
              ["Visites", stats.visits],
              ["Inscriptions", stats.signups],
              ["Leads", stats.leads],
              ["Acomptes", stats.deposits],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-charcoal/10 p-4 text-center">
              <p className="text-2xl font-medium text-deep-green">{value}</p>
              <p className="text-xs text-charcoal/60">{label}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-charcoal/40">
        Lien de partage : /{locale}?ref={code}
      </p>
    </div>
  );
}
