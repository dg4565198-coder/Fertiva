// Armazenamento local persistente em IndexedDB para PDFs e Imagens de Livros da Biblioteca FERTIVA

const DB_NAME = 'fertiva_library_db';
const DB_VERSION = 1;
const STORE_NAME = 'book_files';

interface StoredBookRecord {
  refId: string;
  blob: Blob;
  fileName: string;
  fileType: 'pdf' | 'image';
  updatedAt: number;
}

const memoryUrlCache = new Map<string, { url: string; fileName: string; fileType: 'pdf' | 'image' }>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado neste ambiente'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'refId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBookBlob(
  refId: string,
  file: Blob | File,
  fileName: string,
  fileType: 'pdf' | 'image'
): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredBookRecord = {
        refId,
        blob: file,
        fileName,
        fileType,
        updatedAt: Date.now()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Atualiza cache em memória
    const url = URL.createObjectURL(file);
    memoryUrlCache.set(refId, { url, fileName, fileType });
  } catch (err) {
    console.warn('Falha ao gravar arquivo no IndexedDB:', err);
    // Mesmo com erro em IndexedDB, mantemos no cache de sessão
    const url = URL.createObjectURL(file);
    memoryUrlCache.set(refId, { url, fileName, fileType });
  }
}

export async function getBookBlob(
  refId: string
): Promise<{ blob: Blob; fileName: string; fileType: 'pdf' | 'image' } | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(refId);
      req.onsuccess = () => {
        if (req.result) {
          resolve({
            blob: req.result.blob,
            fileName: req.result.fileName,
            fileType: req.result.fileType
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falha ao ler arquivo do IndexedDB:', err);
    return null;
  }
}

export async function getOrLoadBookUrl(
  refId: string
): Promise<{ url: string; fileName: string; fileType: 'pdf' | 'image' } | null> {
  if (memoryUrlCache.has(refId)) {
    return memoryUrlCache.get(refId)!;
  }

  const record = await getBookBlob(refId);
  if (record) {
    const url = URL.createObjectURL(record.blob);
    const entry = { url, fileName: record.fileName, fileType: record.fileType };
    memoryUrlCache.set(refId, entry);
    return entry;
  }

  return null;
}

export async function deleteBookBlob(refId: string): Promise<void> {
  if (memoryUrlCache.has(refId)) {
    const cached = memoryUrlCache.get(refId);
    if (cached?.url) {
      URL.revokeObjectURL(cached.url);
    }
    memoryUrlCache.delete(refId);
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(refId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falha ao deletar arquivo do IndexedDB:', err);
  }
}
