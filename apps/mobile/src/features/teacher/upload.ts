import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL, ApiError, api } from '../../lib/api';
import { rewriteLoopbackHost } from '../../lib/media';

interface PresignResponse {
  fileId: string;
  uploadUrl: string;
  method?: string;
  headers?: Record<string, string>;
}

const MAX_SIDE = 1600;
const UPLOAD_TIMEOUT_MS = 120_000;

export async function captureOrPickPhoto(useCamera: boolean): Promise<{ uri: string } | null> {
  const picked = useCamera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (picked.canceled || !picked.assets[0]) return null;
  const asset = picked.assets[0];
  const actions = asset.width > MAX_SIDE ? [{ resize: { width: MAX_SIDE } }] : [];
  const out = await ImageManipulator.manipulateAsync(asset.uri, actions, { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG });
  return { uri: out.uri };
}

// presign -> PUT bytes to storage -> confirm, for the private "teacher_document" and
// "teacher_photo" upload purposes used across M15's documents and M17's profile photo.
export async function uploadTeacherFile(input: { uri: string; purpose: 'teacher_document' | 'teacher_photo'; fileName: string; mimeType?: string }): Promise<string> {
  const blob = await (await fetch(input.uri)).blob();
  const mimeType = input.mimeType ?? 'image/jpeg';

  const presign = await api.post<PresignResponse>('uploads/presign', {
    purpose: input.purpose,
    mimeType,
    sizeBytes: blob.size,
    fileName: input.fileName,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(rewriteLoopbackHost(presign.uploadUrl, API_BASE_URL), {
      method: presign.method ?? 'PUT',
      headers: presign.headers ?? { 'Content-Type': mimeType },
      body: blob,
      signal: controller.signal,
    });
    if (!res.ok) throw new ApiError('UPLOAD_FAILED', res.status, 'The upload did not complete.');
  } finally {
    clearTimeout(timer);
  }

  const confirmed = await api.post<{ fileId: string }>(`uploads/${presign.fileId}/confirm`);
  return confirmed.fileId ?? presign.fileId;
}
