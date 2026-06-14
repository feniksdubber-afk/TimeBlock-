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
import { useBlocks } from "@/hooks/useBlocks";
import { useSync } from "@/hooks/useSync";

const queryClient = new QueryClient();

function Home() {
  const { syncStatus } = useSync();
  const { blocks, loading, addBlock, updateBlocks } = useBlocks();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0f0f0f] flex flex-col relative">
      <DayHeader blocks={blocks} syncStatus={syncStatus} />
      <TimeGrid blocks={blocks} onBlocksChange={updateBlocks} />

      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-5 z-30 w-14 h-14 rounded-full bg-indigo-600 shadow-lg shadow-indigo-900/60 flex items-center justify-center text-white text-3xl font-light select-none"
        style={{ touchAction: "manipulation" }}
      >
        +
      </motion.button>

      <CreateBlockModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addBlock}
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
