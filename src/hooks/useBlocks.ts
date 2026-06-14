import { useState, useEffect, useCallback, useRef } from "react";
import { Block, RepeatType } from "@/types";
import { getBlocksByDate, getAllBlocks, saveBlock, updateBlock, deleteBlock } from "@/store/db";
import { getSampleBlocks } from "@/utils/sampleData";

interface UseBlocksReturn {
  blocks: Block[];
  loading: boolean;
  addBlock: (block: Block) => Promise<void>;
  updateBlocks: (blocks: Block[]) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDay(); // 0=Sun, 1=Mon...6=Sat
}

function shouldRepeatOnDate(block: Block, targetDate: string): boolean {
  if (block.date === targetDate) return false; // o'zi
  const blockDay = getDayOfWeek(block.date);
  const targetDay = getDayOfWeek(targetDate);
  const targetTime = new Date(targetDate + "T00:00:00").getTime();
  const blockTime = new Date(block.date + "T00:00:00").getTime();
  if (targetTime < blockTime) return false; // o'tmishga takrorlanmaydi

  switch (block.repeat) {
    case RepeatType.HarKuni:
      return true;
    case RepeatType.HarHafta:
      return blockDay === targetDay;
    case RepeatType.IshKunlari:
      return targetDay >= 1 && targetDay <= 5;
    case RepeatType.DamOlishKunlari:
      return targetDay === 0 || targetDay === 6;
    case RepeatType.HarOy: {
      const blockDate = new Date(block.date + "T00:00:00").getDate();
      const targetDateNum = new Date(targetDate + "T00:00:00").getDate();
      return blockDate === targetDateNum;
    }
    case RepeatType.HarYil: {
      const bd = new Date(block.date + "T00:00:00");
      const td = new Date(targetDate + "T00:00:00");
      return bd.getDate() === td.getDate() && bd.getMonth() === td.getMonth();
    }
    default:
      return false;
  }
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
        // 1. Bu kunga tegishli bloklar
        let local = await getBlocksByDate(date);

        // 2. Boshqa kunlardan takrorlanadigan bloklar
        const allBlocks = await getAllBlocks();
        const repeated = allBlocks
          .filter((b) => shouldRepeatOnDate(b, date))
          .map((b) => ({
            ...b,
            id: `${b.id}__repeat__${date}`, // unique id
            date,
          }));

        // 3. Takrorlanuvchi blokni o'sha kunda override qilingan bo'lsa skip
        const localIds = new Set(local.map((b) => b.id));
        const filteredRepeated = repeated.filter((rb) => {
          const originalId = rb.id.split("__repeat__")[0];
          return !localIds.has(originalId);
        });

        if (!cancelled) {
          // Birinchi marta — sample data seed
          if (local.length === 0 && filteredRepeated.length === 0) {
            const today = new Date().toISOString().slice(0, 10);
            if (date === today) {
              const samples = getSampleBlocks(date);
              await Promise.all(samples.map(saveBlock));
              local = samples;
            }
          }
          setBlocks([...local, ...filteredRepeated]);
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
    // Faqat "haqiqiy" bloklar (repeat nusxalar emas) saqlanadi
    const realBlocks = next.filter((b) => !b.id.includes("__repeat__"));
    const changed = realBlocks.filter((nb) => {
      const ob = prev.find((b) => b.id === nb.id);
      return !ob || JSON.stringify(ob) !== JSON.stringify(nb);
    });
    await Promise.all(changed.map(updateBlock)).catch(() => {});
  }, []);

  const removeBlock = useCallback(async (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    // Repeat nusxa bo'lsa, asl ID bilan o'chirish
    const realId = id.includes("__repeat__") ? id.split("__repeat__")[0] : id;
    await deleteBlock(realId).catch(() => {});
  }, []);

  return { blocks, loading, addBlock, updateBlocks, removeBlock };
}
