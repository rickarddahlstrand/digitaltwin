import { motion } from 'framer-motion';
import { Building2, Layers, Zap } from 'lucide-react';
import { slideInLeft, staggerContainer, staggerItem } from '../utils/animations';

interface POIControls {
  categories: string[];
  isShowingAll: () => boolean;
  showAllBuildings: () => void;
  isCategoryActive: (cat: string) => boolean;
  toggleCategory: (cat: string) => void;
}

interface EnergyControls {
  toggle: () => void;
  active: boolean;
}

interface LayerPanelProps {
  poiControls: POIControls;
  energyControls?: EnergyControls;
}

export default function LayerPanel({ poiControls, energyControls }: LayerPanelProps) {
  const categories = poiControls?.categories || [];
  const showingAll = poiControls?.isShowingAll() ?? true;

  return (
    <motion.div
      {...slideInLeft}
      className="bg-black/70 backdrop-blur-xl
        border border-white/[0.08]
        rounded-xl px-3 py-2
        text-white shadow-xl shadow-black/30"
    >
      <h3 className="text-[10px] font-bold mb-1.5 text-white/50 tracking-wider uppercase">
        Lager
      </h3>
      <motion.div {...staggerContainer} animate="animate" initial="initial" className="space-y-px">
        {/* Alla byggnader */}
        <motion.div variants={staggerItem}>
          <label className="flex items-center gap-2 text-[11px] py-0.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showingAll}
              onChange={() => poiControls?.showAllBuildings()}
              className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
            />
            <Building2 size={11} className="text-blue-400" />
            <span className="font-medium">Alla byggnader</span>
          </label>
        </motion.div>

        {/* Category filters */}
        {categories.map((cat) => (
          <motion.div key={cat} variants={staggerItem}>
            <label className="flex items-center gap-2 text-[11px] py-0.5 cursor-pointer select-none
              text-white/60 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={poiControls?.isCategoryActive(cat) ?? false}
                onChange={() => poiControls?.toggleCategory(cat)}
                className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
              />
              <Layers size={10} className="text-blue-400/60" />
              {cat}
            </label>
          </motion.div>
        ))}
      </motion.div>

      {energyControls && (
        <>
          <div className="border-t border-white/[0.08] mt-2 pt-2">
            <label className="flex items-center gap-2 text-[11px] py-0.5 cursor-pointer select-none
              text-white/60 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={energyControls.active}
                onChange={() => energyControls.toggle()}
                className="w-3.5 h-3.5 accent-green-500 cursor-pointer"
              />
              <Zap size={11} className="text-green-400" />
              <span className="font-medium">Delning av energi</span>
            </label>
          </div>
        </>
      )}
    </motion.div>
  );
}
