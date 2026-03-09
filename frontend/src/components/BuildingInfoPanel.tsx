import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Save, Loader2, Check, FileSpreadsheet } from 'lucide-react';
import { dropExit } from '../utils/animations';
import { useBuildingData } from '../hooks/useBuildingData';
import CategoryInput from './CategoryInput';
import type { BuildingInfo } from '../hooks/useBuildingClick';
import type { BrfRow } from '../utils/csvParser';

interface BuildingInfoPanelProps {
  info: BuildingInfo | null;
  onClose: () => void;
  onSaved?: () => void;
  getBrfForBuilding?: (customName: string, address?: string) => BrfRow | null;
  brfFields?: { key: string; label: string }[];
}

export default function BuildingInfoPanel({ info, onClose, onSaved, getBrfForBuilding, brfFields }: BuildingInfoPanelProps) {
  const { savedData, loading, saving, save, allCategories } = useBuildingData(info);

  // Look up BRF row using savedData (correct custom_name) when available
  const brfRow = getBrfForBuilding
    ? getBrfForBuilding(
        savedData?.custom_name || info?.name || '',
        savedData?.metadata?.address || info?.address,
      )
    : null;
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (savedData) {
      setCustomName(savedData.custom_name || '');
      setNotes(savedData.notes || '');
      setCategories(Array.isArray(savedData.categories) ? savedData.categories : []);
    } else if (info) {
      setCustomName('');
      setNotes('');
      setCategories([]);
    }
  }, [savedData, info?.osmId]);

  const handleSave = async () => {
    await save({ customName, notes, categories });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    onSaved?.();
  };

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          key="building-info"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          {...dropExit}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-x-2 top-2 z-10 sm:inset-x-auto sm:top-28 sm:right-4 sm:w-[320px]
            max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)]
            overflow-y-auto rounded-xl text-sm
            bg-slate-900/95 sm:bg-slate-900/85 backdrop-blur-xl
            border border-white/[0.08]
            text-white/90 shadow-xl shadow-black/30"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
            border-b border-white/[0.08] bg-white/[0.04]">
            <span className="text-[15px] font-bold text-white">
              {savedData?.custom_name || savedData?.property_name || info.name}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X size={16} className="text-white/50 hover:text-white" />
            </button>
          </div>

          {/* Fastighet & Adress */}
          {(savedData?.property_name || savedData?.metadata?.address) && (
            <div className="px-4 py-2 space-y-0.5 border-b border-white/[0.08] bg-white/[0.02]">
              {savedData?.property_name && (
                <p className="text-xs text-white/60">
                  <span className="text-white/40">Fastighet: </span>
                  {savedData.property_name}
                </p>
              )}
              {savedData?.metadata?.address && (
                <p className="text-xs text-white/60">
                  <span className="text-white/40">Adress: </span>
                  {savedData.metadata.address}
                </p>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-4 pt-3 space-y-2.5">
            {/* Editable name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Eget namn</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={info.name}
                className="w-full px-3 py-2 rounded-lg text-sm text-white
                  bg-white/[0.06] border border-white/[0.08]
                  outline-none focus:border-blue-400/50 focus:bg-white/[0.08]
                  placeholder:text-white/25 transition-colors"
              />
            </div>

            {/* Categories */}
            <CategoryInput
              value={categories}
              onChange={setCategories}
              allCategories={allCategories}
            />

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Anteckningar</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Skriv anteckningar om byggnaden..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none
                  bg-white/[0.06] border border-white/[0.08]
                  outline-none focus:border-blue-400/50 focus:bg-white/[0.08]
                  placeholder:text-white/25 transition-colors"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center justify-center gap-1.5 flex-1 py-1.5 rounded-lg
                  text-xs font-semibold transition-all
                  bg-blue-500/25 hover:bg-blue-500/35 text-blue-300
                  border border-blue-400/20
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : justSaved ? (
                  <Check size={12} />
                ) : (
                  <Save size={12} />
                )}
                {saving ? 'Sparar...' : justSaved ? 'Sparat' : 'Spara'}
              </button>

            </div>

            {/* BRF data rows */}
            {brfRow && brfFields && brfFields.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet size={11} className="text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400/70">Fastighetsdata</span>
                </div>
                {brfFields.map((f) => {
                  const val = brfRow[f.key];
                  if (val === undefined || val === '') return null;
                  return (
                    <div
                      key={f.key}
                      className="flex justify-between items-baseline px-3 py-2
                        rounded-lg bg-emerald-500/[0.06] border border-emerald-400/[0.08]"
                    >
                      <span className="text-xs text-emerald-300/50">{f.label}</span>
                      <span className="font-medium text-white/90 text-right max-w-[60%] break-words">
                        {String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Property rows */}
            <div className="pt-1.5 space-y-1">
              <span className="text-xs font-medium text-white/50">Egenskaper</span>
              {info.rows.map((row, i) => (
                <div
                  key={i}
                  className="flex justify-between items-baseline px-3 py-2
                    rounded-lg bg-white/[0.04]"
                >
                  <span className="text-xs text-white/40">{row.label}</span>
                  <span className="font-medium text-white/90 text-right max-w-[60%] break-words">
                    {String(row.value)}
                  </span>
                </div>
              ))}
            </div>

            {info.osmLink && (
              <a
                href={info.osmLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 mt-2 pt-2.5
                  border-t border-white/[0.08]
                  text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                <ExternalLink size={12} />
                Visa på OpenStreetMap
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
