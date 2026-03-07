import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusToastProps {
  message: string;
  duration?: number;
}

export default function StatusToast({ message, duration = 3000 }: StatusToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="px-4 py-2 rounded-lg text-xs text-white/80
              bg-black/50 backdrop-blur-md border border-white/[0.08]"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
