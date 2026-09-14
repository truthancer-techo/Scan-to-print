import React from 'react';
import { PhotoCollage } from '../../types';

interface PhotoCollageSelectorProps {
  selected: PhotoCollage;
  onChange: (collage: PhotoCollage) => void;
}

interface CollageOption {
  id: PhotoCollage;
  label: string;
  description: string;
  gridCols: number;
  cells: number;
}

const COLLAGE_OPTIONS: CollageOption[] = [
  { id: 'Original', label: 'Original', description: 'One image', gridCols: 1, cells: 1 },
  { id: '2/page', label: '2/page', description: 'Two photos', gridCols: 2, cells: 2 },
  { id: '4/page', label: '4/page', description: 'Grid sheet', gridCols: 2, cells: 4 },
  { id: '6/page', label: '6/page', description: 'Compact', gridCols: 3, cells: 6 },
  { id: '9/page', label: '9/page', description: '3 × 3 grid', gridCols: 3, cells: 9 },
  { id: '12/page', label: '12/page', description: 'ID sheet', gridCols: 3, cells: 12 },
  { id: '16/page', label: '16/page', description: 'Contact sheet', gridCols: 4, cells: 16 },
];

export const PhotoCollageSelector: React.FC<PhotoCollageSelectorProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
          Photo Collage (Multiple per Sheet)
        </label>
        <span className="text-[11px] text-orange-400 font-semibold">Smart Sheet Fitting</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {COLLAGE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/15 text-white ring-1 ring-orange-500/40 shadow-sm'
                  : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
              }`}
            >
              {/* Mini visual representation of grid layout */}
              <div className="w-10 h-10 mb-2 rounded bg-[#070e1c] border border-blue-900/50 p-0.5 flex items-center justify-center overflow-hidden">
                <div
                  className="w-full h-full grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${opt.gridCols}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: Math.min(opt.cells, 9) }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-[1px] ${
                        isSelected ? 'bg-orange-500' : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="font-bold text-xs">{opt.label}</div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                {opt.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
