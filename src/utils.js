// --- Helper Functions (Pure Logic) ---
export const getNoVigProb = (odds1, odds2) => {
    if (!odds1 || !odds2) return 0.5;
    const implied1 = 1 / odds1;
    const implied2 = 1 / odds2;
    const totalImplied = implied1 + implied2;
    if (totalImplied === 0) return 0.5;
    return implied1 / totalImplied;
};
export const decimalToAmerican = (decimalOdds) => {
    if (isNaN(decimalOdds) || decimalOdds <= 1) return 'N/A';
    if (decimalOdds >= 2.0) return `+${((decimalOdds - 1) * 100).toFixed(0)}`;
    return `${(-100 / (decimalOdds - 1)).toFixed(0)}`;
};
export const americanToDecimal = (americanOdds) => {
    const num = parseFloat(americanOdds);
    if (isNaN(num)) return NaN;
    if (num >= 100) return (num / 100) + 1;
    if (num <= -100) return (100 / Math.abs(num)) + 1;
    return NaN;
};
export const calculateEV = (winProb, decimalOdds) => (winProb * (decimalOdds - 1)) - (1 - winProb);

export const getMomentumAdjustedProbability = (currentGame, historicalGame) => {
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
export const getTeamInfo = (teamName) => {
    if (!teamName) return { name: 'Unknown', logo: '', id: null };
    const teamKey = Object.keys(TEAM_INFO).find(key => teamName.includes(key));
    if (teamKey && TEAM_INFO[teamKey]) {
        const info = TEAM_INFO[teamKey];
        const logo = info.logoId ? `${LOGO_BASE_URL}/${info.logoId}` : `https://placehold.co/96x96/e2e8f0/64748b?text=${teamName.substring(0,2)}`;
        return { name: teamName, logo: logo, id: info.id };
    }
    return { name: teamName, logo: `https://placehold.co/96x96/e2e8f0/64748b?text=${teamName.substring(0,2)}`, id: null };
};
export const SPORT_MAP = { 'NFL': 'Football', 'CFL': 'Football', 'NCAAF': 'Football', 'MLB': 'Baseball', 'NBA': 'Basketball', 'WNBA': 'Basketball', 'SOCCER': 'Soccer', 'NHL': 'Hockey', 'NCAAB': 'Basketball' };
export const getGameSport = (game) => {
     if (game.sport_key && SPORT_MAP[game.sport_key.toUpperCase().split('_')[1]]) { return SPORT_MAP[game.sport_key.toUpperCase().split('_')[1]]; }
     if(game.sport_title && SPORT_MAP[game.sport_title]) return SPORT_MAP[game.sport_title];
    return 'Unknown';
};

export const transformApiData = (apiGame) => {
    const bookmaker = apiGame.bookmakers?.[0];
    if (!bookmaker) return null;
    const moneylineMarket = bookmaker.markets.find(m => m.key === 'h2h');
    const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads');
    const totalMarket = bookmaker.markets.find(m => m.key === 'totals');
    const moneylineAwayOutcome = moneylineMarket?.outcomes.find(o => o.name === apiGame.away_team);
    const moneylineHomeOutcome = moneylineMarket?.outcomes.find(o => o.name === apiGame.home_team);
    const spreadAwayOutcome = spreadMarket?.outcomes.find(o => o.name === apiGame.away_team);
    const spreadHomeOutcome = spreadMarket?.outcomes.find(o => o.name === apiGame.home_team);
    const totalOverOutcome = totalMarket?.outcomes.find(o => o.name === 'Over');
    const totalUnderOutcome = totalMarket?.outcomes.find(o => o.name === 'Under');
    let sport = 'Unknown';
    if (apiGame.sport_key.includes('nfl')) sport = 'NFL';
    else if (apiGame.sport_key.includes('cfl')) sport = 'CFL';
    else if (apiGame.sport_key.includes('ncaaf')) sport = 'NCAAF';
    else if (apiGame.sport_key.includes('ncaab')) sport = 'NCAAB';
    else if (apiGame.sport_key.includes('mlb')) sport = 'MLB';
    else if (apiGame.sport_key.includes('nba')) sport = 'NBA';
    else if (apiGame.sport_key.includes('wnba')) sport = 'WNBA';
    else if (apiGame.sport_key.includes('soccer')) sport = 'SOCCER';
    else if (apiGame.sport_key.includes('nhl')) sport = 'NHL';

    return { id: apiGame.id, sport, sport_key: apiGame.sport_key, away_team: apiGame.away_team, home_team: apiGame.home_team, moneyline_away: moneylineAwayOutcome?.price || null, moneyline_home: moneylineHomeOutcome?.price || null, spread_away: spreadAwayOutcome?.point || null, spread_away_odds: spreadAwayOutcome?.price || null, spread_home: spreadHomeOutcome?.point || null, spread_home_odds: spreadHomeOutcome?.price || null, total_over: totalOverOutcome?.point || null, total_over_odds: totalOverOutcome?.price || null, total_under: totalUnderOutcome?.point || null, total_under_odds: totalUnderOutcome?.price || null };
};
