import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL, ApiError, api } from '../../lib/api';
import { rewriteLoopbackHost } from '../../lib/media';

export type UploadPurpose = 'avatar';

interface PresignResponse {
  fileId: string;
  uploadUrl: string;
  method?: string;
  headers?: Record<string, string>;
  expiresAt: string;
}

export interface UploadedFile {
  fileId: string;
  publicUrl: string | null;
}

const MAX_SIDE = 1024;
const UPLOAD_TIMEOUT_MS = 120_000;

// Opens the gallery with a square crop, then shrinks and re-encodes as JPEG so the
// file is small and always a type the server accepts. Returns null if cancelled.
export async function pickSquarePhoto(): Promise<{ uri: string } | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (picked.canceled || !picked.assets[0]) return null;
  const asset = picked.assets[0];
  const actions = asset.width > MAX_SIDE ? [{ resize: { width: MAX_SIDE } }] : [];
  const out = await ImageManipulator.manipulateAsync(asset.uri, actions, { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
  return { uri: out.uri };
}

// presign -> PUT the bytes straight to storage -> confirm. The PUT deliberately
// does not go through the API client, so no Authorization header is sent to storage.
export async function uploadImage(input: { uri: string; purpose: UploadPurpose; fileName?: string }): Promise<UploadedFile> {
  const blob = await (await fetch(input.uri)).blob();

  const presign = await api.post<PresignResponse>('uploads/presign', {
    purpose: input.purpose,
    mimeType: 'image/jpeg',
    sizeBytes: blob.size,
    fileName: input.fileName ?? `${input.purpose}.jpg`,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(rewriteLoopbackHost(presign.uploadUrl, API_BASE_URL), {
      method: presign.method ?? 'PUT',
      headers: presign.headers ?? { 'Content-Type': 'image/jpeg' },
      body: blob,
      signal: controller.signal,
    });
    if (!res.ok) throw new ApiError('UPLOAD_FAILED', res.status, 'The upload did not complete.');
  } finally {
    clearTimeout(timer);
  }

  const confirmed = await api.post<{ fileId: string; status: string; publicUrl: string | null }>(`uploads/${presign.fileId}/confirm`);
  return { fileId: confirmed.fileId ?? presign.fileId, publicUrl: confirmed.publicUrl ?? null };
}
