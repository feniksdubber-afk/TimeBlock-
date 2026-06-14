import { useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import TimeGrid from "@/components/Grid/TimeGrid";
import DayHeader from "@/components/Header/DayHeader";
import CreateBlockModal from "@/components/Modal/CreateBlockModal";
import EditBlockModal from "@/components/Modal/EditBlockModal";
import WeekCalendar from "@/components/Calendar/WeekCalendar";
import { useBlocks } from "@/hooks/useBlocks";
import { Block } from "@/types";

const queryClient = new QueryClient();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function Home() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  const { blocks, loading, addBlock, updateBlocks, removeBlock, editBlock } =
    useBlocks(selectedDate);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col w-full"
      style={{
        height: "100dvh",
        backgroundColor: "#0f0f0f",
        paddingBottom: "env(safe-area-inset-bottom)",
        overflow: "hidden",
      }}
    >
      <DayHeader blocks={blocks} syncStatus="idle" selectedDate={selectedDate} />
      <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="flex-1 relative min-h-0">
        <TimeGrid
          blocks={blocks}
          onBlocksChange={updateBlocks}
          onRemoveBlock={removeBlock}
          onEditBlock={setEditingBlock}
        />
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-5 z-30 w-14 h-14 rounded-full bg-indigo-600 shadow-lg shadow-indigo-900/60 flex items-center justify-center text-white text-3xl font-light select-none"
        style={{ touchAction: "manipulation", marginBottom: "env(safe-area-inset-bottom)" }}
      >
        +
      </motion.button>

      <CreateBlockModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={addBlock}
        date={selectedDate}
      />

      <EditBlockModal
        block={editingBlock}
        isOpen={editingBlock !== null}
        onClose={() => setEditingBlock(null)}
        onSave={editBlock}
        onDelete={(id) => {
          removeBlock(id);
          setEditingBlock(null);
        }}
      />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1c1c1e",
              color: "#f4f4f5",
              border: "1px solid #3f3f46",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
