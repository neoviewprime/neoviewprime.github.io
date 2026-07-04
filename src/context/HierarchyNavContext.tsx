import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type BackHandler = () => void;

interface HierarchyNavContextValue {
  canGoBack: boolean;
  showBack: (show: boolean) => void;
  setBackHandler: (handler: BackHandler | null) => void;
  triggerBack: () => void;
}

const HierarchyNavContext = createContext<HierarchyNavContextValue | null>(null);

export function HierarchyNavProvider({ children }: { children: React.ReactNode }) {
  const [canGoBack, setCanGoBack] = useState(false);
  const backHandlerRef = useRef<BackHandler | null>(null);

  const showBack = useCallback((show: boolean) => setCanGoBack(show), []);
  const setBackHandler = useCallback((handler: BackHandler | null) => {
    backHandlerRef.current = handler;
  }, []);
  const triggerBack = useCallback(() => {
    backHandlerRef.current?.();
  }, []);

  return (
    <HierarchyNavContext.Provider value={{ canGoBack, showBack, setBackHandler, triggerBack }}>
      {children}
    </HierarchyNavContext.Provider>
  );
}

export function useHierarchyNav() {
  const ctx = useContext(HierarchyNavContext);
  if (!ctx) throw new Error('useHierarchyNav must be used within HierarchyNavProvider');
  return ctx;
}