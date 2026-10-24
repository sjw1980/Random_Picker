import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Copy, Check, RotateCcw, Shuffle, ShieldAlert, Award } from 'lucide-react';
import { sounds } from '../utils/sound';

interface LottoGame {
  id: string;
  gameLabel: string; // A, B, C, D, E
  numbers: number[];
  bonus?: number;
  oddEven: string; // e.g. "3 : 3"
  sum: number;
}

// Official Korean 6/45 Lotto Ball Color scheme
export const getLottoBallColor = (num: number): { bg: string; text: string; border: string; glow: string } => {
  if (num <= 10) {
    return {
      bg: 'bg-gradient-to-b from-amber-300 to-amber-500',
      text: 'text-slate-950',
      border: 'border-amber-200',
      glow: 'shadow-amber-500/30',
    };
  }
  if (num <= 20) {
    return {
      bg: 'bg-gradient-to-b from-blue-400 to-blue-600',
      text: 'text-white',
      border: 'border-blue-300',
      glow: 'shadow-blue-500/30',
    };
  }
  if (num <= 30) {
    return {
      bg: 'bg-gradient-to-b from-rose-400 to-rose-600',
      text: 'text-white',
      border: 'border-rose-300',
      glow: 'shadow-rose-500/30',
    };
  }
  if (num <= 40) {
    return {
      bg: 'bg-gradient-to-b from-slate-400 to-slate-600',
      text: 'text-white',
      border: 'border-slate-300',
      glow: 'shadow-slate-500/30',
    };
  }
  return {
    bg: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
    text: 'text-white',
    border: 'border-emerald-300',
    glow: 'shadow-emerald-500/30',
  };
};

