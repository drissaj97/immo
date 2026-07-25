import Link from "next/link";
import Image from "next/image";
import { getListingById } from "@/server/repositories/listings";
import { formatPrice } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Comparer des biens", description: "Comparez deux annonces côte à côte.", path: "/comparer", locale });
}

export default async function ComparerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { locale } = await params;
  const { a, b } = await searchParams;
  const listingA = a ? await getListingById(a) : null;
  const listingB = b ? await getListingById(b) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Comparateur</h1>
      <p className="mt-2 text-charcoal/60">Ajoutez deux biens via les paramètres URL ?a=id&b=id</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {[listingA, listingB].map((listing, i) =>
          listing ? (
            <div key={listing.id} className="rounded-lg border border-charcoal/10 overflow-hidden">
              <div className="relative aspect-video bg-sand">
                <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
              </div>
              <div className="p-4 space-y-2">
                <p className="text-lg font-medium text-deep-green">{formatPrice(listing.price, listing.currency)}</p>
                <h2 className="font-serif text-xl">{listing.title}</h2>
                <p className="text-sm text-charcoal/60">{listing.location.city} · {listing.livingArea ?? "—"} m²</p>
                <p className="text-sm">Rendement est. : {listing.estimatedYield ?? "—"} %</p>
                <Link href={`/${locale}/biens/${listing.slug}`}><Button variant="outline" size="sm">Voir la fiche</Button></Link>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-center justify-center rounded-lg border border-dashed border-charcoal/20 p-12 text-charcoal/40">
              Bien {i === 0 ? "A" : "B"} non sélectionné
            </div>
          ),
        )}
      </div>

      {listingA && listingB && (
        <table className="mt-8 w-full text-sm">
          <thead><tr className="border-b"><th className="py-2 text-left">Critère</th><th>Bien A</th><th>Bien B</th></tr></thead>
          <tbody>
            {[
              ["Prix", formatPrice(listingA.price, listingA.currency), formatPrice(listingB.price, listingB.currency)],
              ["Surface", `${listingA.livingArea ?? "—"} m²`, `${listingB.livingArea ?? "—"} m²`],
              ["Chambres", listingA.bedrooms ?? "—", listingB.bedrooms ?? "—"],
              ["Rendement", `${listingA.estimatedYield ?? "—"} %`, `${listingB.estimatedYield ?? "—"} %`],
              ["Vérifié", listingA.isVerified ? "Oui" : "Non", listingB.isVerified ? "Oui" : "Non"],
            ].map(([label, va, vb]) => (
              <tr key={label as string} className="border-b border-charcoal/5">
                <td className="py-2 font-medium">{label}</td>
                <td className="text-center">{va}</td>
                <td className="text-center">{vb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
