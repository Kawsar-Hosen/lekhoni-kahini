import { Book, Chapter } from './types';
import type { CopyKey } from './i18n';


const API_BASE = 'https://lekhoni-admin-api.smdkawsar2.workers.dev';
const TIMEOUT = 6000;

type RemoteBook = { id:string; title:string; author:string; cover_url:string|null; status:string; views:number|string; likes:number|string; dislikes:number|string; description:string|null; category:string|null; color:string; accent:string; is_new?:boolean; featured?:boolean; home_section?:string|null; views_visible?:boolean; display_status?:string; writer_status?:string; hide_title_on_cover?:boolean; pdf_url?:string; dedication?:string; author_name?:string; show_ads?:boolean; pdf_reward_ad?:boolean; updated_at:string };
type RemoteChapter = { id:string; book_id:string; title:string; body:string; position:number; sort_order?:number; minutes?:number };
type RemoteComment = { id:string; book_id:string; display_name:string; body:string; status:string; created_at:string };
type RemoteNotification = { id:string; title:string; body:string; icon:string|null; url:string|null; story_cover?:string; created_at:string };
type RemoteEvent = { device_id:string; book_id:string; event_type:'view'|'like'|'dislike'; created_at:string };

async function apiFetch<T>(path: string, init?: RequestInit, opts?: { timeout?: number; errorBody?: boolean }): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts?.timeout ?? TIMEOUT);
    const isFormData = init?.body instanceof FormData;
    const headers: Record<string, string> = {};
    if (!isFormData) headers['content-type'] = 'application/json';
    if (init?.headers) Object.assign(headers, init.headers);
    const response = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal, headers });
    clearTimeout(timer);
    if (!response.ok) {
      if (!opts?.errorBody) return null;
      try { return await response.json() as T; } catch { return null; }
    }
    return await response.json() as T;
  } catch { return null; }
}

function toBookColor(id: string): string {
  const palette: Record<string, string> = { nodi: '#4A1220', megh: '#6D3B46', ghori: '#292E3D', jochona: '#383655', shohor: '#185366', kobita: '#276250', ekattor: '#59412E', chaya: '#232F32' };
  return palette[id] || `#${id.split('').reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).slice(-6).padStart(6, '0')}`;
}

function toAccent(id: string): string {
  const accents: Record<string, string> = { nodi: '#C9972B', megh: '#F3B5B9', ghori: '#DF6E52', jochona: '#C3B7EA', shohor: '#EFAB62', kobita: '#D9DF91', ekattor: '#D6A25E', chaya: '#A8C0B7' };
  return accents[id] || '#C9972B';
}

function toCategoryIcon(cat: string | null): string {
  const icons: Record<string, string> = { 'উপন্যাস': 'book-open', 'রোমান্টিক': 'heart', 'রহস্য': 'search', 'থ্রিলার': 'zap', 'ভৌতিক': 'moon', 'কবিতা': 'feather', 'ইতিহাস': 'archive', 'কিশোর': 'sun', 'মুক্তিযুদ্ধ': 'flag' };
  return icons[cat || ''] || 'book-open';
}

function mergeRemoteBooks(remote: RemoteBook[], chaptersByBook: Record<string, RemoteChapter[]>): Book[] {
  return remote.filter(b => b.status === 'published').map(b => {
    const chs = (chaptersByBook[b.id] || [])
      .sort((a, c) => (a.sort_order ?? a.position) - (c.sort_order ?? c.position))
      .map(c => ({ id: c.id, title: c.title, body: c.body, minutes: c.minutes || 5 }));
    return {
      id: b.id, title: b.title, author: b.author, category: b.category || 'উপন্যাস',
      categoryIcon: toCategoryIcon(b.category), color: b.color || toBookColor(b.id),
      accent: b.accent || toAccent(b.id),       views: `${b.views}`, rating: 4.5, likes: Number(b.likes) || 0,
      featured: Boolean(b.featured), homeSection: b.home_section || undefined, views_visible: b.views_visible !== false,
      description: b.description || '', updated: 'অনলাইন', isNew: Boolean(b.is_new), chapters: chs, cover_url: b.cover_url || null,
      display_status: b.display_status || undefined,
      writer_status: b.writer_status || undefined,
      hide_title_on_cover: b.hide_title_on_cover || false,
      pdf_url: b.pdf_url || '', dedication: b.dedication || '', author_name: b.author_name || '',
      show_ads: b.show_ads !== false, pdf_reward_ad: b.pdf_reward_ad !== false,
    };
  }).filter(Boolean) as Book[];
}
export async function fetchRemoteBooks(): Promise<Book[]> {
  const booksData = await apiFetch<RemoteBook[]>('/api/public/books');
  if (!booksData || !booksData.length) return [];
  const chaptersData = await apiFetch<RemoteChapter[]>('/api/public/chapters');
  const chaptersByBook: Record<string, RemoteChapter[]> = {};
  if (chaptersData) {
    for (const ch of chaptersData) {
      if (!chaptersByBook[ch.book_id]) chaptersByBook[ch.book_id] = [];
      chaptersByBook[ch.book_id].push(ch);
    }
  }
  return mergeRemoteBooks(booksData, chaptersByBook);
}

