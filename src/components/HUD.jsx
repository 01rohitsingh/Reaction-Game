import React from 'react';

export default function HUD({ score, best, round, timeLeft, paused, onPauseToggle, lives }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-3">
      <div className="flex items-center gap-3">
        <div className="bg-slate-700 px-3 py-2 rounded-lg">
          <div className="text-xs text-slate-400">Score</div>
          <div className="text-lg  font-medium">{score}</div>
        </div>
        <div className="bg-slate-700 px-3 py-2 rounded-lg">
          <div className="text-xs text-slate-400">Best</div>
          <div className="text-lg">{best}</div>
        </div>
        <div className="bg-slate-700 px-3 py-2 rounded-lg">
          <div className="text-xs text-slate-400">Round</div>
          <div className="text-lg">{round}</div>
        </div>
        <div className="bg-slate-700 px-3 py-2 rounded-lg">
          <div className="text-xs text-slate-400">Lives</div>
          <div className="text-lg">{'❤️'.repeat(lives)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-slate-700 px-3 py-2 rounded-lg text-center">
          <div className="text-xs text-slate-400">Time</div>
          <div className="text-lg">{timeLeft.toFixed(2)}s</div>
        </div>

        <button
          onClick={onPauseToggle}
          className=" bg-slate-700 px-3 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-sm"
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </div>
  );
}
