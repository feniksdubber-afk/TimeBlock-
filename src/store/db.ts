import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Block } from "@/types";

const DB_NAME = "timeblocks-db";
const DB_VERSION = 2;
const STORE = "blocks" as const;

interface TimeBlocksSchema extends DBSchema {
  [STORE]: {
    key: string;
    value: Block;
    indexes: { "by-date": string };
  };
}

type TimeBlocksDB = IDBPDatabase<TimeBlocksSchema>;

let _db: TimeBlocksDB | null = null;

async function getDB(): Promise<TimeBlocksDB> {
  if (_db) return _db;
  _db = await openDB<TimeBlocksSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by-date", "date");
      } else {
        // v1 → v2: add date index if missing
        const store = db.transaction.objectStore(STORE);
        if (!store.indexNames.contains("by-date")) {
          store.createIndex("by-date", "date");
        }
      }
    },
  });
  return _db;
}

export async function getAllBlocks(): Promise<Block[]> {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function getBlocksByDate(date: string): Promise<Block[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE, "by-date", date);
}

export async function saveBlock(block: Block): Promise<void> {
  const db = await getDB();
  await db.put(STORE, block);
}

export async function updateBlock(block: Block): Promise<void> {
  const db = await getDB();
  await db.put(STORE, block);
}

export async function deleteBlock(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function clearAllBlocks(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE);
}
