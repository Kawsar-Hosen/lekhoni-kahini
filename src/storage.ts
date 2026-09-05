import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { LocalState, Book, WriterProfile } from './types';

const KEY = '@lekhoni/state/v1';
const HOME_CACHE_KEY = '@lekhoni/homeCache/v1';
const WT_KEY = 'lekhoni_writer_token';
const UT_KEY = 'lekhoni_user_token';
const TOKENS_FALLBACK_KEY = '@lekhoni/tokens/v1';

// Auth tokens live in SecureStore (encrypted), never in plaintext AsyncStorage.
// The AsyncStorage fallback is a read-only migration source: entries are
// re-secured and wiped at the first opportunity, never written fresh.
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
    try { await AsyncStorage.removeItem(TOKENS_FALLBACK_KEY); } catch {}
  } catch {
    // SecureStore unavailable (rare): keep in-memory only this session.
    // Deliberately NOT writing secrets to plaintext AsyncStorage.
  }
}
export async function loadTokens(): Promise<{ writerToken: string | null; userToken: string | null }> {
  let w: string | null = null, u: string | null = null;
  try {
    w = await SecureStore.getItemAsync(WT_KEY);
    u = await SecureStore.getItemAsync(UT_KEY);
  } catch { /* fall through to legacy read */ }
  try {
    const raw = await AsyncStorage.getItem(TOKENS_FALLBACK_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (!w && p.writerToken) { const t=p.writerToken; w = t; try { await SecureStore.setItemAsync(WT_KEY, t); } catch {} }
      if (!u && p.userToken) { const t=p.userToken; u = t; try { await SecureStore.setItemAsync(UT_KEY, t); } catch {} }
      if (w && u) { try { await AsyncStorage.removeItem(TOKENS_FALLBACK_KEY); } catch {} }
    }
  } catch { /* ignore */ }
  return { writerToken: w, userToken: u };
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
    let writerToken = tk.writerToken, userToken = tk.userToken, migrated = false;
    if (!writerToken && parsed.writerToken) { writerToken = parsed.writerToken; migrated = true; saveTokens({ writerToken }).catch(() => {}); }
    if (!userToken && parsed.userToken) { userToken = parsed.userToken; migrated = true; saveTokens({ userToken }).catch(() => {}); }
    const out = { ...initialState, ...parsed, deviceId: parsed.deviceId || generateDeviceId(), settings: loadedSettings, remoteBooks: parsed.remoteBooks || [], online: false, writer: parsed.writer || null, writerToken, user: parsed.user || null, userToken, followedWriters: parsed.followedWriters || [], readingActivity: parsed.readingActivity || {}, unlockedChapters: parsed.unlockedChapters || [] };
    if (migrated) saveState(out).catch(() => {});
    return out;
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
