import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Shuffle, Trash2, Trophy, Volume2 } from 'lucide-react';
import { sounds } from '../utils/sound';

const SLICE_PALETTES = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#d946ef', // Fuchsia
];

const DEFAULT_OPTIONS = [
  '짜장면',
  '돈까스',
  '김치찌개',
  '초밥',
  '제육볶음',
  '햄버거',
  '마라탕',
  '파스타',
];

export const RouletteWheel: React.FC = () => {
  const [inputText, setInputText] = useState<string>(DEFAULT_OPTIONS.join('\n'));
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [removeOnWin, setRemoveOnWin] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const spinRafRef = useRef<number | null>(null);
  const lastPegIndexRef = useRef<number>(-1);

  const items = React.useMemo(() => {
    return inputText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [inputText]);

  // Draw the roulette wheel on canvas
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    if (items.length === 0) {
      // Empty state circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 15px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('항목을 입력해주세요', centerX, centerY);
      ctx.restore();
      return;
    }

    const numSlices = items.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    // Draw outer glow and border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3b4e72';
    ctx.stroke();

    // Draw Slices
    for (let i = 0; i < numSlices; i++) {
      const startAngle = currentAngleRef.current + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Slice fill
      ctx.fillStyle = SLICE_PALETTES[i % SLICE_PALETTES.length];
      ctx.fill();

      // Slice border
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(12, Math.min(16, 260 / Math.max(items[i].length, 12)))}px Pretendard, sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;

      // Text truncation if too long
      let text = items[i];
      if (text.length > 10) {
        text = text.substring(0, 9) + '…';
      }
      ctx.fillText(text, radius - 24, 0);
      ctx.restore();

      // Draw border peg
      const pegAngle = startAngle;
      const pegX = centerX + Math.cos(pegAngle) * (radius - 2);
      const pegY = centerY + Math.sin(pegAngle) * (radius - 2);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // Draw Center Cap
    ctx.beginPath();
    ctx.arc(centerX, centerY, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0f19';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Top Pointer Needle
    ctx.restore();
  }, [items]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => drawWheel();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  // Calculate winner based on final angle
  const calculateWinner = useCallback(() => {
    if (items.length === 0) return null;
    const numSlices = items.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    // Pointer is fixed at 12 o'clock (angle = -PI / 2 or 3 * PI / 2)
    // Normalize currentAngle to [0, 2*PI)
    let normalizedAngle = currentAngleRef.current % (Math.PI * 2);
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

    // Pointer position is at angle = 1.5 * PI (270 degrees / 12 o'clock)
    const pointerAngle = 1.5 * Math.PI;
    let diff = (pointerAngle - normalizedAngle) % (Math.PI * 2);
    if (diff < 0) diff += Math.PI * 2;

    const winningIndex = Math.floor(diff / sliceAngle) % numSlices;
    return items[winningIndex];
  }, [items]);

  // Spin Wheel Loop
  const spin = () => {
    if (isSpinning || items.length < 2) return;

    setIsSpinning(true);
    setWinner(null);
    sounds.playWhoosh();

    // High initial velocity (randomized between 0.28 and 0.42 radians/frame)
    const initialVelocity = 0.28 + Math.random() * 0.15;
    velocityRef.current = initialVelocity;

    // Gradual friction deceleration
    const friction = 0.988 + Math.random() * 0.004; // ~4 to 7 seconds total spin

    const numSlices = items.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    const updateSpin = () => {
      currentAngleRef.current += velocityRef.current;
      velocityRef.current *= friction;

      // Tick audio when crossing slice boundaries
      let normalizedAngle = currentAngleRef.current % (Math.PI * 2);
      if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
      const currentPeg = Math.floor(normalizedAngle / sliceAngle);
      if (currentPeg !== lastPegIndexRef.current) {
        lastPegIndexRef.current = currentPeg;
        sounds.playTick(750 + Math.floor(velocityRef.current * 800));
      }

      drawWheel();

      // Stop threshold
      if (velocityRef.current > 0.001) {
        spinRafRef.current = requestAnimationFrame(updateSpin);
      } else {
        velocityRef.current = 0;
        setIsSpinning(false);
        const win = calculateWinner();
        setWinner(win);
        sounds.playFanfare();
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.55 },
        });

        if (removeOnWin && win) {
          setTimeout(() => {
            const next = items.filter((i) => i !== win);
            setInputText(next.join('\n'));
          }, 2500);
        }
      }
    };

    spinRafRef.current = requestAnimationFrame(updateSpin);
  };

  useEffect(() => {
    return () => {
      if (spinRafRef.current) cancelAnimationFrame(spinRafRef.current);
    };
  }, []);

  const handleShuffle = () => {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setInputText(list.join('\n'));
    sounds.playWhoosh();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>대화형 룰렛 돌림판</span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
              Roulette Wheel
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            항목을 입력하고 돌림판을 돌려 스릴 넘치게 결정하세요.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Canvas Wheel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#111726] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
          {/* Wheel Pointer at 12 o'clock */}
          <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
            {/* Pointer SVG */}
            <div className="absolute -top-1.5 z-20 transform -translate-x-1/2 left-1/2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] pointer-events-none">
              <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
                <path
                  d="M17 40L2 4C2 2 3.5 1 5.5 1H28.5C30.5 1 32 2 32 4L17 40Z"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-pointer select-none"
              onClick={spin}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* Winner Announcement Banner */}
          {winner && (
            <div className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border border-amber-400/50 text-center animate-in zoom-in-95">
              <span className="text-xs font-medium text-amber-300 block">당첨 항목</span>
              <span className="text-xl sm:text-2xl font-black text-white">{winner}</span>
            </div>
          )}

          {/* Spin Trigger Button */}
          <div className="w-full max-w-sm mt-5">
            <button
              type="button"
              onClick={spin}
              disabled={isSpinning || items.length < 2}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-base text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{isSpinning ? '돌아가는 중...' : '룰렛 돌리기!'}</span>
            </button>
          </div>
        </div>

        {/* Right: Wheel Slices Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-[#111726] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">돌림판 항목 편집</h3>
            <span className="text-xs text-slate-400 font-mono">
              현재 <strong className="text-cyan-400">{items.length}</strong>개 조각
            </span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSpinning}
            rows={8}
            placeholder="룰렛에 넣을 항목을 줄바꿈으로 입력하세요"
            className="w-full bg-[#090d16] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-y"
          />

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleShuffle}
              disabled={isSpinning || items.length === 0}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              <span>조각 섞기</span>
            </button>

            <button
              type="button"
              onClick={() => setInputText('')}
              disabled={isSpinning || items.length === 0}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>비우기</span>
            </button>
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={removeOnWin}
              onChange={(e) => setRemoveOnWin(e.target.checked)}
              disabled={isSpinning}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
            />
            <span>당첨된 조각 자동 삭제 (다음 회전 시 제외)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
