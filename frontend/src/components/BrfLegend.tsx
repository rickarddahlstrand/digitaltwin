import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight } from 'lucide-react';
import { fadeIn } from '../utils/animations';
import type { BrfDataState } from '../hooks/useBrfData';

interface BrfLegendProps {
  brfState: BrfDataState;
  onClose: () => void;
  onSetRange: (min?: number, max?: number) => void;
  onSetReversed: (reversed: boolean) => void;
}

export default function BrfLegend({ brfState, onClose, onSetRange, onSetReversed }: BrfLegendProps) {
  const { matches, colorField, fields, colorReversed } = brfState;
  const [editing, setEditing] = useState(false);

  const fieldMeta = fields.find((f) => f.key === colorField);
  const label = fieldMeta?.label || colorField;

  // Compute data min/max
  const values: number[] = [];
  for (const m of matches) {
    const v = m.brfRow[colorField];
    if (typeof v === 'number') values.push(v);
  }
  if (values.length === 0) return null;

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const activeMin = brfState.colorMin ?? dataMin;
  const activeMax = brfState.colorMax ?? dataMax;

  const gradientDir = colorReversed ? 'to left' : 'to right';

  const [editMin, setEditMin] = useState(String(Math.round(activeMin)));
  const [editMax, setEditMax] = useState(String(Math.round(activeMax)));

  const handleOpen = () => {
    setEditMin(String(Math.round(activeMin)));
    setEditMax(String(Math.round(activeMax)));
    setEditing(true);
  };

  const handleApply = () => {
    const newMin = parseFloat(editMin);
    const newMax = parseFloat(editMax);
    if (!isNaN(newMin) && !isNaN(newMax) && newMin < newMax) {
      onSetRange(newMin, newMax);
    }
    setEditing(false);
  };

  const handleReset = () => {
    onSetRange(undefined, undefined);
    setEditMin(String(Math.round(dataMin)));
    setEditMax(String(Math.round(dataMax)));
    setEditing(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        {...fadeIn}
        className="absolute bottom-14 right-2 sm:bottom-20 sm:right-4 z-10
          bg-black/70 backdrop-blur-xl
          border border-white/[0.08]
          rounded-xl px-3 py-2.5
          text-white shadow-xl shadow-black/30
          min-w-[160px]"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
            {label}
          </span>
          <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 transition-colors">
            <X size={10} className="text-white/40" />
          </button>
        </div>

        {/* Gradient bar — clickable */}
        <button
          onClick={editing ? undefined : handleOpen}
          className="w-full h-3 rounded-full cursor-pointer hover:ring-1 hover:ring-white/30 transition-all"
          style={{
            background: `linear-gradient(${gradientDir}, hsl(120,80%,45%), hsl(60,80%,45%), hsl(0,80%,45%))`,
          }}
          title="Klicka för att redigera skalan"
        />

        {/* Labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-white/40">
            {colorReversed ? Math.round(activeMax) : Math.round(activeMin)}
          </span>
          <span className="text-[9px] text-white/40">
            {colorReversed ? Math.round(activeMin) : Math.round(activeMax)}
          </span>
        </div>

        {/* Edit panel */}
        {editing && (
          <div className="mt-2 pt-2 border-t border-white/[0.08] space-y-2">
            <div className="flex gap-2 items-center">
              <div className="flex-1 space-y-0.5">
                <label className="text-[9px] text-white/40">Min</label>
                <input
                  type="number"
                  value={editMin}
                  onChange={(e) => setEditMin(e.target.value)}
                  className="w-full px-2 py-1 rounded text-[11px] text-white
                    bg-white/[0.08] border border-white/[0.1]
                    outline-none focus:border-blue-400/50"
                />
              </div>
              <div className="flex-1 space-y-0.5">
                <label className="text-[9px] text-white/40">Max</label>
                <input
                  type="number"
                  value={editMax}
                  onChange={(e) => setEditMax(e.target.value)}
                  className="w-full px-2 py-1 rounded text-[11px] text-white
                    bg-white/[0.08] border border-white/[0.1]
                    outline-none focus:border-blue-400/50"
                />
              </div>
            </div>

            {/* Reverse toggle */}
            <button
              onClick={() => onSetReversed(!colorReversed)}
              className={`flex items-center gap-1.5 w-full px-2 py-1 rounded text-[10px]
                border transition-colors ${
                  colorReversed
                    ? 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/70'
                }`}
            >
              <ArrowLeftRight size={10} />
              Omvänd skala
            </button>

            {/* Action buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={handleApply}
                className="flex-1 py-1 rounded text-[10px] font-semibold
                  bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300
                  border border-emerald-400/20 transition-colors"
              >
                Tillämpa
              </button>
              <button
                onClick={handleReset}
                className="py-1 px-2 rounded text-[10px]
                  bg-white/[0.06] hover:bg-white/10 text-white/50
                  border border-white/[0.08] transition-colors"
              >
                Återställ
              </button>
              <button
                onClick={() => setEditing(false)}
                className="py-1 px-2 rounded text-[10px]
                  bg-white/[0.06] hover:bg-white/10 text-white/50
                  border border-white/[0.08] transition-colors"
              >
                Stäng
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
