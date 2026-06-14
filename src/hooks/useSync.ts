import { useState, useEffect, useCallback, useRef } from "react";
import { Block } from "@/types";
import {
  fetchAllBlocksFromSupabase,
  upsertBlockToSupabase,
  upsertBlocksToSupabase,
  deleteBlockFromSupabase,
  supabase,
} from "@/store/supabase";

// ─── Offline queue (persisted in localStorage) ────────────────────────────────

const QUEUE_KEY = "timeblocks_sync_queue";

type QueueOp =
  | { type: "upsert"; block: Block }
  | { type: "delete"; id: string };

function loadQueue(): QueueOp[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function enqueue(op: QueueOp) {
  const queue = loadQueue();
  // Collapse duplicate upserts for the same id
  if (op.type === "upsert") {
    const idx = queue.findIndex(
      (q) => q.type === "upsert" && q.block.id === op.block.id,
    );
    if (idx !== -1) {
      queue[idx] = op;
    } else {
      queue.push(op);
    }
  } else {
    // Remove any pending upsert for this id and add the delete
    const filtered = queue.filter(
      (q) => !(q.type === "upsert" && q.block.id === op.id),
    );
    filtered.push(op);
    saveQueue(filtered);
    return;
  }
  saveQueue(queue);
}

// ─── Sync status type ─────────────────────────────────────────────────────────

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseSyncReturn {
  syncStatus: SyncStatus;
  pullFromSupabase: () => Promise<Block[] | null>;
  syncBlock: (block: Block) => Promise<void>;
  syncBlocks: (blocks: Block[]) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
}

export function useSync(): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    supabase ? "idle" : "offline",
  );
  const isFlushing = useRef(false);

  const isOnline = () => navigator.onLine && supabase !== null;

  // Flush the offline queue when we come back online
  const flushQueue = useCallback(async () => {
    if (isFlushing.current || !isOnline()) return;
    const queue = loadQueue();
    if (queue.length === 0) return;

    isFlushing.current = true;
    setSyncStatus("syncing");

    try {
      for (const op of queue) {
        if (op.type === "upsert") {
          await upsertBlockToSupabase(op.block);
        } else {
          await deleteBlockFromSupabase(op.id);
        }
      }
      saveQueue([]);
      setSyncStatus("synced");
    } catch (err) {
      console.error("useSync: flush failed", err);
      setSyncStatus("error");
    } finally {
      isFlushing.current = false;
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    if (!supabase) return;

    const handleOnline = () => {
      setSyncStatus("syncing");
      flushQueue();
    };
    const handleOffline = () => setSyncStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) setSyncStatus("offline");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushQueue]);

  // Pull all blocks from Supabase (called on mount)
  const pullFromSupabase = useCallback(async (): Promise<Block[] | null> => {
    if (!isOnline()) return null;
    setSyncStatus("syncing");
    try {
      const blocks = await fetchAllBlocksFromSupabase();
      setSyncStatus("synced");
      return blocks;
    } catch (err) {
      console.error("useSync: pull failed", err);
      setSyncStatus("error");
      return null;
    }
  }, []);

  // Upsert one block
  const syncBlock = useCallback(async (block: Block) => {
    if (!isOnline()) {
      enqueue({ type: "upsert", block });
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    try {
      await upsertBlockToSupabase(block);
      setSyncStatus("synced");
    } catch (err) {
      console.error("useSync: syncBlock failed", err);
      enqueue({ type: "upsert", block });
      setSyncStatus("error");
    }
  }, []);

  // Upsert many blocks (e.g. after drag-drop diff)
  const syncBlocks = useCallback(async (blocks: Block[]) => {
    if (blocks.length === 0) return;
    if (!isOnline()) {
      blocks.forEach((b) => enqueue({ type: "upsert", block: b }));
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    try {
      await upsertBlocksToSupabase(blocks);
      setSyncStatus("synced");
    } catch (err) {
      console.error("useSync: syncBlocks failed", err);
      blocks.forEach((b) => enqueue({ type: "upsert", block: b }));
      setSyncStatus("error");
    }
  }, []);

  // Delete one block
  const removeBlock = useCallback(async (id: string) => {
    if (!isOnline()) {
      enqueue({ type: "delete", id });
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    try {
      await deleteBlockFromSupabase(id);
      setSyncStatus("synced");
    } catch (err) {
      console.error("useSync: removeBlock failed", err);
      enqueue({ type: "delete", id });
      setSyncStatus("error");
    }
  }, []);

  return { syncStatus, pullFromSupabase, syncBlock, syncBlocks, removeBlock };
}
