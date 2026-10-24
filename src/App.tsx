import React, { useState } from 'react';
import { Navigation, ActiveTool } from './components/Navigation';
import { ListPicker } from './components/ListPicker';
import { RouletteWheel } from './components/RouletteWheel';
import { LadderGame } from './components/LadderGame';
import { LottoGenerator } from './components/LottoGenerator';
import { RangeNumberPicker } from './components/RangeNumberPicker';
import { HelpModal } from './components/HelpModal';
import { sounds } from './utils/sound';

export default function App() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('list');
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Navigation (Strict 3-zone contract) */}
      <Navigation
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTool === 'list' && <ListPicker />}
        {activeTool === 'roulette' && <RouletteWheel />}
        {activeTool === 'ladder' && <LadderGame />}
        {activeTool === 'lotto' && <LottoGenerator />}
        {activeTool === 'number' && <RangeNumberPicker />}
      </main>

      {/* Clean Unboxed Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-400">결정의 순간</span>
            <span aria-hidden="true">·</span>
            <span>일상적 결정 보조 도구</span>
            <span aria-hidden="true">·</span>
            <span>공정 난수 알고리즘</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <button
              onClick={() => {
                setActiveTool('list');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              목록 추첨
            </button>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <button
              onClick={() => {
                setActiveTool('roulette');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              룰렛
            </button>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <button
              onClick={() => {
                setActiveTool('ladder');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              사다리 게임
            </button>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <button
              onClick={() => {
                setActiveTool('lotto');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              로또 6/45
            </button>
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
