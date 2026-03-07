import { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function CategoryInput({ value = [], onChange, allCategories = [] }) {
  const [newCat, setNewCat] = useState('');

  const available = allCategories.filter((c) => !value.includes(c));

  const add = (cat) => {
    const trimmed = cat.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setNewCat('');
  };

  const remove = (cat) => {
    onChange(value.filter((c) => c !== cat));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && newCat.trim()) {
      e.preventDefault();
      add(newCat);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/50">Kategorier</label>

      {/* Selected categories */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                bg-blue-500/20 text-blue-300 border border-blue-400/20"
            >
              {cat}
              <button
                onClick={() => remove(cat)}
                className="text-blue-300/50 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available categories to pick from */}
      {available.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Tillgängliga</span>
          <div className="flex flex-wrap gap-1.5">
            {available.map((cat) => (
              <button
                key={cat}
                onClick={() => add(cat)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs
                  bg-white/[0.05] text-white/50 border border-white/[0.08]
                  hover:bg-blue-500/15 hover:text-blue-300 hover:border-blue-400/20
                  transition-all"
              >
                <Plus size={10} />
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create new category */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ny kategori..."
          className="flex-1 px-3 py-1.5 rounded-lg text-xs text-white
            bg-white/[0.06] border border-white/[0.08]
            outline-none focus:border-blue-400/50 focus:bg-white/[0.08]
            placeholder:text-white/25 transition-colors"
        />
        {newCat.trim() && (
          <button
            onClick={() => add(newCat)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium
              bg-blue-500/20 text-blue-300 border border-blue-400/20
              hover:bg-blue-500/30 transition-colors"
          >
            Lägg till
          </button>
        )}
      </div>
    </div>
  );
}
