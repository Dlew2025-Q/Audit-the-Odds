import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Helper Functions (Pure Logic) ---
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

const calculateEV = (winProb, decimalOdds) => {
    if (!winProb || !decimalOdds) return -Infinity;
    return (winProb * (decimalOdds - 1)) - (1 - winProb);
}

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
    'Arizona Cardinals': { id: '134931', logoId: 'nfl/500/ari.png' },'Atlanta Falcons': { id: '134919', logoId: 'nfl/500/atl.png' },'Baltimore Ravens': { id: '134925', logoId: 'nfl/500/bal.png' },'Buffalo Bills': { id: '134910', logoId: 'nfl/500/buf.png' },'Carolina Panthers': { id: '134932', logoId: 'nfl/500/car.png' },'Chicago Bears': { id: '134914', logoId: 'nfl/500/chi.png' },'Cincinnati Bengals': { id: '134916', logoId: 'nfl/500/cin.png' },'Cleveland Browns': { id: '134915', logoId: 'nfl/500/cle.png' },'Dallas Cowboys': { id: '134923', logoId: 'nfl/500/dal.png' },'Denver Broncos': { id: '134926', logoId: 'nfl/500/den.png' },'Detroit Lions': { id: '134913', logoId: 'nfl/500/det.png' },'Green Bay Packers': { id: '134912', logoId: 'nfl/500/gb.png' },'Houston Texans': { id: '134938', logoId: 'nfl/500/hou.png' },'Indianapolis Colts': { id: '134918', logoId: 'nfl/500/ind.png' },'Jacksonville Jaguars': { id: '134933', logoId: 'nfl/500/jax.png' },'Kansas City Chiefs': { id: '134921', logoId: 'nfl/500/kc.png' },'Las Vegas Raiders': { id: '134922', logoId: 'nfl/500/lv.png' },'Los Angeles Chargers': { id: '134928', logoId: 'nfl/500/lac.png' },'Los Angeles Rams': { id: '134930', logoId: 'nfl/500/lar.png' },'Miami Dolphins': { id: '134909', logoId: 'nfl/500/mia.png' },'Minnesota Vikings': { id: '134911', logoId: 'nfl/500/min.png' },'New England Patriots': { id: '134908', logoId: 'nfl/500/ne.png' },'New Orleans Saints': { id: '134927', logoId: 'nfl/500/no.png' },'New York Giants': { id: '134924', logoId: 'nfl/500/nyg.png' },'New York Jets': { id: '134907', logoId: 'nfl/500/nyj.png' },'Philadelphia Eagles': { id: '134920', logoId: 'nfl/500/phi.png' },'Pittsburgh Steelers': { id: '134917', logoId: 'nfl/500/pit.png' },'San Francisco 49ers': { id: '134929', logoId: 'nfl/500/sf.png' },'Seattle Seahawks': { id: '134934', logoId: 'nfl/500/sea.png' },'Tampa Bay Buccaneers': { id: '134935', logoId: 'nfl/500/tb.png' },'Tennessee Titans': { id: '134936', logoId: 'nfl/500/ten.png' },'Washington Commanders': { id: '134937', logoId: 'nfl/500/wsh.png' },'Atlanta Hawks': { id: '134873', logoId: 'nba/500/atl.png' },'Boston Celtics': { id: '134860', logoId: 'nba/500/bos.png' },'Brooklyn Nets': { id: '134861', logoId: 'nba/500/bkn.png' },'Charlotte Hornets': { id: '134874', logoId: 'nba/500/cha.png' },'Chicago Bulls': { id: '134868', logoId: 'nba/500/chi.png' },'Cleveland Cavaliers': { id: '134867', logoId: 'nba/500/cle.png' },'Dallas Mavericks': { id: '134888', logoId: 'nba/500/dal.png' },'Denver Nuggets': { id: '134881', logoId: 'nba/500/den.png' },'Detroit Pistons': { id: '134866', logoId: 'nba/500/det.png' },'Golden State Warriors': { id: '134878', logoId: 'nba/500/gsw.png' },'Houston Rockets': { id: '134887', logoId: 'nba/500/hou.png' },'Indiana Pacers': { id: '134865', logoId: 'nba/500/ind.png' },'Los Angeles Clippers': { id: '134877', logoId: 'nba/500/lac.png' },'Los Angeles Lakers': { id: '134876', logoId: 'nba/500/lal.png' },'Memphis Grizzlies': { id: '134889', logoId: 'nba/500/mem.png' },'Miami Heat': { id: '134875', logoId: 'nba/500/mia.png' },'Milwaukee Bucks': { id: '134864', logoId: 'nba/500/mil.png' },'Minnesota Timberwolves': { id: '134880', logoId: 'nba/500/min.png' },'New Orleans Pelicans': { id: '134890', logoId: 'nba/500/no.png' },'New York Knicks': { id: '134862', logoId: 'nba/500/nyk.png' },'Oklahoma City Thunder': { id: '134883', logoId: 'nba/500/okc.png' },'Orlando Magic': { id: '134872', logoId: 'nba/500/orl.png' },'Philadelphia 76ers': { id: '134863', logoId: 'nba/500/phi.png' },'Phoenix Suns': { id: '134879', logoId: 'nba/500/phx.png' },'Portland Trail Blazers': { id: '134882', logoId: 'nba/500/por.png' },'Sacramento Kings': { id: '134884', logoId: 'nba/500/sac.png' },'San Antonio Spurs': { id: '134886', logoId: 'nba/500/sa.png' },'Toronto Raptors': { id: '134869', logoId: 'nba/500/tor.png' },'Utah Jazz': { id: '134885', logoId: 'nba/500/utah.png' },'Washington Wizards': { id: '134871', logoId: 'nba/500/wsh.png' },'Arizona Diamondbacks': { id: '134891', logoId: 'mlb/500/ari.png' },'Atlanta Braves': { id: '134879', logoId: 'mlb/500/atl.png' },'Baltimore Orioles': { id: '134897', logoId: 'mlb/500/bal.png' },'Boston Red Sox': { id: '134884', logoId: 'mlb/500/bos.png' },'Chicago Cubs': { id: '134882', logoId: 'mlb/500/chc.png' },'Chicago White Sox': { id: '134902', logoId: 'mlb/500/chw.png' },'Cincinnati Reds': { id: '134883', logoId: 'mlb/500/cin.png' },'Cleveland Guardians': { id: '134903', logoId: 'mlb/500/cle.png' },'Colorado Rockies': { id: '134890', logoId: 'mlb/500/col.png' },'Detroit Tigers': { id: '134904', logoId: 'mlb/500/det.png' },'Houston Astros': { id: '134886', logoId: 'mlb/500/hou.png' },'Kansas City Royals': { id: '134905', logoId: 'mlb/500/kc.png' },'Los Angeles Angels': { id: '134901', logoId: 'mlb/500/laa.png' },'Los Angeles Dodgers': { id: '134880', logoId: 'mlb/500/lad.png' },'Miami Marlins': { id: '134878', logoId: 'mlb/500/mia.png' },'Milwaukee Brewers': { id: '134885', logoId: 'mlb/500/mil.png' },'Minnesota Twins': { id: '134906', logoId: 'mlb/500/min.png' },'New York Mets': { id: '134877', logoId: 'mlb/500/nym.png' },'New York Yankees': { id: '134899', logoId: 'mlb/500/nyy.png' },'Oakland Athletics': { id: '134900', logoId: 'mlb/500/oak.png' },'Philadelphia Phillies': { id: '134876', logoId: 'mlb/500/phi.png' },'Pittsburgh Pirates': { id: '134881', logoId: 'mlb/500/pit.png' },'San Diego Padres': { id: '134892', logoId: 'mlb/500/sd.png' },'San Francisco Giants': { id: '134893', logoId: 'mlb/500/sf.png' },'Seattle Mariners': { id: '134896', logoId: 'mlb/500/sea.png' },'St. Louis Cardinals': { id: '134888', logoId: 'mlb/500/stl.png' },'Tampa Bay Rays': { id: '134898', logoId: 'mlb/500/tb.png' },'Texas Rangers': { id: '134895', logoId: 'mlb/500/tex.png' },'Toronto Blue Jays': { id: '134894', logoId: 'mlb/500/tor.png' },'Washington Nationals': { id: '134875', logoId: 'mlb/500/wsh.png' },'Alabama Crimson Tide': { id: '134803', logoId: 'ncf/500/333.png' },'Georgia Bulldogs': { id: '134804', logoId: 'ncf/500/61.png' },'Ohio State Buckeyes': { id: '134798', logoId: 'ncf/500/194.png' },'Michigan Wolverines': { id: '134805', logoId: 'ncf/500/130.png' },'Texas Longhorns': { id: '134823', logoId: 'ncf/500/251.png' },'USC Trojans': { id: '134840', logoId: 'ncf/500/30.png' },'Notre Dame Fighting Irish': { id: '134802', logoId: 'ncf/500/87.png' },'Clemson Tigers': { id: '134812', logoId: 'ncf/500/228.png' },'LSU Tigers': { id: '134807', logoId: 'ncf/500/99.png' },'Penn State Nittany Lions': { id: '134799', logoId: 'ncf/500/213.png' },'Atlanta Dream': { id: '135254', logoId: 'wnba/500/atl.png'},'Chicago Sky': { id: '135255', logoId: 'wnba/500/chi.png'},'Connecticut Sun': { id: '135256', logoId: 'wnba/500/conn.png'},'Dallas Wings': { id: '135265', logoId: 'wnba/500/dal.png'},'Indiana Fever': { id: '135257', logoId: 'wnba/500/ind.png'},'Las Vegas Aces': { id: '135264', logoId: 'wnba/500/lv.png'},'Los Angeles Sparks': { id: '135262', logoId: 'wnba/500/la.png'},'Minnesota Lynx': { id: '135263', logoId: 'wnba/500/min.png'},'New York Liberty': { id: '135258', logoId: 'wnba/500/nyi.png'},'Phoenix Mercury': { id: '135261', logoId: 'wnba/500/phx.png'},'Seattle Storm': { id: '135260', logoId: 'wnba/500/sea.png'},'Washington Mystics': { id: '135259', logoId: 'wnba/500/wsh.png'},
};

