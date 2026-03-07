export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
} as const;

export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
} as const;

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
} as const;

export const scaleSpring = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
} as const;

export const dropExit = {
  exit: {
    opacity: 0,
    scale: 0.8,
    rotate: 15,
    y: 400,
    transition: { duration: 0.5, ease: 'easeIn' as const },
  },
} as const;

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
} as const;

export const staggerItem = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
} as const;
