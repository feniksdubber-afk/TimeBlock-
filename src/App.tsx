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
import WeekCalendar from "@/components/Calendar/WeekCalendar";
import { useBlocks } from "@/hooks/useBlocks";

const queryClient = new QueryClient();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function Home() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [modalOpen, setModalOpen] = useState(false);
  const { blocks, loading, addBlock, updateBlocks, removeBlock } = useBlocks(selectedDate);

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
      {/* Header */}
      <DayHeader blocks={blocks} syncStatus="idle" selectedDate={selectedDate} />

      {/* Haftalik calendar */}
      <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Grid — qolgan joy */}
      <div className="flex-1 relative min-h-0">
        <TimeGrid
          blocks={blocks}
          onBlocksChange={updateBlocks}
          onRemoveBlock={removeBlock}
        />
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-5 z-30 w-14 h-14 rounded-full bg-indigo-600 shadow-lg shadow-indigo-900/60 flex items-center justify-center text-white text-3xl font-light select-none"
        style={{ touchAction: "manipulation", marginBottom: "env(safe-area-inset-bottom)" }}
      >
        +
      </motion.button>

      <CreateBlockModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addBlock}
        date={selectedDate}
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
