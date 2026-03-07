import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface DarkModeContextValue {
  isDark: boolean;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored !== null ? stored === 'true' : true; // default dark
  });

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDark));
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ isDark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const ctx = useContext(DarkModeContext);
  if (!ctx) throw new Error('useDarkMode must be used within DarkModeProvider');
  return ctx;
}