const NCAA_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/d/dd/NCAA_logo.svg';
const CFL_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/9e/CFL_Logo.svg';

const getTeamInfo = (teamName, game) => {
    if (!teamName) return { name: 'Unknown', logo: '', id: null };
    
    const sportTitle = game?.sport_title?.toUpperCase();
    if (sportTitle === 'CFL') {
        return { name: teamName, logo: CFL_LOGO_URL, id: null };
    }

    const teamKey = Object.keys(TEAM_INFO).find(key => teamName.includes(key));
    if (teamKey && TEAM_INFO[teamKey]) {
        const info = TEAM_INFO[teamKey];
        let logo = `https://placehold.co/96x96/e2e8f0/64748b?text=${teamName.substring(0,2)}`;
        if (info.logoId) {
            if (info.logoId.startsWith('http')) {
                logo = info.logoId; // It's a full URL
            } else {
                logo = `${LOGO_BASE_URL}/${info.logoId}`; // It's a path
            }
        }
        return { name: teamName, logo: logo, id: info.id };
    }
    
    // Fallback logic for teams not found in TEAM_INFO
    if (sportTitle === 'NCAAF' || sportTitle === 'CFB' || sportTitle === 'NCAAB') {
        return { name: teamName, logo: NCAA_LOGO_URL, id: null };
    }

    // Default placeholder for other leagues if team not found
    return { name: teamName, logo: `https://placehold.co/96x96/e2e8f0/64748b?text=${teamName.substring(0,2)}`, id: null };
};
const SPORT_MAP = { 'NFL': 'Football', 'CFL': 'Football', 'NCAAF': 'Football', 'CFB': 'Football', 'MLB': 'Baseball', 'NBA': 'Basketball', 'WNBA': 'Basketball', 'SOCCER': 'Soccer', 'NHL': 'Hockey', 'NCAAB': 'Basketball' };
const getGameSport = (game) => {
     if (game.sport_key && SPORT_MAP[game.sport_key.toUpperCase().split('_')[1]]) { return SPORT_MAP[game.sport_key.toUpperCase().split('_')[1]]; }
     if(game.sport_title && SPORT_MAP[game.sport_title]) return SPORT_MAP[game.sport_title];
    return 'Unknown';
};

