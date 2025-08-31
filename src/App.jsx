import React, { useState, useEffect } from "react";
import Game from "./components/Game";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Body background and text color
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("bg-black", "text-white");
      document.body.classList.remove("bg-white", "text-black");
    } else {
      document.body.classList.add("bg-white", "text-black");
      document.body.classList.remove("bg-black", "text-white");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen w-full flex flex-col transition-colors duration-300">
      {/* Header */}
      <header
        className={`flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shadow-md transition-colors duration-300
        ${darkMode ? "bg-[#151414f2] text-[#f1f1f1]" : "bg-[#a5bacd] text-[#333333]"} rounded-lg`}
      >
        <h1 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-0">
          Reaction Speed
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <p className="text-xs sm:text-sm  hidden md:block text-center sm:text-left">
            Click the target. Speed up each round. Best score saved.
          </p>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 sm:px-4 py-1 rounded-lg border border-gray-400 
              bg-transparent hover:bg-gray-300 hover:text-black 
              dark:hover:bg-gray-900 dark:hover:text-white transition text-sm sm:text-base"
          >
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Game darkMode={darkMode} />
      </main>

      {/* Footer */}
      <footer
        className={`px-4 sm:px-6 py-3 sm:py-4 mt-4 shadow-md transition-colors duration-300
        ${darkMode ? "bg-[#151414f2] text-[#f1f1f1]" : "bg-[#a5bacd] text-[#111111]"} rounded-lg text-center`}
      >
        <p className="text-xs sm:text-sm">
          • Best: 12345 • Press to restart • © 2025 Rohit
        </p>
      </footer>
    </div>
  );
}
