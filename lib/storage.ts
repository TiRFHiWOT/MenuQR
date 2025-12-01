import { createServerSupabaseClient } from "./supabase";

export async function uploadImage(file: File, path: string): Promise<string> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.storage
    .from("menu-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("menu-images").getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteImage(path: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.storage.from("menu-images").remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

export function getImageUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/menu-images/${path}`;
}
