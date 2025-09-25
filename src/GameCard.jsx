import React, { useState, useEffect } from 'react';
import { getMomentumAdjustedProbability, getTeamInfo, getGameSport, decimalToAmerican } from './utils';

export function GameCard({ game }) {
    const [awayProb, setAwayProb] = useState(50);
    
    useEffect(() => {
         const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
         setAwayProb(momentumResult.prob * 100);
    }, [game]);

    const awayTeamInfo = getTeamInfo(game.away_team);
    const homeTeamInfo = getTeamInfo(game.home_team);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden">
            <div className="relative"><span className="absolute -top-10 -left-10 text-xs font-bold uppercase px-3 py-1 rounded-br-lg rounded-tl-xl bg-blue-50 text-blue-800 dark:bg-slate-800 dark:text-blue-300">{getGameSport(game)}</span></div>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-8 items-start pt-4">
                <div className="flex items-center justify-around text-center">
                    <div className="flex flex-col items-center space-y-1 w-2/5">
                        <img src={awayTeamInfo.logo} alt={awayTeamInfo.name} className="h-16 w-16 md:h-20 md:w-20 object-contain mb-1" />
                        <span className="font-bold text-sm md:text-base leading-tight">{awayTeamInfo.name}</span>
                        <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">{decimalToAmerican(game.moneyline_away)}</span>
                    </div>
                    <div className="font-bold text-xl text-slate-400 dark:text-slate-500 pb-10">VS</div>
                    <div className="flex flex-col items-center space-y-1 w-2/5">
                         <img src={homeTeamInfo.logo} alt={homeTeamInfo.name} className="h-16 w-16 md:h-20 md:w-20 object-contain mb-1" />
                        <span className="font-bold text-sm md:text-base leading-tight">{homeTeamInfo.name}</span>
                        <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">{decimalToAmerican(game.moneyline_home)}</span>
                    </div>
                </div>
                <div>
                     <p className="text-center text-sm text-slate-500">Analysis controls and EV results will be fully migrated here.</p>
                     <p className="text-center font-mono mt-2">{awayProb.toFixed(1)}%</p>
                </div>
            </div>
        </div>
    );
}