export async function fetchRemoteBook(id: string): Promise<Book | null> {
  const b = await apiFetch<RemoteBook & { chapters: RemoteChapter[] }>(`/api/public/books/${id}`);
  if (!b) return null;
  const chs = (b.chapters || []).sort((a, c) => (a.sort_order ?? a.position) - (c.sort_order ?? c.position)).map(c => ({ id: c.id, title: c.title, body: c.body, minutes: c.minutes || 5 }));
  return {
    id: b.id, title: b.title, author: b.author, category: b.category || 'উপন্যাস',
    categoryIcon: toCategoryIcon(b.category), color: b.color || toBookColor(b.id),
    accent: b.accent || toAccent(b.id), views: `${b.views}`, rating: 4.5, likes: Number(b.likes) || 0,
    featured: Boolean(b.featured), homeSection: b.home_section || undefined,
    description: b.description || '', updated: 'অনলাইন', isNew: Boolean(b.is_new), chapters: chs, cover_url: b.cover_url || null,
    display_status: b.display_status || undefined, writer_status: b.writer_status || undefined,
    hide_title_on_cover: b.hide_title_on_cover || false,
    pdf_url: b.pdf_url || '', dedication: b.dedication || '', author_name: b.author_name || '',
    show_ads: b.show_ads !== false, pdf_reward_ad: b.pdf_reward_ad !== false,
  };
}

export async function trackEvent(deviceId: string, bookId: string, eventType: 'view' | 'like' | 'dislike'): Promise<void> {
  await apiFetch('/api/public/events', {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, book_id: bookId, event_type: eventType }),
  });
}

export async function toggleBookLike(deviceId: string, bookId: string, value: boolean): Promise<number> {
  const r = await apiFetch<{ ok: boolean; likes: number }>(`/api/public/books/${bookId}/like`, {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, value }),
  });
  return typeof r?.likes === 'number' ? r.likes : -1;
}

export async function fetchRemoteComments(bookId: string): Promise<RemoteComment[]> {
  return (await apiFetch<RemoteComment[]>(`/api/public/books/${bookId}/comments`)) || [];
}

