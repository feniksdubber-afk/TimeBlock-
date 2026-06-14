import { useMemo, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { Block } from "@/types";
import { SyncStatus } from "@/hooks/useSync";

// ─── Uzbek locale helpers ─────────────────────────────────────────────────────

const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
const UZ_DAYS = [
  "Yakshanba", "Dushanba", "Seshanba", "Chorshanba",
  "Payshanba", "Juma", "Shanba",
];

function formatUzbekDate(date: Date): string {
  return `${date.getDate()} ${UZ_MONTHS[date.getMonth()]}, ${UZ_DAYS[date.getDay()]}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}s`;
  return `${h}s ${m}m`;
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    const ctrl = animate(count, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
    });
    return ctrl.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

// ─── Sync badge ───────────────────────────────────────────────────────────────

function SyncBadge({ status }: { status: SyncStatus }) {
  const config: Record<SyncStatus, { label: string; dot: string; text: string }> = {
    idle:    { label: "—",               dot: "bg-zinc-600",   text: "text-zinc-500" },
    syncing: { label: "Sinxronlanmoqda", dot: "bg-amber-400 animate-pulse", text: "text-amber-400" },
    synced:  { label: "Sinxronlashdi ✓", dot: "bg-emerald-400", text: "text-emerald-400" },
    offline: { label: "Oflayn rejim",    dot: "bg-zinc-500",   text: "text-zinc-400" },
    error:   { label: "Xato ✗",          dot: "bg-rose-500",   text: "text-rose-400" },
  };
  const { label, dot, text } = config[status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1.5"
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
        <span className={`text-[10px] font-semibold tracking-wide ${text}`}>{label}</span>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={[
        "text-[11px] font-semibold uppercase tracking-wider",
        accent ? "text-indigo-400" : "text-zinc-500",
      ].join(" ")}>
        {label}
      </span>
      <span className="text-sm font-bold text-zinc-100">{value}</span>
    </div>
  );
}

// ─── DayHeader ────────────────────────────────────────────────────────────────

interface DayHeaderProps {
  blocks: Block[];
  syncStatus: SyncStatus;
}

export default function DayHeader({ blocks, syncStatus }: DayHeaderProps) {
  const today = useMemo(() => new Date(), []);

  const { fillPercent, plannedMinutes, freeMinutes } = useMemo(() => {
    const filledSlots = blocks.reduce((sum, b) => sum + b.durationSlots, 0);
    const fillPercent = Math.min(100, Math.round((filledSlots / 96) * 100));
    const plannedMinutes = filledSlots * 15;
    const freeMinutes = Math.max(0, 24 * 60 - plannedMinutes);
    return { fillPercent, plannedMinutes, freeMinutes };
  }, [blocks]);

  const barColor =
    fillPercent < 50
      ? "from-indigo-500 to-violet-500"
      : fillPercent < 80
        ? "from-violet-500 to-fuchsia-500"
        : "from-fuchsia-500 to-rose-500";

  return (
    <div className="mx-3 my-3">
      <div className="rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/60 px-4 pt-3.5 pb-4 shadow-lg shadow-black/30">

        {/* Date + percentage row */}
        <div className="flex items-start justify-between mb-1.5">
          <div>
            <p className="text-[13px] font-semibold text-zinc-300 tracking-tight">
              {formatUzbekDate(today)}
            </p>
            <div className="mt-0.5">
              <SyncBadge status={syncStatus} />
            </div>
          </div>

          <p
            className="text-2xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            <AnimatedNumber value={fillPercent} suffix="%" />
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden mb-3.5">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
          {fillPercent > 0 && (
            <motion.div
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ left: "-2rem" }}
              animate={{ left: `${fillPercent}%` }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </div>

        {/* Stats row */}
        <div className="flex justify-around">
          <StatChip label="Rejalashtirilgan" value={formatDuration(plannedMinutes)} accent />
          <div className="w-px bg-zinc-800" />
          <StatChip label="Bo'sh vaqt" value={formatDuration(freeMinutes)} />
          <div className="w-px bg-zinc-800" />
          <StatChip label="Bloklar" value={String(blocks.length)} />
        </div>
      </div>
    </div>
  );
}
