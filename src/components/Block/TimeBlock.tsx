import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Block } from "@/types";
import { hexToRgba, getTextColor } from "@/utils/color";

const SLOT_HEIGHT = 16;

interface TimeBlockProps {
  block: Block;
  onRemove?: (id: string) => void;
  onClick?: () => void;
}

export default function TimeBlock({ block, onRemove, onClick }: TimeBlockProps) {
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const height = block.durationSlots * SLOT_HEIGHT;
  const bgColor = hexToRgba(block.color, 0.85);
  const shadowColor = hexToRgba(block.color, 0.35);
  const textColor = getTextColor(block.color);
  const showName = block.durationSlots >= 2;
  const isRepeat = block.id.includes("__repeat__");

  function handleLongPressStart() {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function handleTap() {
    if (showActions) {
      setShowActions(false);
      return;
    }
    onClick?.();
  }

  return (
    <>
      <AnimatePresence>
        {showActions && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/40"
            onClick={() => setShowActions(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        style={{
          height,
          backgroundColor: bgColor,
          boxShadow: `0 4px 20px ${shadowColor}, 0 1px 4px ${shadowColor}`,
          color: textColor,
          position: "relative",
          zIndex: showActions ? 30 : 10,
        }}
        className="rounded-xl backdrop-blur-md px-2 py-1 flex items-center gap-1.5 overflow-visible cursor-pointer select-none w-full"
        whileTap={{ scale: showActions ? 1 : 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={handleTap}
        onPointerDown={handleLongPressStart}
        onPointerUp={handleLongPressEnd}
        onPointerLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
      >
        <span className="text-sm leading-none flex-shrink-0">{block.emoji}</span>
        {showName && (
          <span className="text-xs font-semibold truncate leading-none flex-1">
            {block.name}
          </span>
        )}
        {isRepeat && showName && (
          <span className="text-[9px] opacity-60 flex-shrink-0">↻</span>
        )}

        {/* Action tugmalar */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 z-40"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onRemove?.(block.id);
                  setShowActions(false);
                }}
                className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
              >
                <span className="text-white text-xs font-bold">✕</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