export async function submitComment(bookId: string, deviceId: string, name: string, body: string, avatarUrl?: string): Promise<{ok:boolean;needs_approval?:boolean}> {
  const result = await apiFetch<{ ok: boolean; needs_approval?: boolean }>(`/api/public/books/${bookId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, name, body, avatar_url: avatarUrl || '' }),
  });
  return { ok: Boolean(result?.ok), needs_approval: result?.needs_approval };
}

export async function fetchCommentsConfig(): Promise<{comments_approval:boolean}> {
  const r = await apiFetch<{comments_approval:boolean}>('/api/public/comments-config');
  return r || { comments_approval: true };
}

export async function fetchRemoteNotifications(deviceId?: string): Promise<RemoteNotification[]> {
  const qs = deviceId ? `?device_id=${deviceId}` : '';
  return (await apiFetch<RemoteNotification[]>(`/api/public/notifications${qs}`)) || [];
}

export async function registerPushToken(deviceId: string, pushToken: string): Promise<boolean> {
  const r = await apiFetch<{ ok: boolean }>('/api/public/devices/register', {
    method: 'POST', body: JSON.stringify({ device_id: deviceId, push_token: pushToken }),
  });
  return !!r?.ok;
}

type RemoteCategory = { id: string; name: string; icon: string; color: string; cover_url: string | null };
export async function fetchRemoteCategories(): Promise<RemoteCategory[]> {
  return (await apiFetch<RemoteCategory[]>('/api/public/categories')) || [];
}

export type HomeSectionConfig = { key: string; enabled: boolean; title?: string };
export async function fetchHomeConfig(): Promise<HomeSectionConfig[]> {
  return (await apiFetch<HomeSectionConfig[]>('/api/home-config')) || [];
}

export type HomeSectionsData = {
  sections: { key: string; title: string; books: RemoteBook[] }[];
  writers: { id: string; username: string; writer_name: string; bio: string; avatar_url: string | null; follower_count: number; badge: string }[];
  viewsVisible?: boolean;
};
export async function fetchHomeSections(): Promise<HomeSectionsData | null> {
  return await apiFetch<HomeSectionsData>('/api/home-sections');
}

export type UserStatePayload = {
  settings?: Record<string, unknown>;
  favorites?: string[];
  downloads?: string[];
  history?: string[];
  positions?: Record<string, number>;
  bookmarks?: unknown[];
};
export async function fetchUserState(deviceKey: string): Promise<{ synced: boolean; state?: UserStatePayload & Record<string, unknown> }> {
  return (await apiFetch<{ synced: boolean; state?: any }>(`/api/public/user-state?device_key=${encodeURIComponent(deviceKey)}`)) || { synced: false };
}
export async function saveUserState(deviceKey: string, payload: UserStatePayload): Promise<boolean> {
  const r = await apiFetch<{ ok?: boolean }>('/api/public/user-state', {
    method: 'PUT',
    body: JSON.stringify({ device_key: deviceKey, ...payload }),
  });
  return Boolean(r?.ok);
}

// --- Writer Auth ---
export type Writer = { id: string; username: string; writer_name: string; email?: string; bio?: string; avatar_url?: string | null; follower_count?: number; created_at?: string };

const TEMP_MAIL_DOMAINS = ['mailinator.com','10minutemail.com','guerrillamail.com','yopmail.com','tempmail.com','throwawaymail.com','fakemail.net','trashmail.com','maildrop.cc','getnada.com','mohmal.com','sharklasers.com'];
function mailBaseDomain(d: string): string { const p = d.toLowerCase().split('.'); return p.length > 2 ? p.slice(-2).join('.') : d.toLowerCase(); }

export function validateWriterSignup(username: string, writerName: string, email: string, password: string): CopyKey | null {
  const uname = (username || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(uname) || uname.startsWith('_') || uname.endsWith('_') || uname.includes('__')) return 'invalidUsername';
  const wname = (writerName || '').trim().replace(/\s+/g, ' ');
  if (wname.length < 2 || wname.length > 30) return 'invalidWriterName';
  if (!/^[A-Za-z\u0980-\u09FF\u0900-\u097F .'\-]+$/.test(wname)) return 'invalidWriterName';
  if (!/[A-Za-z\u0980-\u09FF\u0900-\u097F]/.test(wname)) return 'invalidWriterName';
  if (/(.)\1{3,}/.test(wname.replace(/ /g, ''))) return 'invalidWriterName';
  const em = (email || '').trim().toLowerCase();
  if (!em || em.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return 'invalidEmail';
  const dom = em.split('@')[1] || '';
  if (TEMP_MAIL_DOMAINS.includes(dom) || TEMP_MAIL_DOMAINS.includes(mailBaseDomain(dom))) return 'tempMailBlocked';
  const pw = password || '';
  if (pw.length < 8 || pw.length > 128 || !/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'weakPassword';
  return null;
}

export type WriterSignupResult = { writer: Writer; token: string } | { needs_verification: true; email: string; mail_sent?: boolean } | { error: string; retry_after?: number; attempts_left?: number } | null;

export async function writerSignup(username: string, writerName: string, email: string, password: string): Promise<WriterSignupResult> {
  const r = await apiFetch<{ writer?: Writer; token?: string; needs_verification?: boolean; email?: string; mail_sent?: boolean; error?: string; retry_after?: number; attempts_left?: number }>('/api/public/writers/signup', {
    method: 'POST', body: JSON.stringify({ username, writer_name: writerName, email, password }),
  }, { timeout: 25000, errorBody: true });
  if (!r) return null;
  if (r.writer && r.token) return { writer: r.writer, token: r.token };
  if (r.needs_verification && r.email) return { needs_verification: true, email: r.email, mail_sent: r.mail_sent };
  if (r.error) return { error: r.error, retry_after: r.retry_after, attempts_left: r.attempts_left };
  return null;
}

export async function verifyWriterCode(email: string, code: string): Promise<{ writer: Writer; token: string } | { error: string; attempts_left?: number } | null> {
  const r = await apiFetch<{ writer?: Writer; token?: string; error?: string; attempts_left?: number }>('/api/public/writers/verify', {
    method: 'POST', body: JSON.stringify({ email, code }),
  }, { timeout: 15000, errorBody: true });
  if (!r) return null;
  if (r.writer && r.token) return { writer: r.writer, token: r.token };
  if (r.error) return { error: r.error, attempts_left: r.attempts_left };
  return null;
}

export async function resendWriterCode(email: string): Promise<{ ok: boolean; mail_sent?: boolean } | { error: string; retry_after?: number } | null> {
  const r = await apiFetch<{ ok?: boolean; mail_sent?: boolean; error?: string; retry_after?: number }>('/api/public/writers/resend', {
    method: 'POST', body: JSON.stringify({ email }),
  }, { timeout: 25000, errorBody: true });
  if (!r) return null;
  if (r.ok) return { ok: true, mail_sent: r.mail_sent };
  if (r.error) return { error: r.error, retry_after: r.retry_after };
  return null;
}

export async function forgotWriterPassword(email: string): Promise<{ ok: boolean; mail_sent?: boolean } | { error: string; retry_after?: number } | null> {
  const r = await apiFetch<{ ok?: boolean; mail_sent?: boolean; error?: string; retry_after?: number }>('/api/public/writers/forgot', {
    method: 'POST', body: JSON.stringify({ email }),
  }, { timeout: 25000, errorBody: true });
  if (!r) return null;
  if (r.ok) return { ok: true, mail_sent: r.mail_sent };
  if (r.error) return { error: r.error, retry_after: r.retry_after };
  return null;
}

export async function resetWriterPassword(email: string, code: string, newPassword: string): Promise<{ writer: Writer; token: string } | { error: string; attempts_left?: number } | null> {
  const r = await apiFetch<{ writer?: Writer; token?: string; error?: string; attempts_left?: number }>('/api/public/writers/reset', {
    method: 'POST', body: JSON.stringify({ email, code, new_password: newPassword }),
  }, { timeout: 15000, errorBody: true });
  if (!r) return null;
  if (r.writer && r.token) return { writer: r.writer, token: r.token };
  if (r.error) return { error: r.error, attempts_left: r.attempts_left };
  return null;
}

export async function writerLogin(emailOrUsername: string, password: string): Promise<{ writer: Writer; token: string } | { unverified: true; email: string } | { error: string } | null> {
  const r = await apiFetch<{ writer?: Writer; token?: string; error?: string; email?: string }>('/api/public/writers/login', {
    method: 'POST', body: JSON.stringify({ email_or_username: emailOrUsername, password }),
  }, { timeout: 15000, errorBody: true });
  if (!r) return null;
  if (r.writer && r.token) return { writer: r.writer, token: r.token };
  if (r.error === 'email_unverified' && r.email) return { unverified: true, email: r.email };
  if (r.error) return { error: r.error };
  return null;
}

export async function writerGoogleAuth(credential: string): Promise<{ writer: Writer; token: string } | null> {
  const r = await apiFetch<{ writer?: Writer; token?: string; error?: string }>('/api/public/writers/google', {
    method: 'POST', body: JSON.stringify({ credential }),
  });
  if (r?.writer && r?.token) return { writer: r.writer, token: r.token };
  return null;
}

export async function verifyWriterToken(token: string): Promise<Writer | null> {
  const r = await apiFetch<{ writer?: Writer }>('/api/public/writers/verify', {
    method: 'POST', body: JSON.stringify({ token }),
  });
  return r?.writer || null;
}

export type UserProfile = { id: string; username: string; display_name: string; avatar_url?: string; bio?: string };

export async function userSignup(username: string, email: string, password: string, displayName?: string): Promise<{ user: UserProfile; token: string } | null> {
  const r = await apiFetch<{ user?: UserProfile; token?: string; error?: string }>('/api/public/users/signup', {
    method: 'POST', body: JSON.stringify({ username, email, password, display_name: displayName || username }),
  });
  if (r?.user && r?.token) return { user: r.user, token: r.token };
  return null;
}

export async function userLogin(emailOrUsername: string, password: string): Promise<{ user: UserProfile; token: string } | null> {
  const r = await apiFetch<{ user?: UserProfile; token?: string; error?: string }>('/api/public/users/login', {
    method: 'POST', body: JSON.stringify({ email_or_username: emailOrUsername, password }),
  });
  if (r?.user && r?.token) return { user: r.user, token: r.token };
  return null;
}

export async function verifyUserToken(token: string): Promise<UserProfile | null> {
  const r = await apiFetch<{ user?: UserProfile }>('/api/public/users/verify', {
    method: 'POST', body: JSON.stringify({ token }),
  });
  return r?.user || null;
}

export async function updateUserProfile(token: string, data: { display_name?: string; bio?: string; avatar_url?: string }): Promise<UserProfile | null> {
  const r = await apiFetch<{ user?: UserProfile }>('/api/public/users/profile', {
    method: 'PUT', body: JSON.stringify({ token, ...data }),
  });
  return r?.user || null;
}

export async function fetchPublicWriters(): Promise<Writer[]> {
  return (await apiFetch<Writer[]>('/api/public/writers')) || [];
}

export type AboutData = { title: string; subtitle: string; description: string; features: string[]; version: string; developer: string };
export async function fetchAbout(): Promise<AboutData | null> {
  return (await apiFetch<AboutData>('/api/public/about')) || null;
}

// --- Follows ---
export async function fetchFollowedWriters(deviceId: string): Promise<Writer[]> {
  return (await apiFetch<Writer[]>(`/api/public/follows?device_id=${deviceId}`)) || [];
}

export async function followWriter(deviceId: string, writerId: string, followerWriterId?: string, followerUserId?: string): Promise<boolean> {
  const r = await apiFetch<{ ok: boolean }>('/api/public/follows', {
    method: 'POST', body: JSON.stringify({ device_id: deviceId, writer_id: writerId, follower_writer_id: followerWriterId, follower_user_id: followerUserId }),
  });
  return Boolean(r?.ok);
}

export async function unfollowWriter(deviceId: string, writerId: string): Promise<boolean> {
  const r = await apiFetch<{ ok: boolean }>(`/api/public/follows/${writerId}?device_id=${deviceId}`, {
    method: 'DELETE',
  });
  return Boolean(r?.ok);
}

// --- Writer Studio (authenticated) ---
export type Story = { id: string; title: string; description: string; status: string; cover_url: string | null; category: string; views: number; likes: number; chapters_count: number; created_at: string; updated_at: string };
export type StoryChapter = { id: string; title: string; body: string; position: number; minutes: number; created_at: string };
export type WriterStats = { stories: number; views: number; followers: number; activities: { id: string; type: string; data: any; created_at: string }[] };
export type WriterProfileFull = Writer & { email?: string; bio?: string };

async function writerApiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T | null> {
  return apiFetch<T>(path, { ...init, headers: { Authorization: `Bearer ${token}`, ...init?.headers } });
}

export async function fetchWriterStats(token: string): Promise<WriterStats | null> {
  return writerApiFetch<WriterStats>('/api/writer/stats', token);
}

export async function fetchWriterStories(token: string): Promise<Story[]> {
  return (await writerApiFetch<Story[]>('/api/writer/stories', token)) || [];
}

export async function createWriterStory(token: string, title: string, description: string, category: string, coverUrl?: string, displayStatus?: string, writerStatus?: string, hideTitleOnCover?: boolean, pdfUrl?: string, dedication?: string, authorName?: string): Promise<Story | null> {
  return writerApiFetch<Story>('/api/writer/stories', token, {
    method: 'POST', body: JSON.stringify({ title, description, category, cover_url: coverUrl, display_status: displayStatus, writer_status: writerStatus, hide_title_on_cover: hideTitleOnCover, pdf_url: pdfUrl, dedication, author_name: authorName }),
  });
}

export async function uploadWriterPdf(token: string, fileUri: string, fileName: string): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName, type: 'application/pdf' } as any);
  const r = await apiFetch<{ url?: string }>(`/api/writer/upload-pdf`, { method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` } });
  return r?.url || null;
}

