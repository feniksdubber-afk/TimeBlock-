export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

// Simplified sync hook - no Supabase dependency for now
export function useSync() {
  return {
    syncStatus: "idle" as SyncStatus,
  };
}
