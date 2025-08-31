import React from "react";

export default function PauseOverlay({ onResume, darkMode = false }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center p-3 sm:p-4 transition-colors duration-300 ${
        darkMode ? "bg-black/50" : "bg-white/50"
      }`}
    >
      <div
        className={`border p-5 sm:p-6 md:p-8 rounded-2xl text-center w-full max-w-xs sm:max-w-sm md:max-w-md shadow-lg transition-colors duration-300
          ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-black"}
        `}
      >
        <h2
          className={`text-base sm:text-lg md:text-2xl font-semibold mb-2 sm:mb-3 transition-colors duration-300 ${
            darkMode ? "text-white" : "text-black"
          }`}
        >
          Paused
        </h2>
        <p
          className={`mb-4 sm:mb-6 text-xs sm:text-sm md:text-base transition-colors duration-300 ${
            darkMode ? "text-slate-400" : "text-gray-700"
          }`}
        >
          Take a breather — click resume to continue.
        </p>
        <button
          onClick={onResume}
          className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium shadow-md hover:shadow-xl transition"
        >
          Resume
        </button>
      </div>
    </div>
  );
}
