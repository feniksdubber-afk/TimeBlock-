import { useMemo } from "react";
import { motion } from "framer-motion";

const UZ_DAYS_SHORT = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
const UZ_MONTHS_SHORT = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];

interface WeekCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function toStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function WeekCalendar({ selectedDate, onSelectDate }: WeekCalendarProps) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // FIX: todayStr dependency — har kun o'zgarishi mumkin, shu sababli har render qayta hisoblash to'g'ri
  const days = useMemo(() => {
    const today = new Date(todayStr + "T00:00:00");
    const result: Date[] = [];
    for (let i = -3; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      result.push(d);
    }
    return result;
  }, [todayStr]);

  return (
    <div className="px-3 pb-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {days.map((day) => {
          const str = toStr(day);
          const isSelected = str === selectedDate;
          const isToday = str === todayStr;

          return (
            <motion.button
              key={str}
              whileTap={{ scale: 0.92 }}
              onClick={() => onSelectDate(str)}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-2xl transition-colors"
              style={{
                backgroundColor: isSelected
                  ? "#6366f1"
                  : isToday
                  ? "rgba(99,102,241,0.15)"
                  : "rgba(255,255,255,0.04)",
                minWidth: 44,
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: isSelected ? "#c7d2fe" : "#71717a" }}
              >
                {UZ_DAYS_SHORT[day.getDay()]}
              </span>
              <span
                className="text-base font-bold leading-none"
                style={{ color: isSelected ? "#fff" : isToday ? "#818cf8" : "#e4e4e7" }}
              >
                {day.getDate()}
              </span>
              <span
                className="text-[9px]"
                style={{ color: isSelected ? "#c7d2fe" : "#52525b" }}
              >
                {UZ_MONTHS_SHORT[day.getMonth()]}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
