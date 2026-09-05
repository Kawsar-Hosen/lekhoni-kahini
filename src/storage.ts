import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { LocalState, Book, WriterProfile } from './types';

const KEY = '@lekhoni/state/v1';
const HOME_CACHE_KEY = '@lekhoni/homeCache/v1';
const WT_KEY = 'lekhoni_writer_token';
const UT_KEY = 'lekhoni_user_token';
const TOKENS_FALLBACK_KEY = '@lekhoni/tokens/v1';

// Auth tokens live in SecureStore (encrypted), never in plaintext AsyncStorage.
export async function saveTokens(t: { writerToken?: string | null; userToken?: string | null }) {
  try {
    if (t.writerToken !== undefined) {
      if (t.writerToken) await SecureStore.setItemAsync(WT_KEY, t.writerToken);
      else await SecureStore.deleteItemAsync(WT_KEY);
    }
    if (t.userToken !== undefined) {
      if (t.userToken) await SecureStore.setItemAsync(UT_KEY, t.userToken);
      else await SecureStore.deleteItemAsync(UT_KEY);
    }
  } catch {
    try {
      const cur = await loadTokensFallback();
      await AsyncStorage.setItem(TOKENS_FALLBACK_KEY, JSON.stringify({
        writerToken: t.writerToken !== undefined ? (t.writerToken || null) : cur.writerToken,
        userToken: t.userToken !== undefined ? (t.userToken || null) : cur.userToken,
      }));
    } catch { /* ignore */ }
  }
}
async function loadTokensFallback(): Promise<{ writerToken: string | null; userToken: string | null }> {
  try {
    const raw = await AsyncStorage.getItem(TOKENS_FALLBACK_KEY);
    if (!raw) return { writerToken: null, userToken: null };
    const p = JSON.parse(raw);
    return { writerToken: p.writerToken || null, userToken: p.userToken || null };
  } catch { return { writerToken: null, userToken: null }; }
}
export async function loadTokens(): Promise<{ writerToken: string | null; userToken: string | null }> {
  try {
    const w = await SecureStore.getItemAsync(WT_KEY);
    const u = await SecureStore.getItemAsync(UT_KEY);
    if (w || u) return { writerToken: w, userToken: u };
    return loadTokensFallback();
  } catch { return loadTokensFallback(); }
}
export async function clearTokens() {
  try { await SecureStore.deleteItemAsync(WT_KEY); } catch {}
  try { await SecureStore.deleteItemAsync(UT_KEY); } catch {}
  try { await AsyncStorage.removeItem(TOKENS_FALLBACK_KEY); } catch {}
}

function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const hex = '0123456789abcdef';
  const s = (n: number) => Array.from({ length: n }, () => hex[Math.floor(Math.random() * 16)]).join('');
  return `${s(8)}-${s(4)}-4${s(3)}-${['8','9','a','b'][Math.floor(Math.random()*4)]}${s(3)}-${s(12)}`;
}

export const initialState: LocalState = {
  name: '', deviceId: generateDeviceId(), favorites: [], downloads: [], history: [], positions: {},
  bookmarks: [], searchHistory: [],   settings: { dark: false, fontSize: 19, lineHeight: 32, lineSpacing: 1.0, fontFamily: 'default', pageMode: 'scroll', notifications: true, wifiOnly: true, language: 'bn', themeId: 'katagolap', readerTheme: 'default', keepScreenOn: true, autoScroll: false, autoScrollSpeed: 2, volumeScroll: false, eyeComfort: 0, brightness: 100, voiceId: null, voiceLang: null, voiceRate: 1, voicePitch: 1, voiceHighlight: true },
  readNotifications: [], reactions: {}, remoteBooks: [], online: false, lastSync: '',
  writer: null, writerToken: null, user: null, userToken: null, followedWriters: [],
  readingActivity: {},
  unlockedChapters: [],
  freshChapters: {},
};

export async function loadState(): Promise<LocalState> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (!saved) {
      const tk = await loadTokens();
      return { ...initialState, writerToken: tk.writerToken, userToken: tk.userToken };
    }
    const parsed = JSON.parse(saved);
    const loadedSettings = { ...initialState.settings, ...parsed.settings };
    if (typeof loadedSettings.eyeComfort === 'boolean') loadedSettings.eyeComfort = loadedSettings.eyeComfort ? 50 : 0;
    // Tokens: SecureStore wins; migrate legacy plaintext tokens once, then strip.
    const tk = await loadTokens();
    let writerToken = tk.writerToken, userToken = tk.userToken;
    if (!writerToken && parsed.writerToken) { writerToken = parsed.writerToken; saveTokens({ writerToken }).catch(() => {}); }
    if (!userToken && parsed.userToken) { userToken = parsed.userToken; saveTokens({ userToken }).catch(() => {}); }
    return { ...initialState, ...parsed, deviceId: parsed.deviceId || generateDeviceId(), settings: loadedSettings, remoteBooks: parsed.remoteBooks || [], online: false, writer: parsed.writer || null, writerToken, user: parsed.user || null, userToken, followedWriters: parsed.followedWriters || [], readingActivity: parsed.readingActivity || {}, unlockedChapters: parsed.unlockedChapters || [] };
  } catch { return initialState; }
}
export async function saveState(state: LocalState) {
  try {
    // Never persist secrets to plaintext storage; tokens live in SecureStore.
    const { writerToken, userToken, ...rest } = state as LocalState & { writerToken?: string | null; userToken?: string | null };
    void writerToken; void userToken;
    const toSave = { ...rest, online: false, remoteBooks: [] };
    await AsyncStorage.setItem(KEY, JSON.stringify(toSave));
  } catch { /* The bundled catalog remains usable if storage is unavailable. */ }
}
export async function clearState() {
  try { await AsyncStorage.removeItem(KEY); } catch { /* ignore */ }
  await clearTokens();
}

export type HomeCache = { allBooks: Book[]; homeData: any; allCategories: [string, string, string, string | null][]; publicWriters: WriterProfile[]; savedAt: string };

export async function saveHomeCache(c: HomeCache) {
  try { await AsyncStorage.setItem(HOME_CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export async function loadHomeCache(): Promise<HomeCache | null> {
  try {
    const raw = await AsyncStorage.getItem(HOME_CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.allBooks) || !p.allBooks.length) return null;
    return p as HomeCache;
  } catch { return null; }
}
