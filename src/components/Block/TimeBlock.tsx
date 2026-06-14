import { motion } from "framer-motion";
import { Block } from "@/types";
import { hexToRgba, getTextColor } from "@/utils/color";

const SLOT_HEIGHT = 14;

interface TimeBlockProps {
  block: Block;
  onClick?: () => void;
}

export default function TimeBlock({ block, onClick }: TimeBlockProps) {
  const height = block.durationSlots * SLOT_HEIGHT;
  const bgColor = hexToRgba(block.color, 0.8);
  const shadowColor = hexToRgba(block.color, 0.35);
  const textColor = getTextColor(block.color);
  const showName = block.durationSlots >= 2;

  return (
    <motion.div
      style={{
        height,
        backgroundColor: bgColor,
        boxShadow: `0 4px 20px ${shadowColor}, 0 1px 4px ${shadowColor}`,
        color: textColor,
      }}
      className="rounded-xl backdrop-blur-md px-2 py-1 flex items-center gap-1.5 overflow-hidden cursor-pointer select-none w-full"
      whileTap={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      <span className="text-sm leading-none flex-shrink-0">{block.emoji}</span>
      {showName && (
        <span className="text-xs font-semibold truncate leading-none">
          {block.name}
        </span>
      )}
    </motion.div>
  );
}
