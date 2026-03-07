import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../utils/animations';

export default function HudStatus({ status }) {
  return (
    <div className="absolute bottom-10 right-4 z-10 pointer-events-none text-right">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-blue-200/70
            drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
        >
          {status}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
