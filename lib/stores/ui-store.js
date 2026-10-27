"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * UI-only state (never database data). Imported by client components only;
 * `persist` keeps the sidebar preference across reloads via localStorage.
 */
export const useUiStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      mobileNavOpen: false,
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

      /** Task drawer selection (used from Phase 5 on). */
      selectedTaskId: null,
      openTask: (id) => set({ selectedTaskId: id }),
      closeTask: () => set({ selectedTaskId: null }),
    }),
    {
      name: "flowdesk-ui",
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
