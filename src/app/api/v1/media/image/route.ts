import { NextResponse } from "next/server";

const REFERERS: Record<string, string> = {
  "www.mubawab-media.com": "https://www.mubawab.ma/",
  "www.mubawab.ma": "https://www.mubawab.ma/",
  "content.avito.ma": "https://www.avito.ma/",
  "www.avito.ma": "https://www.avito.ma/",
  "sarouty-prod.s3.eu-west-3.amazonaws.com": "https://www.sarouty.ma/",
  "medias.yakeey.com": "https://www.yakeey.com/",
  "yakeey.com": "https://www.yakeey.com/",
  "agenz.ma": "https://www.agenz.ma/",
  "media.agenz-failed.ma": "https://www.agenz.ma/",
  "www.semsarai.ma": "https://www.semsarai.ma/",
};

const ALLOWED_HOSTS = new Set(Object.keys(REFERERS));

/** Proxy images agrégées (Referer requis par Mubawab, Yakeey, Agenz…). */
export async function GET(request: Request) {
  const urlParam = new URL(request.url).searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent": "DarBladi/1.0 (+https://darbladi.ma)",
        Referer: REFERERS[target.hostname] ?? "https://www.semsarai.ma/",
        Accept: "image/*,*/*",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(res.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
