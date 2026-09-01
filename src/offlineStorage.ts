import * as FileSystem from 'expo-file-system/legacy';
import { Book } from './types';

const DL_DIR = (FileSystem.documentDirectory || '') + 'downloads/';

async function ensureDir(dir: string) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

export async function saveBookOffline(book: Book): Promise<void> {
  await ensureDir(DL_DIR);
  const bookDir = DL_DIR + book.id + '/';
  await ensureDir(bookDir);

  const meta = { ...book, chapters: book.chapters.map(c => ({ id: c.id, title: c.title, minutes: c.minutes })) };
  await FileSystem.writeAsStringAsync(bookDir + 'book.json', JSON.stringify(meta));

  for (let i = 0; i < book.chapters.length; i++) {
    const ch = book.chapters[i];
    await FileSystem.writeAsStringAsync(bookDir + `chapter-${i}.json`, JSON.stringify({ id: ch.id, title: ch.title, body: ch.body || '', minutes: ch.minutes }));
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
}

export async function isBookOffline(id: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(DL_DIR + id + '/book.json');
    return info.exists;
  } catch {
    return false;
  }
}

export async function getOfflineBookIds(): Promise<string[]> {
  try {
    const info = await FileSystem.getInfoAsync(DL_DIR);
    if (!info.exists) return [];
    const items = await FileSystem.readDirectoryAsync(DL_DIR);
    return items.filter((i: string) => i.endsWith('/')).map((i: string) => i.replace(/\//g, ''));
  } catch {
    return [];
  }
}
