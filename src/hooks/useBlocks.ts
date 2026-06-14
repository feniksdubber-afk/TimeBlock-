import { useState, useEffect, useCallback, useRef } from "react";
import { Block } from "@/types";
import { getBlocksByDate, saveBlock, updateBlock, deleteBlock } from "@/store/db";
import { getSampleBlocks } from "@/utils/sampleData";

interface UseBlocksReturn {
  blocks: Block[];
  loading: boolean;
  addBlock: (block: Block) => Promise<void>;
  updateBlocks: (blocks: Block[]) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
}

export function useBlocks(date: string): UseBlocksReturn {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const blocksRef = useRef<Block[]>([]);
  blocksRef.current = blocks;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        let local = await getBlocksByDate(date);
        if (!cancelled) {
          if (local.length === 0) {
            // First time for this date — seed sample blocks
            const today = new Date().toISOString().slice(0, 10);
            if (date === today) {
              const samples = getSampleBlocks(date);
              await Promise.all(samples.map(saveBlock));
              local = samples;
            }
          }
          setBlocks(local);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [date]);

  const addBlock = useCallback(async (block: Block) => {
    const b = { ...block, date };
    setBlocks((prev) => [...prev, b]);
    await saveBlock(b).catch(() => {});
  }, [date]);

  const updateBlocks = useCallback(async (next: Block[]) => {
    const prev = blocksRef.current;
    setBlocks(next);
    const changed = next.filter((nb) => {
      const ob = prev.find((b) => b.id === nb.id);
      return !ob || JSON.stringify(ob) !== JSON.stringify(nb);
    });
    await Promise.all(changed.map(updateBlock)).catch(() => {});
  }, []);

  const removeBlock = useCallback(async (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    await deleteBlock(id).catch(() => {});
  }, []);

  return { blocks, loading, addBlock, updateBlocks, removeBlock };
}
