import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Copy, Check, Shuffle, Dices, Coins } from 'lucide-react';
import { sounds } from '../utils/sound';

export const RangeNumberPicker: React.FC = () => {
  // Range state
  const [minVal, setMinVal] = useState<number>(1);
  const [maxVal, setMaxVal] = useState<number>(100);
  const [count, setCount] = useState<number>(1);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [results, setResults] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Quick Micro tools state (Coin & Dice)
  const [coinResult, setCoinResult] = useState<'앞면' | '뒷면' | null>(null);
  const [isFlippingCoin, setIsFlippingCoin] = useState<boolean>(false);
  const [diceCount, setDiceCount] = useState<number>(2);
  const [diceResults, setDiceResults] = useState<number[]>([3, 5]);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);

  // Range Pick Handler
  const handleGenerateRange = () => {
    if (minVal >= maxVal) {
      alert('최솟값은 최댓값보다 작아야 합니다.');
      return;
    }

    const rangeSize = maxVal - minVal + 1;
    if (!allowDuplicates && count > rangeSize) {
      alert(`중복을 허용하지 않는 경우 최대 ${rangeSize}개까지만 뽑을 수 있습니다.`);
      return;
    }

    setIsGenerating(true);
    setResults([]);
    sounds.playWhoosh();

    // Fast animation cycles
    let iterations = 0;
    const interval = setInterval(() => {
      iterations++;
      sounds.playTick(700 + iterations * 40);

      // Temporary numbers for visual feedback
      const temp: number[] = [];
      for (let i = 0; i < count; i++) {
        temp.push(Math.floor(Math.random() * rangeSize) + minVal);
      }
      setResults(temp);

      if (iterations > 12) {
        clearInterval(interval);
        setIsGenerating(false);

        let finalPicks: number[] = [];
        if (allowDuplicates) {
          for (let i = 0; i < count; i++) {
            finalPicks.push(Math.floor(Math.random() * rangeSize) + minVal);
          }
        } else {
          const pool = Array.from({ length: rangeSize }, (_, i) => minVal + i);
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
          }
          finalPicks = pool.slice(0, count);
        }

        if (sortOrder === 'asc') finalPicks.sort((a, b) => a - b);
        if (sortOrder === 'desc') finalPicks.sort((a, b) => b - a);

        setResults(finalPicks);
        sounds.playFanfare();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    }, 60);
  };

  // Coin Flip
  const handleFlipCoin = () => {
    if (isFlippingCoin) return;
    setIsFlippingCoin(true);
    sounds.playClink();

    let flips = 0;
    const interval = setInterval(() => {
      flips++;
      sounds.playTick(900);
      setCoinResult(flips % 2 === 0 ? '앞면' : '뒷면');

      if (flips > 14) {
        clearInterval(interval);
        const finalSide: '앞면' | '뒷면' = Math.random() < 0.5 ? '앞면' : '뒷면';
        setCoinResult(finalSide);
        setIsFlippingCoin(false);
        sounds.playFanfare();
      }
    }, 80);
  };

  // Dice Roll
  const handleRollDice = () => {
    if (isRollingDice) return;
    setIsRollingDice(true);
    sounds.playWhoosh();

    let rolls = 0;
    const interval = setInterval(() => {
      rolls++;
      sounds.playClink();
      const temp = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setDiceResults(temp);

      if (rolls > 10) {
        clearInterval(interval);
        const finalDice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        setDiceResults(finalDice);
        setIsRollingDice(false);
        sounds.playFanfare();
      }
    }, 80);
  };

  const handleCopy = () => {
    if (results.length === 0) return;
    navigator.clipboard.writeText(results.join(', '));
    setCopied(true);
    sounds.playTick(1200);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>난수(숫자 범위) & 간이 결정기</span>
            <span className="text-xs font-mono text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded border border-violet-400/20">
              Random Number & Dice
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            원하는 숫자 범위를 설정해 난수를 생성하거나 동전, 주사위를 즉시 굴려보세요.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Number Range Controls & Generator (7 cols) */}
        <div className="lg:col-span-7 bg-[#111726] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>범위 난수 설정</span>
          </h3>

          {/* Range Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">최솟값 (Min)</label>
              <input
                type="number"
                value={minVal}
                onChange={(e) => setMinVal(Number(e.target.value))}
                disabled={isGenerating}
                className="w-full bg-[#090d16] border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">최댓값 (Max)</label>
              <input
                type="number"
                value={maxVal}
                onChange={(e) => setMaxVal(Number(e.target.value))}
                disabled={isGenerating}
                className="w-full bg-[#090d16] border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-slate-400 block mb-1">추출 개수</label>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
                disabled={isGenerating}
                className="w-full bg-[#090d16] border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400">범위 프리셋:</span>
            {[
              { label: '1 ~ 100', min: 1, max: 100 },
              { label: '1 ~ 10', min: 1, max: 10 },
              { label: '1 ~ 50', min: 1, max: 50 },
              { label: '1000 ~ 9999', min: 1000, max: 9999 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setMinVal(p.min);
                  setMaxVal(p.max);
                  sounds.playTick(800);
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowDuplicates}
                onChange={(e) => setAllowDuplicates(e.target.checked)}
                disabled={isGenerating}
                className="rounded bg-slate-900 border-slate-700 text-violet-500 focus:ring-0"
              />
              <span>중복 추출 허용</span>
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">결과 정렬:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'none' | 'asc' | 'desc')}
                disabled={isGenerating}
                className="bg-[#090d16] border border-slate-700 text-xs rounded px-2 py-1 text-slate-200 cursor-pointer"
              >
                <option value="none">추출 순서대로</option>
                <option value="asc">오름차순 (작은수부터)</option>
                <option value="desc">내림차순 (큰수부터)</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleGenerateRange}
            disabled={isGenerating}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-base text-slate-950 bg-gradient-to-r from-violet-400 to-fuchsia-400 hover:from-violet-300 hover:to-fuchsia-300 active:scale-95 transition-all shadow-lg shadow-violet-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
            <span>{isGenerating ? '난수 추출 중...' : '난수 생성하기'}</span>
          </button>

          {/* Results Visual Box */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">생성된 난수 결과</span>
              {results.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>
              )}
            </div>

            <div className="min-h-[80px] p-4 rounded-xl bg-[#090d16] border border-slate-800 flex flex-wrap items-center justify-center gap-2">
              {results.length === 0 ? (
                <span className="text-xs text-slate-500">생성 버튼을 누르면 난수가 출력됩니다</span>
              ) : (
                results.map((res, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-200 font-mono text-xl sm:text-2xl font-bold shadow-sm"
                  >
                    {res}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Coin Flip & Dice Roll Micro-tools (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Coin Flip Card */}
          <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>동전 던지기 (앞면 / 뒷면)</span>
              </h3>
            </div>

            <div className="flex items-center justify-center py-4">
              <div
                className={`w-24 h-24 rounded-full border-4 border-amber-300/80 bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center text-slate-950 font-black text-xl shadow-xl shadow-amber-500/20 select-none transition-transform duration-200 ${
                  isFlippingCoin ? 'rotate-180 scale-95 animate-spin' : 'hover:scale-105'
                }`}
              >
                {coinResult || '동전'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleFlipCoin}
              disabled={isFlippingCoin}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isFlippingCoin ? '동전 던지는 중...' : '동전 튕기기 (Flip Coin)'}
            </button>
          </div>

          {/* 2. Dice Roll Card */}
          <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Dices className="w-4 h-4 text-emerald-400" />
                <span>주사위 굴리기 (Dice Roll)</span>
              </h3>
              <select
                value={diceCount}
                onChange={(e) => setDiceCount(Number(e.target.value))}
                disabled={isRollingDice}
                className="bg-[#090d16] border border-slate-700 text-xs rounded px-2 py-1 text-emerald-400 font-bold cursor-pointer"
              >
                <option value={1}>1개</option>
                <option value={2}>2개</option>
                <option value={3}>3개</option>
              </select>
            </div>

            <div className="flex items-center justify-center gap-3 py-4">
              {diceResults.slice(0, diceCount).map((d, i) => (
                <div
                  key={i}
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-300 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg border border-white/40 font-mono select-none transition-transform ${
                    isRollingDice ? 'rotate-45 scale-90' : 'hover:scale-105'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="text-center text-xs text-slate-400 font-mono">
              주사위 눈의 합:{' '}
              <strong className="text-emerald-400 font-bold">
                {diceResults.slice(0, diceCount).reduce((a, b) => a + b, 0)}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleRollDice}
              disabled={isRollingDice}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isRollingDice ? '주사위 굴리는 중...' : '주사위 굴리기 (Roll)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
