import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const API_BASE = 'https://lekhoni-admin-api.smdkawsar2.workers.dev';

export async function pickAndResizeImage(type: 'avatar' | 'cover'): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: true,
    aspect: type === 'avatar' ? [1, 1] : [4, 3],
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const size = type === 'avatar' ? 400 : 800;
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

  const uploadRes = await fetch(`${API_BASE}/api/media`, {
    method: 'POST',
    body: formData,
  });
  if (!uploadRes.ok) return null;
  const data = await uploadRes.json();
  return data.url || null;
}
