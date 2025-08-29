import React from 'react';

export default function PauseOverlay({ onResume }) {
  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">Paused</h2>
        <p className="text-slate-400 mb-4">Take a breather — click resume to continue.</p>
        <button onClick={onResume} className="px-4 py-2 rounded bg-accent text-white">Resume</button>
      </div>
    </div>
  );
}
