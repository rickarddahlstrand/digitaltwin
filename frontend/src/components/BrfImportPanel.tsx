import { useState, useRef, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, X, CheckCircle, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';
import { slideInLeft } from '../utils/animations';
import type { MatchResult } from '../utils/brfMatcher';
import type { BrfDataState } from '../hooks/useBrfData';
import type { BuildingRecord } from '../lib/pocketbase';

interface BrfImportPanelProps {
  open: boolean;
  onClose: () => void;
  onImport: (csvText: string, buildings: BuildingRecord[]) => BrfDataState | null;
  buildings: BuildingRecord[];
  numericFields: { index: number; key: string; label: string }[];
  colorField: string;
  onColorFieldChange: (field: string) => void;
  onImported?: () => void;
}

const STATUS_ICON = {
  exact: <CheckCircle size={12} className="text-green-400" />,
  partial: <AlertTriangle size={12} className="text-yellow-400" />,
  none: <XCircle size={12} className="text-red-400/60" />,
};

export default function BrfImportPanel({
  open,
  onClose,
  onImport,
  buildings,
  numericFields,
  colorField,
  onColorFieldChange,
  onImported,
}: BrfImportPanelProps) {
  const [preview, setPreview] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [csvText, setCsvText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      doPreview(text);
    };
    reader.onerror = () => setError('Kunde inte läsa filen.');
    reader.readAsText(file, 'utf-8');
  };

  const doPreview = (text: string) => {
    const result = onImport(text, buildings);
    if (!result) {
      setError('Ingen namnkolumn hittades i CSV-filen. Kontrollera att det finns en kolumn med "Namn" eller "BRF".');
      setPreview(null);
      return;
    }
    setPreview(result.matches);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    if (!csvText) return;
    onImport(csvText, buildings);
    setPreview(null);
    setCsvText('');
    onImported?.();
    onClose();
  };

  const handleCancel = () => {
    setPreview(null);
    setCsvText('');
    setError('');
    onClose();
  };

  const downloadExampleCSV = () => {
    const a = document.createElement('a');
    a.href = '/exempel-fastigheter.csv';
    a.download = 'exempel-fastigheter.csv';
    a.click();
  };

  const matched = preview?.filter((m) => m.confidence !== 'none').length ?? 0;
  const total = preview?.length ?? 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...slideInLeft}
          className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-20
            w-[calc(100vw-1rem)] sm:w-[340px]
            max-h-[calc(100vh-2rem)] overflow-y-auto
            bg-black/80 backdrop-blur-xl
            border border-white/[0.08]
            rounded-xl text-white shadow-xl shadow-black/30"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={14} className="text-emerald-400" />
              <span className="text-sm font-bold">Importera fastighetsdata</span>
            </div>
            <button onClick={handleCancel} className="p-1 rounded-md hover:bg-white/10 transition-colors">
              <X size={14} className="text-white/50" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Drop zone */}
            {!preview && (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 py-6 rounded-lg
                    border-2 border-dashed cursor-pointer transition-colors
                    ${dragging
                      ? 'border-emerald-400/50 bg-emerald-500/10'
                      : 'border-white/[0.12] hover:border-white/[0.2] hover:bg-white/[0.03]'
                    }`}
                >
                  <Upload size={20} className="text-white/30" />
                  <span className="text-xs text-white/40">
                    Dra en CSV-fil hit eller klicka för att välja
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadExampleCSV(); }}
                  className="flex items-center gap-1.5 text-[11px] text-white/40
                    hover:text-emerald-300 transition-colors"
                >
                  <Download size={11} />
                  Ladda ner exempel-CSV (fastigheter i Hammarby Sjöstad)
                </button>
              </>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Match preview */}
            {preview && (
              <>
                <div className="text-xs text-white/50">
                  <span className="text-white font-medium">{matched}</span> av{' '}
                  <span className="text-white font-medium">{total}</span> BRFer matchade
                </div>

                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {preview.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] text-xs"
                    >
                      {STATUS_ICON[m.confidence]}
                      <span className="flex-1 truncate text-white/80">{m.brfRow.name}</span>
                      {m.building && (
                        <span className="text-white/30 truncate max-w-[40%]">
                          → {m.building.custom_name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Color field selector */}
                {numericFields.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs text-white/50">Färglägg efter</label>
                    <select
                      value={colorField}
                      onChange={(e) => onColorFieldChange(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs text-white
                        bg-white/[0.06] border border-white/[0.08]
                        outline-none focus:border-emerald-400/50 transition-colors"
                    >
                      {numericFields.map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleConfirm}
                    disabled={matched === 0}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
                      bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300
                      border border-emerald-400/20
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Importera ({matched})
                  </button>
                  <button
                    onClick={handleCancel}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold transition-all
                      bg-white/[0.06] hover:bg-white/[0.1] text-white/60
                      border border-white/[0.08]"
                  >
                    Avbryt
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
