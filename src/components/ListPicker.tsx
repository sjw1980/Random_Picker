import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Shuffle,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  ListFilter,
  CheckCircle2,
  History,
  HelpCircle,
  FileText
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface HistoryRecord {
  id: string;
  timestamp: string;
  winners: string[];
  totalCandidates: number;
}

const PRESETS = [
  {
    name: '점심 메뉴',
    items: ['김치찌개', '돈까스', '제육볶음', '초밥', '마라탕', '수제버거', '파스타', '쌀국수', '비빔밥', '서브웨이 샌드위치', '짜장면/짬뽕', '칼국수'],
  },
  {
    name: '벌칙 정하기',
    items: ['오늘 점심/커피 쏘기', '노래 한 곡 부르기', '재밌는 개인기 보여주기', '딱밤 한 대 맞기', '내일 간식 사오기', '회의록 정리하기', '자리 청소하기'],
  },
  {
    name: '팀원 발표 순서',
    items: ['민수', '지은', '도현', '수아', '준혁', '다은', '서진', '태양'],
  },
  {
    name: '회식 1차 장소',
    items: ['삼겹살/소고기 구이', '모듬 회/이자카야', '양꼬치 & 꿔바로우', '피맥(피자 & 맥주)', '곱창/대창 전골', '조개구이/해물탕'],
  },
];

