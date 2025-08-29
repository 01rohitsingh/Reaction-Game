import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HUD from './HUD';
import PauseOverlay from './PauseOverlay';

// -- constants --
const START_TIME = 1.6; // seconds target is visible in round 1
const MIN_TIME = 0.45;  // minimum visible time as difficulty increases
const TIME_DECREASE = 0.06; // time reduced per round
const START_LIVES = 3;
const BEST_KEY = 'reaction_speed_best_score';

function useBeep() {
  const ctxRef = useRef(null);
  return useCallback((freq = 440, duration = 0.08, vol = 0.12) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
      }, duration * 1000);
    } catch (e) {
      // audio unavailable (autoplay blocked), silently ignore
    }
  }, []);
}

export default function Game() {
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) || 0));
  const [round, setRound] = useState(1);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [timeVisible, setTimeVisible] = useState(START_TIME);
  const [timeLeft, setTimeLeft] = useState(START_TIME);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lives, setLives] = useState(START_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const arenaRef = useRef(null);
  const timerRef = useRef(null);
  const beep = useBeep();
  const [leaderboard, setLeaderboard] = useState([]);

  // load leaderboard stub (mock)
  useEffect(() => {
    fetch('/leaderboard-stub.json').then(r => r.json()).then(data => {
      if (data?.leaderboard) setLeaderboard(data.leaderboard);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(BEST_KEY, String(best));
  }, [best]);

  // start a new game
  const startGame = useCallback(() => {
    setScore(0);
    setRound(1);
    setTimeVisible(START_TIME);
    setTimeLeft(START_TIME);
    setLives(START_LIVES);
    setGameOver(false);
    setRunning(true);
    setPaused(false);
    spawnTarget(START_TIME);
  }, []);

  // spawn target at random position within arena
  const spawnTarget = useCallback((visibleFor) => {
    const rect = arenaRef.current?.getBoundingClientRect();
    const padding = 70;
    let x = 50, y = 50;
    if (rect) {
      const W = rect.width - padding;
      const H = rect.height - padding;
      x = Math.max(40, Math.random() * W + 20);
      y = Math.max(40, Math.random() * H + 20);
    } else {
      x = 50 + (Math.random() - 0.5) * 20;
      y = 50 + (Math.random() - 0.5) * 20;
    }
    setTargetPos({ x, y });
    setTimeLeft(visibleFor);

    // clear any previous timer
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (paused) return prev;
        if (prev <= 0.05) {
          clearInterval(timerRef.current);
          // missed target
          setLives(lv => {
            const newLives = lv - 1;
            if (newLives <= 0) {
              endGame();
            } else {
              // next round continues but penalize
              const nextTime = Math.max(MIN_TIME, visibleFor - TIME_DECREASE);
              setRound(r => r + 1);
              setTimeVisible(nextTime);
              spawnTarget(nextTime);
            }
            return newLives;
          });
          beep(220, 0.08, 0.12);
          return 0;
        }
        return +(prev - 0.05).toFixed(2);
      });
    }, 50);
  }, [paused, beep]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const endGame = useCallback(() => {
    setRunning(false);
    setGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setBest(prev => {
      if (score > prev) {
        localStorage.setItem(BEST_KEY, String(score));
        return score;
      }
      return prev;
    });
  }, [score]);

  const handleClickTarget = useCallback(() => {
    if (!running || paused) return;
    // score increases based on remaining time (faster click -> higher points)
    setScore(s => {
      const add = Math.ceil(100 * (timeLeft / timeVisible));
      const newScore = s + add;
      // small success beep
      beep(880, 0.06, 0.10);
      return newScore;
    });

    // advance difficulty and spawn next
    const nextTime = Math.max(MIN_TIME, timeVisible - TIME_DECREASE);
    setRound(r => r + 1);
    setTimeVisible(nextTime);
    spawnTarget(nextTime);
  }, [timeLeft, timeVisible, running, paused, spawnTarget, beep]);

  const onPauseToggle = useCallback(() => {
    setPaused(p => {
      const newP = !p;
      if (!newP && running && timeLeft > 0) {
        // resumed - restart timer
        spawnTarget(timeLeft);
      } else if (newP) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return newP;
    });
  }, [running, spawnTarget, timeLeft]);

  // quick keyboard support: space to start, p to pause
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        if (!running) startGame();
        e.preventDefault();
      } else if (e.key.toLowerCase() === 'p') {
        if (running) onPauseToggle();
      } else if (e.key === 'r') {
        startGame();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, startGame, onPauseToggle]);

  return (
    <div className="relative">
      <HUD
        score={score}
        best={best}
        round={round}
        timeLeft={timeLeft}
        paused={paused}
        onPauseToggle={onPauseToggle}
        lives={lives}
      />

      <div
        ref={arenaRef}
        
        className="relative bg-slate-800 h-[56vh] max-h-[560px] rounded-lg overflow-hidden border border-slate-700"
      >
        {/* Play area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!running && !gameOver && (
            <div className="text-center pointer-events-auto">
              <h2 className="text-xl font-semibold mb-2">Reaction Speed</h2>
              <p className="text-slate-400 mb-4">Press <span className="font-medium">Space</span> to start</p>
              <div className="flex gap-3 justify-center">
                <button onClick={startGame} className="px-4 py-2 rounded bg-accent text-white">Start</button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="text-center pointer-events-auto">
              <h2 className="text-2xl font-bold mb-2">Game Over</h2>
              <p className="text-slate-400 mb-3">Your score: <span className="font-medium">{score}</span></p>
              <p className="text-slate-400 mb-4">Best: <span className="font-medium">{best}</span></p>
              <div className="flex gap-3 justify-center">
                <button onClick={startGame} className="px-4 py-2 rounded bg-accent text-white">Restart</button>
              </div>
            </div>
          )}
        </div>

        {/* Target */}
        <AnimatePresence>
          {running && !paused && timeLeft > 0 && (
            <motion.button
              key={round + String(targetPos.x) + String(targetPos.y)}
              onClick={handleClickTarget}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 700, damping: 20 }}
              style={{
                position: 'absolute',
                left: targetPos.x,
                top: targetPos.y,
                translate: '-50% -50%'
              }}
              className="pointer-events-auto w-22 h-22 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-accent to-indigo-500 target-shadow border-2 border-white/10 p-1"
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 flex items-center justify-center text-slate-900 font-semibold">
                  Hit
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* subtle indicator at bottom */}
        <div className="absolute left-4 bottom-4 text-xs text-slate-400">
          Round time: <span className="font-medium">{timeVisible.toFixed(2)}s</span>
        </div>
      </div>

      {/* controls below arena */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => { startGame(); }}
            className="px-4 py-2 rounded bg-accent text-white text-sm"
          >
            Restart
          </button>

          <button
            onClick={() => {
              setRunning(false); setPaused(false); setGameOver(true);
              if (timerRef.current) clearInterval(timerRef.current);
            }}
            className="px-4 py-2 rounded bg-slate-700 text-sm"
          >
            End
          </button>

          <button onClick={onPauseToggle} className="px-4 py-2 rounded bg-slate-700 text-sm">
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>

        {/* leaderboard stub */}
        <div className="bg-slate-800 rounded-lg p-3 text-sm w-64">
          <div className="text-xs text-slate-400 mb-2">Leaderboard (mock)</div>
          <ol className="list-decimal ml-4">
            {leaderboard.map((p, idx) => (
              <li key={idx}><span className="font-medium">{p.name}</span> — {p.score}</li>
            ))}
          </ol>
        </div>
      </div>

      {paused && <PauseOverlay onResume={onPauseToggle} />}
    </div>
  );
}
