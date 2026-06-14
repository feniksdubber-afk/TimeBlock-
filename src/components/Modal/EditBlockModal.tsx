import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Block, Category, RepeatType } from "@/types";
import { hexToRgba, getTextColor } from "@/utils/color";

const EMOJIS = [
  "😴","💻","🍽","🏃","📚","🎮","🎵","🏠",
  "💪","🧘","🚗","✍️","🎨","🛒","☕","🤝",
  "📞","💊","🚿","🏋️","🌟","❤️","🎯","🔥",
  "💡","🌙","☀️","🍎","🥗","🎬","📺","🎤",
  "🏊","🚴","⚽","🎸","📝","💼","🎓","🧹",
];

const DURATIONS: { label: string; slots: number }[] = [
  { label: "15 min", slots: 1 },
  { label: "30 min", slots: 2 },
  { label: "45 min", slots: 3 },
  { label: "1 soat", slots: 4 },
  { label: "2 soat", slots: 8 },
  { label: "3 soat", slots: 12 },
  { label: "4 soat", slots: 16 },
  { label: "8 soat", slots: 32 },
];

const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  [Category.Ish]:       { label: "Ish",       color: "#0ea5e9" },
  [Category.Sport]:     { label: "Sport",     color: "#10b981" },
  [Category.Oqish]:    { label: "Oqish",     color: "#8b5cf6" },
  [Category.DamOlish]: { label: "Dam olish", color: "#f97316" },
  [Category.Ovqat]:    { label: "Ovqat",     color: "#f59e0b" },
  [Category.Oila]:     { label: "Oila",      color: "#ec4899" },
  [Category.Muhim]:    { label: "Muhim",     color: "#ef4444" },
  [Category.Shaxsiy]:  { label: "Shaxsiy",   color: "#14b8a6" },
  [Category.Boshqa]:   { label: "Boshqa",    color: "#71717a" },
};

const PRESET_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#ef4444",
  "#f97316","#f59e0b","#84cc16","#10b981",
  "#14b8a6","#0ea5e9","#06b6d4","#71717a",
];

const REPEAT_LABELS: Record<RepeatType, string> = {
  [RepeatType.HarKuni]:         "Har kuni",
  [RepeatType.HarHafta]:        "Har hafta",
  [RepeatType.IshKunlari]:      "Ish kunlari",
  [RepeatType.DamOlishKunlari]: "Dam olish kunlari",
  [RepeatType.HarOy]:           "Har oy",
  [RepeatType.HarYil]:          "Har yil",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function slotFromTime(hour: number, minute: number): number {
  return hour * 4 + Math.floor(minute / 15);
}

function slotToTime(slot: number): { hour: number; minute: number } {
  return { hour: Math.floor(slot / 4), minute: (slot % 4) * 15 };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
      {children}
    </p>
  );
}

interface EditBlockModalProps {
  block: Block | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: Block) => void;
  onDelete: (id: string) => void;
}

