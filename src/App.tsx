import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Cell = number | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isSolvable(board: Cell[], size: number): boolean {
  const nums = board.filter((n) => n !== null) as number[];
  let inversions = 0;
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      if (nums[i] > nums[j]) inversions++;
  const blankRow = Math.floor(board.indexOf(null) / size);
  if (size % 2 === 1) return inversions % 2 === 0;
  return (inversions + (size - blankRow)) % 2 === 1;
}

function createSlidePuzzle(size: number): Cell[] {
  let board: Cell[];
  do {
    board = shuffle(([...Array(size * size - 1).keys()].map((n) => n + 1) as Cell[]).concat([null]));
  } while (!isSolvable(board, size));
  return board;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE PUZZLE GAME
// ═══════════════════════════════════════════════════════════════════════════════
function SlidePuzzle({ onBack }: { onBack: () => void }) {
  const [size, setSize] = useState(4);
  const [board, setBoard] = useState<Cell[]>(() => createSlidePuzzle(4));
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [animating, setAnimating] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goal: Cell[] = ([...Array(size * size - 1).keys()].map((n) => n + 1) as Cell[]).concat([null]);

  const checkWin = useCallback(
    (b: Cell[]) => b.every((v, i) => v === goal[i]),
    [size]
  );

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const newGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setBoard(createSlidePuzzle(size));
    setMoves(0);
    setTime(0);
    setRunning(false);
    setWon(false);
  };

  const handleSizeChange = (s: number) => {
    setSize(s);
    if (timerRef.current) clearInterval(timerRef.current);
    setBoard(createSlidePuzzle(s));
    setMoves(0);
    setTime(0);
    setRunning(false);
    setWon(false);
  };

  const handleClick = (idx: number) => {
    if (won) return;
    const blank = board.indexOf(null);
    const row = Math.floor(idx / size), col = idx % size;
    const bRow = Math.floor(blank / size), bCol = blank % size;
    if ((Math.abs(row - bRow) === 1 && col === bCol) || (Math.abs(col - bCol) === 1 && row === bRow)) {
      setAnimating(idx);
      setTimeout(() => setAnimating(null), 150);
      const nb = [...board];
      [nb[idx], nb[blank]] = [nb[blank], nb[idx]];
      setBoard(nb);
      setMoves((m) => m + 1);
      if (!running) setRunning(true);
      if (checkWin(nb)) {
        setWon(true);
        setRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const blank = board.indexOf(null);
      const bRow = Math.floor(blank / size), bCol = blank % size;
      let target = -1;
      if (e.key === "ArrowUp" && bRow < size - 1) target = blank + size;
      if (e.key === "ArrowDown" && bRow > 0) target = blank - size;
      if (e.key === "ArrowLeft" && bCol < size - 1) target = blank + 1;
      if (e.key === "ArrowRight" && bCol > 0) target = blank - 1;
      if (target >= 0) { e.preventDefault(); handleClick(target); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [board, size, won]);

  const tileSize = size === 3 ? "text-4xl" : size === 4 ? "text-2xl" : "text-xl";
  const gridTemplate = `repeat(${size}, minmax(0, 1fr))`;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 w-full max-w-lg">
        <button onClick={onBack} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
          ← 返回
        </button>
        <h2 className="text-2xl font-bold text-white flex-1 text-center">🧩 滑动拼图</h2>
      </div>

      {/* Size selector */}
      <div className="flex gap-2">
        {[3, 4, 5].map((s) => (
          <button key={s} onClick={() => handleSizeChange(s)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${size === s ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
            {s}×{s}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{moves}</div>
          <div className="text-xs text-gray-400">步数</div>
        </div>
        <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {String(Math.floor(time / 60)).padStart(2, "0")}:{String(time % 60).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-400">时间</div>
        </div>
      </div>

      {/* Board */}
      <div className="relative">
        {won && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-black/70 backdrop-blur-sm">
            <div className="text-5xl mb-2">🎉</div>
            <div className="text-2xl font-bold text-yellow-400">恭喜完成！</div>
            <div className="text-gray-300 mt-1">{moves} 步 · {time} 秒</div>
          </div>
        )}
        <div
          className="grid gap-2 p-3 bg-white/5 rounded-2xl border border-white/10"
          style={{ display: "grid", gridTemplateColumns: gridTemplate, width: `${size * 80 + (size - 1) * 8 + 24}px` }}
        >
          {board.map((val, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              className={`
                aspect-square rounded-xl font-bold transition-all duration-150 select-none
                ${tileSize}
                ${val === null
                  ? "bg-transparent cursor-default"
                  : "cursor-pointer shadow-lg active:scale-95 " +
                    (animating === idx ? "scale-95 " : "") +
                    (checkWin(board) ? "bg-gradient-to-br from-green-400 to-emerald-600 text-white" :
                      "bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20")
                }
              `}
              style={{ width: "72px", height: "72px" }}
              disabled={val === null}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={newGame}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/30">
          🔄 新游戏
        </button>
        <button onClick={() => setBoard(goal as Cell[])}
          className="px-6 py-2 bg-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/20 transition-all">
          💡 显示答案
        </button>
      </div>

      <p className="text-gray-500 text-sm">使用方向键或点击方块移动</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY CARD GAME
// ═══════════════════════════════════════════════════════════════════════════════
const EMOJIS = ["🐉", "🦊", "🐬", "🦋", "🌸", "⚡", "🔥", "🌊", "🎯", "🎲", "💎", "🚀", "🌈", "🍄", "🦁", "🐺", "🦅", "🐙"];

type MemCard = { id: number; emoji: string; flipped: boolean; matched: boolean };

function MemoryGame({ onBack }: { onBack: () => void }) {
  const [gridSize, setGridSize] = useState(4);
  const [cards, setCards] = useState<MemCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initCards = (size: number) => {
    const count = (size * size) / 2;
    const chosen = shuffle(EMOJIS).slice(0, count);
    return shuffle([...chosen, ...chosen].map((emoji, i) => ({
      id: i, emoji, flipped: false, matched: false,
    })));
  };

  useEffect(() => { setCards(initCards(gridSize)); }, []);

  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const newGame = (size = gridSize) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCards(initCards(size));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTime(0);
    setRunning(false);
    setWon(false);
    setLocked(false);
  };

  const handleSizeChange = (s: number) => {
    setGridSize(s);
    newGame(s);
  };

  const handleFlip = (id: number) => {
    if (locked || flipped.includes(id) || matched.includes(id) || won) return;
    if (!running) setRunning(true);

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = newFlipped;
      const ca = cards[a], cb = cards[b];
      if (ca.emoji === cb.emoji) {
        const newMatched = [...matched, a, b];
        setMatched(newMatched);
        setFlipped([]);
        setLocked(false);
        if (newMatched.length === cards.length) {
          setWon(true);
          setRunning(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } else {
        setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
      }
    }
  };

  const cols = gridSize;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center gap-4 w-full max-w-xl">
        <button onClick={onBack} className="text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors">← 返回</button>
        <h2 className="text-2xl font-bold text-white flex-1 text-center">🃏 记忆翻牌</h2>
      </div>

      <div className="flex gap-2">
        {[4, 6].map((s) => (
          <button key={s} onClick={() => handleSizeChange(s)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${gridSize === s ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
            {s}×{s}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-pink-400">{moves}</div>
          <div className="text-xs text-gray-400">翻牌次数</div>
        </div>
        <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {String(Math.floor(time / 60)).padStart(2, "0")}:{String(time % 60).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-400">时间</div>
        </div>
        <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-green-400">{matched.length / 2}/{cards.length / 2}</div>
          <div className="text-xs text-gray-400">已配对</div>
        </div>
      </div>

      <div className="relative">
        {won && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-black/70 backdrop-blur-sm">
            <div className="text-5xl mb-2">🎊</div>
            <div className="text-2xl font-bold text-yellow-400">全部配对！</div>
            <div className="text-gray-300 mt-1">{moves} 次 · {time} 秒</div>
          </div>
        )}
        <div
          className="grid gap-3 p-4 bg-white/5 rounded-2xl border border-white/10"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {cards.map((card) => {
            const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
            const isMatched = matched.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => handleFlip(card.id)}
                className={`
                  w-16 h-16 rounded-xl font-bold text-2xl transition-all duration-300 select-none
                  ${isFlipped
                    ? isMatched
                      ? "bg-gradient-to-br from-green-400 to-emerald-600 scale-95 shadow-green-500/30 shadow-lg"
                      : "bg-gradient-to-br from-pink-400 to-purple-600 shadow-pink-500/30 shadow-lg"
                    : "bg-gradient-to-br from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 cursor-pointer"
                  }
                `}
              >
                {isFlipped ? card.emoji : "?"}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={() => newGame()}
        className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/30">
        🔄 新游戏
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATHFINDER GAME (maze-like grid)
// ═══════════════════════════════════════════════════════════════════════════════
type PFCell = "empty" | "wall" | "start" | "end" | "player" | "visited" | "path";

function generateMaze(rows: number, cols: number): PFCell[][] {
  // Simple random maze with guaranteed path
  const grid: PFCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() < 0.28 ? "wall" : "empty"))
  );
  grid[0][0] = "start";
  grid[rows - 1][cols - 1] = "end";
  // Carve a random winding path
  let r = 0, c = 0;
  while (r < rows - 1 || c < cols - 1) {
    if (grid[r][c] !== "start") grid[r][c] = "empty";
    if (r === rows - 1) c++;
    else if (c === cols - 1) r++;
    else if (Math.random() < 0.5) r++;
    else c++;
  }
  grid[0][0] = "start";
  grid[rows - 1][cols - 1] = "end";
  return grid;
}

function PathfinderGame({ onBack }: { onBack: () => void }) {
  const ROWS = 10, COLS = 14;
  const [grid, setGrid] = useState<PFCell[][]>(() => generateMaze(ROWS, COLS));
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0]);
  const [visited, setVisited] = useState<Set<string>>(new Set(["0,0"]));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const newGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGrid(generateMaze(ROWS, COLS));
    setPlayerPos([0, 0]);
    setVisited(new Set(["0,0"]));
    setMoves(0);
    setTime(0);
    setRunning(false);
    setWon(false);
  };

  const move = useCallback((dr: number, dc: number) => {
    if (won) return;
    const [r, c] = playerPos;
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    if (grid[nr][nc] === "wall") return;
    if (!running) setRunning(true);
    setPlayerPos([nr, nc]);
    setMoves((m) => m + 1);
    setVisited((v) => new Set([...v, `${nr},${nc}`]));
    if (nr === ROWS - 1 && nc === COLS - 1) {
      setWon(true);
      setRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [playerPos, grid, won, running]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowUp" || e.key === "w") move(-1, 0);
        if (e.key === "ArrowDown" || e.key === "s") move(1, 0);
        if (e.key === "ArrowLeft" || e.key === "a") move(0, -1);
        if (e.key === "ArrowRight" || e.key === "d") move(0, 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const getCellStyle = (cell: PFCell, r: number, c: number) => {
    const isPlayer = r === playerPos[0] && c === playerPos[1];
    const isVisit = visited.has(`${r},${c}`);
    if (isPlayer) return "bg-yellow-400 shadow-yellow-400/60 shadow-md z-10";
    if (cell === "start") return "bg-green-500";
    if (cell === "end") return "bg-red-500 animate-pulse";
    if (cell === "wall") return "bg-slate-700 border-slate-600";
    if (isVisit) return "bg-blue-900/60 border-blue-800/40";
    return "bg-slate-800/80 border-slate-700/40 hover:bg-slate-700/60";
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center gap-4 w-full max-w-2xl">
        <button onClick={onBack} className="text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">← 返回</button>
        <h2 className="text-2xl font-bold text-white flex-1 text-center">🗺️ 迷宫寻路</h2>
      </div>

      <div className="flex gap-6">
        <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-green-400">{moves}</div>
          <div className="text-xs text-gray-400">步数</div>
        </div>
        <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {String(Math.floor(time / 60)).padStart(2, "0")}:{String(time % 60).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-400">时间</div>
        </div>
      </div>

      <div className="relative">
        {won && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-black/75 backdrop-blur-sm">
            <div className="text-5xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-yellow-400">找到出口！</div>
            <div className="text-gray-300 mt-1">{moves} 步 · {time} 秒</div>
          </div>
        )}
        <div className="grid gap-1 p-3 bg-white/5 rounded-2xl border border-white/10"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`}
                className={`w-8 h-8 rounded border transition-all duration-150 flex items-center justify-center text-sm ${getCellStyle(cell, r, c)}`}>
                {r === playerPos[0] && c === playerPos[1] ? "😊" : cell === "end" ? "🏁" : cell === "start" && !(r === playerPos[0] && c === playerPos[1]) ? "🟢" : ""}
              </div>
            ))
          )}
        </div>
      </div>

      {/* D-pad controls for mobile */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div />
        <button onClick={() => move(-1, 0)} className="w-12 h-12 bg-white/10 rounded-xl text-white hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-xl">↑</button>
        <div />
        <button onClick={() => move(0, -1)} className="w-12 h-12 bg-white/10 rounded-xl text-white hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-xl">←</button>
        <button onClick={() => move(1, 0)} className="w-12 h-12 bg-white/10 rounded-xl text-white hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-xl">↓</button>
        <button onClick={() => move(0, 1)} className="w-12 h-12 bg-white/10 rounded-xl text-white hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-xl">→</button>
      </div>

      <div className="flex gap-3">
        <button onClick={newGame}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-green-500/30">
          🔄 新迷宫
        </button>
      </div>
      <p className="text-gray-500 text-sm">方向键/WASD 控制移动 · 🟢起点 🏁终点</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME OF LIFE
// ═══════════════════════════════════════════════════════════════════════════════
const LIFE_ROWS = 20, LIFE_COLS = 30;

function createEmptyLife() {
  return Array.from({ length: LIFE_ROWS }, () => Array(LIFE_COLS).fill(false));
}

function createRandomLife() {
  return Array.from({ length: LIFE_ROWS }, () =>
    Array.from({ length: LIFE_COLS }, () => Math.random() < 0.3)
  );
}

function stepLife(grid: boolean[][]): boolean[][] {
  return grid.map((row, r) =>
    row.map((cell, c) => {
      let neighbors = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = (r + dr + LIFE_ROWS) % LIFE_ROWS;
          const nc = (c + dc + LIFE_COLS) % LIFE_COLS;
          if (grid[nr][nc]) neighbors++;
        }
      if (cell) return neighbors === 2 || neighbors === 3;
      return neighbors === 3;
    })
  );
}

function GameOfLife({ onBack }: { onBack: () => void }) {
  const [grid, setGrid] = useState<boolean[][]>(createEmptyLife);
  const [running, setRunning] = useState(false);
  const [gen, setGen] = useState(0);
  const [speed, setSpeed] = useState(150);
  const [drawing, setDrawing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setGrid((g) => stepLife(g));
        setGen((n) => n + 1);
      }, speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, speed]);

  const toggleCell = (r: number, c: number) => {
    setGrid((g) => {
      const ng = g.map((row) => [...row]);
      ng[r][c] = !ng[r][c];
      return ng;
    });
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (drawing) {
      setGrid((g) => {
        const ng = g.map((row) => [...row]);
        ng[r][c] = true;
        return ng;
      });
    }
  };

  const population = grid.flat().filter(Boolean).length;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center gap-4 w-full max-w-3xl">
        <button onClick={onBack} className="text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">← 返回</button>
        <h2 className="text-2xl font-bold text-white flex-1 text-center">🌱 生命游戏</h2>
      </div>

      <div className="flex gap-6">
        <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{gen}</div>
          <div className="text-xs text-gray-400">代数</div>
        </div>
        <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{population}</div>
          <div className="text-xs text-gray-400">存活细胞</div>
        </div>
        <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
          <div className="text-sm font-bold text-purple-400">{speed}ms</div>
          <div className="text-xs text-gray-400">速度</div>
        </div>
      </div>

      {/* Grid */}
      <div
        className="border border-white/10 rounded-xl overflow-hidden cursor-crosshair"
        onMouseLeave={() => setDrawing(false)}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                className={`w-5 h-5 border-[0.5px] border-white/5 transition-colors duration-100 ${cell ? "bg-gradient-to-br from-orange-400 to-yellow-500" : "bg-slate-900"}`}
                onMouseDown={() => { setDrawing(true); toggleCell(r, c); }}
                onMouseEnter={() => handleMouseEnter(r, c)}
                onMouseUp={() => setDrawing(false)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => setRunning((r) => !r)}
          className={`px-6 py-2 font-bold rounded-xl transition-all shadow-lg ${running ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" : "bg-gradient-to-r from-orange-500 to-yellow-500 hover:opacity-90 shadow-orange-500/30"} text-white`}>
          {running ? "⏸ 暂停" : "▶ 开始"}
        </button>
        <button onClick={() => { setGrid(createRandomLife()); setGen(0); setRunning(false); }}
          className="px-4 py-2 bg-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/20 transition-all">🎲 随机</button>
        <button onClick={() => { setGrid(createEmptyLife()); setGen(0); setRunning(false); }}
          className="px-4 py-2 bg-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/20 transition-all">🗑 清空</button>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl border border-white/20 outline-none cursor-pointer"
        >
          <option value={50}>⚡ 极快</option>
          <option value={150}>🚀 快速</option>
          <option value={300}>🐢 普通</option>
          <option value={600}>🐌 慢速</option>
        </select>
      </div>

      <p className="text-gray-500 text-sm">点击/拖拽绘制细胞 · 每代按照规则演化</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
type Game = "slide" | "memory" | "pathfinder" | "life";

const GAMES = [
  {
    id: "slide" as Game,
    title: "滑动拼图",
    icon: "🧩",
    desc: "经典数字华容道，将数字排列整齐",
    color: "from-cyan-500 to-blue-600",
    glow: "shadow-cyan-500/30",
    tags: ["益智", "策略"],
  },
  {
    id: "memory" as Game,
    title: "记忆翻牌",
    icon: "🃏",
    desc: "翻开匹配相同的卡片，测试你的记忆力",
    color: "from-pink-500 to-purple-600",
    glow: "shadow-pink-500/30",
    tags: ["记忆", "配对"],
  },
  {
    id: "pathfinder" as Game,
    title: "迷宫寻路",
    icon: "🗺️",
    desc: "在随机迷宫中找到出口，躲避障碍",
    color: "from-green-500 to-teal-600",
    glow: "shadow-green-500/30",
    tags: ["探索", "策略"],
  },
  {
    id: "life" as Game,
    title: "生命游戏",
    icon: "🌱",
    desc: "Conway的生命游戏，观察细胞的演化规律",
    color: "from-orange-500 to-yellow-600",
    glow: "shadow-orange-500/30",
    tags: ["模拟", "创意"],
  },
];

export default function App() {
  const [current, setCurrent] = useState<Game | null>(null);

  // Animated background particles
  const particles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${(i * 5.3 + 2) % 100}%`,
              top: `${(i * 7.1 + 5) % 100}%`,
              background: ["#06b6d4", "#a855f7", "#22c55e", "#f97316"][i % 4],
              animation: `float ${3 + (i % 4)}s ease-in-out infinite ${i * 0.3}s alternate`,
            }}
          />
        ))}
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); }
          to { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8">
        {!current ? (
          /* ── MENU ── */
          <div className="w-full max-w-4xl">
            {/* Title */}
            <div className="text-center mb-12">
              <div className="text-7xl mb-4">⬛⬜</div>
              <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
                2D 矩阵游戏
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"> 合集</span>
              </h1>
              <p className="text-gray-400 text-lg">选择一款游戏开始挑战</p>
            </div>

            {/* Game Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setCurrent(game.id)}
                  className={`group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${game.glow}`}
                >
                  {/* Gradient blob */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />

                  <div className="relative flex items-start gap-4">
                    <div className={`text-5xl p-3 rounded-xl bg-gradient-to-br ${game.color} shadow-lg ${game.glow}`}>
                      {game.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-1">{game.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{game.desc}</p>
                      <div className="flex gap-2 mt-3">
                        {game.tags.map((tag) => (
                          <span key={tag} className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${game.color} text-white font-medium opacity-80`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all text-xl">→</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center mt-12 text-gray-600 text-sm">
              <p>🎮 4款经典矩阵游戏 · 支持键盘控制 · 响应式设计</p>
            </div>
          </div>
        ) : (
          /* ── GAME SCREEN ── */
          <div className="w-full max-w-4xl flex flex-col items-center">
            {current === "slide" && <SlidePuzzle onBack={() => setCurrent(null)} />}
            {current === "memory" && <MemoryGame onBack={() => setCurrent(null)} />}
            {current === "pathfinder" && <PathfinderGame onBack={() => setCurrent(null)} />}
            {current === "life" && <GameOfLife onBack={() => setCurrent(null)} />}
          </div>
        )}
      </div>
    </div>
  );
}
