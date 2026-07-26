export type StorageUploadResult = {
  url: string;
  path: string;
  provider: string;
};

export interface StorageProvider {
  readonly name: string;
  upload(file: File | Buffer, filename: string, contentType: string): Promise<StorageUploadResult>;
}

class MockStorageProvider implements StorageProvider {
  readonly name = "mock";

  async upload(_file: File | Buffer, filename: string, contentType: string): Promise<StorageUploadResult> {
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const url = `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&demo=${encodeURIComponent(safeName)}`;
    console.info(`[storage:mock] Uploaded ${safeName} (${contentType})`);
    return { url, path: `demo/${safeName}`, provider: this.name };
  }
}

class SupabaseStorageProvider implements StorageProvider {
  readonly name = "supabase";

  async upload(file: File | Buffer, filename: string, contentType: string): Promise<StorageUploadResult> {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "listings";

    if (!url || !key) {
      return new MockStorageProvider().upload(file, filename, contentType);
    }

    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const bytes = file instanceof Buffer ? new Uint8Array(file) : new Uint8Array(await (file as File).arrayBuffer());

    const res = await fetch(`${url}/storage/v1/object/${bucket}/${safeName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: bytes,
    });

    if (!res.ok) {
      console.warn("[storage:supabase] Upload failed, falling back to mock");
      return new MockStorageProvider().upload(file, filename, contentType);
    }

    const publicUrl = `${url}/storage/v1/object/public/${bucket}/${safeName}`;
    return { url: publicUrl, path: `${bucket}/${safeName}`, provider: this.name };
  }
}

export function createStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === "supabase") {
    return new SupabaseStorageProvider();
  }
  return new MockStorageProvider();
}

export async function uploadListingMedia(
  file: File | Buffer,
  filename: string,
  contentType: string,
): Promise<StorageUploadResult> {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(contentType)) {
    throw new Error(`Type non supporté: ${contentType}`);
  }
  return createStorageProvider().upload(file, filename, contentType);
}
