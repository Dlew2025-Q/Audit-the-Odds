import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Helper Functions (Pure Logic) ---
// All helper functions from utils.js are included here to meet the single-file mandate.

const getNoVigProb = (odds1, odds2) => {
    if (!odds1 || !odds2) return 0.5;
    const implied1 = 1 / odds1;
    const implied2 = 1 / odds2;
    const totalImplied = implied1 + implied2;
    if (totalImplied === 0) return 0.5;
    return implied1 / totalImplied;
};

const decimalToAmerican = (decimalOdds) => {
    if (isNaN(decimalOdds) || decimalOdds <= 1) return 'N/A';
    if (decimalOdds >= 2.0) return `+${((decimalOdds - 1) * 100).toFixed(0)}`;
    return `${(-100 / (decimalOdds - 1)).toFixed(0)}`;
};

const americanToDecimal = (americanOdds) => {
    const num = parseFloat(americanOdds);
    if (isNaN(num)) return NaN;
    if (num >= 100) return (num / 100) + 1;
    if (num <= -100) return (100 / Math.abs(num)) + 1;
    return NaN;
};

const calculateEV = (winProb, decimalOdds) => (winProb * (decimalOdds - 1)) - (1 - winProb);

const getMomentumAdjustedProbability = (currentGame, historicalGame) => {
    const currentAwayProb = getNoVigProb(currentGame.moneyline_away, currentGame.moneyline_home);
    if (!historicalGame) return { prob: currentAwayProb, status: 'no_data', shift: 0 };
    const historicalBookmaker = historicalGame.bookmakers?.[0];
    if (!historicalBookmaker) return { prob: currentAwayProb, status: 'no_data', shift: 0 };
    const historicalMoneyline = historicalBookmaker.markets.find(m => m.key === 'h2h');
    const historicalAwayOutcome = historicalMoneyline?.outcomes.find(o => o.name === currentGame.away_team);
    const historicalHomeOutcome = historicalMoneyline?.outcomes.find(o => o.name === currentGame.home_team);
    if (!historicalAwayOutcome || !historicalHomeOutcome) return { prob: currentAwayProb, status: 'no_data', shift: 0 };
    const openingAwayProb = getNoVigProb(historicalAwayOutcome.price, historicalHomeOutcome.price);
    const probabilityShift = currentAwayProb - openingAwayProb;
    let adjustedProb = currentAwayProb + probabilityShift;
    adjustedProb = Math.max(0.01, Math.min(0.99, adjustedProb));
    return { prob: adjustedProb, status: 'ok', shift: probabilityShift };
};

