"use client";

import { create } from "zustand";

interface ProjectKeyState {
  unlockedKeys: Record<string, string>;
  setKey: (projectId: string, projectKey: string) => void;
  getKey: (projectId: string) => string | null;
  clearKey: (projectId: string) => void;
  clearAll: () => void;
}

export const useProjectKeyStore = create<ProjectKeyState>((set, get) => ({
  unlockedKeys: {},
  setKey: (projectId, projectKey) =>
    set((state) => ({
      unlockedKeys: {
        ...state.unlockedKeys,
        [projectId]: projectKey,
      },
    })),
  getKey: (projectId) => get().unlockedKeys[projectId] ?? null,
  clearKey: (projectId) =>
    set((state) => {
      const next = { ...state.unlockedKeys };
      delete next[projectId];
      return { unlockedKeys: next };
    }),
  clearAll: () => set({ unlockedKeys: {} }),
}));
