import { createClient } from "@supabase/supabase-js";
import { Block, Category, RepeatType } from "@/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars missing — sync disabled");
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ─── Row type ─────────────────────────────────────────────────────────────────

interface BlockRow {
  id: string;
  emoji: string;
  name: string;
  category: string;
  color: string;
  duration_slots: number;
  start_slot: number;
  shape_cols: number;
  shape_rows: number;
  repeat: string;
  date: string; // FIX: date field qo'shildi
}

function rowToBlock(row: BlockRow): Block {
  return {
    id: row.id,
    emoji: row.emoji,
    name: row.name,
    category: row.category as Category,
    color: row.color,
    durationSlots: row.duration_slots,
    startSlot: row.start_slot,
    shape: { cols: row.shape_cols, rows: row.shape_rows },
    repeat: row.repeat as RepeatType,
    date: row.date, // FIX: date maplash
  };
}

function blockToRow(block: Block): BlockRow {
  return {
    id: block.id,
    emoji: block.emoji,
    name: block.name,
    category: block.category,
    color: block.color,
    duration_slots: block.durationSlots,
    start_slot: block.startSlot,
    shape_cols: block.shape.cols,
    shape_rows: block.shape.rows,
    repeat: block.repeat,
    date: block.date, // FIX: date saqlash
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function fetchAllBlocksFromSupabase(): Promise<Block[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("blocks").select("*");
  if (error) throw error;
  return (data as BlockRow[]).map(rowToBlock);
}

export async function upsertBlockToSupabase(block: Block): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("blocks")
    .upsert(blockToRow(block), { onConflict: "id" });
  if (error) throw error;
}

export async function upsertBlocksToSupabase(blocks: Block[]): Promise<void> {
  if (!supabase || blocks.length === 0) return;
  const { error } = await supabase
    .from("blocks")
    .upsert(blocks.map(blockToRow), { onConflict: "id" });
  if (error) throw error;
}

export async function deleteBlockFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("blocks").delete().eq("id", id);
  if (error) throw error;
}