export default function EditBlockModal({
  block,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditBlockModalProps) {
  const [emoji, setEmoji] = useState("⭐");
  const [name, setName] = useState("");
  const [durationSlots, setDurationSlots] = useState(4);
  const [category, setCategory] = useState<Category>(Category.Boshqa);
  const [color, setColor] = useState("#6366f1");
  const [repeat, setRepeat] = useState<RepeatType>(RepeatType.HarKuni);
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Block o'zgarganda formni to'ldirish
  useEffect(() => {
    if (block) {
      setEmoji(block.emoji);
      setName(block.name);
      setDurationSlots(block.durationSlots);
      setCategory(block.category);
      setColor(block.color);
      setRepeat(block.repeat);
      const { hour, minute } = slotToTime(block.startSlot);
      setStartHour(hour);
      setStartMinute(minute);
      setConfirmDelete(false);
    }
  }, [block]);

  if (!block) return null;

  const isRepeatCopy = block.id.includes("__repeat__");

  function handleSave() {
    if (!name.trim()) return;
    const startSlot = slotFromTime(startHour, startMinute);
    onSave({
      ...block,
      emoji,
      name: name.trim(),
      category,
      color,
      durationSlots,
      startSlot,
      shape: { cols: 1, rows: durationSlots },
      repeat,
    });
    onClose();
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(block.id);
    onClose();
  }

  const endSlot = slotFromTime(startHour, startMinute) + durationSlots;
  const endHour = Math.floor(endSlot / 4) % 24;
  const endMin = (endSlot % 4) * 15;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 max-h-[90vh]"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="px-5 pt-1 pb-3 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-bold text-zinc-100">Blokni tahrirlash</h2>
              {isRepeatCopy && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                  ↻ Takrorlanuvchi
                </span>
              )}
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-2 space-y-5">

              {/* Emoji */}
              <div>
                <SectionLabel>Emoji</SectionLabel>
                <div className="grid grid-cols-10 gap-1">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setEmoji(e)}
                      className={["h-8 w-full flex items-center justify-center rounded-lg text-lg transition-colors",
                        emoji === e ? "bg-zinc-700 ring-1 ring-zinc-500" : "bg-zinc-800/60 active:bg-zinc-700"].join(" ")}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nomi */}
              <div>
                <SectionLabel>Nomi</SectionLabel>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800/70 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              {/* Vaqt */}
              <div>
                <SectionLabel>Boshlanish vaqti</SectionLabel>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}
                      className="w-full bg-zinc-800/70 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-600 appearance-none text-center">
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-600 text-center mt-1">soat</p>
                  </div>
                  <span className="text-zinc-500 font-bold text-lg pb-4">:</span>
                  <div className="flex-1">
                    <select value={startMinute} onChange={(e) => setStartMinute(Number(e.target.value))}
                      className="w-full bg-zinc-800/70 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-600 appearance-none text-center">
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-600 text-center mt-1">daqiqa</p>
                  </div>
                  <div className="flex-1 bg-zinc-800/40 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-xs text-zinc-400 font-medium">
                      {String(startHour).padStart(2, "0")}:{String(startMinute).padStart(2, "0")}
                      {" → "}
                      {String(endHour).padStart(2, "0")}:{String(endMin).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">vaqt oralig'i</p>
                  </div>
                </div>
              </div>

              {/* Davomiyligi */}
              <div>
                <SectionLabel>Davomiyligi</SectionLabel>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map(({ label, slots }) => (
                    <button key={slots} onClick={() => setDurationSlots(slots)}
                      className={["py-2 rounded-xl text-xs font-semibold transition-colors",
                        durationSlots === slots ? "bg-indigo-600 text-white" : "bg-zinc-800/70 text-zinc-400 active:bg-zinc-700"].join(" ")}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kategoriya */}
              <div>
                <SectionLabel>Kategoriya</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
                    const { label, color: c } = CATEGORY_META[cat];
                    const active = category === cat;
                    return (
                      <button key={cat} onClick={() => setCategory(cat)}
                        style={{
                          backgroundColor: active ? hexToRgba(c, 0.25) : hexToRgba(c, 0.08),
                          borderColor: active ? c : "transparent",
                          color: active ? c : "#a1a1aa",
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors">
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rang */}
              <div>
                <SectionLabel>Rang</SectionLabel>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={["w-8 h-8 rounded-full transition-transform active:scale-90",
                        color === c ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110" : ""].join(" ")} />
                  ))}
                </div>
                <div className="mt-3 rounded-xl px-3 py-2 flex items-center gap-2"
                  style={{ backgroundColor: hexToRgba(color, 0.2) }}>
                  <span className="text-lg">{emoji}</span>
                  <span className="text-sm font-semibold truncate" style={{ color }}>
                    {name || "Blok nomi"}
                  </span>
                </div>
              </div>

              {/* Takrorlanish */}
              <div>
                <SectionLabel>Takrorlanish</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(REPEAT_LABELS) as RepeatType[]).map((r) => (
                    <button key={r} onClick={() => setRepeat(r)}
                      className={["py-2 px-3 rounded-xl text-xs font-medium text-left transition-colors",
                        repeat === r ? "bg-zinc-700 text-zinc-100 ring-1 ring-zinc-600" : "bg-zinc-800/60 text-zinc-400 active:bg-zinc-700"].join(" ")}>
                      {REPEAT_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              {/* O'chirish */}
              <div className="pb-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDelete}
                  className={[
                    "w-full py-3 rounded-2xl text-sm font-semibold transition-colors",
                    confirmDelete
                      ? "bg-red-500 text-white"
                      : "bg-zinc-800/60 text-red-400 border border-red-500/20",
                  ].join(" ")}
                >
                  {confirmDelete ? "Tasdiqlash — o'chirilsin ✕" : "Blokni o'chirish"}
                </motion.button>
                {confirmDelete && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setConfirmDelete(false)}
                    className="w-full mt-2 py-2 text-xs text-zinc-500 text-center"
                  >
                    Bekor qilish
                  </motion.button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 flex-shrink-0 border-t border-zinc-800/60">
              <button onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 text-sm font-semibold active:bg-zinc-700 transition-colors">
                Bekor qilish
              </button>
              <motion.button
                onClick={handleSave}
                disabled={!name.trim()}
                whileTap={{ scale: 0.97 }}
                style={{
                  backgroundColor: name.trim() ? color : undefined,
                  color: name.trim() ? getTextColor(color) : undefined,
                }}
                className={["flex-1 py-3 rounded-2xl text-sm font-bold transition-colors",
                  !name.trim() ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : ""].join(" ")}
              >
                Saqlash
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
