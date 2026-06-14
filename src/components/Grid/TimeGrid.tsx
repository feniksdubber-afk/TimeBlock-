import { useState, useMemo, useRef, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  pointerWithin,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Block } from "@/types";
import TimeBlock from "@/components/Block/TimeBlock";
import { hexToRgba } from "@/utils/color";

const TOTAL_SLOTS = 96;
const SLOT_HEIGHT = 16;

function formatHourLabel(slotIndex: number): string {
  const hour = Math.floor(slotIndex / 4);
  return `${String(hour).padStart(2, "0")}:00`;
}

function buildOccupancyMap(blocks: Block[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const block of blocks) {
    for (let i = 0; i < block.durationSlots; i++) {
      const s = block.startSlot + i;
      if (s < TOTAL_SLOTS) map.set(s, block.id);
    }
  }
  return map;
}

function DroppableSlot({ index, isOccupied }: { index: number; isOccupied: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` });
  const isHourMark = index % 4 === 0;
  return (
    <div
      ref={setNodeRef}
      style={{ height: SLOT_HEIGHT }}
      className={[
        "w-full box-border transition-colors duration-75",
        !isOccupied
          ? ["border-b border-zinc-800/50", isHourMark ? "border-t border-t-zinc-700/70" : ""].join(" ")
          : "",
        isOver && !isOccupied ? "bg-white/[0.06]" : "",
        isOver && isOccupied ? "bg-red-500/10" : "",
      ].join(" ")}
    />
  );
}

function DraggableBlock({
  block,
  isActive,
  onRemove,
  onEdit,
}: {
  block: Block;
  isActive: boolean;
  onRemove: (id: string) => void;
  onEdit: (block: Block) => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: block.id });
  return (
    <motion.div
      layout
      layoutId={block.id}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: "absolute",
        top: block.startSlot * SLOT_HEIGHT,
        left: 0,
        right: 0,
        zIndex: 10,
        opacity: isActive ? 0 : 1,
        touchAction: "none",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      <TimeBlock block={block} onRemove={onRemove} onEdit={onEdit} />
    </motion.div>
  );
}

interface TimeGridProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onRemoveBlock: (id: string) => void;
  onEditBlock: (block: Block) => void;
}

export default function TimeGrid({ blocks, onBlocksChange, onRemoveBlock, onEditBlock }: TimeGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    const currentSlot = now.getHours() * 4 + Math.floor(now.getMinutes() / 15);
    const scrollTo = Math.max(0, (currentSlot - 4) * SLOT_HEIGHT);
    if (scrollRef.current) scrollRef.current.scrollTop = scrollTo;
  }, []);

  const occupancyMap = useMemo(() => buildOccupancyMap(blocks), [blocks]);
  const activeBlock = useMemo(
    () => (activeId ? blocks.find((b) => b.id === activeId) ?? null : null),
    [activeId, blocks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const blockId = active.id as string;
    const targetSlot = parseInt(String(over.id).replace("slot-", ""), 10);
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.startSlot === targetSlot) return;
    if (targetSlot < 0 || targetSlot + block.durationSlots > TOTAL_SLOTS) {
      toast.error("Bu vaqt chegaradan tashqarida!");
      return;
    }
    const conflicting = Array.from({ length: block.durationSlots }, (_, i) => targetSlot + i)
      .some((s) => occupancyMap.has(s) && occupancyMap.get(s) !== blockId);
    if (conflicting) {
      toast.error("Bu vaqt band!");
      return;
    }
    onBlocksChange(blocks.map((b) => b.id === blockId ? { ...b, startSlot: targetSlot } : b));
  }

  const slots = useMemo(() => Array.from({ length: TOTAL_SLOTS }, (_, i) => i), []);

  const now = new Date();
  const nowTop = (now.getHours() * 4 + now.getMinutes() / 15) * SLOT_HEIGHT;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={scrollRef}
        className="overflow-y-auto w-full bg-[#0f0f0f]"
        style={{ height: "100%", WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex w-full" style={{ height: TOTAL_SLOTS * SLOT_HEIGHT, position: "relative" }}>
          {/* Vaqt ustuni */}
          <div className="w-10 flex-shrink-0 select-none">
            {slots.map((index) => (
              <div key={index} style={{ height: SLOT_HEIGHT }} className="flex items-start justify-end pr-1.5">
                {index % 4 === 0 && (
                  <span className="text-[9px] font-medium text-zinc-500 leading-none tracking-tight">
                    {formatHourLabel(index)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Bloklar ustuni */}
          <div className="flex-1 min-w-0 relative">
            {/* Joriy vaqt chizig'i */}
            <div style={{ top: nowTop, position: "absolute", left: 0, right: 0, zIndex: 20 }}
              className="pointer-events-none">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400 -ml-1 flex-shrink-0" />
                <div className="flex-1 h-px bg-indigo-400/60" />
              </div>
            </div>

            {slots.map((index) => (
              <DroppableSlot
                key={index}
                index={index}
                isOccupied={occupancyMap.has(index) && occupancyMap.get(index) !== activeId}
              />
            ))}

            {blocks.map((block) => (
              <DraggableBlock
                key={block.id}
                block={block}
                isActive={block.id === activeId}
                onRemove={onRemoveBlock}
                onEdit={onEditBlock}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeBlock && (
          <motion.div
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 1.05, opacity: 1 }}
            style={{
              boxShadow: `0 8px 32px ${hexToRgba(activeBlock.color, 0.5)}`,
              borderRadius: "0.75rem",
              width: "100%",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <TimeBlock block={activeBlock} onRemove={onRemoveBlock} onEdit={onEditBlock} />
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
