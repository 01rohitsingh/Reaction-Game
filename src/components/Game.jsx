import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HUD from "./HUD";
import PauseOverlay from "./PauseOverlay";

const START_TIME = 1.6;
const MIN_TIME = 0.45;
const TIME_DECREASE = 0.06;
const START_LIVES = 3;
const BEST_KEY = "reaction_speed_best_score";

function useBeep() {
  const ctxRef = useRef(null);
  return useCallback((freq = 440, duration = 0.08, vol = 0.12) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => o.stop(), duration * 1000);
    } catch (e) {}
  }, []);
}

export default function Game({ darkMode }) {
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

  useEffect(() => {
    fetch("/leaderboard-stub.json")
      .then((r) => r.json())
      .then((data) => {
        if (data?.leaderboard) setLeaderboard(data.leaderboard);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(BEST_KEY, String(best));
  }, [best]);

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

  const spawnTarget = useCallback(
    (visibleFor) => {
      const rect = arenaRef.current?.getBoundingClientRect();
      const padding = 70;
      let x = 50,
        y = 50;
      if (rect) {
        const W = rect.width - padding;
        const H = rect.height - padding;
        x = Math.max(40, Math.random() * W + 20);
        y = Math.max(40, Math.random() * H + 20);
      }
      setTargetPos({ x, y });
      setTimeLeft(visibleFor);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (paused) return prev;
          if (prev <= 0.05) {
            clearInterval(timerRef.current);
            setLives((lv) => {
              const newLives = lv - 1;
              if (newLives <= 0) endGame();
              else {
                const nextTime = Math.max(MIN_TIME, visibleFor - TIME_DECREASE);
                setRound((r) => r + 1);
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
    },
    [paused, beep]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const endGame = useCallback(() => {
    setRunning(false);
    setGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setBest((prev) => (score > prev ? (localStorage.setItem(BEST_KEY, String(score)), score) : prev));
  }, [score]);

  const handleClickTarget = useCallback(() => {
    if (!running || paused) return;
    setScore((s) => {
      const add = Math.ceil(100 * (timeLeft / timeVisible));
      beep(880, 0.06, 0.1);
      return s + add;
    });
    const nextTime = Math.max(MIN_TIME, timeVisible - TIME_DECREASE);
    setRound((r) => r + 1);
    setTimeVisible(nextTime);
    spawnTarget(nextTime);
  }, [timeLeft, timeVisible, running, paused, spawnTarget, beep]);

  const onPauseToggle = useCallback(() => {
    setPaused((p) => {
      const newP = !p;
      if (!newP && running && timeLeft > 0) spawnTarget(timeLeft);
      else if (newP && timerRef.current) clearInterval(timerRef.current);
      return newP;
    });
  }, [running, spawnTarget, timeLeft]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        if (!running) startGame();
        e.preventDefault();
      } else if (e.key.toLowerCase() === "p" && running) {
        onPauseToggle();
      } else if (e.key === "r") {
        startGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, startGame, onPauseToggle]);

  return (
    <div className="relative w-full">
      <HUD
        darkMode={darkMode}
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
        className={`relative h-[40vh] sm:h-[50vh] md:h-[56vh] max-h-[560px] rounded-lg overflow-hidden border
          ${darkMode ? "bg-black border-gray-800 text-white" : "bg-slate-200 border-gray-300 text-black"}`}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!running && !gameOver && (
            <div className="text-center pointer-events-auto px-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Reaction Speed</h2>
              <p className="mb-4 text-sm sm:text-base">
                Press <span className="font-medium">Space</span> to start
              </p>
              <button
                onClick={startGame}
                className="px-4 py-2 rounded bg-accent  text-sm sm:text-base"
              >
                Start
              </button>
            </div>
          )}

          {gameOver && (
            <div className="text-center pointer-events-auto px-4">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Game Over</h2>
              <p className="mb-2 text-sm sm:text-base">
                Your score: <span className="font-medium">{score}</span>
              </p>
              <p className="mb-4 text-sm sm:text-base">
                Best: <span className="font-medium">{best}</span>
              </p>
              <button
                onClick={startGame}
                className="px-4 py-2 rounded bg-accent  text-sm sm:text-base"
              >
                Restart
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {running && !paused && timeLeft > 0 && (
            <motion.button
              key={round + String(targetPos.x) + String(targetPos.y)}
              onClick={handleClickTarget}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 700, damping: 20 }}
              style={{ position: "absolute", left: targetPos.x, top: targetPos.y, translate: "-50% -50%" }}
              className={`pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full p-1 border-2
                ${darkMode ? "bg-gradient-to-br from-purple-600 to-indigo-900 border-white/10 text-white" : "bg-gradient-to-br from-accent to-indigo-500 border-white/10 text-slate-900"}`}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm
                  ${darkMode ? "bg-white/20 text-white" : "bg-white/90 text-slate-900"}`}
                >
                  Hit
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="absolute left-3 bottom-3 text-xs sm:text-sm">
          Round time: <span className="font-medium">{timeVisible.toFixed(2)}s</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startGame}
            className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm ${darkMode ? "bg-gray-700 text-white" : "bg-slate-700 text-white"}`}
          >
            Restart
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setPaused(false);
              setGameOver(true);
              if (timerRef.current) clearInterval(timerRef.current);
            }}
            className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm ${darkMode ? "bg-gray-700 text-white" : "bg-slate-700 text-white"}`}
          >
            End
          </button>
          <button
            onClick={onPauseToggle}
            className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm ${darkMode ? "bg-gray-700 text-white" : "bg-slate-700 text-white"}`}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>

        <div
          className={`rounded-lg p-3 text-xs sm:text-sm w-full md:w-64 ${
            darkMode ? "bg-[#151414f2] text-slate-300" : "bg-slate-200 text-slate-700"
          }`}
        >
          <div className="text-xs mb-2">Leaderboard (mock)</div>
          <ol className="list-decimal ml-4">
            {leaderboard.map((p, idx) => (
              <li key={idx}>
                <span className="font-medium">{p.name}</span> — {p.score}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {paused && <PauseOverlay darkMode={darkMode} onResume={onPauseToggle} />}
    </div>
  );
}