const LOGO_BASE_URL = 'https://a.espncdn.com/i/teamlogos';
const TEAM_INFO = {
    'Arizona Cardinals': { id: '134931', logoId: 'nfl/500/ari.png' },'Atlanta Falcons': { id: '134919', logoId: 'nfl/500/atl.png' },'Baltimore Ravens': { id: '134925', logoId: 'nfl/500/bal.png' },'Buffalo Bills': { id: '134910', logoId: 'nfl/500/buf.png' },'Carolina Panthers': { id: '134932', logoId: 'nfl/500/car.png' },'Chicago Bears': { id: '134914', logoId: 'nfl/500/chi.png' },'Cincinnati Bengals': { id: '134916', logoId: 'nfl/500/cin.png' },'Cleveland Browns': { id: '134915', logoId: 'nfl/500/cle.png' },'Dallas Cowboys': { id: '134923', logoId: 'nfl/500/dal.png' },'Denver Broncos': { id: '134926', logoId: 'nfl/500/den.png' },'Detroit Lions': { id: '134913', logoId: 'nfl/500/det.png' },'Green Bay Packers': { id: '134912', logoId: 'nfl/500/gb.png' },'Houston Texans': { id: '134938', logoId: 'nfl/500/hou.png' },'Indianapolis Colts': { id: '134918', logoId: 'nfl/500/ind.png' },'Jacksonville Jaguars': { id: '134933', logoId: 'nfl/500/jax.png' },'Kansas City Chiefs': { id: '134921', logoId: 'nfl/500/kc.png' },'Las Vegas Raiders': { id: '134922', logoId: 'nfl/500/lv.png' },'Los Angeles Chargers': { id: '134928', logoId: 'nfl/500/lac.png' },'Los Angeles Rams': { id: '134930', logoId: 'nfl/500/lar.png' },'Miami Dolphins': { id: '134909', logoId: 'nfl/500/mia.png' },'Minnesota Vikings': { id: '134911', logoId: 'nfl/500/min.png' },'New England Patriots': { id: '134908', logoId: 'nfl/500/ne.png' },'New Orleans Saints': { id: '134927', logoId: 'nfl/500/no.png' },'New York Giants': { id: '134924', logoId: 'nfl/500/nyg.png' },'New York Jets': { id: '134907', logoId: 'nfl/500/nyj.png' },'Philadelphia Eagles': { id: '134920', logoId: 'nfl/500/phi.png' },'Pittsburgh Steelers': { id: '134917', logoId: 'nfl/500/pit.png' },'San Francisco 49ers': { id: '134929', logoId: 'nfl/500/sf.png' },'Seattle Seahawks': { id: '134934', logoId: 'nfl/500/sea.png' },'Tampa Bay Buccaneers': { id: '134935', logoId: 'nfl/500/tb.png' },'Tennessee Titans': { id: '134936', logoId: 'nfl/500/ten.png' },'Washington Commanders': { id: '134937', logoId: 'nfl/500/wsh.png' },'Atlanta Hawks': { id: '134873', logoId: 'nba/500/atl.png' },'Boston Celtics': { id: '134860', logoId: 'nba/500/bos.png' },'Brooklyn Nets': { id: '134861', logoId: 'nba/500/bkn.png' },'Charlotte Hornets': { id: '134874', logoId: 'nba/500/cha.png' },'Chicago Bulls': { id: '134868', logoId: 'nba/500/chi.png' },'Cleveland Cavaliers': { id: '134867', logoId: 'nba/500/cle.png' },'Dallas Mavericks': { id: '134888', logoId: 'nba/500/dal.png' },'Denver Nuggets': { id: '134881', logoId: 'nba/500/den.png' },'Detroit Pistons': { id: '134866', logoId: 'nba/500/det.png' },'Golden State Warriors': { id: '134878', logoId: 'nba/500/gsw.png' },'Houston Rockets': { id: '134887', logoId: 'nba/500/hou.png' },'Indiana Pacers': { id: '134865', logoId: 'nba/500/ind.png' },'Los Angeles Clippers': { id: '134877', logoId: 'nba/500/lac.png' },'Los Angeles Lakers': { id: '134876', logoId: 'nba/500/lal.png' },'Memphis Grizzlies': { id: '134889', logoId: 'nba/500/mem.png' },'Miami Heat': { id: '134875', logoId: 'nba/500/mia.png' },'Milwaukee Bucks': { id: '134864', logoId: 'nba/500/mil.png' },'Minnesota Timberwolves': { id: '134880', logoId: 'nba/500/min.png' },'New Orleans Pelicans': { id: '134890', logoId: 'nba/500/no.png' },'New York Knicks': { id: '134862', logoId: 'nba/500/nyk.png' },'Oklahoma City Thunder': { id: '134883', logoId: 'nba/500/okc.png' },'Orlando Magic': { id: '134872', logoId: 'nba/500/orl.png' },'Philadelphia 76ers': { id: '134863', logoId: 'nba/500/phi.png' },'Phoenix Suns': { id: '134879', logoId: 'nba/500/phx.png' },'Portland Trail Blazers': { id: '134882', logoId: 'nba/500/por.png' },'Sacramento Kings': { id: '134884', logoId: 'nba/500/sac.png' },'San Antonio Spurs': { id: '134886', logoId: 'nba/500/sa.png' },'Toronto Raptors': { id: '134869', logoId: 'nba/500/tor.png' },'Utah Jazz': { id: '134885', logoId: 'nba/500/utah.png' },'Washington Wizards': { id: '134871', logoId: 'nba/500/wsh.png' },'Arizona Diamondbacks': { id: '134891', logoId: 'mlb/500/ari.png' },'Atlanta Braves': { id: '134879', logoId: 'mlb/500/atl.png' },'Baltimore Orioles': { id: '134897', logoId: 'mlb/500/bal.png' },'Boston Red Sox': { id: '134884', logoId: 'mlb/500/bos.png' },'Chicago Cubs': { id: '134882', logoId: 'mlb/500/chc.png' },'Chicago White Sox': { id: '134902', logoId: 'mlb/500/chw.png' },'Cincinnati Reds': { id: '134883', logoId: 'mlb/500/cin.png' },'Cleveland Guardians': { id: '134903', logoId: 'mlb/500/cle.png' },'Colorado Rockies': { id: '134890', logoId: 'mlb/500/col.png' },'Detroit Tigers': { id: '134904', logoId: 'mlb/500/det.png' },'Houston Astros': { id: '134886', logoId: 'mlb/500/hou.png' },'Kansas City Royals': { id: '134905', logoId: 'mlb/500/kc.png' },'Los Angeles Angels': { id: '134901', logoId: 'mlb/500/laa.png' },'Los Angeles Dodgers': { id: '134880', logoId: 'mlb/500/lad.png' },'Miami Marlins': { id: '134878', logoId: 'mlb/500/mia.png' },'Milwaukee Brewers': { id: '134885', logoId: 'mlb/500/mil.png' },'Minnesota Twins': { id: '134906', logoId: 'mlb/500/min.png' },'New York Mets': { id: '134877', logoId: 'mlb/500/nym.png' },'New York Yankees': { id: '134899', logoId: 'mlb/500/nyy.png' },'Oakland Athletics': { id: '134900', logoId: 'mlb/500/oak.png' },'Philadelphia Phillies': { id: '134876', logoId: 'mlb/500/phi.png' },'Pittsburgh Pirates': { id: '134881', logoId: 'mlb/500/pit.png' },'San Diego Padres': { id: '134892', logoId: 'mlb/500/sd.png' },'San Francisco Giants': { id: '134893', logoId: 'mlb/500/sf.png' },'Seattle Mariners': { id: '134896', logoId: 'mlb/500/sea.png' },'St. Louis Cardinals': { id: '134888', logoId: 'mlb/500/stl.png' },'Tampa Bay Rays': { id: '134898', logoId: 'mlb/500/tb.png' },'Texas Rangers': { id: '134895', logoId: 'mlb/500/tex.png' },'Toronto Blue Jays': { id: '134894', logoId: 'mlb/500/tor.png' },'Washington Nationals': { id: '134875', logoId: 'mlb/500/wsh.png' },'BC Lions': { id: '135246', logoId: 'cfl/500/bc.png' },'Calgary Stampeders': { id: '135248', logoId: 'cfl/500/cgy.png' },'Edmonton Elks': { id: '135247', logoId: 'cfl/500/edm.png' },'Saskatchewan Roughriders': { id: '135249', logoId: 'cfl/500/ssk.png' },'Winnipeg Blue Bombers': { id: '135250', logoId: 'cfl/500/wpg.png' },'Hamilton Tiger-Cats': { id: '135251', logoId: 'cfl/500/ham.png' },'Toronto Argonauts': { id: '135252', logoId: 'cfl/500/tor.png' },'Ottawa Redblacks': { id: '137459', logoId: 'cfl/500/ott.png' },'Montreal Alouettes': { id: '135253', logoId: 'cfl/500/mtl.png' },'Alabama Crimson Tide': { id: '134803', logoId: 'ncf/500/333.png' },'Georgia Bulldogs': { id: '134804', logoId: 'ncf/500/61.png' },'Ohio State Buckeyes': { id: '134798', logoId: 'ncf/500/194.png' },'Michigan Wolverines': { id: '134805', logoId: 'ncf/500/130.png' },'Texas Longhorns': { id: '134823', logoId: 'ncf/500/251.png' },'USC Trojans': { id: '134840', logoId: 'ncf/500/30.png' },'Notre Dame Fighting Irish': { id: '134802', logoId: 'ncf/500/87.png' },'Clemson Tigers': { id: '134812', logoId: 'ncf/500/228.png' },'LSU Tigers': { id: '134807', logoId: 'ncf/500/99.png' },'Penn State Nittany Lions': { id: '134799', logoId: 'ncf/500/213.png' },
};
const getTeamInfo = (teamName) => {
    if (!teamName) return { name: 'Unknown', logo: '', id: null };
    const teamKey = Object.keys(TEAM_INFO).find(key => teamName.includes(key));
    if (teamKey && TEAM_INFO[teamKey]) {
        const info = TEAM_INFO[teamKey];
        const logo = info.logoId ? `${LOGO_BASE_URL}/${info.logoId}` : `https://placehold.co/96x96/e2e8f0/64748b?text=${teamName.substring(0,2)}`;
        return { name: teamName, logo: logo, id: info.id };
    }
    return { name: teamName, logo: `https://placehold.co/96x96/e2e8f0/64748b?text=${teamName.substring(0,2)}`, id: null };
};
const SPORT_MAP = { 'NFL': 'Football', 'CFL': 'Football', 'NCAAF': 'Football', 'MLB': 'Baseball', 'NBA': 'Basketball', 'WNBA': 'Basketball', 'SOCCER': 'Soccer', 'NHL': 'Hockey', 'NCAAB': 'Basketball' };
const getGameSport = (game) => {
     if (game.sport_key && SPORT_MAP[game.sport_key.toUpperCase().split('_')[1]]) { return SPORT_MAP[game.sport_key.toUpperCase().split('_')[1]]; }
     if(game.sport_title && SPORT_MAP[game.sport_title]) return SPORT_MAP[game.sport_title];
    return 'Unknown';
};