const kellyCriterion = (winProb, odds) => (winProb * (odds - 1) - (1 - winProb)) / (odds - 1);

// --- Child Components (nested) ---
function Header({ onHelpClick }) {
    return (
        <header className="sticky top-4 z-10 bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
             <style>{`
                @keyframes matrix-animation {
                    from { transform: translateY(0); }
                    to { transform: translateY(-100%); }
                }
                .matrix-bg {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 200%;
                    background-image: linear-gradient(
                        rgba(0, 255, 0, 0.1) 1px,
                        transparent 1px
                    );
                    background-size: 100% 10px;
                    animation: matrix-animation 10s linear infinite;
                    z-index: 0;
                    opacity: 0.2;
                }
                @keyframes swing {
                    0% { transform: rotate(50deg); }
                    50% { transform: rotate(-50deg); }
                    100% { transform: rotate(50deg); }
                }
                .pendulum-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    overflow: hidden;
                    pointer-events: none; 
                }
                .pendulum-svg {
                    position: absolute;
                    top: -40px; /* Start the pivot point higher up */
                    left: 50%;
                    width: 300px; /* Make the pendulum longer */
                    height: 300px;
                    transform-origin: 50% 0; /* Swing from the top center */
                    animation: swing 6s ease-in-out infinite; /* Slower, more majestic swing */
                    opacity: 0.25;
                    margin-left: -150px; /* Adjust for the new width */
                }
             `}</style>
             <div className="pendulum-container">
                <svg className="pendulum-svg" viewBox="0 0 100 120">
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#FFD700" strokeWidth="2" />
                    <circle cx="50" cy="110" r="10" fill="#FFD700" />
                </svg>
             </div>
             <div className="flex justify-end items-center relative z-10">
                 <button onClick={onHelpClick} className="p-2 rounded-full focus:outline-none bg-slate-800 border border-slate-700">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                 </button>
             </div>
            <div className="text-center relative z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-white">
                    Momentum Swing
                    <span className="text-lg align-middle font-medium text-slate-400">v13.26</span>
                </h1>
                <p className="text-lg text-slate-400">
                    Find value by analyzing live betting lines for today's games.
                </p>
            </div>
            <div className="matrix-bg"></div>
        </header>
    );
}
function GameCard({ game, addBet }) {
    const [trueAwayProb, setTrueAwayProb] = useState(50);
    const [evAway, setEvAway] = useState(0);
    const [evHome, setEvHome] = useState(0);

    const awayTeamInfo = getTeamInfo(game.away_team, game);
    const homeTeamInfo = getTeamInfo(game.home_team, game);
    const momentumResult = useMemo(() => getMomentumAdjustedProbability(game, game.historicalData), [game]);

    const bookmaker = game.bookmakers?.[0];
    const spreadMarket = bookmaker?.markets.find(m => m.key === 'spreads');
    const totalMarket = bookmaker?.markets.find(m => m.key === 'totals');
    const spreadAwayOutcome = spreadMarket?.outcomes.find(o => o.name === game.away_team);
    const spreadHomeOutcome = spreadMarket?.outcomes.find(o => o.name === game.home_team);
    const totalOverOutcome = totalMarket?.outcomes.find(o => o.name === 'Over');
    const totalUnderOutcome = totalMarket?.outcomes.find(o => o.name === 'Under');
    
    const impliedProbSpread = useMemo(() => {
        if (!spreadAwayOutcome?.price || !spreadHomeOutcome?.price) return { away: 0.5, home: 0.5 };
        return {
            away: getNoVigProb(spreadAwayOutcome.price, spreadHomeOutcome.price),
            home: getNoVigProb(spreadHomeOutcome.price, spreadAwayOutcome.price)
        };
    }, [spreadAwayOutcome, spreadHomeOutcome]);

    const impliedProbTotal = useMemo(() => {
        if (!totalOverOutcome?.price || !totalUnderOutcome?.price) return { over: 0.5, under: 0.5 };
        return {
            over: getNoVigProb(totalOverOutcome.price, totalUnderOutcome.price),
            under: getNoVigProb(totalUnderOutcome.price, totalOverOutcome.price)
        };
    }, [totalOverOutcome, totalUnderOutcome]);

    useEffect(() => {
        const initialProb = momentumResult.prob * 100;
        setTrueAwayProb(initialProb);
        setEvAway(calculateEV(initialProb / 100, game.moneyline_away));
        setEvHome(calculateEV((100 - initialProb) / 100, game.moneyline_home));
    }, [game, momentumResult]);

    const handleSliderChange = (e) => {
        const newProb = parseFloat(e.target.value);
        setTrueAwayProb(newProb);
        const homeProb = 100 - newProb;
        setEvAway(calculateEV(newProb / 100, game.moneyline_away));
        setEvHome(calculateEV(homeProb / 100, game.moneyline_home));
    };

    const handleBetClick = (bet) => {
        addBet(bet);
    };

    const renderMomentumDisplay = () => {
        if (momentumResult.status !== 'ok') {
            return (
                <div className="text-slate-500 text-center text-sm p-2 rounded-lg bg-slate-800">
                    Momentum: N/A
                </div>
            );
        }

        const awayMomentum = momentumResult.shift * 100;
        const homeMomentum = -awayMomentum;

        const formatMomentum = (momentum) => {
            if (Math.abs(momentum) < 0.1) return <span className="font-mono text-slate-500">--</span>;
            const sign = momentum > 0 ? '+' : '';
            const color = momentum > 0 ? 'text-green-400' : 'text-red-400';
            const arrow = momentum > 0 ? '⬆️' : '⬇️';
            return <span className={`font-mono ${color}`}>{sign}{momentum.toFixed(1)}% {arrow}</span>;
        };

        return (
            <div className="flex flex-col space-y-2 text-sm p-3 rounded-lg bg-slate-800 border border-slate-700">
                <div className="flex justify-between items-center">
                    <span className="font-semibold">{awayTeamInfo.name} Mom:</span>
                    {formatMomentum(awayMomentum)}
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold">{homeTeamInfo.name} Mom:</span>
                    {formatMomentum(homeMomentum)}
                </div>
            </div>
        );
    };

    // JSX for Moneyline Display
    const moneylineDisplay = (
        <div className="flex items-center justify-between w-full space-x-2">
            <div className="w-1/2 flex flex-col items-center p-2 rounded-lg border border-slate-700">
                <span className="font-semibold text-lg text-blue-400">{decimalToAmerican(game.moneyline_away)}</span>
                <button onClick={() => handleBetClick({ id: `${game.id}-moneyline-away`, gameId: game.id, team: awayTeamInfo.name, odds: game.moneyline_away, ev: evAway, betType: 'Moneyline', betLabel: `Moneyline: ${awayTeamInfo.name}`, sport: getGameSport(game) })} className="utility-btn text-sm mt-1">Add</button>
            </div>
            <div className="w-1/2 flex flex-col items-center p-2 rounded-lg border border-slate-700">
                <span className="font-semibold text-lg text-blue-400">{decimalToAmerican(game.moneyline_home)}</span>
                <button onClick={() => handleBetClick({ id: `${game.id}-moneyline-home`, gameId: game.id, team: homeTeamInfo.name, odds: game.moneyline_home, ev: evHome, betType: 'Moneyline', betLabel: `Moneyline: ${homeTeamInfo.name}`, sport: getGameSport(game) })} className="utility-btn text-sm mt-1">Add</button>
            </div>
        </div>
    );

    // JSX for Spread Display
    const spreadDisplay = spreadMarket && (
        <div className="flex flex-col items-center w-full">
            <h4 className="font-bold text-sm mb-2">Spreads</h4>
            <div className="flex justify-between items-center w-full space-x-2">
                {spreadAwayOutcome?.price && (
                    <div className="flex flex-col items-center w-1/2 p-2 rounded-lg border border-slate-700">
                        <span className="font-semibold text-lg text-blue-400">{spreadAwayOutcome.point > 0 ? `+${spreadAwayOutcome.point}` : spreadAwayOutcome.point}</span>
                        <span className="text-xs text-slate-400">{decimalToAmerican(spreadAwayOutcome.price)}</span>
                        <button onClick={() => handleBetClick({ id: `${game.id}-spread-away`, gameId: game.id, team: awayTeamInfo.name, odds: spreadAwayOutcome.price, ev: calculateEV(impliedProbSpread.away, spreadAwayOutcome.price), betType: 'Spread', betLabel: `Spread: ${awayTeamInfo.name} (${spreadAwayOutcome.point > 0 ? '+' : ''}${spreadAwayOutcome.point})`, sport: getGameSport(game) })} className="utility-btn text-xs mt-1">Add</button>
                    </div>
                )}
                {spreadHomeOutcome?.price && (
                    <div className="flex flex-col items-center w-1/2 p-2 rounded-lg border border-slate-700">
                        <span className="font-semibold text-lg text-blue-400">{spreadHomeOutcome.point > 0 ? `+${spreadHomeOutcome.point}` : spreadHomeOutcome.point}</span>
                        <span className="text-xs text-slate-400">{decimalToAmerican(spreadHomeOutcome.price)}</span>
                        <button onClick={() => handleBetClick({ id: `${game.id}-spread-home`, gameId: game.id, team: homeTeamInfo.name, odds: spreadHomeOutcome.price, ev: calculateEV(impliedProbSpread.home, spreadHomeOutcome.price), betType: 'Spread', betLabel: `Spread: ${homeTeamInfo.name} (${spreadHomeOutcome.point > 0 ? '+' : ''}${spreadHomeOutcome.point})`, sport: getGameSport(game) })} className="utility-btn text-xs mt-1">Add</button>
                    </div>
                )}
            </div>
        </div>
    );

    // JSX for Total Display
    const totalDisplay = totalMarket && (
        <div className="flex flex-col items-center w-full">
            <h4 className="font-bold text-sm mb-2">Totals</h4>
            <div className="flex justify-between items-center w-full space-x-2">
                {totalOverOutcome?.price && (
                    <div className="flex flex-col items-center w-1/2 p-2 rounded-lg border border-slate-700">
                        <span className="font-semibold text-lg text-blue-400">O {totalOverOutcome.point}</span>
                        <span className="text-xs text-slate-400">{decimalToAmerican(totalOverOutcome.price)}</span>
                        <button onClick={() => handleBetClick({ id: `${game.id}-total-over`, gameId: game.id, team: `${awayTeamInfo.name}/${homeTeamInfo.name}`, odds: totalOverOutcome.price, ev: calculateEV(impliedProbTotal.over, totalOverOutcome.price), betType: 'Total', betLabel: `Total: Over (${totalOverOutcome.point})`, sport: getGameSport(game) })} className="utility-btn text-xs mt-1">Add</button>
                    </div>
                )}
                {totalUnderOutcome?.price && (
                    <div className="flex flex-col items-center w-1/2 p-2 rounded-lg border border-slate-700">
                        <span className="font-semibold text-lg text-blue-400">U {totalUnderOutcome.point}</span>
                        <span className="text-xs text-slate-400">{decimalToAmerican(totalUnderOutcome.price)}</span>
                        <button onClick={() => handleBetClick({ id: `${game.id}-total-under`, gameId: game.id, team: `${awayTeamInfo.name}/${homeTeamInfo.name}`, odds: totalUnderOutcome.price, ev: calculateEV(impliedProbTotal.under, totalUnderOutcome.price), betType: 'Total', betLabel: `Total: Under (${totalUnderOutcome.point})`, sport: getGameSport(game) })} className="utility-btn text-xs mt-1">Add</button>
                    </div>
                )}
            </div>
        </div>
    );


    return (
        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 relative overflow-hidden">
            <div className="relative"><span className="absolute -top-10 -left-10 text-xs font-bold uppercase px-3 py-1 rounded-br-lg rounded-tl-xl bg-slate-800 text-blue-300">{getGameSport(game)}</span></div>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-8 items-start pt-4">
                <div className="flex flex-col items-center justify-around text-center">
                    <div className="flex w-full items-center justify-between text-center pb-4">
                        <div className="flex flex-col items-center space-y-1 w-2/5">
                            <img src={awayTeamInfo.logo} alt={awayTeamInfo.name} className="h-16 w-16 md:h-20 md:w-20 object-contain mb-1" />
                            <span className="font-bold text-sm md:text-base leading-tight">{awayTeamInfo.name}</span>
                        </div>
                        <div className="font-bold text-xl text-slate-500 pb-10">VS</div>
                        <div className="flex flex-col items-center space-y-1 w-2/5">
                            <img src={homeTeamInfo.logo} alt={homeTeamInfo.name} className="h-16 w-16 md:h-20 md:w-20 object-contain mb-1" />
                            <span className="font-bold text-sm md:text-base leading-tight">{homeTeamInfo.name}</span>
                        </div>
                    </div>
                    {/* Main Bet Display Area */}
                    {moneylineDisplay}
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold">True Probability:</span>
                            <span className="font-mono text-sm text-blue-400">{trueAwayProb.toFixed(1)}%</span>
                        </div>
                        <input type="range" min="1" max="99" value={trueAwayProb} onChange={handleSliderChange} className="w-full h-2 bg-blue-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="flex flex-col space-y-2 text-sm text-center">
                        <div className="flex justify-between items-center bg-green-900/20 text-green-400 rounded-lg p-2">
                            <span className="font-semibold">{awayTeamInfo.name} EV:</span>
                            <span className="font-mono">{(evAway * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-red-900/20 text-red-400 rounded-lg p-2">
                            <span className="font-semibold">{homeTeamInfo.name} EV:</span>
                            <span className="font-mono">{(evHome * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                    {renderMomentumDisplay()}
                </div>
            </div>
            {(spreadMarket || totalMarket) && (
                <div className="mt-6 border-t border-slate-800 pt-6 grid grid-cols-2 gap-4">
                    {spreadDisplay}
                    {totalDisplay}
                </div>
            )}
        </div>
    );
}

function FilterControls({ filters, setFilters, resetApp, handleBuildKellyBets }) {
    const handleFilterChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, [setFilters]);
    
    return (
        <div className="mb-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
             <div className="grid grid-cols-2 gap-4">
                 <label className="flex items-center space-x-2">
                    <input type="checkbox" name="showPositiveEVOnly" checked={filters.showPositiveEVOnly} onChange={handleFilterChange} className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                    <span className="text-sm">Only Show +EV</span>
                </label>
                 <label className="flex items-center space-x-2">
                    <input type="checkbox" name="fadeMomentum" checked={filters.fadeMomentum} onChange={handleFilterChange} className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                    <span className="text-sm">Fade Momentum</span>
                </label>
                <div className="grid grid-cols-2 gap-x-4 col-span-2">
                    <label className="flex flex-col space-y-1">
                        <span className="text-sm">Min Odds</span>
                        <input type="text" name="minOdds" value={filters.minOdds} onChange={handleFilterChange} className="form-input rounded-md text-sm bg-slate-800 border border-slate-700" placeholder="e.g., +100" />
                    </label>
                    <label className="flex flex-col space-y-1">
                        <span className="text-sm">Max Odds</span>
                        <input type="text" name="maxOdds" value={filters.maxOdds} onChange={handleFilterChange} className="form-input rounded-md text-sm bg-slate-800 border border-slate-700" placeholder="e.g., +400" />
                    </label>
                </div>
                 <label className="flex flex-col space-y-1 col-span-2">
                    <span className="text-sm">Min Momentum %</span>
                    <input type="number" name="minMomentum" value={filters.minMomentum} onChange={handleFilterChange} className="form-input rounded-md text-sm bg-slate-800 border border-slate-700" />
                </label>
                <label className="flex flex-col space-y-1 col-span-2">
                    <span className="text-sm">Sort By</span>
                    <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="form-select rounded-md text-sm bg-slate-800 border border-slate-700">
                        <option value="commence_time">Game Time</option>
                        <option value="ev">Expected Value</option>
                        <option value="momentum">Momentum</option>
                    </select>
                </label>
                <label className="flex flex-col space-y-1 col-span-2">
                    <span className="text-sm">Bankroll</span>
                    <input type="number" name="bankroll" value={filters.bankroll} onChange={handleFilterChange} className="form-input rounded-md text-sm bg-slate-800 border border-slate-700" />
                </label>
            </div>
            <div className="flex justify-between items-center mt-4">
                <button onClick={resetApp} className="utility-btn text-sm">New Analysis</button>
                <button onClick={handleBuildKellyBets} className="utility-btn text-sm">Build Kelly Bets</button>
            </div>
        </div>
    );
}

function BetSlip({ betSlip, clearBetSlip, removeBet, copyBetSlip }) {
    return (
        <div className="lg:order-last lg-col-span-1">
             <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                 <h3 className="text-lg font-semibold mb-3 text-center">My Bet Slip</h3>
                 {betSlip.length === 0 ? (
                     <p className="text-center text-sm text-slate-500 py-4">Your bet slip is empty.</p>
                 ) : (
                     <ul className="space-y-3">
                         {betSlip.map(bet => (
                             <li key={bet.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                                 <div>
                                     <p className="text-sm font-semibold">{bet.betLabel}</p>
                                     <p className="text-xs text-slate-400">
                                         Odds: {decimalToAmerican(bet.odds)} | EV: {(bet.ev * 100).toFixed(2)}%
                                         {bet.betSize && <span className="ml-2"> | Bet: ${bet.betSize.toFixed(2)}</span>}
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
            <div className="w-full max-w-2xl p-6 md:p-8 rounded-2xl shadow-2xl bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">How It Works</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto pr-4 text-slate-400 space-y-4">
                    <p><strong>1. Fetch Data:</strong> The app fetches today's games and live odds from The Odds API.</p>
                    <p><strong>2. Calculate Line Movement:</strong> It compares the current odds to the odds from <strong>6 hours ago</strong> to determine the "momentum" or how the market is moving.</p>
                    <p><strong>3. Model True Probability:</strong> A predictive model uses this momentum to estimate the "true" probability of a moneyline outcome. This is the starting point for the EV calculations and the initial position of the slider on each game card.</p>
                    <p><strong>4. Calculate Expected Value (EV):</strong> The app calculates the EV for all available bets (Moneyline, Spreads, Totals) based on their respective no-vig implied probabilities. The interactive slider on each card allows you to manually adjust the moneyline probability and see how the EV changes in real-time for that specific bet.</p>
                    <p><strong>5. Build Kelly Bets:</strong> When you click "Build Kelly Bets," the app identifies the single most profitable (+EV) opportunity in each game across all bet types. It then calculates the optimal bet size for each of these picks using the Kelly Criterion, based on your specified bankroll.</p>
                    <p><strong>6. Fade Momentum:</strong> The "Fade Momentum" filter reverses this logic. It identifies opportunities where betting <em>against</em> the public momentum has a positive EV and builds a Kelly bet slip based on those contrarian picks.</p>
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
        minOdds: '', 
        maxOdds: '',
        minMomentum: 0,
        bankroll: 500,
        homeTeamsOnly: false,
        fadeMomentum: false,
    });
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    
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
            const desiredSportTitles = ['NFL', 'MLB', 'NBA', 'NHL', 'WNBA', 'CFL', 'NCAAF', 'CFB', 'NCAAB', 'Premier League'];
            
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (now.getHours() >= 21) { // 9 PM or later
                startDate.setDate(now.getDate() + 1);
                startDate.setHours(0, 0, 0, 0); // Start of next day
                endDate.setDate(now.getDate() + 1);
                endDate.setHours(23, 59, 59, 999); // End of next day
            } else {
                // Before 9 PM, look at games for the rest of today
                startDate = now; // Start from now
                endDate.setHours(23, 59, 59, 999); // End of today
            }

            const commenceTimeFrom = startDate.toISOString().slice(0, 19) + 'Z';
            const commenceTimeTo = endDate.toISOString().slice(0, 19) + 'Z';
            const historicalTimestamp = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 19) + 'Z';
            
            // We now manually define the sports to ensure we always get them, regardless of "active" status.
            const sportsToFetch = [
                { key: 'americanfootball_nfl', title: 'NFL' },
                { key: 'baseball_mlb', title: 'MLB' },
                { key: 'basketball_nba', title: 'NBA' },
                { key: 'icehockey_nhl', title: 'NHL' },
                { key: 'basketball_wnba', title: 'WNBA' },
                { key: 'americanfootball_cfl', title: 'CFL' },
                { key: 'americanfootball_ncaaf', title: 'NCAAF' },
                { key: 'basketball_ncaab', title: 'NCAAB' },
                { key: 'soccer_epl', title: 'Premier League' }
            ];

            const oddsPromises = sportsToFetch.map(sport => {
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
                const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads');
                const totalMarket = bookmaker.markets.find(m => m.key === 'totals');

                const awayML = moneylineMarket?.outcomes.find(o => o.name === game.away_team)?.price;
                const homeML = moneylineMarket?.outcomes.find(o => o.name === game.home_team)?.price;

                const spreadAwayOutcome = spreadMarket?.outcomes.find(o => o.name === game.away_team);
                const spreadHomeOutcome = spreadMarket?.outcomes.find(o => o.name === game.home_team);
                const totalOverOutcome = totalMarket?.outcomes.find(o => o.name === 'Over');
                const totalUnderOutcome = totalMarket?.outcomes.find(o => o.name === 'Under');
                
                return { 
                    id: game.id,
                    sport_key: game.sport_key,
                    sport_title: game.sport_title,
                    commence_time: game.commence_time,
                    home_team: game.home_team,
                    away_team: game.away_team,
                    moneyline_away: awayML, 
                    moneyline_home: homeML,
                    spread_away: spreadAwayOutcome?.point || null,
                    spread_away_odds: spreadAwayOutcome?.price || null,
                    spread_home: spreadHomeOutcome?.point || null,
                    spread_home_odds: spreadHomeOutcome?.price || null,
                    total_over: totalOverOutcome?.point || null,
                    total_over_odds: totalOverOutcome?.price || null,
                    total_under: totalUnderOutcome?.point || null,
                    total_under_odds: totalUnderOutcome?.price || null,
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
        const title = `Momentum Swing Parlay (${betSlip.length} Picks)`;

        const settings = [
            `Min Odds: ${filters.minOdds || 'None'}`,
            `Min Mom: ${filters.minMomentum || 'None'}%`,
            `Teams: ${filters.homeTeamsOnly ? 'Home Only' : 'All'}`,
            `Trend: ${filters.fadeMomentum ? 'Fade' : 'Standard'}`
        ].join(' | ');

        const header = `${title}\nv13.5 | Generated: ${new Date().toLocaleString()} | Settings: ${settings}`;

        const betSlipText = betSlip.map(bet => {
            const game = allGames.find(g => g.id === bet.gameId);
            if (!game) return '';

            const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
            const momentumText = `Mom: ${momentumResult.shift >= 0 ? '+' : ''}${(momentumResult.shift * 100).toFixed(1)}%`;
            
            const oddsText = decimalToAmerican(bet.odds);
            const evText = `EV: ${bet.ev >= 0 ? '+' : ''}${(bet.ev * 100).toFixed(1)}%`;

            let betName = bet.team; // Default to team name

            if (bet.betLabel.includes('Spread:')) {
                const parts = bet.betLabel.match(/\((.*)\)/);
                if (parts) {
                    betName = `${bet.team} ${parts[1]}`;
                }
            } else if (bet.betLabel.includes('Total:')) {
                const parts = bet.betLabel.match(/Total: (Over|Under) \((.*)\)/);
                if (parts) {
                    betName = `${parts[1]} ${parts[2]}`;
                }
            }

            const matchup = `${game.away_team} @ ${game.home_team}`;

            return `${betName} (${oddsText} | ${evText} | ${momentumText})\n${matchup}`;
        }).join('\n\n');

        const textToCopy = `${header}\n\n${betSlipText}`;
        
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = textToCopy;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);

    }, [betSlip, allGames, filters]);

    const filteredGames = useMemo(() => {
        // 1. Map over games to calculate all possible EVs first.
        let gamesWithAllEVs = allGames.map(game => {
            const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
            const momentum = momentumResult.shift;
    
            // Moneyline EV
            const probAwayML = momentumResult.prob;
            const probHomeML = 1 - probAwayML;
            const evAwayML = calculateEV(probAwayML, game.moneyline_away);
            const evHomeML = calculateEV(probHomeML, game.moneyline_home);

            // Spread EV
            const probAwaySpread = getNoVigProb(game.spread_away_odds, game.spread_home_odds);
            const probHomeSpread = 1 - probAwaySpread;
            const evAwaySpread = calculateEV(probAwaySpread, game.spread_away_odds);
            const evHomeSpread = calculateEV(probHomeSpread, game.spread_home_odds);
            
            // Total EV
            const probOverTotal = getNoVigProb(game.total_over_odds, game.total_under_odds);
            const probUnderTotal = 1 - probOverTotal;
            const evOverTotal = calculateEV(probOverTotal, game.total_over_odds);
            const evUnderTotal = calculateEV(probUnderTotal, game.total_under_odds);
    
            // Find the best EV across all types for sorting and general filtering
            const bestEV = Math.max(evAwayML, evHomeML, evAwaySpread, evHomeSpread, evOverTotal, evUnderTotal);
            
            return { 
                ...game, 
                bestEV, 
                momentum,
                 probs: {
                    moneyline: { away: probAwayML, home: probHomeML },
                    spread: { away: probAwaySpread, home: probHomeSpread },
                    total: { over: probOverTotal, under: probUnderTotal }
                },
                evs: {
                    moneyline: { away: evAwayML, home: evHomeML },
                    spread: { away: evAwaySpread, home: evHomeSpread },
                    total: { over: evOverTotal, under: evUnderTotal }
                }
            };
        });
    
        let filtered = gamesWithAllEVs;
    
        // Apply user-configurable filters FOR DISPLAY ONLY
        if (filters.showPositiveEVOnly) {
            filtered = filtered.filter(game => game.bestEV > 0);
        }
    
        if (filters.minMomentum > 0) {
            filtered = filtered.filter(game => Math.abs(game.momentum * 100) >= filters.minMomentum);
        }
    
        if (filters.fadeMomentum) {
            // Fading momentum means betting against the public money.
            filtered = filtered.filter(game => {
                const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
                const fadedAwayEV = calculateEV(1 - momentumResult.prob, game.moneyline_away);
                const fadedHomeEV = calculateEV(momentumResult.prob, game.moneyline_home);
                return fadedAwayEV > 0 || fadedHomeEV > 0;
            });
        }
        
        if (filters.homeTeamsOnly) {
             filtered = filtered.filter(game => {
                return game.evs.moneyline.home > 0;
            });
        }
        
        // Apply sorting
        if (filters.sortBy === 'ev') {
            filtered.sort((a, b) => b.bestEV - a.bestEV);
        } else if (filters.sortBy === 'momentum') {
             filtered.sort((a, b) => Math.abs(b.momentum) - Math.abs(a.momentum));
        } else {
            // Default sort by commence_time
            filtered.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
        }
        
        return filtered;
    }, [allGames, filters]);
    
    const handleBuildKellyBets = useCallback(() => {
        const kellyBets = allGames // Start with all games to apply filters internally
            .map(game => {
                // Pre-calculate all EV and Prob data for the game
                 const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
                 const probAwayML = momentumResult.prob;
                 const probHomeML = 1 - probAwayML;
                 const evAwayML = calculateEV(probAwayML, game.moneyline_away);
                 const evHomeML = calculateEV(probHomeML, game.moneyline_home);
                 const probAwaySpread = getNoVigProb(game.spread_away_odds, game.spread_home_odds);
                 const probHomeSpread = 1 - probAwaySpread;
                 const evAwaySpread = calculateEV(probAwaySpread, game.spread_away_odds);
                 const evHomeSpread = calculateEV(probHomeSpread, game.spread_home_odds);
                 const probOverTotal = getNoVigProb(game.total_over_odds, game.total_under_odds);
                 const probUnderTotal = 1 - probOverTotal;
                 const evOverTotal = calculateEV(probOverTotal, game.total_over_odds);
                 const evUnderTotal = calculateEV(probUnderTotal, game.total_under_odds);
                
                let potentialBets = [];

                if (filters.fadeMomentum) {
                    const fadedAwayEV = calculateEV(1 - probAwayML, game.moneyline_away);
                    if (fadedAwayEV > 0) potentialBets.push({ team: game.away_team, odds: game.moneyline_away, ev: fadedAwayEV, winProb: 1 - probAwayML, betLabel: `Fade ML: ${game.away_team}` });
                    const fadedHomeEV = calculateEV(probAwayML, game.moneyline_home);
                    if (fadedHomeEV > 0) potentialBets.push({ team: game.home_team, odds: game.moneyline_home, ev: fadedHomeEV, winProb: probAwayML, betLabel: `Fade ML: ${game.home_team}` });
                } else {
                    if (evAwayML > 0) potentialBets.push({ team: game.away_team, odds: game.moneyline_away, ev: evAwayML, winProb: probAwayML, betLabel: `Moneyline: ${game.away_team}` });
                    if (evHomeML > 0) potentialBets.push({ team: game.home_team, odds: game.moneyline_home, ev: evHomeML, winProb: probHomeML, betLabel: `Moneyline: ${game.home_team}` });
                    if (evAwaySpread > 0) potentialBets.push({ team: game.away_team, odds: game.spread_away_odds, ev: evAwaySpread, winProb: probAwaySpread, betLabel: `Spread: ${game.away_team} (${game.spread_away > 0 ? '+' : ''}${game.spread_away})` });
                    if (evHomeSpread > 0) potentialBets.push({ team: game.home_team, odds: game.spread_home_odds, ev: evHomeSpread, winProb: probHomeSpread, betLabel: `Spread: ${game.home_team} (${game.spread_home > 0 ? '+' : ''}${game.spread_home})` });
                    if (evOverTotal > 0) potentialBets.push({ team: `${game.away_team}/${game.home_team}`, odds: game.total_over_odds, ev: evOverTotal, winProb: probOverTotal, betLabel: `Total: Over (${game.total_over})` });
                    if (evUnderTotal > 0) potentialBets.push({ team: `${game.away_team}/${game.home_team}`, odds: game.total_under_odds, ev: evUnderTotal, winProb: probUnderTotal, betLabel: `Total: Under (${game.total_under})` });
                }

                let validBets = potentialBets;

                if (filters.minOdds) {
                    const minOddsDecimal = americanToDecimal(filters.minOdds);
                    if (!isNaN(minOddsDecimal)) validBets = validBets.filter(bet => bet.odds && bet.odds >= minOddsDecimal);
                }
                if (filters.maxOdds) {
                    const maxOddsDecimal = americanToDecimal(filters.maxOdds);
                    if (!isNaN(maxOddsDecimal)) validBets = validBets.filter(bet => bet.odds && bet.odds <= maxOddsDecimal);
                }
                
                if (validBets.length === 0) return null;

                validBets.sort((a, b) => b.ev - a.ev);
                const bestEVBet = validBets[0];

                if (bestEVBet) {
                    const kellyBetSize = kellyCriterion(bestEVBet.winProb, bestEVBet.odds) * filters.bankroll;
                    if (kellyBetSize > 0) {
                        return { ...bestEVBet, betSize: kellyBetSize, gameId: game.id, sport: getGameSport(game) };
                    }
                }
                return null;
            })
            .filter(bet => bet !== null);
    
        setBetSlip(kellyBets.map(bet => ({
            id: `${bet.gameId}-${bet.betLabel}`,
            gameId: bet.gameId,
            team: bet.team,
            odds: bet.odds,
            ev: bet.ev,
            betType: bet.betType,
            betLabel: bet.betLabel,
            sport: bet.sport,
            betSize: bet.betSize,
        })));
    
    }, [allGames, filters]);

    const supportedLeagues = [
        { name: 'NFL', src: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png' },
        { name: 'NBA', src: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png' },
        { name: 'MLB', src: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png' },
        { name: 'NHL', src: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png' },
        { name: 'NCAAF', src: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/NCAA_logo.svg' },
        { name: 'CFL', src: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/CFL_Logo.svg' },
        { name: 'WNBA', src: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png' },
        { name: 'Premier League', src: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png' }
    ];
    
    return (
        <div className="dark bg-slate-950 text-slate-100 min-h-screen">
             <style>{`
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: #020617; /* slate-950 */
                }
                .utility-btn {
                    background-color: #1e293b; /* slate-800 */
                    border: 1px solid #334155; /* slate-700 */
                    color: #94a3b8; /* slate-400 */
                    padding: 0.5rem 1rem;
                    border-radius: 9999px;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .utility-btn:hover:not(:disabled) {
                    background-color: #334155; /* slate-700 */
                    border-color: #3b82f6; /* blue-500 */
                    color: #93c5fd; /* blue-300 */
                }
                .utility-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .utility-btn.bg-blue-600 {
                    background-color: #2563eb;
                    border-color: #2563eb;
                    color: white;
                }
             `}</style>
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                <Header onHelpClick={toggleHelpModal} />
                <main className="mt-8">
                    {!isAnalyzed && !isLoading && (
                        <div className="text-center my-12">
                            <div className="mb-12">
                                <p className="text-sm uppercase font-semibold tracking-wider text-slate-500 mb-6">Supported Leagues</p>
                                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-4 md:gap-x-8">
                                    {supportedLeagues.map(league => (
                                        <img 
                                            key={league.name} 
                                            src={league.src} 
                                            alt={league.name} 
                                            className="h-10 md:h-12 object-contain transition-transform hover:scale-110"
                                            title={league.name}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button onClick={fetchAndAnalyzeGames} className="text-xl font-semibold py-4 px-10 rounded-xl transition-transform transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-offset-slate-900">
                                Analyze Today's Games
                            </button>
                        </div>
                    )}
                    {isLoading && (
                        <div className="text-center py-10">
                             <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p id="processing-text" className="mt-4 text-slate-400">Fetching data...</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center p-4 rounded-lg bg-red-900/20 text-red-400">
                            {error}
                            <button onClick={resetApp} className="utility-btn ml-4">Reset</button>
                        </div>
                    )}
                    {isAnalyzed && !isLoading && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
                             <BetSlip betSlip={betSlip} clearBetSlip={clearBetSlip} removeBet={removeBet} copyBetSlip={copyBetSlip} />
                            <div className="lg:order-first lg:col-span-2">
                                <FilterControls filters={filters} setFilters={setFilters} resetApp={resetApp} handleBuildKellyBets={handleBuildKellyBets} />
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
            </div>
        </div>
    );
}

