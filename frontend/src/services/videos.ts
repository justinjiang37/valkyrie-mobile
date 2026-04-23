import { supabase } from "../lib/supabase";

const BUCKET = "horse-videos";

export async function uploadHorseVideo(
  file: Blob | ArrayBuffer,
  fileName: string,
  contentType = "video/mp4"
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: true, contentType });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return pub.publicUrl;
}

export async function deleteHorseVideo(fileName: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([fileName]);
  if (error) throw error;
}

export async function listHorseVideos(): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list();
  if (error) throw error;
  return data.map((f) => f.name);
}

export async function setHorseVideoUrl(horseId: string, videoUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from("horses")
    .update({ video_url: videoUrl })
    .eq("id", horseId);
  if (error) throw error;
}
