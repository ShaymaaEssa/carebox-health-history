import imageCompression from "browser-image-compression";

import { ATTACHMENTS_BUCKET, supabase } from "@/integrations/supabase/client";
import type { Attachment } from "./types";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_TYPES = [...IMAGE_TYPES, "application/pdf"] as const;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function isImage(mime: string) {
  return (IMAGE_TYPES as readonly string[]).includes(mime);
}

export function validateFile(file: File): string | null {
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return `"${file.name}" isn't supported. Please choose a JPG, PNG, WebP or PDF file.`;
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    return `"${file.name}" is larger than 20 MB. Please choose a smaller file.`;
  }
  return null;
}

export async function prepareFile(file: File): Promise<{ blob: Blob; error?: undefined } | { error: string; blob?: undefined }> {
  if (!isImage(file.type)) return { blob: file };

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 1600,
      initialQuality: 0.8,
      useWebWorker: true,
      maxSizeMB: 5,
      fileType: file.type,
    });
    if (compressed.size > MAX_UPLOAD_BYTES) {
      return { error: `"${file.name}" is still too large after optimizing. Please choose a smaller image.` };
    }
    return { blob: compressed };
  } catch {
    return { error: `We couldn't optimize "${file.name}". Please try another image.` };
  }
}

export { ATTACHMENT_LIMIT_MESSAGE } from "./errors";

function friendlyUploadError(error: unknown) {
  return friendlyMessage(error, "Something went wrong while saving this file. Please try again.");
}


/** Upload a validated file and register its metadata row via create_attachment(). */
export async function uploadAttachment(params: {
  userId: string;
  prescriptionId: string;
  file: File;
}): Promise<{ error?: string }> {
  const { userId, prescriptionId, file } = params;

  const invalid = validateFile(file);
  if (invalid) return { error: invalid };

  const prepared = await prepareFile(file);
  if (prepared.error !== undefined || prepared.blob === undefined) {
    return { error: prepared.error ?? "We couldn't prepare this file. Please try again." };
  }
  const body = prepared.blob;

  const ext = EXT_BY_MIME[file.type];
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `${userId}/${prescriptionId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(storagePath, body, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: `Upload failed for "${file.name}". Please try again.` };
  }

  const { error: rpcError } = await supabase.rpc("create_attachment", {
    p_prescription_id: prescriptionId,
    p_storage_path: storagePath,
    p_original_file_name: file.name,
    p_file_name: fileName,
    p_mime_type: file.type,
    p_file_size: body.size,
    p_original_file_size: file.size,
  });

  if (rpcError) {
    // Clean up the orphaned storage object.
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);
    return { error: friendlyError(rpcError.message) };
  }

  return {};
}

export async function listAttachments(prescriptionId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from("prescription_attachments")
    .select("*")
    .eq("prescription_id", prescriptionId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Attachment[];
}

export async function removeAttachment(attachment: Attachment) {
  const { error } = await supabase.from("prescription_attachments").delete().eq("id", attachment.id);
  if (error) throw error;
  await supabase.storage.from(ATTACHMENTS_BUCKET).remove([attachment.storage_path]);
}

export async function reorderAttachments(prescriptionId: string, orderedIds: string[]) {
  const { error } = await supabase.rpc("reorder_attachments", {
    p_prescription_id: prescriptionId,
    p_ordered_ids: orderedIds,
  });
  if (error) throw error;
}

export async function signedUrl(storagePath: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deletePrescriptionWithFiles(prescriptionId: string) {
  const attachments = await listAttachments(prescriptionId);
  const paths = attachments.map((a) => a.storage_path);
  const { error } = await supabase.from("prescriptions").delete().eq("id", prescriptionId);
  if (error) throw error;
  if (paths.length) await supabase.storage.from(ATTACHMENTS_BUCKET).remove(paths);
}
