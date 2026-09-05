import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const API_BASE = 'https://lekhoni-admin-api.smdkawsar2.workers.dev';

// Book cover: 2:3 vertical ratio
// Recommended: 600×900 | High quality: 800×1200 | Minimum: 400×600
const COVER_ASPECT: [number, number] = [2, 3];
const COVER_WIDTH = 800; // outputs 800×1200 (high quality)

export async function pickAndResizeImage(type: 'avatar' | 'cover'): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: true,
    aspect: type === 'avatar' ? [1, 1] : COVER_ASPECT,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const size = type === 'avatar' ? 400 : COVER_WIDTH;
  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: size } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  const formData = new FormData();
  formData.append('file', {
    uri: manipulated.uri,
    name: `${type}.jpg`,
    type: 'image/jpeg',
  } as any);

  let uploadRes: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      uploadRes = await fetch(`${API_BASE}/api/media`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
    } finally { clearTimeout(timer); }
  } catch (e: any) {
    throw new Error('Network error');
  }
  if (!uploadRes.ok) return null;
  const data = await uploadRes.json();
  return data.url || null;
}
