import { useState } from "react";
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
  [Category.Ish]:      { label: "Ish",       color: "#0ea5e9" },
  [Category.Sport]:    { label: "Sport",     color: "#10b981" },
  [Category.Oqish]:   { label: "Oqish",     color: "#8b5cf6" },
  [Category.DamOlish]:{ label: "Dam olish", color: "#f97316" },
  [Category.Ovqat]:   { label: "Ovqat",     color: "#f59e0b" },
  [Category.Oila]:    { label: "Oila",      color: "#ec4899" },
  [Category.Muhim]:   { label: "Muhim",     color: "#ef4444" },
  [Category.Shaxsiy]: { label: "Shaxsiy",   color: "#14b8a6" },
  [Category.Boshqa]:  { label: "Boshqa",    color: "#71717a" },
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
      {children}
    </p>
  );
}

interface CreateBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: Block) => void;
  date: string;
}

interface FormState {
  emoji: string;
  name: string;
  durationSlots: number;
  category: Category;
  color: string;
  repeat: RepeatType;
}

const DEFAULT_FORM: FormState = {
  emoji: "⭐",
  name: "",
  durationSlots: 4,
  category: Category.Boshqa,
  color: "#6366f1",
  repeat: RepeatType.HarKuni,
};

export default function CreateBlockModal({ isOpen, onClose, onSave, date }: CreateBlockModalProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const block: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      emoji: form.emoji,
      name: form.name.trim(),
      category: form.category,
      color: form.color,
      durationSlots: form.durationSlots,
      startSlot: 0,
      shape: { cols: 1, rows: form.durationSlots },
      repeat: form.repeat,
      date,
    };
    onSave(block);
    setForm(DEFAULT_FORM);
    onClose();
  }

  function handleClose() {
    setForm(DEFAULT_FORM);
    onClose();
  }

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
            onClick={handleClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 max-h-[88vh]"
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>
            <div className="px-5 pt-1 pb-3 flex-shrink-0">
              <h2 className="text-base font-bold text-zinc-100">Yangi blok yaratish</h2>
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-2 space-y-5">
              <div>
                <SectionLabel>Emoji</SectionLabel>
                <div className="grid grid-cols-10 gap-1">
                  {EMOJIS.map((emoji) => (
                    <button key={emoji} onClick={() => set("emoji", emoji)}
                      className={["h-8 w-full flex items-center justify-center rounded-lg text-lg transition-colors",
                        form.emoji === emoji ? "bg-zinc-700 ring-1 ring-zinc-500" : "bg-zinc-800/60 active:bg-zinc-700"].join(" ")}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Nomi</SectionLabel>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Masalan: Uyqu, Ish, Sport..."
                  className="w-full bg-zinc-800/70 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors" />
              </div>

              <div>
                <SectionLabel>Davomiyligi</SectionLabel>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map(({ label, slots }) => (
                    <button key={slots} onClick={() => set("durationSlots", slots)}
                      className={["py-2 rounded-xl text-xs font-semibold transition-colors",
                        form.durationSlots === slots ? "bg-indigo-600 text-white" : "bg-zinc-800/70 text-zinc-400 active:bg-zinc-700"].join(" ")}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Kategoriya</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
                    const { label, color } = CATEGORY_META[cat];
                    const active = form.category === cat;
                    return (
                      <button key={cat} onClick={() => set("category", cat)}
                        style={{
                          backgroundColor: active ? hexToRgba(color, 0.25) : hexToRgba(color, 0.08),
                          borderColor: active ? color : "transparent",
                          color: active ? color : "#a1a1aa",
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors">
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <SectionLabel>Rang</SectionLabel>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map((color) => (
                    <button key={color} onClick={() => set("color", color)}
                      style={{ backgroundColor: color }}
                      className={["w-8 h-8 rounded-full transition-transform active:scale-90",
                        form.color === color ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110" : ""].join(" ")} />
                  ))}
                </div>
                <div className="mt-3 rounded-xl px-3 py-2 flex items-center gap-2"
                  style={{ backgroundColor: hexToRgba(form.color, 0.2) }}>
                  <span className="text-lg">{form.emoji}</span>
                  <span className="text-sm font-semibold truncate" style={{ color: form.color }}>
                    {form.name || "Blok nomi"}
                  </span>
                </div>
              </div>

              <div>
                <SectionLabel>Takrorlanish</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(REPEAT_LABELS) as RepeatType[]).map((r) => (
                    <button key={r} onClick={() => set("repeat", r)}
                      className={["py-2 px-3 rounded-xl text-xs font-medium text-left transition-colors",
                        form.repeat === r ? "bg-zinc-700 text-zinc-100 ring-1 ring-zinc-600" : "bg-zinc-800/60 text-zinc-400 active:bg-zinc-700"].join(" ")}>
                      {REPEAT_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 flex-shrink-0 border-t border-zinc-800/60">
              <button onClick={handleClose}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 text-sm font-semibold active:bg-zinc-700 transition-colors">
                Bekor qilish
              </button>
              <motion.button onClick={handleSave} disabled={!form.name.trim()} whileTap={{ scale: 0.97 }}
                style={{
                  backgroundColor: form.name.trim() ? form.color : undefined,
                  color: form.name.trim() ? getTextColor(form.color) : undefined,
                }}
                className={["flex-1 py-3 rounded-2xl text-sm font-bold transition-colors",
                  !form.name.trim() ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : ""].join(" ")}>
                Saqlash
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
