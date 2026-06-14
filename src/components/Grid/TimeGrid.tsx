import { useState, useMemo } from "react";
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
const SLOT_HEIGHT = 14;
const PANEL_SIZE = 48;

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

// ─── Droppable slot ───────────────────────────────────────────────────────────

function DroppableSlot({
  index,
  isOccupied,
}: {
  index: number;
  isOccupied: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` });
  const isHourMark = index % 4 === 0;

  return (
    <div
      ref={setNodeRef}
      style={{ height: SLOT_HEIGHT }}
      className={[
        "w-full box-border transition-colors duration-75",
        !isOccupied
          ? [
              "border-b border-zinc-800/50",
              isHourMark ? "border-t border-t-zinc-700/70" : "",
            ].join(" ")
          : "",
        isOver && !isOccupied ? "bg-white/[0.06]" : "",
        isOver && isOccupied ? "bg-red-500/10" : "",
      ].join(" ")}
    />
  );
}

// ─── Draggable block ──────────────────────────────────────────────────────────

function DraggableBlock({
  block,
  panelStart,
  isActive,
}: {
  block: Block;
  panelStart: number;
  isActive: boolean;
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
        top: (block.startSlot - panelStart) * SLOT_HEIGHT,
        left: 0,
        right: 0,
        zIndex: 10,
        opacity: isActive ? 0 : 1,
        touchAction: "none",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      <TimeBlock block={block} />
    </motion.div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({
  panelStart,
  blocks,
  occupancyMap,
  activeId,
}: {
  panelStart: number;
  blocks: Block[];
  occupancyMap: Map<number, string>;
  activeId: string | null;
}) {
  const slots = useMemo(
    () => Array.from({ length: PANEL_SIZE }, (_, i) => panelStart + i),
    [panelStart],
  );

  const panelBlocks = blocks.filter(
    (b) => b.startSlot >= panelStart && b.startSlot < panelStart + PANEL_SIZE,
  );

  return (
    <div className="flex flex-1 min-w-0">
      {/* Time label column */}
      <div className="w-10 flex-shrink-0 select-none">
        {slots.map((index) => (
          <div
            key={index}
            style={{ height: SLOT_HEIGHT }}
            className="flex items-start justify-end pr-1.5"
          >
            {index % 4 === 0 && (
              <span className="text-[9px] font-medium text-zinc-500 leading-none tracking-tight">
                {formatHourLabel(index)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Slot column */}
      <div
        className="flex-1 min-w-0 relative"
        style={{ height: PANEL_SIZE * SLOT_HEIGHT }}
      >
        {slots.map((index) => (
          <DroppableSlot
            key={index}
            index={index}
            isOccupied={
              occupancyMap.has(index) && occupancyMap.get(index) !== activeId
            }
          />
        ))}

        {panelBlocks.map((block) => (
          <DraggableBlock
            key={block.id}
            block={block}
            panelStart={panelStart}
            isActive={block.id === activeId}
          />
        ))}
      </div>
    </div>
  );
}

// ─── TimeGrid ─────────────────────────────────────────────────────────────────

interface TimeGridProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
}

export default function TimeGrid({ blocks, onBlocksChange }: TimeGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const occupancyMap = useMemo(() => buildOccupancyMap(blocks), [blocks]);

  const activeBlock = useMemo(
    () => (activeId ? blocks.find((b) => b.id === activeId) ?? null : null),
    [activeId, blocks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
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
      toast.error("Bu vaqt band!");
      return;
    }

    const conflicting = Array.from(
      { length: block.durationSlots },
      (_, i) => targetSlot + i,
    ).some((s) => occupancyMap.has(s) && occupancyMap.get(s) !== blockId);

    if (conflicting) {
      toast.error("Bu vaqt band!");
      return;
    }

    onBlocksChange(
      blocks.map((b) =>
        b.id === blockId ? { ...b, startSlot: targetSlot } : b,
      ),
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex w-full bg-[#0f0f0f]"
        style={{ height: SLOT_HEIGHT * PANEL_SIZE }}
      >
        <Panel
          panelStart={0}
          blocks={blocks}
          occupancyMap={occupancyMap}
          activeId={activeId}
        />
        <div className="w-px bg-zinc-800 flex-shrink-0" />
        <Panel
          panelStart={48}
          blocks={blocks}
          occupancyMap={occupancyMap}
          activeId={activeId}
        />
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
            <TimeBlock block={activeBlock} />
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