export const ListPicker: React.FC = () => {
  const [inputText, setInputText] = useState<string>(() => {
    return PRESETS[0].items.join('\n');
  });
  const [excludePicked, setExcludePicked] = useState<boolean>(false);
  const [pickCount, setPickCount] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [winners, setWinners] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [remainingPool, setRemainingPool] = useState<string[]>([]);
  const [lastWinnerTimestamp, setLastWinnerTimestamp] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const candidateItems = React.useMemo(() => {
    return inputText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [inputText]);

  // Keep remaining pool in sync with candidateItems when changed manually
  useEffect(() => {
    if (!excludePicked || remainingPool.length === 0) {
      setRemainingPool(candidateItems);
    }
  }, [candidateItems, excludePicked]);

  // Clean duplicates from textarea
  const handleRemoveDuplicates = () => {
    const lines = inputText.split('\n').map((l) => l.trim()).filter(Boolean);
    const unique = Array.from(new Set(lines));
    setInputText(unique.join('\n'));
    setRemainingPool(unique);
    sounds.playTick(900);
  };

  // Shuffle text lines
  const handleShuffleList = () => {
    const lines = [...candidateItems];
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    setInputText(lines.join('\n'));
    setRemainingPool(lines);
    sounds.playWhoosh();
  };

  // Clear list
  const handleClearList = () => {
    setInputText('');
    setRemainingPool([]);
    setWinners([]);
    setHighlightedIndex(null);
  };

  // Load preset
  const handleLoadPreset = (items: string[]) => {
    setInputText(items.join('\n'));
    setRemainingPool(items);
    setWinners([]);
    setHighlightedIndex(null);
    sounds.playTick(600);
  };

  // Fire celebratory confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#38bdf8', '#a855f7', '#ec4899'],
    });
  };

  // Execute random pick animation
  const handleStartPick = () => {
    const currentPool = excludePicked && remainingPool.length > 0 ? remainingPool : candidateItems;

    if (currentPool.length === 0) {
      alert('추첨할 항목이 없습니다. 목록을 입력해주세요.');
      return;
    }

    const actualCount = Math.min(pickCount, currentPool.length);

    setIsSpinning(true);
    setWinners([]);
    sounds.playWhoosh();

    // Animation configuration
    const totalDuration = 2400; // ms
    const startTime = performance.now();
    let lastTickTime = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Deceleration curve: tick interval increases from 40ms to 350ms
      const currentInterval = 40 + Math.pow(progress, 3) * 320;

      if (currentTime - lastTickTime > currentInterval) {
        lastTickTime = currentTime;
        const randomIndex = Math.floor(Math.random() * candidateItems.length);
        setHighlightedIndex(randomIndex);
        sounds.playTick(600 + Math.floor((1 - progress) * 500));
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Complete pick
        const shuffled = [...currentPool];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selected = shuffled.slice(0, actualCount);

        // Highlight first selected item
        const finalIdx = candidateItems.indexOf(selected[0]);
        setHighlightedIndex(finalIdx !== -1 ? finalIdx : 0);

        setWinners(selected);
        setIsSpinning(false);

        // Update remaining pool if excludePicked
        if (excludePicked) {
          const nextPool = currentPool.filter((item) => !selected.includes(item));
          setRemainingPool(nextPool);
        }

        // Add to history
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLastWinnerTimestamp(timeStr);
        setHistory((prev) => [
          {
            id: String(Date.now()),
            timestamp: timeStr,
            winners: selected,
            totalCandidates: currentPool.length,
          },
          ...prev.slice(0, 19),
        ]);

        // Victory sound and confetti
        sounds.playFanfare();
        triggerConfetti();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Reset remaining pool
  const handleResetPool = () => {
    setRemainingPool(candidateItems);
    sounds.playTick(800);
  };

  // Remove winner from textarea
  const handleRemoveWinnerFromText = (winnerItem: string) => {
    const updated = candidateItems.filter((i) => i !== winnerItem);
    setInputText(updated.join('\n'));
    setRemainingPool(updated);
    setWinners((prev) => prev.filter((w) => w !== winnerItem));
  };

  const handleCopyWinners = () => {
    if (winners.length === 0) return;
    navigator.clipboard.writeText(winners.join(', '));
    setCopied(true);
    sounds.playTick(1200);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePool = excludePicked ? remainingPool : candidateItems;

  return (
    <div className="space-y-6">
      {/* Kicker & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>목록 랜덤 추첨기</span>
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Random Item Picker
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            줄바꿈으로 항목을 입력하고 즉석에서 공정하게 무작위 추첨하세요.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">추천 프리셋:</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleLoadPreset(p.items)}
              disabled={isSpinning}
              className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-md border border-slate-700/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input Panel (Left) & Candidate / Draw Zone (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Textarea & Options (5 cols) */}
        <div className="lg:col-span-5 space-y-4 bg-[#111726] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <label htmlFor="item-list-input" className="text-sm font-semibold text-slate-200">
                추첨 항목 목록
              </label>
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              총 <span className="text-amber-400 font-bold">{candidateItems.length}</span>개 항목
            </div>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              id="item-list-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSpinning}
              rows={9}
              placeholder="추첨할 항목을 한 줄에 하나씩 입력하세요.&#10;예시:&#10;김치찌개&#10;돈까스&#10;초밥&#10;마라탕"
              className="w-full bg-[#090d16] border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono leading-relaxed resize-y disabled:opacity-60"
            />
          </div>

          {/* Action Tools for Text */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRemoveDuplicates}
                disabled={isSpinning || candidateItems.length === 0}
                title="중복된 텍스트 항목을 제거합니다"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800/70 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/50 transition-colors cursor-pointer disabled:opacity-40"
              >
                <ListFilter className="w-3.5 h-3.5 text-emerald-400" />
                <span>중복 제거</span>
              </button>

              <button
                type="button"
                onClick={handleShuffleList}
                disabled={isSpinning || candidateItems.length === 0}
                title="목록 순서를 무작위로 섞습니다"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800/70 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/50 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                <span>순서 섞기</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClearList}
              disabled={isSpinning || candidateItems.length === 0}
              title="입력 목록 전체 비우기"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 비우기</span>
            </button>
          </div>

          {/* Draw Settings */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="pick-count-select" className="text-xs font-medium text-slate-300">
                한 번에 추첨할 인원 / 수량
              </label>
              <select
                id="pick-count-select"
                value={pickCount}
                onChange={(e) => setPickCount(Number(e.target.value))}
                disabled={isSpinning}
                className="bg-[#090d16] border border-slate-700 text-xs text-amber-400 font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num}명 (개) 뽑기
                  </option>
                ))}
              </select>
            </div>

            {/* Exclude Picked Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={excludePicked}
                onChange={(e) => setExcludePicked(e.target.checked)}
                disabled={isSpinning}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <div className="text-xs text-slate-300 group-hover:text-slate-200">
                <span className="font-medium text-slate-200">비복원 추출 (뽑힌 항목 추첨 풀에서 제외)</span>
                <p className="text-slate-500 mt-0.5">
                  다음 추첨 시 이미 당첨된 항목을 제외하고 남은 항목 중에서만 뽑습니다.
                </p>
              </div>
            </label>

            {excludePicked && (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">
                  남은 항목: <strong className="text-emerald-400 font-mono">{activePool.length}</strong> / {candidateItems.length}
                </span>
                <button
                  type="button"
                  onClick={handleResetPool}
                  disabled={isSpinning || activePool.length === candidateItems.length}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 disabled:opacity-40 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>풀 초기화</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Stage & Winner Showcase (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Draw Action & Highlight Card */}
          <div className="bg-gradient-to-b from-[#141d30] to-[#0f172a] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Display Stage */}
            <div className="relative text-center py-6 sm:py-8 px-4 rounded-xl border border-slate-800/80 bg-[#090d16]/70 backdrop-blur-sm">
              <div className="text-xs font-semibold text-slate-400 mb-2 tracking-wide uppercase">
                {isSpinning ? '무작위 추첨 진행 중...' : winners.length > 0 ? '🎉 당첨 결과' : '추첨 대기 중'}
              </div>

              {/* Animated Rolling Name Stage */}
              <div className="min-h-[72px] flex items-center justify-center">
                {isSpinning ? (
                  <div className="animate-pulse">
                    <span className="text-2xl sm:text-4xl font-extrabold text-amber-400 tracking-tight drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                      {highlightedIndex !== null && candidateItems[highlightedIndex]
                        ? candidateItems[highlightedIndex]
                        : '두구두구...'}
                    </span>
                  </div>
                ) : winners.length > 0 ? (
                  <div className="space-y-3 w-full">
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {winners.map((winner, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 rounded-xl text-lg sm:text-2xl font-bold text-white shadow-lg shadow-amber-500/10 flex items-center gap-2 animate-in zoom-in-95 duration-200"
                        >
                          <span className="text-xs text-amber-400 font-mono px-1.5 py-0.5 rounded bg-black/40">
                            #{idx + 1}
                          </span>
                          <span className="text-amber-200">{winner}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveWinnerFromText(winner)}
                            title="이 항목을 목록에서 완전히 삭제"
                            className="text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2 text-xs">
                      <button
                        type="button"
                        onClick={handleCopyWinners}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? '복사 완료!' : '결과 복사'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm sm:text-base font-medium">
                    아래 버튼을 눌러 무작위 추첨을 시작하세요
                  </div>
                )}
              </div>
            </div>

            {/* Giant Action Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleStartPick}
                disabled={isSpinning || activePool.length === 0}
                className="w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.99] transition-all duration-150 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5"
              >
                <Sparkles className="w-5 h-5 text-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
                <span>
                  {isSpinning
                    ? '추첨 진행 중...'
                    : activePool.length === 0
                    ? '추첨 가능한 항목이 없습니다'
                    : `${activePool.length}개 중 ${Math.min(pickCount, activePool.length)}개 무작위 추첨!`}
                </span>
              </button>
            </div>
          </div>

          {/* Candidate Grid Visualizer */}
          <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>추첨 후보 항목 실시간 현황</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {candidateItems.length}개 중 {activePool.length}개 유효
              </span>
            </div>

            {candidateItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                왼쪽 입력창에 항목을 입력하면 이곳에 시각적으로 표시됩니다.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1 pr-1.5">
                {candidateItems.map((item, idx) => {
                  const isHighlighted = highlightedIndex === idx;
                  const isWinner = winners.includes(item);
                  const isExcluded = excludePicked && !remainingPool.includes(item);

                  return (
                    <div
                      key={idx}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all duration-100 flex items-center gap-1.5 ${
                        isHighlighted
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold scale-105 shadow-md shadow-amber-400/30'
                          : isWinner
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : isExcluded
                          ? 'bg-slate-900/40 text-slate-600 border-slate-800 line-through'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-[10px] font-mono opacity-60">#{idx + 1}</span>
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Draw History Log */}
          {history.length > 0 && (
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>최근 추첨 기록</span>
                </span>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-xs text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                >
                  기록 지우기
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#090d16] border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">{record.timestamp}</span>
                      <div className="flex flex-wrap gap-1 font-semibold text-amber-300">
                        {record.winners.join(', ')}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      후보 {record.totalCandidates}개 중
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