export async function updateWriterStory(token: string, storyId: string, patch: { title?: string; description?: string; status?: string; category?: string; display_status?: string; writer_status?: string; cover_url?: string }): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/stories/${storyId}`, token, {
    method: 'PUT', body: JSON.stringify(patch),
  });
  return Boolean(r?.ok);
}

export async function deleteWriterStory(token: string, storyId: string): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/stories/${storyId}`, token, {
    method: 'DELETE',
  });
  return Boolean(r?.ok);
}

export async function fetchWriterStoryDetail(token: string, storyId: string): Promise<(Story & { chapters: StoryChapter[] }) | null> {
  return writerApiFetch<Story & { chapters: StoryChapter[] }>(`/api/writer/stories/${storyId}`, token);
}

export async function createStoryChapter(token: string, storyId: string, title: string, body: string): Promise<StoryChapter | null> {
  return writerApiFetch<StoryChapter>(`/api/writer/stories/${storyId}/chapters`, token, {
    method: 'POST', body: JSON.stringify({ title, body }),
  });
}

export async function updateStoryChapter(token: string, storyId: string, chapterId: string, patch: { title?: string; body?: string }): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/stories/${storyId}/chapters/${chapterId}`, token, {
    method: 'PUT', body: JSON.stringify(patch),
  });
  return Boolean(r?.ok);
}

export async function deleteStoryChapter(token: string, storyId: string, chapterId: string): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/stories/${storyId}/chapters/${chapterId}`, token, {
    method: 'DELETE',
  });
  return Boolean(r?.ok);
}

