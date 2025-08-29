import React from 'react';
import Game from './components/Game';

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Reaction Speed</h1>
          <p className="text-sm text-slate-400">Click the target. Speed up each round. Best score saved.</p>
        </header>

        <main>
          <Game />
        </main>

        <footer className="mt-6 text-xs text-slate-500 text-center">
          Built with React + Tailwind + Framer Motion — Demo assignment
        </footer>
      </div>
    </div>
  );
}
