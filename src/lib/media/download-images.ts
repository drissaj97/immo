import { createWriteStream, existsSync, mkdirSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function extensionFromUrl(url: string): string {
  const clean = url.split("?")[0];
  const ext = path.extname(clean).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return ext === ".jpeg" ? ".jpg" : ext;
  return ".jpg";
}

export function extensionFromContentType(contentType: string | null): string {
  if (!contentType) return ".jpg";
  const base = contentType.split(";")[0].trim().toLowerCase();
  return EXT_BY_TYPE[base] ?? ".jpg";
}

export async function downloadImageToFile(sourceUrl: string, destPath: string): Promise<boolean> {
  if (existsSync(destPath)) return true;

  mkdirSync(path.dirname(destPath), { recursive: true });

  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "Samsar-IA-Import/1.0 (+first-party migration)" },
  });

  if (!res.ok) {
    console.warn(`[download] ${res.status} ${sourceUrl}`);
    return false;
  }

  const contentType = res.headers.get("content-type");
  if (contentType && !contentType.startsWith("image/")) {
    console.warn(`[download] invalid content-type ${contentType} for ${sourceUrl}`);
    return false;
  }

  const body = res.body;
  if (!body) return false;

  const nodeStream = Readable.fromWeb(body as import("stream/web").ReadableStream);
  await pipeline(nodeStream, createWriteStream(destPath));
  return true;
}

export type DownloadedImage = {
  sourceUrl: string;
  localPath: string;
  publicUrl: string;
};

/** Télécharge une liste d'images vers public/media/{prefix}/… */
export async function downloadListingImages(
  sourceUrls: string[],
  options: {
    mediaRoot: string;
    publicPrefix: string;
    listingKey: string;
    concurrency?: number;
  },
): Promise<DownloadedImage[]> {
  const { mediaRoot, publicPrefix, listingKey, concurrency = 4 } = options;
  const safeKey = listingKey.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  const results: DownloadedImage[] = [];

  let index = 0;
  async function worker() {
    while (index < sourceUrls.length) {
      const i = index++;
      const sourceUrl = sourceUrls[i];
      const ext = extensionFromUrl(sourceUrl);
      const filename = `${String(i + 1).padStart(2, "0")}${ext}`;
      const relDir = path.join(publicPrefix, safeKey);
      const destPath = path.join(mediaRoot, relDir, filename);
      const publicUrl = `/${path.posix.join(relDir, filename)}`;

      const ok = await downloadImageToFile(sourceUrl, destPath);
      if (ok) {
        results[i] = { sourceUrl, localPath: destPath, publicUrl };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, sourceUrls.length) }, worker));
  return results.filter(Boolean);
}
