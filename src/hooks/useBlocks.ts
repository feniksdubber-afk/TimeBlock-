import { useState, useEffect, useCallback, useRef } from "react";
import { Block } from "@/types";
import {
  getAllBlocks,
  saveBlock,
  updateBlock,
  deleteBlock,
} from "@/store/db";
import { useSync } from "@/hooks/useSync";
import { sampleBlocks } from "@/utils/sampleData";

interface UseBlocksReturn {
  blocks: Block[];
  loading: boolean;
  addBlock: (block: Block) => Promise<void>;
  updateBlocks: (blocks: Block[]) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
}

export function useBlocks(): UseBlocksReturn {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const blocksRef = useRef<Block[]>([]);
  blocksRef.current = blocks;

  const { pullFromSupabase, syncBlock, syncBlocks, removeBlock: syncRemove } = useSync();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Always load IDB first so the app is never empty while network resolves
      let localBlocks: Block[] = [];
      try {
        localBlocks = await getAllBlocks();
      } catch {
        localBlocks = [];
      }

      if (!cancelled) {
        if (localBlocks.length > 0) {
          setBlocks(localBlocks);
          setLoading(false);
        }
      }

      // 2. Try to pull from Supabase (non-blocking — already showing IDB data)
      try {
        const remote = await pullFromSupabase();
        if (cancelled) return;

        if (remote !== null && remote.length > 0) {
          // Remote wins — update UI and mirror to IDB
          setBlocks(remote);
          await Promise.all(remote.map(saveBlock));
          return;
        }

        // Remote returned empty — if we have local data push it up, otherwise seed
        if (localBlocks.length > 0) {
          await syncBlocks(localBlocks);
        } else if (!cancelled) {
          // First launch: seed everywhere
          setBlocks(sampleBlocks);
          await Promise.all(sampleBlocks.map(saveBlock));
          await syncBlocks(sampleBlocks);
        }
      } catch (err) {
        // Supabase unavailable or table missing — just keep IDB data
        console.warn("useBlocks: Supabase pull failed, using local data", err);
        if (!cancelled && localBlocks.length === 0) {
          setBlocks(sampleBlocks);
          await Promise.all(sampleBlocks.map(saveBlock)).catch(() => {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addBlock = useCallback(async (block: Block) => {
    setBlocks((prev) => [...prev, block]);
    await saveBlock(block).catch(() => {});
    await syncBlock(block).catch(() => {});
  }, [syncBlock]);

  const updateBlocks = useCallback(async (next: Block[]) => {
    const prev = blocksRef.current;
    setBlocks(next);

    const changed = next.filter((nb) => {
      const ob = prev.find((b) => b.id === nb.id);
      return !ob || JSON.stringify(ob) !== JSON.stringify(nb);
    });

    await Promise.all(changed.map(updateBlock)).catch(() => {});
    await syncBlocks(changed).catch(() => {});
  }, [syncBlocks]);

  const removeBlock = useCallback(async (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    await deleteBlock(id).catch(() => {});
    await syncRemove(id).catch(() => {});
  }, [syncRemove]);

  return { blocks, loading, addBlock, updateBlocks, deleteBlock: removeBlock };
}
