import * as FileSystem from 'expo-file-system/legacy';
import { Book } from './types';

const DL_DIR = (FileSystem.documentDirectory || '') + 'downloads/';

async function ensureDir(dir: string) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

// P1: readDirectoryAsync returns bare names (no trailing slash) — verify each
// entry is a book dir containing book.json instead of suffix filtering.
export async function getOfflineBookIds(): Promise<string[]> {
  try {
    const info = await FileSystem.getInfoAsync(DL_DIR);
    if (!info.exists) return [];
    const items = await FileSystem.readDirectoryAsync(DL_DIR);
    const ids: string[] = [];
    for (const raw of items) {
      const name = (raw || '').replace(/\//g, '');
      if (!name || name.endsWith('.tmp')) continue;
      try {
        const st = await FileSystem.getInfoAsync(DL_DIR + name + '/book.json');
        if (st.exists) ids.push(name);
      } catch {}
    }
    return ids;
  } catch {
    return [];
  }
}

// P4 progress (0-100 across cover+meta+chapters), P5 cover cache, P6 atomic tmp+verify.
// Single disk write per book: caller must fetch once and call this once.
export async function saveBookOffline(book: Book, onProgress?: (pct: number) => void): Promise<void> {
  const prog = (f: number) => { try { onProgress && onProgress(Math.max(0, Math.min(100, Math.floor(f)))); } catch {} };
  await ensureDir(DL_DIR);
  const finalDir = DL_DIR + book.id + '/';
  const tmpDir = DL_DIR + book.id + '.tmp/';
  try { await FileSystem.deleteAsync(tmpDir, { idempotent: true }); } catch {}
  await ensureDir(tmpDir);
  try {
    const total = book.chapters.length;
    if (!total) throw new Error('no chapters');
    // P5: cache cover inside tmp dir; store filename only (path changes after move).
    let coverLocal: string | null = null;
    const curl = book.cover_url || null;
    if (curl && curl.startsWith('http')) {
      try {
        const dl = await FileSystem.downloadAsync(curl, tmpDir + 'cover.jpg');
        if (dl && (dl as any).uri) coverLocal = 'cover.jpg';
      } catch {}
    }
    prog(5);
    const meta = { ...book, chapters: book.chapters.map(c => ({ id: c.id, title: c.title, minutes: c.minutes })), cover_local: coverLocal, saved_at: Date.now() };
    await FileSystem.writeAsStringAsync(tmpDir + 'book.json', JSON.stringify(meta));
    prog(10);
    for (let i = 0; i < total; i++) {
      const ch = book.chapters[i];
      await FileSystem.writeAsStringAsync(tmpDir + `chapter-${i}.json`, JSON.stringify({ id: ch.id, title: ch.title, body: ch.body || '', minutes: ch.minutes }));
      prog(10 + (85 * (i + 1)) / total);
    }
    // P6: verify tmp copy before publishing.
    const raw = await FileSystem.readAsStringAsync(tmpDir + 'book.json');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.chapters) || parsed.chapters.length !== total) throw new Error('verify meta');
    for (let i = 0; i < total; i++) {
      const st = await FileSystem.getInfoAsync(tmpDir + `chapter-${i}.json`);
      if (!st.exists) throw new Error('verify chapter ' + i);
    }
    prog(97);
    // Atomic publish: replace final dir with verified tmp dir.
    try { await FileSystem.deleteAsync(finalDir, { idempotent: true }); } catch {}
    try {
      await FileSystem.moveAsync({ from: tmpDir, to: finalDir });
    } catch {
      // Fallback for versions without dir move: move files one by one.
      await ensureDir(finalDir);
      const names = await FileSystem.readDirectoryAsync(tmpDir);
      for (const n of names) {
        await FileSystem.moveAsync({ from: tmpDir + n, to: finalDir + n });
      }
      try { await FileSystem.deleteAsync(tmpDir, { idempotent: true }); } catch {}
    }
    prog(100);
  } catch (e) {
    try { await FileSystem.deleteAsync(tmpDir, { idempotent: true }); } catch {}
    throw e;
  }
}

export async function loadBookOffline(id: string): Promise<Book | null> {
  try {
    const bookDir = DL_DIR + id + '/';
    const info = await FileSystem.getInfoAsync(bookDir + 'book.json');
    if (!info.exists) return null;

    const metaRaw = await FileSystem.readAsStringAsync(bookDir + 'book.json');
    const meta = JSON.parse(metaRaw);

    const chapters = [];
    for (let i = 0; ; i++) {
      const chPath = bookDir + `chapter-${i}.json`;
      const chInfo = await FileSystem.getInfoAsync(chPath);
      if (!chInfo.exists) break;
      const chRaw = await FileSystem.readAsStringAsync(chPath);
      chapters.push(JSON.parse(chRaw));
    }

    // P6 integrity: an incomplete copy is not a valid download (re-downloadable).
    if (!Array.isArray(meta.chapters) || !chapters.length || chapters.length !== meta.chapters.length) return null;
    // P5: prefer local cached cover when present, else keep remote URL.
    if (meta.cover_local) {
      try {
        const cst = await FileSystem.getInfoAsync(bookDir + meta.cover_local);
        if (cst.exists) meta.cover_url = bookDir + meta.cover_local;
      } catch {}
    }

    return { ...meta, chapters } as Book;
  } catch {
    return null;
  }
}

export async function removeBookOffline(id: string): Promise<void> {
  try {
    const bookDir = DL_DIR + id + '/';
    const info = await FileSystem.getInfoAsync(bookDir);
    if (info.exists) await FileSystem.deleteAsync(bookDir, { idempotent: true });
  } catch {}
  try { await FileSystem.deleteAsync(DL_DIR + id + '.tmp/', { idempotent: true }); } catch {}
}

export async function isBookOffline(id: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(DL_DIR + id + '/book.json');
    return info.exists;
  } catch {
    return false;
  }
}
