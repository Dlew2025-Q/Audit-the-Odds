import React from 'react';

export function Header({ onHelpClick }) {
    // This could later manage its own state for theme toggling etc.
    return (
        <header className="sticky top-4 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
             <button onClick={onHelpClick} className="absolute top-4 left-4 p-2 rounded-full focus:outline-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            </button>
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-slate-900 dark:text-white">
                    Audit the Odds
                    <span className="text-lg align-middle font-medium text-slate-500 dark:text-slate-400">v12.1</span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    Find value by analyzing live betting lines for today's games.
                </p>
            </div>
        </header>
    );
}
