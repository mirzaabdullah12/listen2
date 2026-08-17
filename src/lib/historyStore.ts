import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { TranscriptionRecord } from '@/types';

interface MtsDB extends DBSchema {
  transcriptions: {
    key: string;
    value: TranscriptionRecord;
    indexes: { 'by-createdAt': number };
  };
}

let dbPromise: Promise<IDBPDatabase<MtsDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MtsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MtsDB>('mts-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('transcriptions', { keyPath: 'id' });
        store.createIndex('by-createdAt', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function saveRecord(record: TranscriptionRecord): Promise<void> {
  const db = await getDB();
  await db.put('transcriptions', record);
}

export async function getAllRecords(): Promise<TranscriptionRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('transcriptions', 'by-createdAt');
  return all.reverse(); // most recent first
}

export async function getRecordById(id: string): Promise<TranscriptionRecord | undefined> {
  const db = await getDB();
  return db.get('transcriptions', id);
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transcriptions', id);
}