export async function fetchWriterProfile(token: string): Promise<WriterProfileFull | null> {
  return writerApiFetch<WriterProfileFull>('/api/writer/profile', token);
}

export async function updateWriterProfile(token: string, patch: { writer_name?: string; bio?: string; avatar_url?: string; username?: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const res = await fetch(`${API_BASE}/api/writer/profile`, {
      method: 'PUT',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    clearTimeout(timer);
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: body?.error || `HTTP ${res.status}` };
    return body || { ok: true };
  } catch { return { ok: false, error: 'Network error' }; }
}

export async function requestDeleteCode(token: string): Promise<{ ok: boolean; mail_sent?: boolean } | { error: string; retry_after?: number } | null> {
  const r = await apiFetch<{ ok?: boolean; mail_sent?: boolean; error?: string; retry_after?: number }>('/api/writer/account/code', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
  }, { timeout: 25000, errorBody: true });
  if (!r) return null;
  if (r.ok) return { ok: true, mail_sent: r.mail_sent };
  if (r.error) return { error: r.error, retry_after: r.retry_after };
  return null;
}

export async function deleteWriterAccount(token: string, code?: string): Promise<{ ok: boolean; error?: string; attempts_left?: number }> {
  const r = await apiFetch<{ ok?: boolean; error?: string; attempts_left?: number }>('/api/writer/account', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    body: code ? JSON.stringify({ code }) : undefined,
  }, { timeout: 25000, errorBody: true });
  if (!r) return { ok: false, error: 'Network error' };
  if (r.ok) return { ok: true };
  return { ok: false, error: r.error || 'Failed', attempts_left: r.attempts_left };
}

