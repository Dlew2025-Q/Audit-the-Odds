import React from 'react';

export function HelpModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl p-6 md:p-8 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">How It Works</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto pr-4 text-slate-600 dark:text-slate-400 space-y-4">
                    <p><strong>1. Fetch Data:</strong> The app starts by fetching today's (or tomorrow's, if it's late) games and the latest odds from The Odds API.</p>
                    <p><strong>2. Calculate Line Movement Momentum:</strong> For each game, the app makes a second API call to get the odds from **6 hours ago**. It compares these opening odds to the current odds to calculate the true line movement.</p>
                    <p><strong>3. Adjust Probability:</strong> The initial probability for each team is adjusted based on this line movement. A line moving in a team's favor indicates positive market momentum. This is reflected in the initial position of the slider and the trend arrow (⬆️ or ⬇️).</p>
                    <p><strong>4. Calculate Expected Value (EV):</strong> As you adjust the "True Probability" slider, the app instantly calculates the Expected Value for every available bet.</p>
                    <p><strong>5. Calculate Kelly Criterion Bet Size:</strong> When you enter a bankroll and click "Build Kelly Bets", the app calculates the optimal bet size for the highest +EV opportunity in each qualifying game.</p>
                </div>
            </div>
        </div>
    );
}
