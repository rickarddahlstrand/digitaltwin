import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

export default function DarkModeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      onClick={toggle}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10
        w-10 h-10 rounded-full
        bg-black/60 dark:bg-black/60 bg-white/70
        backdrop-blur-lg
        border border-white/15 dark:border-white/15 border-black/10
        flex items-center justify-center
        cursor-pointer hover:scale-110 transition-transform"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={18} className="text-blue-300" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={18} className="text-yellow-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