export type WriterDashboard = { stories: number; totalViews: number; followers: number; published: number; pending: number; publishedStories: { id: string; title: string; views: number; cover_url?: string; created_at: string; updated_at: string }[]; todayViews: number; weekViews: number; monthViews: number };

export async function fetchWriterDashboard(token: string): Promise<WriterDashboard | null> {
  return writerApiFetch<WriterDashboard>('/api/writer/dashboard', token);
}

export type WriterNotification = { id: string; title: string; body: string; type: string; story_id?: string; is_read: boolean; url?: string; avatar_url?: string; story_title?: string; story_cover?: string; created_at: string };

export async function fetchWriterNotifications(token: string): Promise<WriterNotification[]> {
  return (await writerApiFetch<WriterNotification[]>('/api/writer/notifications', token)) || [];
}

export async function markWriterNotificationsRead(token: string, ids?: string[]): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>('/api/writer/notifications/read', token, {
    method: 'POST', body: JSON.stringify({ ids }),
  });
  return Boolean(r?.ok);
}

export async function deleteWriterNotification(token: string, id: string): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/notifications/${id}`, token, { method: 'DELETE' });
  return Boolean(r?.ok);
}

export type WriterFollower = { id: string; username: string; writer_name: string; bio?: string; avatar_url?: string; follower_count?: number; badge?: string };

export async function fetchWriterFollowers(token: string): Promise<WriterFollower[]> {
  return (await writerApiFetch<WriterFollower[]>('/api/writer/followers', token)) || [];
}

export async function submitStoryForReview(token: string, storyId: string): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean; status: string }>(`/api/writer/stories/${storyId}/submit`, token, {
    method: 'POST',
  });
  return Boolean(r?.ok);
}

export async function submitReport(bookId: string, reason: string, details: string, deviceId: string, reporterName: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch(`${API_BASE}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId, reason, details, device_id: deviceId, reporter_name: reporterName }),
    });
    const data = await r.json();
    return { ok: Boolean(data?.ok), error: data?.error };
  } catch { return { ok: false, error: 'Network error' }; }
}
