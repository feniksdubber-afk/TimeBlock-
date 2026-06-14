import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Block } from "@/types";

const DB_NAME = "timeblocks-db";
const DB_VERSION = 1;
const STORE = "blocks" as const;

interface TimeBlocksSchema extends DBSchema {
  [STORE]: {
    key: string;
    value: Block;
  };
}

type TimeBlocksDB = IDBPDatabase<TimeBlocksSchema>;

let _db: TimeBlocksDB | null = null;

async function getDB(): Promise<TimeBlocksDB> {
  if (_db) return _db;
  _db = await openDB<TimeBlocksSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    },
  });
  return _db;
}

export async function getAllBlocks(): Promise<Block[]> {
  const db = await getDB();
  return db.getAll(STORE);
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