export const LottoBall: React.FC<{ num: number; size?: 'sm' | 'md' | 'lg'; isBonus?: boolean }> = ({
  num,
  size = 'md',
  isBonus = false,
}) => {
  const color = getLottoBallColor(num);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs font-bold',
    md: 'w-10 h-10 sm:w-11 sm:h-11 text-sm sm:text-base font-extrabold',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg font-black',
  }[size];

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shadow-lg ${color.bg} ${color.text} ${color.border} ${color.glow} ${sizeClasses} select-none transform transition-transform hover:scale-110 border`}
    >
      {/* 3D sphere highlight */}
      <div className="absolute top-1 left-1.5 w-2.5 h-2 rounded-full bg-white/40 blur-[1px] pointer-events-none" />
      <span className="font-mono tabular-nums drop-shadow-sm">{num}</span>
    </div>
  );
};

export const LottoGenerator: React.FC = () => {
  const [games, setGames] = useState<LottoGame[]>([]);
  const [gameCount, setGameCount] = useState<number>(5);
  const [includeBonus, setIncludeBonus] = useState<boolean>(true);
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [animatedBalls, setAnimatedBalls] = useState<number[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'machine' | 'filter'>('machine');

  // Generate a single game with inclusion & exclusion filters
  const generateSingleGame = (fixed: number[], excluded: number[]): { numbers: number[]; bonus?: number } => {
    // Pool of available numbers 1 ~ 45
    let pool = Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => !excluded.includes(n));

    // Remove fixed numbers from pool
    pool = pool.filter((n) => !fixed.includes(n));

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const needed = 6 - fixed.length;
    const picked = [...fixed, ...pool.slice(0, needed)].sort((a, b) => a - b);

    // Pick bonus ball if requested
    let bonus: number | undefined;
    if (includeBonus) {
      const remainingPool = pool.slice(needed);
      if (remainingPool.length > 0) {
        bonus = remainingPool[0];
      }
    }

    return { numbers: picked, bonus };
  };

  // Run the animated draw for Game A
  const runAnimatedDraw = () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setAnimatedBalls([]);
    sounds.playWhoosh();

    const { numbers, bonus } = generateSingleGame(fixedNumbers, excludedNumbers);
    const targetBalls = includeBonus && bonus ? [...numbers, bonus] : numbers;

    let index = 0;
    const interval = setInterval(() => {
      if (index < targetBalls.length) {
        setAnimatedBalls((prev) => [...prev, targetBalls[index]]);
        sounds.playClink();
        index++;
      } else {
        clearInterval(interval);
        setIsDrawing(false);

        // Generate full game slip
        const labels = ['A', 'B', 'C', 'D', 'E'];
        const fullGames: LottoGame[] = [];

        // Game A is the one just animated
        const oddCountA = numbers.filter((n) => n % 2 !== 0).length;
        fullGames.push({
          id: 'game-A',
          gameLabel: 'A',
          numbers,
          bonus,
          oddEven: `${oddCountA} : ${6 - oddCountA}`,
          sum: numbers.reduce((acc, curr) => acc + curr, 0),
        });

        // Generate remaining games (B, C, D, E)
        for (let g = 1; g < gameCount; g++) {
          const { numbers: gNumbers, bonus: gBonus } = generateSingleGame(fixedNumbers, excludedNumbers);
          const oddCount = gNumbers.filter((n) => n % 2 !== 0).length;
          fullGames.push({
            id: `game-${labels[g]}`,
            gameLabel: labels[g],
            numbers: gNumbers,
            bonus: gBonus,
            oddEven: `${oddCount} : ${6 - oddCount}`,
            sum: gNumbers.reduce((acc, curr) => acc + curr, 0),
          });
        }

        setGames(fullGames);
        sounds.playFanfare();
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    }, 380);
  };

  // Initial draw on mount
  useEffect(() => {
    runAnimatedDraw();
  }, []);

  const handleToggleFixed = (num: number) => {
    if (excludedNumbers.includes(num)) return;
    if (fixedNumbers.includes(num)) {
      setFixedNumbers((prev) => prev.filter((n) => n !== num));
    } else {
      if (fixedNumbers.length >= 5) {
        alert('고정수는 최대 5개까지만 선택할 수 있습니다.');
        return;
      }
      setFixedNumbers((prev) => [...prev, num].sort((a, b) => a - b));
    }
    sounds.playTick(800);
  };

  const handleToggleExcluded = (num: number) => {
    if (fixedNumbers.includes(num)) return;
    if (excludedNumbers.includes(num)) {
      setExcludedNumbers((prev) => prev.filter((n) => n !== num));
    } else {
      if (excludedNumbers.length >= 35) {
        alert('제외수가 너무 많습니다.');
        return;
      }
      setExcludedNumbers((prev) => [...prev, num].sort((a, b) => a - b));
    }
    sounds.playTick(600);
  };

  const handleCopySlip = () => {
    if (games.length === 0) return;
    const text = games
      .map(
        (g) =>
          `[${g.gameLabel}게임] ${g.numbers.map((n) => String(n).padStart(2, '0')).join(', ')}${
            g.bonus ? ` + 보너스 ${g.bonus}` : ''
          }`
      )
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    sounds.playTick(1200);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>로또 6/45 번호 추첨기</span>
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Lotto 6/45
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            공식 번호 대역별 색상 적용, 고정수/제외수 필터 및 1~5게임 복권 슬립 자동 생성기.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <select
            value={gameCount}
            onChange={(e) => setGameCount(Number(e.target.value))}
            disabled={isDrawing}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-2 cursor-pointer font-medium"
          >
            <option value={1}>1게임 생성</option>
            <option value={2}>2게임 생성</option>
            <option value={3}>3게임 생성</option>
            <option value={4}>4게임 생성</option>
            <option value={5}>5게임 (한 장 풀세트)</option>
          </select>

          <button
            type="button"
            onClick={runAnimatedDraw}
            disabled={isDrawing}
            className="px-4 py-2 rounded-lg font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Shuffle className="w-4 h-4" />
            <span>{isDrawing ? '추첨 중...' : '로또 번호 생성'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Machine & Ticket Slip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Animated Tumbler & Ticket Display (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Drum Visual Stage */}
          <div className="bg-gradient-to-b from-[#131d30] to-[#0c1322] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>실시간 로또 볼 추첨 머신</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">1 ~ 45 난수 추출</span>
            </div>

            {/* Balls Drop Zone */}
            <div className="py-8 px-4 rounded-xl bg-[#090d16]/90 border border-slate-800/80 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 min-h-[96px]">
              {animatedBalls.length === 0 ? (
                <span className="text-xs text-slate-500">추첨 버튼을 누르면 볼이 순서대로 추출됩니다</span>
              ) : (
                animatedBalls.map((ballNum, idx) => {
                  const isBonusBall = includeBonus && idx === 6;
                  return (
                    <React.Fragment key={idx}>
                      {isBonusBall && (
                        <span className="text-xl font-bold text-slate-400 mx-1 sm:mx-2">+</span>
                      )}
                      <div className="flex flex-col items-center gap-1 animate-in zoom-in-75 duration-200">
                        <LottoBall num={ballNum} size="lg" isBonus={isBonusBall} />
                        <span className="text-[10px] font-mono text-slate-400">
                          {isBonusBall ? '보너스' : `${idx + 1}구`}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Official Color Legend */}
            <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>1~10 (노랑)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>11~20 (파랑)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>21~30 (빨강)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>31~40 (회색)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>41~45 (초록)</span>
              </div>
            </div>
          </div>

          {/* Generated Slip Receipt */}
          {games.length > 0 && (
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">로또 6/45 슬립 발권 내역</span>
                <button
                  type="button"
                  onClick={handleCopySlip}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? '복사 완료' : '전체 복사'}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                        {game.gameLabel}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {game.numbers.map((n, i) => (
                          <LottoBall key={i} num={n} size="sm" />
                        ))}
                        {game.bonus && (
                          <>
                            <span className="text-xs text-slate-500 px-0.5">+</span>
                            <LottoBall num={game.bonus} size="sm" isBonus />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 shrink-0">
                      <span>홀짝 {game.oddEven}</span>
                      <span>·</span>
                      <span>합계 {game.sum}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Fixed & Excluded Numbers Filter (5 cols) */}
        <div className="lg:col-span-5 bg-[#111726] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">번호 맞춤 필터 설정</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              반드시 포함할 고정수와 제외할 번호를 지정할 수 있습니다.
            </p>
          </div>

          {/* Filter Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#090d16] rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('machine')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'machine'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              고정수 지정 ({fixedNumbers.length}/5)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('filter')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'filter'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              제외수 지정 ({excludedNumbers.length})
            </button>
          </div>

          <div className="text-xs text-slate-400">
            {activeTab === 'machine' ? (
              <span>반드시 포함할 번호를 터치하세요 (최대 5개까지 가능):</span>
            ) : (
              <span>추첨에서 뺄 번호를 터치하세요:</span>
            )}
          </div>

          {/* 1 ~ 45 Number Grid Pad */}
          <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 max-h-64 overflow-y-auto p-1 bg-[#090d16] border border-slate-800 rounded-xl">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => {
              const isFixed = fixedNumbers.includes(n);
              const isExcluded = excludedNumbers.includes(n);

              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    if (activeTab === 'machine') {
                      handleToggleFixed(n);
                    } else {
                      handleToggleExcluded(n);
                    }
                  }}
                  className={`h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isFixed
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : isExcluded
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50 line-through'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          {/* Quick Clear for Filters */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <span className="text-slate-500 font-mono">
              고정: {fixedNumbers.length}개 / 제외: {excludedNumbers.length}개
            </span>
            <button
              type="button"
              onClick={() => {
                setFixedNumbers([]);
                setExcludedNumbers([]);
                sounds.playTick(600);
              }}
              className="text-slate-400 hover:text-rose-400 cursor-pointer"
            >
              필터 전체 초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
