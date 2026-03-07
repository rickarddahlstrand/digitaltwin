import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useCesium } from '../context/CesiumContext';
import { getAllBuildings, type BuildingRecord } from '../lib/pocketbase';

export default function BuildingSearch() {
  const { viewerRef, isReady } = useCesium();
  const [query, setQuery] = useState('');
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [results, setResults] = useState<BuildingRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load buildings once viewer is ready
  useEffect(() => {
    if (isReady) {
      getAllBuildings('getAllBuildings-search').then(setBuildings);
    }
  }, [isReady]);

  // Filter on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const filtered = buildings
      .filter((b) => b.custom_name && b.latitude && b.longitude)
      .filter((b) => b.custom_name.toLowerCase().includes(q))
      .slice(0, 8);
    setResults(filtered);
    setOpen(filtered.length > 0);
    setSelected(-1);
  }, [query, buildings]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const flyTo = useCallback((building: BuildingRecord) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const target = Cesium.Cartesian3.fromDegrees(building.longitude, building.latitude, 0);
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 1), {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-45),
        400,
      ),
      duration: 1.5,
    });

    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }, [viewerRef]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selected >= 0 && results[selected]) {
      flyTo(results[selected]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  if (!isReady) return null;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Sök fastighet..."
          className="w-full pl-7 pr-6 py-1.5 rounded-lg text-xs text-white
            bg-black/60 backdrop-blur-xl border border-white/[0.08]
            outline-none focus:border-white/20
            placeholder:text-white/30 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5
              text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg overflow-hidden
          bg-black/80 backdrop-blur-xl border border-white/[0.08]
          shadow-xl shadow-black/40 z-20">
          {results.map((b, i) => (
            <button
              key={b.id}
              onClick={() => flyTo(b)}
              onMouseEnter={() => setSelected(i)}
              className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors
                ${i === selected
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/[0.06]'
                }`}
            >
              <div className="font-medium truncate">{b.custom_name}</div>
              {b.categories?.length > 0 && (
                <div className="text-[10px] text-white/30 truncate">
                  {b.categories.join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