const kellyCriterion = (winProb, odds) => (winProb * (odds - 1) - (1 - winProb)) / (odds - 1);
const calculateKellyBet = (bankroll, game) => {
    if (!game.bestEVBet) return null;
    const { winProb, odds } = game.bestEVBet;
    const kellyFraction = kellyCriterion(winProb, odds);
    return bankroll * kellyFraction;
};

// --- Child Components (nested) ---
function Header({ onHelpClick }) {
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
function GameCard({ game, addBet }) {
    const [awayProb, setAwayProb] = useState(50);
    const [trueAwayProb, setTrueAwayProb] = useState(50);
    const [evAway, setEvAway] = useState(0);
    const [evHome, setEvHome] = useState(0);
    const awayTeamInfo = getTeamInfo(game.away_team);
    const homeTeamInfo = getTeamInfo(game.home_team);

    useEffect(() => {
        const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
        const initialProb = momentumResult.prob * 100;
        setAwayProb(initialProb);
        setTrueAwayProb(initialProb);
    }, [game]);

    const handleSliderChange = (e) => {
        const newProb = parseFloat(e.target.value);
        setTrueAwayProb(newProb);
        const homeProb = 100 - newProb;
        setEvAway(calculateEV(newProb / 100, game.moneyline_away));
        setEvHome(calculateEV(homeProb / 100, game.moneyline_home));
    };

    const handleBetClick = (teamName, odds) => {
        const betType = teamName === game.away_team ? 'Moneyline' : 'Moneyline';
        const ev = teamName === game.away_team ? evAway : evHome;
        const bet = {
            id: `${game.id}-${teamName}`,
            gameId: game.id,
            team: teamName,
            odds: odds,
            ev: ev,
            betType: betType,
            sport: getGameSport(game),
        };
        addBet(bet);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden">
            <div className="relative"><span className="absolute -top-10 -left-10 text-xs font-bold uppercase px-3 py-1 rounded-br-lg rounded-tl-xl bg-blue-50 text-blue-800 dark:bg-slate-800 dark:text-blue-300">{getGameSport(game)}</span></div>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-8 items-start pt-4">
                <div className="flex items-center justify-around text-center">
                    <div className="flex flex-col items-center space-y-1 w-2/5">
                        <img src={awayTeamInfo.logo} alt={awayTeamInfo.name} className="h-16 w-16 md:h-20 md:w-20 object-contain mb-1" />
                        <span className="font-bold text-sm md:text-base leading-tight">{awayTeamInfo.name}</span>
                        <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">{decimalToAmerican(game.moneyline_away)}</span>
                        <button onClick={() => handleBetClick(awayTeamInfo.name, game.moneyline_away)} className="utility-btn text-sm">Add</button>
                    </div>
                    <div className="font-bold text-xl text-slate-400 dark:text-slate-500 pb-10">VS</div>
                    <div className="flex flex-col items-center space-y-1 w-2/5">
                         <img src={homeTeamInfo.logo} alt={homeTeamInfo.name} className="h-16 w-16 md:h-20 md:w-20 object-contain mb-1" />
                        <span className="font-bold text-sm md:text-base leading-tight">{homeTeamInfo.name}</span>
                        <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">{decimalToAmerican(game.moneyline_home)}</span>
                        <button onClick={() => handleBetClick(homeTeamInfo.name, game.moneyline_home)} className="utility-btn text-sm">Add</button>
                    </div>
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold">True Probability:</span>
                            <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{trueAwayProb.toFixed(1)}%</span>
                        </div>
                        <input type="range" min="1" max="99" value={trueAwayProb} onChange={handleSliderChange} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-700" />
                    </div>
                    <div className="flex flex-col space-y-2 text-sm text-center">
                        <div className="flex justify-between items-center bg-green-50 rounded-lg p-2 dark:bg-green-900/20 dark:text-green-400">
                             <span className="font-semibold">{awayTeamInfo.name} EV:</span>
                             <span className="font-mono">{evAway.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-red-50 rounded-lg p-2 dark:bg-red-900/20 dark:text-red-400">
                            <span className="font-semibold">{homeTeamInfo.name} EV:</span>
                            <span className="font-mono">{evHome.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FilterControls({ filters, setFilters, resetApp, handleBuildKellyBets, handleGenerateParlayClick }) {
    return (
        <div className="mb-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
             <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={filters.showPositiveEVOnly} onChange={(e) => setFilters(prev => ({ ...prev, showPositiveEVOnly: e.target.checked }))} className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                    <span className="text-sm">Only Show +EV</span>
                </label>
                 <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={filters.fadeMomentum} onChange={(e) => setFilters(prev => ({ ...prev, fadeMomentum: e.target.checked }))} className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                    <span className="text-sm">Fade Momentum</span>
                </label>
            </div>
            <div className="flex justify-between items-center mt-4">
                <button onClick={resetApp} className="utility-btn text-sm">New Analysis</button>
                <button onClick={handleBuildKellyBets} className="utility-btn text-sm">Build Kelly Bets</button>
                <button onClick={handleGenerateParlayClick} className="utility-btn text-sm">Generate Parlay</button>
            </div>
        </div>
    );
}

function BetSlip({ betSlip, clearBetSlip, removeBet, copyBetSlip }) {
    return (
        <div className="lg:order-last lg:col-span-1">
             <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                 <h3 className="text-lg font-semibold mb-3 text-center">My Bet Slip</h3>
                 {betSlip.length === 0 ? (
                    <p className="text-center text-sm text-slate-500 py-4">Your bet slip is empty.</p>
                 ) : (
                    <ul className="space-y-3">
                        {betSlip.map(bet => (
                             <li key={bet.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-slate-800">
                                 <div>
                                     <p className="text-sm font-semibold">{bet.team}</p>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">
                                         Odds: {decimalToAmerican(bet.odds)} | EV: {bet.ev.toFixed(2)}%
                                     </p>
                                 </div>
                                 <button onClick={() => removeBet(bet.id)} className="text-red-500 hover:text-red-700">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                 </button>
                             </li>
                        ))}
                    </ul>
                 )}
                 {betSlip.length > 0 && (
                    <div className="flex justify-between mt-4">
                        <button onClick={clearBetSlip} className="utility-btn text-sm">Clear</button>
                        <button onClick={copyBetSlip} className="utility-btn text-sm">Copy Slip</button>
                    </div>
                 )}
             </div>
         </div>
    );
}
function HelpModal({ onClose }) {
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

function RoundRobinModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl p-6 md:p-8 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Round Robin Builder</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto pr-4 text-slate-600 dark:text-slate-400 space-y-4">
                    <p>This modal will contain the UI for building a round robin parlay from your bet slip. Functionality to be implemented.</p>
                </div>
            </div>
        </div>
    );
}

function StrategyParlayModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl p-6 md:p-8 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Strategy Parlay Builder</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto pr-4 text-slate-600 dark:text-slate-400 space-y-4">
                    <p>This modal will contain the UI for generating a parlay based on your pre-defined strategies. Functionality to be implemented.</p>
                </div>
            </div>
        </div>
    );
}

// --- Main App Component ---

export default function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAnalyzed, setIsAnalyzed] = useState(false);
    const [allGames, setAllGames] = useState([]);
    const [betSlip, setBetSlip] = useState([]);
    const [filters, setFilters] = useState({
        showPositiveEVOnly: false,
        sortBy: 'commence_time',
        minOdds: 1,
        minMomentum: 0,
        bankroll: 100,
        homeTeamsOnly: false,
        fadeMomentum: false,
    });
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isRoundRobinModalOpen, setIsRoundRobinModalOpen] = useState(false);
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
    
    const oddsApiKey = 'cc51a757d14174fd8061956b288df39e';

    const fetchAndAnalyzeGames = async () => {
        setIsLoading(true);
        setError(null);
        if (!oddsApiKey || oddsApiKey === 'YOUR_PAID_API_KEY_HERE') {
            setError("The Odds API key is missing. Please add your paid key.");
            setIsLoading(false);
            return;
        }
        
        try {
            const sportsApiUrl = `https://api.the-odds-api.com/v4/sports/?apiKey=${oddsApiKey}`;
            const sportsResponse = await fetch(sportsApiUrl);
            if (!sportsResponse.ok) throw new Error('Failed to fetch sports list. Your API key may be invalid.');
            const availableSports = await sportsResponse.json();
            const desiredSportTitles = ['NFL', 'MLB', 'NBA', 'NHL', 'WNBA', 'CFL', 'NCAAF', 'NCAAB', 'Premier League'];
            const activeSports = availableSports.filter(sport => desiredSportTitles.includes(sport.title));

            if (activeSports.length === 0) throw new Error("No desired sports could be found in the API's list.");
            
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (now.getHours() >= 21) {
                startDate.setDate(now.getDate() + 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(now.getDate() + 1);
                endDate.setHours(23, 59, 59, 999);
            } else {
                endDate.setHours(23, 59, 59, 999);
            }

            const commenceTimeFrom = startDate.toISOString().slice(0, 19) + 'Z';
            const commenceTimeTo = endDate.toISOString().slice(0, 19) + 'Z';
            const historicalTimestamp = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 19) + 'Z';

            const oddsPromises = activeSports.map(sport => {
                const currentUrl = `https://api.the-odds-api.com/v4/sports/${sport.key}/odds?apiKey=${oddsApiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}`;
                const historicalUrl = `https://api.the-odds-api.com/v4/historical/sports/${sport.key}/odds?apiKey=${oddsApiKey}&regions=us&markets=h2h&date=${historicalTimestamp}`;
                return Promise.all([fetch(currentUrl).then(res => res.json()), fetch(historicalUrl).then(res => res.json())]);
            });

            const allResponses = await Promise.all(oddsPromises);
            let fetchedGames = [];
            const historicalDataMap = new Map();

            allResponses.forEach(responsePair => {
                const currentGames = responsePair[0];
                const historicalGames = responsePair[1].data || [];
                if(Array.isArray(currentGames)) fetchedGames.push(...currentGames);
                historicalGames.forEach(game => historicalDataMap.set(game.id, game));
            });

            if (fetchedGames.length === 0) throw new Error("No upcoming games found for the selected time frame.");

            const processedGames = fetchedGames.map(game => {
                const bookmaker = game.bookmakers?.[0];
                if(!bookmaker) return null;
                const moneylineMarket = bookmaker.markets.find(m => m.key === 'h2h');
                const awayML = moneylineMarket?.outcomes.find(o => o.name === game.away_team)?.price;
                const homeML = moneylineMarket?.outcomes.find(o => o.name === game.home_team)?.price;
                
                return { 
                    id: game.id,
                    sport_key: game.sport_key,
                    sport_title: game.sport_title,
                    commence_time: game.commence_time,
                    home_team: game.home_team,
                    away_team: game.away_team,
                    moneyline_away: awayML, 
                    moneyline_home: homeML, 
                    historicalData: historicalDataMap.get(game.id) 
                };
            }).filter(g => g !== null);

            setAllGames(processedGames);
            setIsAnalyzed(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetApp = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setIsAnalyzed(false);
        setAllGames([]);
        setBetSlip([]);
    }, []);

    const toggleHelpModal = useCallback(() => setIsHelpModalOpen(prev => !prev), []);
    const toggleRoundRobinModal = useCallback(() => setIsRoundRobinModalOpen(prev => !prev), []);
    const toggleStrategyModal = useCallback(() => setIsStrategyModalOpen(prev => !prev), []);

    const addBet = useCallback((bet) => {
        setBetSlip(prev => {
            const exists = prev.some(b => b.id === bet.id);
            if (!exists) {
                return [...prev, bet];
            }
            return prev;
        });
    }, []);

    const removeBet = useCallback((id) => {
        setBetSlip(prev => prev.filter(bet => bet.id !== id));
    }, []);

    const clearBetSlip = useCallback(() => setBetSlip([]), []);

    const copyBetSlip = useCallback(() => {
        const betSlipText = betSlip.map(bet => {
            const evDisplay = bet.ev >= 0 ? `+${bet.ev.toFixed(2)}%` : `${bet.ev.toFixed(2)}%`;
            return `Bet: ${bet.team} | Odds: ${decimalToAmerican(bet.odds)} | EV: ${evDisplay}`;
        }).join('\n');

        const header = `Audit the Odds Bet Slip\nGenerated on: ${new Date().toLocaleString()}\n---\n`;
        const footer = `\n---\nFind value at audittheodds.com`;
        
        const textToCopy = header + betSlipText + footer;
        
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = textToCopy;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);

    }, [betSlip]);

    const handleBuildKellyBets = useCallback(() => {
        const kellyBets = allGames
            .map(game => {
                const awayEV = calculateEV(game.moneyline_away, getMomentumAdjustedProbability(game, game.historicalData).prob);
                const homeEV = calculateEV(game.moneyline_home, 1 - getMomentumAdjustedProbability(game, game.historicalData).prob);
                
                let bestEVBet = null;
                if (awayEV > homeEV && awayEV > 0) {
                    bestEVBet = { team: game.away_team, odds: game.moneyline_away, ev: awayEV, winProb: getMomentumAdjustedProbability(game, game.historicalData).prob };
                } else if (homeEV > awayEV && homeEV > 0) {
                     bestEVBet = { team: game.home_team, odds: game.moneyline_home, ev: homeEV, winProb: 1 - getMomentumAdjustedProbability(game, game.historicalData).prob };
                }

                if (bestEVBet) {
                    const kellyBetSize = calculateKellyBet(filters.bankroll, { bestEVBet });
                    if (kellyBetSize > 0) {
                        return {
                            ...bestEVBet,
                            betSize: kellyBetSize,
                            gameId: game.id,
                            sport: getGameSport(game)
                        };
                    }
                }
                return null;
            })
            .filter(bet => bet !== null);

        setBetSlip(kellyBets.map(bet => ({
            id: `${bet.gameId}-${bet.team}`,
            gameId: bet.gameId,
            team: bet.team,
            odds: bet.odds,
            ev: bet.ev,
            betType: 'Moneyline',
            sport: bet.sport,
            betSize: bet.betSize,
        })));

    }, [allGames, filters.bankroll]);

    const handleGenerateParlayClick = useCallback(() => {
        // Placeholder for future implementation
        toggleStrategyModal();
    }, [toggleStrategyModal]);

    const filteredGames = useMemo(() => {
        let filtered = allGames;

        // Apply filters
        if (filters.showPositiveEVOnly) {
            filtered = filtered.filter(game => {
                const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
                const awayEV = calculateEV(momentumResult.prob, game.moneyline_away);
                const homeEV = calculateEV(1 - momentumResult.prob, game.moneyline_home);
                return awayEV > 0 || homeEV > 0;
            });
        }
        if (filters.homeTeamsOnly) {
             filtered = filtered.filter(game => {
                const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
                const homeEV = calculateEV(1 - momentumResult.prob, game.moneyline_home);
                return homeEV > 0;
            });
        }
        if (filters.fadeMomentum) {
             filtered = filtered.filter(game => {
                const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
                const evAway = calculateEV(1 - momentumResult.prob, game.moneyline_home);
                const evHome = calculateEV(momentumResult.prob, game.moneyline_away);
                return evAway > 0 || evHome > 0;
            });
        }
        // TODO: Add other filters here
        
        return filtered;
    }, [allGames, filters]);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
            <Header onHelpClick={toggleHelpModal} />
            <main className="mt-8">
                {!isAnalyzed && !isLoading && (
                    <div className="text-center my-12">
                        <button onClick={fetchAndAnalyzeGames} className="text-xl font-semibold py-4 px-10 rounded-xl transition-transform transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:focus:ring-offset-slate-900">
                            Analyze Today's Games
                        </button>
                    </div>
                )}
                {isLoading && (
                    <div className="text-center py-10">
                         <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p id="processing-text" className="mt-4 text-slate-500 dark:text-slate-400">Fetching data...</p>
                    </div>
                )}
                {error && (
                    <div className="text-center p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                        <button onClick={resetApp} className="utility-btn ml-4">Reset</button>
                    </div>
                )}
                {isAnalyzed && !isLoading && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
                         <BetSlip betSlip={betSlip} clearBetSlip={clearBetSlip} removeBet={removeBet} copyBetSlip={copyBetSlip} />
                        <div className="lg:order-first lg:col-span-2">
                            <FilterControls filters={filters} setFilters={setFilters} resetApp={resetApp} handleBuildKellyBets={handleBuildKellyBets} handleGenerateParlayClick={handleGenerateParlayClick} />
                            <div className="grid grid-cols-1 gap-6">
                                {filteredGames.map((game) => (
                                    <GameCard key={game.id} game={game} addBet={addBet} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {isHelpModalOpen && <HelpModal onClose={toggleHelpModal} />}
            {isRoundRobinModalOpen && <RoundRobinModal onClose={toggleRoundRobinModal} />}
            {isStrategyModalOpen && <StrategyParlayModal onClose={toggleStrategyModal} />}
        </div>
    );
}
