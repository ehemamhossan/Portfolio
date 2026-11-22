import { ChevronDown, ChevronUp, Pause, Play } from 'lucide-react';
import type { CameraPreset } from '../utils/portfolioLogic';

interface SceneDockProps {
  preset: CameraPreset;
  onPresetChange: (preset: CameraPreset) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  scrollProgress: number;
}

const PRESETS: Array<{ id: CameraPreset; label: string }> = [
  { id: 'overview', label: 'Global Network' },
  { id: 'network', label: 'Connection Arcs' },
  { id: 'precision', label: 'Talent Core' },
];

export default function SceneDock({
  preset,
  onPresetChange,
  autoRotate,
  onToggleAutoRotate,
  collapsed,
  onToggleCollapsed,
  scrollProgress,
}: SceneDockProps) {
  const percent = Math.round(scrollProgress * 100);

  return (
    <aside
      aria-label="3D Scene Controls"
      className="fixed bottom-4 right-6 z-20 hidden md:flex flex-col items-end"
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        className="btn-tactile mb-1.5 inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-[#0D111A]/95 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer whitespace-nowrap"
      >
        {collapsed ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            <span>Show 3D Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            <span>Hide 3D Controls</span>
          </>
        )}
      </button>

      {!collapsed && (
        <div className="flex items-center gap-4 rounded-xl border border-white/15 bg-[#0D111A]/95 px-4 py-2 shadow-2xl">
          <div role="group" aria-label="3D Camera View" className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
            {PRESETS.map((item) => {
              const active = preset === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPresetChange(item.id)}
                  aria-pressed={active}
                  className={`btn-tactile whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-white/15" aria-hidden="true" />

          <button
            type="button"
            onClick={onToggleAutoRotate}
            aria-pressed={autoRotate}
            className="btn-tactile inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{autoRotate ? 'Pause Spin' : 'Resume Spin'}</span>
          </button>

          <div className="h-5 w-px bg-white/15" aria-hidden="true" />

          <span className="font-mono-tabular text-xs text-slate-400 whitespace-nowrap">
            Scroll {percent}%
          </span>
        </div>
      )}
    </aside>
  );
}
