"use client";

import { useProjectKeyStore } from "@/store/projectKeyStore";

export function useProjectKey(projectId: string) {
  const setKey = useProjectKeyStore((state) => state.setKey);
  const clearKey = useProjectKeyStore((state) => state.clearKey);
  const key = useProjectKeyStore((state) => state.unlockedKeys[projectId] ?? null);

  return {
    projectKey: key,
    isUnlocked: Boolean(key),
    unlock: (value: string) => setKey(projectId, value),
    lock: () => clearKey(projectId),
  };
}
