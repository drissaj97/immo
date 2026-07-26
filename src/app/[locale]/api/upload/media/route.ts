import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadListingMedia } from "@/lib/storage/provider";

/** Upload photo pour dépôt d'annonce (public type SemsarAI, ou agent connecté). */
export async function POST(request: Request) {
  // Session optionnelle — le dépôt public /deposer-annonce doit pouvoir joindre une photo.
  await getSession();

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 5 MB" }, { status: 400 });
  }

  const type = file.type || "image/jpeg";
  if (!/^image\/(jpeg|png|webp)$/i.test(type)) {
    return NextResponse.json({ error: "Formats acceptés : JPEG, PNG, WebP" }, { status: 400 });
  }

  try {
    const result = await uploadListingMedia(file, file.name, type);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
