import React from 'react';
import { Volume2, VolumeX, Sparkles, HelpCircle } from 'lucide-react';
import { sounds } from '../utils/sound';

export type ActiveTool = 'list' | 'roulette' | 'ladder' | 'lotto' | 'number';

interface NavigationProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onOpenHelp?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTool,
  setActiveTool,
  isMuted,
  setIsMuted,
  onOpenHelp,
}) => {
  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sounds.playTick(1000);
    }
  };

  const navItems: { id: ActiveTool; label: string }[] = [
    { id: 'list', label: '목록 추첨기' },
    { id: 'roulette', label: '룰렛 돌림판' },
    { id: 'ladder', label: '사다리 타기' },
    { id: 'lotto', label: '로또 6/45' },
    { id: 'number', label: '난수 / 주사위' },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, single line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-[1px] flex items-center justify-center shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#0b0f19] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
            결정의 순간
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1">
          {navItems.map((item) => {
            const isActive = activeTool === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTool(item.id);
                  sounds.playTick(700);
                }}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 font-semibold shadow-inner border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              title="도움말 및 빠른 사용법"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? '음소거 해제' : '음소거'}
            title={isMuted ? '소리 켜기' : '소리 끄기'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
              isMuted
                ? 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">소리 끔</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">소리 켬</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile sub-navigation tabs */}
      <div className="flex md:hidden items-center gap-1 px-4 py-2 overflow-x-auto border-t border-slate-800/50 bg-[#090d16]">
        {navItems.map((item) => {
          const isActive = activeTool === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTool(item.id);
                sounds.playTick(700);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
