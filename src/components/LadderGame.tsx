import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Shuffle, Eye, EyeOff, Play, RotateCcw, Copy, Check, Users, Sparkles } from 'lucide-react';
import { sounds } from '../utils/sound';

interface HorizontalBridge {
  id: string;
  leftCol: number; // 0 to N-2
  rowLevel: number; // 0 to numRows - 1
}

interface PlayerResult {
  playerIndex: number;
  playerName: string;
  resultName: string;
  resultIndex: number;
}

const PLAYER_COLORS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#38bdf8', // Sky
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
];

export const LadderGame: React.FC = () => {
  const [numPlayers, setNumPlayers] = useState<number>(4);
  const [playerNames, setPlayerNames] = useState<string[]>([
    '민수',
    '지은',
    '도현',
    '수아',
  ]);
  const [resultNames, setResultNames] = useState<string[]>([
    '커피 쏘기 ☕',
    '통과 👏',
    '간식 사기 🍪',
    '통과 👏',
  ]);

  const [isBlind, setIsBlind] = useState<boolean>(false);
  const [activePlayerTracing, setActivePlayerTracing] = useState<number | null>(null);
  const [completedTraces, setCompletedTraces] = useState<Map<number, number>>(new Map()); // playerIndex -> resultIndex
  const [bridges, setBridges] = useState<HorizontalBridge[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const numRows = 10; // vertical resolution steps for bridges

  // Ensure arrays match numPlayers
  useEffect(() => {
    setPlayerNames((prev) => {
      const next = [...prev];
      while (next.length < numPlayers) next.push(`참가자 ${next.length + 1}`);
      return next.slice(0, numPlayers);
    });
    setResultNames((prev) => {
      const next = [...prev];
      while (next.length < numPlayers) next.push(`결과 ${next.length + 1}`);
      return next.slice(0, numPlayers);
    });
    setCompletedTraces(new Map());
    setActivePlayerTracing(null);
  }, [numPlayers]);

  // Generate random bridges without horizontal collisions
  const generateBridges = useCallback(() => {
    const newBridges: HorizontalBridge[] = [];
    // For each row level, randomly place bridges between adjacent columns
    for (let r = 0; r < numRows; r++) {
      let c = 0;
      while (c < numPlayers - 1) {
        // 50% chance of a bridge if no adjacent bridge at same row
        if (Math.random() > 0.45) {
          newBridges.push({
            id: `${r}-${c}`,
            leftCol: c,
            rowLevel: r,
          });
          c += 2; // skip next to avoid bridge overlap
        } else {
          c += 1;
        }
      }
    }

    // Ensure every column has at least one bridge connecting it
    for (let col = 0; col < numPlayers - 1; col++) {
      const hasBridge = newBridges.some((b) => b.leftCol === col || b.leftCol === col - 1);
      if (!hasBridge) {
        const randRow = Math.floor(Math.random() * numRows);
        newBridges.push({
          id: `forced-${randRow}-${col}`,
          leftCol: col,
          rowLevel: randRow,
        });
      }
    }

    setBridges(newBridges);
    setCompletedTraces(new Map());
    setActivePlayerTracing(null);
    sounds.playWhoosh();
  }, [numPlayers, numRows]);

  // Initial bridge generation
  useEffect(() => {
    generateBridges();
  }, [generateBridges]);

  // Compute final destination for a starting player
  const computeDestination = useCallback(
    (startCol: number): { finalCol: number; path: { col: number; row: number }[] } => {
      let currentCol = startCol;
      const path: { col: number; row: number }[] = [{ col: currentCol, row: -1 }];

      for (let r = 0; r < numRows; r++) {
        path.push({ col: currentCol, row: r });

        // Check if there's a bridge to the right
        const rightBridge = bridges.find((b) => b.rowLevel === r && b.leftCol === currentCol);
        if (rightBridge) {
          currentCol += 1;
          path.push({ col: currentCol, row: r });
          continue;
        }

        // Check if there's a bridge to the left
        const leftBridge = bridges.find((b) => b.rowLevel === r && b.leftCol === currentCol - 1);
        if (leftBridge) {
          currentCol -= 1;
          path.push({ col: currentCol, row: r });
        }
      }

      path.push({ col: currentCol, row: numRows });
      return { finalCol: currentCol, path };
    },
    [bridges, numRows]
  );

  // Render Ladder Canvas
  const drawLadder = useCallback(
    (animProgress?: { playerIndex: number; currentPathIndex: number; path: { col: number; row: number }[] }) => {
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

      const paddingX = Math.max(30, width / (numPlayers * 2));
      const colWidth = (width - paddingX * 2) / (numPlayers - 1);
      const topY = 24;
      const bottomY = height - 24;
      const rowHeight = (bottomY - topY) / (numRows + 1);

      // 1. Draw Vertical Poles
      for (let c = 0; c < numPlayers; c++) {
        const x = paddingX + c * colWidth;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#27354f';
        ctx.stroke();
      }

      // 2. Draw Bridges (if not blind mode or revealed)
      if (!isBlind) {
        bridges.forEach((b) => {
          const x1 = paddingX + b.leftCol * colWidth;
          const x2 = paddingX + (b.leftCol + 1) * colWidth;
          const y = topY + (b.rowLevel + 1) * rowHeight;

          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#3b5175';
          ctx.stroke();
        });
      } else {
        // Blind mode: draw subtle mystery curtain or blur
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(paddingX - 10, topY + 8, width - (paddingX - 10) * 2, bottomY - topY - 16);
        ctx.fillStyle = '#64748b';
        ctx.font = '13px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒 사다리 가림막 적용 중 (결과는 숨겨져 있습니다)', width / 2, height / 2);
      }

      // 3. Draw Completed Traces
      completedTraces.forEach((_, pIdx) => {
        const { path } = computeDestination(pIdx);
        const color = PLAYER_COLORS[pIdx % PLAYER_COLORS.length];

        ctx.beginPath();
        path.forEach((pt, idx) => {
          const x = paddingX + pt.col * colWidth;
          const y = pt.row === -1 ? topY : pt.row === numRows ? bottomY : topY + (pt.row + 1) * rowHeight;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 4. Draw Active Tracing Path
      if (animProgress) {
        const { playerIndex, currentPathIndex, path } = animProgress;
        const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];

        ctx.beginPath();
        for (let i = 0; i <= currentPathIndex; i++) {
          const pt = path[i];
          const x = paddingX + pt.col * colWidth;
          const y = pt.row === -1 ? topY : pt.row === numRows ? bottomY : topY + (pt.row + 1) * rowHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 5;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Animated glowing bead at the head of trace
        const headPt = path[currentPathIndex];
        const hx = paddingX + headPt.col * colWidth;
        const hy = headPt.row === -1 ? topY : headPt.row === numRows ? bottomY : topY + (headPt.row + 1) * rowHeight;
        ctx.beginPath();
        ctx.arc(hx, hy, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    },
    [bridges, completedTraces, computeDestination, isBlind, numPlayers, numRows]
  );

  useEffect(() => {
    drawLadder();
  }, [drawLadder]);

  // Trace a single player with step-by-step animation
  const tracePlayer = (playerIdx: number) => {
    if (activePlayerTracing !== null) return;
    const { finalCol, path } = computeDestination(playerIdx);

    setActivePlayerTracing(playerIdx);
    let step = 0;
    const totalSteps = path.length;

    const runStep = () => {
      drawLadder({ playerIndex: playerIdx, currentPathIndex: step, path });
      sounds.playStep(400 + step * 30);

      step++;
      if (step < totalSteps) {
        setTimeout(runStep, 90);
      } else {
        setCompletedTraces((prev) => new Map(prev).set(playerIdx, finalCol));
        setActivePlayerTracing(null);
        sounds.playFanfare();
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 },
        });
      }
    };

    runStep();
  };

  // Trace all players in sequence
  const handleTraceAll = () => {
    if (activePlayerTracing !== null) return;
    const allMap = new Map<number, number>();
    for (let i = 0; i < numPlayers; i++) {
      const { finalCol } = computeDestination(i);
      allMap.set(i, finalCol);
    }
    setCompletedTraces(allMap);
    sounds.playFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Preset Outcomes
  const setPresetOutcomes = (type: 'coffee' | 'winner' | 'ranked') => {
    if (type === 'coffee') {
      const list = new Array(numPlayers).fill('통과 👏');
      list[Math.floor(Math.random() * numPlayers)] = '커피 쏘기 ☕';
      setResultNames(list);
    } else if (type === 'winner') {
      const list = new Array(numPlayers).fill('꽝 💨');
      list[Math.floor(Math.random() * numPlayers)] = '당첨 🎉';
      setResultNames(list);
    } else if (type === 'ranked') {
      const list = Array.from({ length: numPlayers }, (_, i) => `${i + 1}등 🏆`);
      setResultNames(list);
    }
    setCompletedTraces(new Map());
    sounds.playTick(900);
  };

  const handleCopyResults = () => {
    if (completedTraces.size === 0) return;
    const lines: string[] = [];
    completedTraces.forEach((destCol, startCol) => {
      lines.push(`${playerNames[startCol]} 👉 ${resultNames[destCol]}`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>사다리 타기 게임</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
              Ghost Leg Ladder
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            참가자 이름을 클릭하면 사다리를 실시간으로 타고 내려가 결과를 확인합니다.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Player Count */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-300 font-medium">인원:</span>
            <select
              value={numPlayers}
              onChange={(e) => setNumPlayers(Number(e.target.value))}
              disabled={activePlayerTracing !== null}
              className="bg-transparent text-amber-400 font-bold text-xs focus:outline-none cursor-pointer"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n} className="bg-[#111726] text-white">
                  {n}명
                </option>
              ))}
            </select>
          </div>

          {/* Regenerate Bridges */}
          <button
            type="button"
            onClick={generateBridges}
            disabled={activePlayerTracing !== null}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer disabled:opacity-40"
          >
            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
            <span>사다리 재배치</span>
          </button>

          {/* Blind Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsBlind(!isBlind)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
              isBlind
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isBlind ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isBlind ? '가림막 ON' : '가림막 OFF'}</span>
          </button>

          {/* Trace All */}
          <button
            type="button"
            onClick={handleTraceAll}
            disabled={activePlayerTracing !== null}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-40"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>전체 결과 보기</span>
          </button>
        </div>
      </div>

      {/* Preset Outcome Quick Bars */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400">결과 자동 채우기:</span>
        <button
          type="button"
          onClick={() => setPresetOutcomes('coffee')}
          className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
        >
          ☕ 1명 커피 쏘기
        </button>
        <button
          type="button"
          onClick={() => setPresetOutcomes('winner')}
          className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
        >
          🎉 1명만 당첨 (나머지 꽝)
        </button>
        <button
          type="button"
          onClick={() => setPresetOutcomes('ranked')}
          className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
        >
          🏆 1등~{numPlayers}등 순위
        </button>
      </div>

      {/* Ladder Game Interactive Board */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Top: Player Inputs & Trigger Buttons */}
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${numPlayers}, minmax(0, 1fr))` }}>
          {playerNames.map((name, idx) => {
            const isCompleted = completedTraces.has(idx);
            const isTracing = activePlayerTracing === idx;
            const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const next = [...playerNames];
                    next[idx] = e.target.value;
                    setPlayerNames(next);
                  }}
                  disabled={activePlayerTracing !== null}
                  className="w-full text-center text-xs font-semibold py-1 px-1 bg-[#090d16] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400 truncate"
                />
                <button
                  type="button"
                  onClick={() => tracePlayer(idx)}
                  disabled={activePlayerTracing !== null}
                  style={{ borderColor: color }}
                  className={`w-full py-1.5 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer truncate ${
                    isCompleted
                      ? 'bg-slate-800 text-white shadow-sm'
                      : isTracing
                      ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                      : 'hover:opacity-90 bg-slate-900 text-slate-200'
                  }`}
                >
                  {isCompleted ? '확인됨 ✓' : isTracing ? '진행 중...' : '출발 ▶'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Center Canvas */}
        <div className="w-full h-80 sm:h-96 relative bg-[#090d16]/80 rounded-xl border border-slate-800/80 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Bottom: Outcome Inputs */}
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${numPlayers}, minmax(0, 1fr))` }}>
          {resultNames.map((res, idx) => {
            // Find which player reached this result
            let reachedByPlayerIndex: number | null = null;
            completedTraces.forEach((destCol, pCol) => {
              if (destCol === idx) reachedByPlayerIndex = pCol;
            });

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-full text-center text-[11px] font-mono py-1 rounded border transition-colors truncate ${
                    reachedByPlayerIndex !== null
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800'
                  }`}
                >
                  {reachedByPlayerIndex !== null
                    ? `${playerNames[reachedByPlayerIndex]} 당첨`
                    : '대기 중'}
                </div>
                <input
                  type="text"
                  value={res}
                  onChange={(e) => {
                    const next = [...resultNames];
                    next[idx] = e.target.value;
                    setResultNames(next);
                  }}
                  disabled={activePlayerTracing !== null}
                  className="w-full text-center text-xs font-semibold py-1.5 px-1 bg-[#090d16] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-400 truncate"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Scoreboard Summary */}
      {completedTraces.size > 0 && (
        <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>최종 사다리 매칭 결과</span>
            </span>
            <button
              type="button"
              onClick={handleCopyResults}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? '복사 완료' : '결과 전체 복사'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {Array.from(completedTraces.entries()).map(([pIdx, resIdx]) => (
              <div
                key={pIdx}
                className="p-3 rounded-xl bg-[#090d16] border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: PLAYER_COLORS[pIdx % PLAYER_COLORS.length] }}
                  />
                  <span className="text-xs font-bold text-slate-200">{playerNames[pIdx]}</span>
                </div>
                <span className="text-xs font-bold text-amber-400">{resultNames[resIdx]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
