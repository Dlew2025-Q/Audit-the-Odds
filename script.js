document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing application...");

    const appVersion = document.querySelector('header h1 span').textContent.trim();
    
    // --- API & DATA ---

    // IMPORTANT: Replace with your actual paid API key
    const oddsApiKey = 'YOUR_PAID_API_KEY_HERE'; 

    /**
     * Calculates momentum based on the change in implied probability over 24 hours.
     * @param {object} currentGame - The current game data object from the API.
     * @param {object} historicalGame - The historical game data object from 24 hours ago.
     * @returns {object} An object containing the adjusted probability and a status.
     */
    function getMomentumAdjustedProbability(currentGame, historicalGame) {
        const currentAwayProb = getNoVigProb(currentGame.moneyline_away, currentGame.moneyline_home);

        if (!historicalGame) {
            return { prob: currentAwayProb, status: 'no_data' };
        }
        
        const historicalBookmaker = historicalGame.bookmakers?.[0];
        if (!historicalBookmaker) {
             return { prob: currentAwayProb, status: 'no_data' };
        }
        
        const historicalMoneyline = historicalBookmaker.markets.find(m => m.key === 'h2h');
        const historicalAwayOutcome = historicalMoneyline?.outcomes.find(o => o.name === currentGame.away_team);
        const historicalHomeOutcome = historicalMoneyline?.outcomes.find(o => o.name === currentGame.home_team);

        if (!historicalAwayOutcome || !historicalHomeOutcome) {
            return { prob: currentAwayProb, status: 'no_data' };
        }

        const openingAwayProb = getNoVigProb(historicalAwayOutcome.price, historicalHomeOutcome.price);
        
        const probabilityShift = currentAwayProb - openingAwayProb;
        
        // The adjusted probability is the current probability plus the shift, which amplifies the trend.
        let adjustedProb = currentAwayProb + probabilityShift;
        adjustedProb = Math.max(0.01, Math.min(0.99, adjustedProb));

        return { prob: adjustedProb, status: 'ok', shift: probabilityShift };
    }

    /**
     * Calculates the no-vig (fair) probability for an outcome given two decimal odds.
     * @param {number} odds1 - Decimal odds for the first outcome.
     * @param {number} odds2 - Decimal odds for the second outcome.
     * @returns {number} The calculated no-vig probability for the first outcome.
     */
    function getNoVigProb(odds1, odds2) {
        if (!odds1 || !odds2) return 0.5; // Default to 50% if odds are missing
        const implied1 = 1 / odds1;
        const implied2 = 1 / odds2;
        const totalImplied = implied1 + implied2;
        if (totalImplied === 0) return 0.5;
        return implied1 / totalImplied;
    }


    // --- DOM ELEMENTS ---
    const gameListContainer = document.getElementById('game-list-container');
    const processingState = document.getElementById('processingState');
    const processingText = document.getElementById('processing-text');
    const errorState = document.getElementById('errorState');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const resultsArea = document.getElementById('results-area');
    const filterControls = document.getElementById('filter-controls');
    const evFilterToggle = document.getElementById('ev-filter-toggle');
    const sortSelect = document.getElementById('sort-select');
    const soccerMarketControl = document.getElementById('soccer-market-control');
    const soccerMarketSelect = document.getElementById('soccer-market-select');
    const copyBtn = document.getElementById('copy-btn');
    const copyBtnText = document.getElementById('copy-btn-text');
    const buildMomentumParlayBtn = document.getElementById('build-momentum-parlay-btn');
    const analyzeSection = document.getElementById('analyze-section');
    const analyzeTodayBtn = document.getElementById('analyze-today-btn');
    const strategyControls = document.getElementById('strategy-controls');
    const strategyOptionsContainer = document.getElementById('strategy-options');
    const generateParlayBtn = document.getElementById('generate-parlay-btn');
    const parlayBtnText = document.getElementById('parlay-btn-text');
    const newAnalysisBtn = document.getElementById('new-analysis-btn');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const helpModalContent = document.getElementById('help-modal-content');
    const closeHelpModalBtn = document.getElementById('close-help-modal');
    const summaryDashboard = document.getElementById('summary-dashboard');
    const minOddsFilter = document.getElementById('min-odds-filter');
    const homeTeamsOnlyToggle = document.getElementById('home-teams-only-toggle');
    
    const betSlipArea = document.getElementById('bet-slip-area');
    const betSlipList = document.getElementById('bet-slip-list');
    const betSlipControls = document.getElementById('bet-slip-controls');
    const emptySlipMessage = document.getElementById('empty-slip-message');
    const copySlipBtn = document.getElementById('copy-slip-btn');
    const copySlipBtnText = document.getElementById('copy-slip-btn-text');
    const clearSlipBtn = document.getElementById('clear-slip-btn');
    
    const comboAnalysisBtn = document.getElementById('combo-analysis-btn');
    const comboModal = document.getElementById('combo-modal');
    const comboModalContent = document.getElementById('combo-modal-content');
    const closeComboModalBtn = document.getElementById('close-combo-modal');
    const wagerPerBetInput = document.getElementById('wager-per-bet-input');
    const comboTotalGamesInput = document.getElementById('combo-total-games-input');
    const comboAvgOdds = document.getElementById('combo-avg-odds');
    const comboResultsContainer = document.getElementById('combo-results-container');
    const comboOverrideOddsInput = document.getElementById('combo-override-odds-input');

    const strategyComboModal = document.getElementById('strategy-combo-modal');
    const strategyComboModalContent = document.getElementById('strategy-combo-modal-content');
    const closeStrategyComboModalBtn = document.getElementById('close-strategy-combo-modal');
    const strategyWagerPerBetInput = document.getElementById('strategy-wager-per-bet-input');
    const strategyComboTotalGamesInput = document.getElementById('strategy-combo-total-games-input');
    const strategyComboAvgOdds = document.getElementById('strategy-combo-avg-odds');
    const strategyComboResultsContainer = document.getElementById('strategy-combo-results-container');
    const copyStrategyParlayBtn = document.getElementById('copy-strategy-parlay-btn');
    const copyStrategyParlayBtnText = document.getElementById('copy-strategy-parlay-btn-text');
    const strategyOverrideOddsInput = document.getElementById('strategy-override-odds-input');
    
    let currentStrategyBets = [];
    let ALL_SPORTS_DATA = [];
    let gameCardElements = [];
    let betSlip = [];
    let slipContext = { type: 'Custom Bet Slip', settings: '' };
	
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            themeIconLight.classList.add('hidden');
            themeIconDark.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            themeIconLight.classList.remove('hidden');
            themeIconDark.classList.add('hidden');
        }
    };
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    const headerElement = canvas.closest('header');
    let animationFrameId;

    function setupMatrix() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = headerElement.offsetWidth * dpr;
        canvas.height = headerElement.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        const characters = '0123456789$+-*/=';
        const fontSize = 14;
        const columns = Math.floor(headerElement.offsetWidth / fontSize);
        const drops = Array.from({ length: columns }).map(() => 1);
        function draw() {
            ctx.fillStyle = document.documentElement.classList.contains('dark') ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#3b82f6' : '#2563eb';
            ctx.font = `${fontSize}px Inter, monospace`;
            for (let i = 0; i < drops.length; i++) {
                const text = characters.charAt(Math.floor(Math.random() * characters.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > headerElement.offsetHeight && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
            animationFrameId = requestAnimationFrame(draw);
        }
        draw();
    }
    
    setTimeout(setupMatrix, 100); 
    new ResizeObserver(setupMatrix).observe(headerElement);
    themeToggle.addEventListener('click', () => setTimeout(setupMatrix, 100));

    const LOGO_BASE_URL = 'https://a.espncdn.com/i/teamlogos';
    const TEAM_INFO = {
        'Arizona Cardinals': { id: '134931', logoId: 'nfl/500/ari.png' },'Atlanta Falcons': { id: '134919', logoId: 'nfl/500/atl.png' },'Baltimore Ravens': { id: '134925', logoId: 'nfl/500/bal.png' },'Buffalo Bills': { id: '134910', logoId: 'nfl/500/buf.png' },'Carolina Panthers': { id: '134932', logoId: 'nfl/500/car.png' },'Chicago Bears': { id: '134914', logoId: 'nfl/500/chi.png' },'Cincinnati Bengals': { id: '134916', logoId: 'nfl/500/cin.png' },'Cleveland Browns': { id: '134915', logoId: 'nfl/500/cle.png' },'Dallas Cowboys': { id: '134923', logoId: 'nfl/500/dal.png' },'Denver Broncos': { id: '134926', logoId: 'nfl/500/den.png' },'Detroit Lions': { id: '134913', logoId: 'nfl/500/det.png' },'Green Bay Packers': { id: '134912', logoId: 'nfl/500/gb.png' },'Houston Texans': { id: '134938', logoId: 'nfl/500/hou.png' },'Indianapolis Colts': { id: '134918', logoId: 'nfl/500/ind.png' },'Jacksonville Jaguars': { id: '134933', logoId: 'nfl/500/jax.png' },'Kansas City Chiefs': { id: '134921', logoId: 'nfl/500/kc.png' },'Las Vegas Raiders': { id: '134922', logoId: 'nfl/500/lv.png' },'Los Angeles Chargers': { id: '134928', logoId: 'nfl/500/lac.png' },'Los Angeles Rams': { id: '134930', logoId: 'nfl/500/lar.png' },'Miami Dolphins': { id: '134909', logoId: 'nfl/500/mia.png' },'Minnesota Vikings': { id: '134911', logoId: 'nfl/500/min.png' },'New England Patriots': { id: '134908', logoId: 'nfl/500/ne.png' },'New Orleans Saints': { id: '134927', logoId: 'nfl/500/no.png' },'New York Giants': { id: '134924', logoId: 'nfl/500/nyg.png' },'New York Jets': { id: '134907', logoId: 'nfl/500/nyj.png' },'Philadelphia Eagles': { id: '134920', logoId: 'nfl/500/phi.png' },'Pittsburgh Steelers': { id: '134917', logoId: 'nfl/500/pit.png' },'San Francisco 49ers': { id: '134929', logoId: 'nfl/500/sf.png' },'Seattle Seahawks': { id: '134934', logoId: 'nfl/500/sea.png' },'Tampa Bay Buccaneers': { id: '134935', logoId: 'nfl/500/tb.png' },'Tennessee Titans': { id: '134936', logoId: 'nfl/500/ten.png' },'Washington Commanders': { id: '134937', logoId: 'nfl/500/wsh.png' },'Atlanta Hawks': { id: '134873', logoId: 'nba/500/atl.png' },'Boston Celtics': { id: '134860', logoId: 'nba/500/bos.png' },'Brooklyn Nets': { id: '134861', logoId: 'nba/500/bkn.png' },'Charlotte Hornets': { id: '134874', logoId: 'nba/500/cha.png' },'Chicago Bulls': { id: '134868', logoId: 'nba/500/chi.png' },'Cleveland Cavaliers': { id: '134867', logoId: 'nba/500/cle.png' },'Dallas Mavericks': { id: '134888', logoId: 'nba/500/dal.png' },'Denver Nuggets': { id: '134881', logoId: 'nba/500/den.png' },'Detroit Pistons': { id: '134866', logoId: 'nba/500/det.png' },'Golden State Warriors': { id: '134878', logoId: 'nba/500/gsw.png' },'Houston Rockets': { id: '134887', logoId: 'nba/500/hou.png' },'Indiana Pacers': { id: '134865', logoId: 'nba/500/ind.png' },'Los Angeles Clippers': { id: '134877', logoId: 'nba/500/lac.png' },'Los Angeles Lakers': { id: '134876', logoId: 'nba/500/lal.png' },'Memphis Grizzlies': { id: '134889', logoId: 'nba/500/mem.png' },'Miami Heat': { id: '134875', logoId: 'nba/500/mia.png' },'Milwaukee Bucks': { id: '134864', logoId: 'nba/500/mil.png' },'Minnesota Timberwolves': { id: '134880', logoId: 'nba/500/min.png' },'New Orleans Pelicans': { id: '134890', logoId: 'nba/500/no.png' },'New York Knicks': { id: '134862', logoId: 'nba/500/nyk.png' },'Oklahoma City Thunder': { id: '134883', logoId: 'nba/500/okc.png' },'Orlando Magic': { id: '134872', logoId: 'nba/500/orl.png' },'Philadelphia 76ers': { id: '134863', logoId: 'nba/500/phi.png' },'Phoenix Suns': { id: '134879', logoId: 'nba/500/phx.png' },'Portland Trail Blazers': { id: '134882', logoId: 'nba/500/por.png' },'Sacramento Kings': { id: '134884', logoId: 'nba/500/sac.png' },'San Antonio Spurs': { id: '134886', logoId: 'nba/500/sa.png' },'Toronto Raptors': { id: '134869', logoId: 'nba/500/tor.png' },'Utah Jazz': { id: '134885', logoId: 'nba/500/utah.png' },'Washington Wizards': { id: '134871', logoId: 'nba/500/wsh.png' },'Arizona Diamondbacks': { id: '134891', logoId: 'mlb/500/ari.png' },'Atlanta Braves': { id: '134879', logoId: 'mlb/500/atl.png' },'Baltimore Orioles': { id: '134897', logoId: 'mlb/500/bal.png' },'Boston Red Sox': { id: '134884', logoId: 'mlb/500/bos.png' },'Chicago Cubs': { id: '134882', logoId: 'mlb/500/chc.png' },'Chicago White Sox': { id: '134902', logoId: 'mlb/500/chw.png' },'Cincinnati Reds': { id: '134883', logoId: 'mlb/500/cin.png' },'Cleveland Guardians': { id: '134903', logoId: 'mlb/500/cle.png' },'Colorado Rockies': { id: '134890', logoId: 'mlb/500/col.png' },'Detroit Tigers': { id: '134904', logoId: 'mlb/500/det.png' },'Houston Astros': { id: '134886', logoId: 'mlb/500/hou.png' },'Kansas City Royals': { id: '134905', logoId: 'mlb/500/kc.png' },'Los Angeles Angels': { id: '134901', logoId: 'mlb/500/laa.png' },'Los Angeles Dodgers': { id: '134880', logoId: 'mlb/500/lad.png' },'Miami Marlins': { id: '134878', logoId: 'mlb/500/mia.png' },'Milwaukee Brewers': { id: '134885', logoId: 'mlb/500/mil.png' },'Minnesota Twins': { id: '134906', logoId: 'mlb/500/min.png' },'New York Mets': { id: '134877', logoId: 'mlb/500/nym.png' },'New York Yankees': { id: '134899', logoId: 'mlb/500/nyy.png' },'Oakland Athletics': { id: '134900', logoId: 'mlb/500/oak.png' },'Philadelphia Phillies': { id: '134876', logoId: 'mlb/500/phi.png' },'Pittsburgh Pirates': { id: '134881', logoId: 'mlb/500/pit.png' },'San Diego Padres': { id: '134892', logoId: 'mlb/500/sd.png' },'San Francisco Giants': { id: '134893', logoId: 'mlb/500/sf.png' },'Seattle Mariners': { id: '134896', logoId: 'mlb/500/sea.png' },'St. Louis Cardinals': { id: '134888', logoId: 'mlb/500/stl.png' },'Tampa Bay Rays': { id: '134898', logoId: 'mlb/500/tb.png' },'Texas Rangers': { id: '134895', logoId: 'mlb/500/tex.png' },'Toronto Blue Jays': { id: '134894', logoId: 'mlb/500/tor.png' },'Washington Nationals': { id: '134875', logoId: 'mlb/500/wsh.png' },'BC Lions': { id: '135246', logoId: 'cfl/500/bc.png' },'Calgary Stampeders': { id: '135248', logoId: 'cfl/500/cgy.png' },'Edmonton Elks': { id: '135247', logoId: 'cfl/500/edm.png' },'Saskatchewan Roughriders': { id: '135249', logoId: 'cfl/500/ssk.png' },'Winnipeg Blue Bombers': { id: '135250', logoId: 'cfl/500/wpg.png' },'Hamilton Tiger-Cats': { id: '135251', logoId: 'cfl/500/ham.png' },'Toronto Argonauts': { id: '135252', logoId: 'cfl/500/tor.png' },'Ottawa Redblacks': { id: '137459', logoId: 'cfl/500/ott.png' },'Montreal Alouettes': { id: '135253', logoId: 'cfl/500/mtl.png' },'Alabama Crimson Tide': { id: '134803', logoId: 'ncf/500/333.png' },'Georgia Bulldogs': { id: '134804', logoId: 'ncf/500/61.png' },'Ohio State Buckeyes': { id: '134798', logoId: 'ncf/500/194.png' },'Michigan Wolverines': { id: '134805', logoId: 'ncf/500/130.png' },'Texas Longhorns': { id: '134823', logoId: 'ncf/500/251.png' },'USC Trojans': { id: '134840', logoId: 'ncf/500/30.png' },'Notre Dame Fighting Irish': { id: '134802', logoId: 'ncf/500/87.png' },'Clemson Tigers': { id: '134812', logoId: 'ncf/500/228.png' },'LSU Tigers': { id: '134807', logoId: 'ncf/500/99.png' },'Penn State Nittany Lions': { id: '134799', logoId: 'ncf/500/213.png' },
    };

    function getTeamInfo(teamName) {
        if (!teamName) return { name: 'Unknown', logo: '', id: null };
        const teamKey = Object.keys(TEAM_INFO).find(key => teamName.includes(key));
        if (teamKey && TEAM_INFO[teamKey]) {
            const info = TEAM_INFO[teamKey];
            const logo = info.logoId ? `${LOGO_BASE_URL}/${info.logoId}` : `https://placehold.co/96x96/e2e8f0/64748b?text=${teamName.substring(0,2)}`;
            return { name: teamName, logo: logo, id: info.id };
        }
        return { name: teamName, logo: `https://placehold.co/96x96/e2e8f0/64748b?text=${teamName.substring(0,2)}`, id: null };
    }

    const SPORT_MAP = { 'NFL': 'Football', 'CFL': 'Football', 'NCAAF': 'Football', 'MLB': 'Baseball', 'NBA': 'Basketball', 'WNBA': 'Basketball', 'SOCCER': 'Soccer', 'NHL': 'Hockey', 'NCAAB': 'Basketball' };

    function getGameSport(game) {
         if (game.sport && game.sport.toUpperCase() in SPORT_MAP) { return SPORT_MAP[game.sport.toUpperCase()]; }
        return 'Unknown';
    }

    const calculateEV = (winProb, decimalOdds) => (winProb * (decimalOdds - 1)) - (1 - winProb);
    
    function americanToDecimal(americanOdds) {
        if (isNaN(americanOdds) || americanOdds === 0) return NaN;
        if (americanOdds >= 100) return (americanOdds / 100) + 1;
        if (americanOdds <= -100) return (100 / Math.abs(americanOdds)) + 1;
        return NaN;
    }

    function decimalToAmerican(decimalOdds) {
        if (isNaN(decimalOdds) || decimalOdds <= 1) return 'N/A';
        if (decimalOdds >= 2.0) return `+${((decimalOdds - 1) * 100).toFixed(0)}`;
        return `${(-100 / (decimalOdds - 1)).toFixed(0)}`;
    }

    function combinations(n, k) {
        if (k < 0 || k > n) return 0;
        if (n - k < k) k = n - k;
        let res = 1;
        for (let i = 1; i <= k; i++) res = res * (n - i + 1) / i;
        return Math.round(res);
    }
    
     async function fetchAndAnalyzeGames() {
        console.log("Analyze button clicked.");
        if (!oddsApiKey || oddsApiKey === 'YOUR_PAID_API_KEY_HERE') {
            showError("The Odds API key is missing or is a placeholder. Please add your paid key to script.js.");
            return;
        }

        analyzeSection.classList.add('hidden');
        processingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        gameListContainer.innerHTML = '';
        resultsArea.classList.add('hidden');
        
        try {
            processingText.textContent = 'Finding in-season sports & fetching odds...';
            const sportsApiUrl = `https://api.the-odds-api.com/v4/sports/?apiKey=${oddsApiKey}`;
            const sportsResponse = await fetch(sportsApiUrl);
            if (!sportsResponse.ok) throw new Error('Failed to fetch sports list. Your API key may be invalid.');
            const availableSports = await sportsResponse.json();
            const desiredSportTitles = ['NFL', 'MLB', 'NBA', 'NHL', 'WNBA', 'CFL', 'NCAAF', 'NCAAB', 'Premier League'];
            const activeSports = availableSports.filter(sport => desiredSportTitles.includes(sport.title));

            if (activeSports.length === 0) {
                showError("No desired sports could be found in the API's list.");
                return;
            }

            const now = new Date();
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            const commenceTimeFrom = now.toISOString().slice(0, 19) + 'Z';
            const commenceTimeTo = endOfDay.toISOString().slice(0, 19) + 'Z';
            const yesterdayTimestamp = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19) + 'Z';

            processingText.textContent = 'Fetching current and historical odds...';
            const oddsPromises = activeSports.map(sport => {
                const currentUrl = `https://api.the-odds-api.com/v4/sports/${sport.key}/odds?apiKey=${oddsApiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}`;
                const historicalUrl = `https://api.the-odds-api.com/v4/historical/sports/${sport.key}/odds?apiKey=${oddsApiKey}&regions=us&markets=h2h&date=${yesterdayTimestamp}`;
                return Promise.all([fetch(currentUrl).then(res => res.json()), fetch(historicalUrl).then(res => res.json())]);
            });

            const allResponses = await Promise.all(oddsPromises);

            let allGames = [];
            const historicalDataMap = new Map();

            allResponses.forEach(responsePair => {
                const currentGames = responsePair[0];
                const historicalGames = responsePair[1].data || [];
                
                if(Array.isArray(currentGames)) {
                    allGames.push(...currentGames);
                }

                historicalGames.forEach(game => {
                    historicalDataMap.set(game.id, game);
                });
            });

            if (allGames.length === 0) {
                showError("No upcoming games found for active sports in the next 24 hours.");
                return;
            }

            ALL_SPORTS_DATA = allGames.map(game => {
                const transformed = transformApiData(game);
                if (transformed) {
                    transformed.historicalData = historicalDataMap.get(game.id);
                }
                return transformed;
            }).filter(g => g !== null);
            
            if (ALL_SPORTS_DATA.length > 0) {
                displayGames(ALL_SPORTS_DATA);
            } else {
                showError("Could not process the odds data.");
            }
        } catch (err) {
            console.error("Failed during analysis:", err);
            showError(`An error occurred: ${err.message}. Check your API key and network connection.`);
        } finally {
            processingState.classList.add('hidden');
        }
    }
    
    function transformApiData(apiGame) {
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
    }

    function createGameCard(game, index) {
        const gameId = `game-${index}`;
        const card = document.createElement('div');
        card.className = 'game-card';
        card.id = gameId;
        card.dataset.gameIndex = index;
        const gameSport = getGameSport(game);
        card.dataset.sport = gameSport;
        const awayTeamInfo = getTeamInfo(game.away_team);
        const homeTeamInfo = getTeamInfo(game.home_team);
        let awayOddsDisplay, homeOddsDisplay;
        if (gameSport === 'Soccer' && soccerMarketSelect.value === 'spread' && game.spread_away != null && game.spread_home != null) {
            awayOddsDisplay = `${game.spread_away > 0 ? '+' : ''}${game.spread_away}`;
            homeOddsDisplay = `${game.spread_home > 0 ? '+' : ''}${game.spread_home}`;
        } else {
            awayOddsDisplay = decimalToAmerican(game.moneyline_away) || 'N/A';
            homeOddsDisplay = decimalToAmerican(game.moneyline_home) || 'N/A';
        }
        
        const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
        const momentumAdjustedProb = momentumResult.prob;
        const initialSliderValue = Math.round(momentumAdjustedProb * 1000);
        let momentumIndicatorHtml = '';

        if (momentumResult.status === 'no_data') {
            momentumIndicatorHtml = `<span class="ml-2 flex items-center text-xs font-bold" style="color: var(--text-secondary);" title="Historical odds not available for momentum calculation."><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg><span>N/A</span></span>`;
        } else {
            const probabilityShift = momentumResult.shift * 100;
            const shiftColor = probabilityShift > 0.1 ? 'var(--positive-text)' : probabilityShift < -0.1 ? 'var(--negative-text)' : 'var(--text-secondary)';
            let arrowSvg = '', momentumLabel = '';
            if (probabilityShift > 0.1) {
                arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>`;
                momentumLabel = 'Away';
            } else if (probabilityShift < -0.1) {
                arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>`;
                momentumLabel = 'Home';
            } else {
                arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z" /><path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>`;
            }
            momentumIndicatorHtml = `<span class="ml-2 flex items-center text-xs font-bold" style="color: ${shiftColor};" title="Momentum from 24hr line movement.">${arrowSvg}<span class="ml-1 mr-1">${momentumLabel}</span><span>${probabilityShift.toFixed(1)}%</span></span>`;
        }
        card.innerHTML = `<div class="relative"><span class="absolute -top-6 -left-6 text-xs font-bold uppercase px-3 py-1 rounded-br-lg rounded-tl-xl" style="background-color: var(--accent-color-light); color: var(--accent-text-dark);">${gameSport}</span></div><div class="grid md:grid-cols-2 gap-x-6 gap-y-8 items-start pt-4"><div class="flex items-center justify-around text-center"><div class="flex flex-col items-center space-y-1 w-2/5"><img src="${awayTeamInfo.logo}" alt="${awayTeamInfo.name}" class="h-16 w-16 md:h-20 md:w-20 object-contain mb-1" onerror="this.src='https://placehold.co/96x96/e2e8f0/64748b?text=${awayTeamInfo.name.substring(0,1)}'; this.onerror=null;"><span class="font-bold text-sm md:text-base leading-tight">${awayTeamInfo.name}</span><span class="font-semibold text-lg" style="color: var(--accent-color);">${awayOddsDisplay}</span></div><div class="font-bold text-xl text-secondary pb-10">VS</div><div class="flex flex-col items-center space-y-1 w-2/5"><img src="${homeTeamInfo.logo}" alt="${homeTeamInfo.name}" class="h-16 w-16 md:h-20 md:w-20 object-contain mb-1" onerror="this.src='https://placehold.co/96x96/e2e8f0/64748b?text=${homeTeamInfo.name.substring(0,1)}'; this.onerror=null;"><span class="font-bold text-sm md:text-base leading-tight">${homeTeamInfo.name}</span><span class="font-semibold text-lg" style="color: var(--accent-color);">${homeOddsDisplay}</span></div></div><div class="border-t-2 md:border-t-0 md:border-l-2 pt-6 md:pt-0 md:pl-6" style="border-color: var(--border-color);"><div class="mb-3"><div class="flex items-center justify-center mb-2"><label class="block text-sm font-medium text-center">Your Estimated True Probability</label>${momentumIndicatorHtml}</div><div class="flex items-center justify-between text-center font-bold text-lg mb-2"><input type="number" step="0.1" min="0" max="100" id="${gameId}-away-prob-input" value="${(momentumAdjustedProb * 100).toFixed(1)}" class="prob-input"><input type="number" step="0.1" min="0" max="100" id="${gameId}-home-prob-input" value="${((1 - momentumAdjustedProb) * 100).toFixed(1)}" class="prob-input"></div><div class="flex items-center space-x-2"><input type="range" min="0" max="1000" value="${initialSliderValue}" class="flex-1 prob-slider" data-game-index="${index}" data-initial-value="${initialSliderValue}"></div></div><div class="mt-4 flex justify-center items-center space-x-2"><button class="utility-btn fifty-fifty-btn text-xs" data-game-index="${index}">50/50</button><button class="utility-btn reset-prob-btn text-xs" data-game-index="${index}">Reset</button></div><div id="${gameId}-results" class="mt-4 space-y-3"></div></div></div>`;
        return card;
    }

    function showError(message, isPartial = false) {
        errorState.innerHTML = message;
        errorState.classList.remove('hidden');
        if (!isPartial) {
            processingState.classList.add('hidden');
            analyzeSection.classList.remove('hidden');
        }
    }
    
    function resetApp() {
        resultsArea.classList.add('hidden');
        analyzeSection.classList.remove('hidden');
        ALL_SPORTS_DATA = []; 
        gameCardElements = [];
        gameListContainer.innerHTML = '';
        errorState.classList.add('hidden');
        evFilterToggle.checked = false;
        sortSelect.value = 'default';
        minOddsFilter.value = '';
        betSlip = [];
        slipContext = { type: 'Custom Bet Slip', settings: '' };
        renderBetSlip();
    }
    
    function updateSummaryDashboard() {
        const totalGames = ALL_SPORTS_DATA.length;
        let positiveEvOpps = 0, maxEv = 0;
        gameCardElements.forEach(card => {
            if (card.dataset.positiveEv === 'true') positiveEvOpps++;
            maxEv = Math.max(maxEv, parseFloat(card.dataset.maxEv) || 0);
        });
        const impliedOdds = maxEv > 0 ? (1 / (1 - maxEv)) : 'N/A';
        const americanOdds = maxEv > 0 ? decimalToAmerican(impliedOdds) : 'N/A';
        summaryDashboard.innerHTML = `<div class="stat-card"><div class="text-sm text-secondary">Total Games</div><div class="text-2xl font-bold">${totalGames}</div></div><div class="stat-card"><div class="text-sm text-secondary">+EV Opportunities</div><div class="text-2xl font-bold text-green-500">${positiveEvOpps}</div></div><div class="stat-card"><div class="text-sm text-secondary">Highest EV Found</div><div class="text-2xl font-bold text-green-500">${maxEv > 0 ? `+${(maxEv * 100).toFixed(2)}%` : '0%'}</div></div><div class="stat-card"><div class="text-sm text-secondary">Implied Odds</div><div class="text-2xl font-bold">${americanOdds}</div></div>`;
    }
    
    function displayGames(games) {
        gameListContainer.innerHTML = '';
        gameCardElements = [];
        if (games && games.length > 0) {
            soccerMarketControl.classList.toggle('hidden', !games.some(game => getGameSport(game) === 'Soccer'));
            games.forEach((game, index) => {
                const card = createGameCard(game, index);
                gameCardElements.push(card);
                calculateAndDisplayResults(card, index, parseFloat(card.querySelector('.prob-slider').value) / 1000);
            });
            resultsArea.classList.remove('hidden');
            if (gameCardElements.length > 0 && !strategyOptionsContainer.hasChildNodes()) {
                displayStrategyControls(games);
            }
            applyFiltersAndSorting();
        } else {
            showError("No valid games could be displayed from the API response.");
            resultsArea.classList.add('hidden');
        }
    }
    
    function displayStrategyControls(games) {
        const sports = [...new Set(games.map(getGameSport))].filter(s => s !== 'Unknown').sort();
        strategyOptionsContainer.innerHTML = '';
        if (sports.length > 0) {
            sports.forEach(sport => {
                const controlEl = document.createElement('div');
                controlEl.className = 'flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800';
                controlEl.innerHTML = `<input type="checkbox" id="sport-toggle-${sport}" data-sport="${sport}" class="sport-toggle-checkbox h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" checked><label for="sport-toggle-${sport}" class="text-sm font-medium flex-1">${sport}</label><select id="strategy-${sport}" data-sport="${sport}" class="strategy-select text-sm rounded-md p-1 w-24" style="background-color: var(--input-bg); border: 1px solid var(--border-color);"><option value="take">Take</option><option value="fade">Fade</option><option value="ignore">Ignore</option></select>`;
                strategyOptionsContainer.appendChild(controlEl);
                if (sport === 'Baseball') {
                    controlEl.querySelector('select').value = 'take';
                }
            });
            strategyControls.classList.remove('hidden');
            generateParlayBtn.disabled = false;
        } else {
            strategyControls.classList.add('hidden');
            generateParlayBtn.disabled = true;
        }
    }

    function calculateAndDisplayResults(card, gameIndex, awayProb) {
        const game = ALL_SPORTS_DATA[gameIndex];
        if (!card || !game) return;
        const resultsContainer = card.querySelector(`#game-${gameIndex}-results`);
        resultsContainer.innerHTML = '';
        const homeProb = 1 - awayProb;
        let maxPositiveEv = 0, hasPositiveEv = false;
        const createResultElement = (ev, label, odds) => {
            if (!odds) return document.createDocumentFragment();
            if (ev > 0) {
                hasPositiveEv = true;
                maxPositiveEv = Math.max(maxPositiveEv, ev);
            }
            const el = document.createElement('div');
            el.className = `result-display items-center ${ev > 0 ? 'positive-ev' : 'negative-ev'}`;
            const oddsText = decimalToAmerican(odds);
            const evText = `${ev > 0 ? '+' : ''}${(ev * 100).toFixed(2)}%`;
            const barWidth = Math.min(Math.abs(ev) * 100 * 4, 100);
            let barColor = ev > 0.10 ? '#16a34a' : ev > 0.05 ? '#22c55e' : ev > 0 ? '#4ade80' : '#ef4444';
            el.innerHTML = `<div class="flex-grow"><strong>${label}</strong><span class="text-xs text-secondary ml-2">${oddsText}</span></div><div class="flex items-center flex-shrink-0"><span class="font-bold w-16 text-right">${evText}</span><div class="w-12 h-1.5 ml-2 rounded-full overflow-hidden" style="background-color: var(--input-bg);"><div class="h-full rounded-full" style="width: ${barWidth}%; background-color: ${barColor};"></div></div></div>`;
            el.classList.add('bet-option', 'cursor-pointer', 'transition-all', 'hover:ring-2', 'hover:ring-offset-2');
            el.dataset.betLabel = label; el.dataset.betOdds = odds; el.dataset.ev = ev;
            return el;
        };
        if (game.moneyline_away && game.moneyline_home) {
            resultsContainer.appendChild(createResultElement(calculateEV(awayProb, game.moneyline_away), getTeamInfo(game.away_team).name, game.moneyline_away));
            resultsContainer.appendChild(createResultElement(calculateEV(homeProb, game.moneyline_home), getTeamInfo(game.home_team).name, game.moneyline_home));
        }
        if (game.spread_away_odds && game.spread_home_odds) {
            resultsContainer.appendChild(createResultElement(calculateEV(awayProb, game.spread_away_odds), `${getTeamInfo(game.away_team).name} ${game.spread_away > 0 ? '+' : ''}${game.spread_away}`, game.spread_away_odds));
            resultsContainer.appendChild(createResultElement(calculateEV(homeProb, game.spread_home_odds), `${getTeamInfo(game.home_team).name} ${game.spread_home > 0 ? '+' : ''}${game.spread_home}`, game.spread_home_odds));
        }
        if (game.total_over_odds && game.total_under_odds) {
            resultsContainer.appendChild(createResultElement(calculateEV(0.5, game.total_over_odds), `Over ${game.total_over}`, game.total_over_odds));
            resultsContainer.appendChild(createResultElement(calculateEV(0.5, game.total_under_odds), `Under ${game.total_under}`, game.total_under_odds));
        }
        card.dataset.maxEv = maxPositiveEv; card.dataset.positiveEv = hasPositiveEv;
    }

    function applyFiltersAndSorting() {
        const showPositiveOnly = evFilterToggle.checked;
        const sortBy = sortSelect.value;
        const minAmericanOdds = parseInt(minOddsFilter.value, 10);
        const minDecimalOdds = !isNaN(minAmericanOdds) ? americanToDecimal(minAmericanOdds) : null;
        let cardsToDisplay = [...gameCardElements];
        if (showPositiveOnly) cardsToDisplay = cardsToDisplay.filter(card => card.dataset.positiveEv === 'true');
        if (minDecimalOdds) {
            cardsToDisplay = cardsToDisplay.filter(card => Array.from(card.querySelectorAll('.bet-option')).some(option => parseFloat(option.dataset.betOdds) >= minDecimalOdds));
        }
        if (sortBy === 'highest-ev') {
            cardsToDisplay.sort((a, b) => parseFloat(b.dataset.maxEv) - parseFloat(a.dataset.maxEv));
        } else {
            cardsToDisplay.sort((a, b) => parseInt(a.dataset.gameIndex) - parseInt(b.dataset.gameIndex));
        }
        gameListContainer.innerHTML = '';
        cardsToDisplay.forEach(card => gameListContainer.appendChild(card));
        buildMomentumParlayBtn.disabled = !ALL_SPORTS_DATA.some(game => game.historicalData);
        copyBtn.disabled = !gameCardElements.some(card => card.dataset.positiveEv === 'true');
        updateSummaryDashboard();
    }

    function renderBetSlip() {
        const hasBets = betSlip.length > 0;
        betSlipArea.classList.toggle('hidden', !hasBets);
        emptySlipMessage.classList.toggle('hidden', hasBets);
        betSlipControls.classList.toggle('hidden', !hasBets);
        betSlipList.innerHTML = '';
        betSlip.forEach(bet => {
            const betEl = document.createElement('div');
            betEl.className = 'p-2 text-xs rounded-lg flex items-center justify-between';
            betEl.style.backgroundColor = 'var(--accent-color-light)';
            const game = ALL_SPORTS_DATA[bet.gameIndex];
            const matchup = `${getTeamInfo(game.away_team).name} @ ${getTeamInfo(game.home_team).name}`;
            const oddsText = decimalToAmerican(bet.odds);
            betEl.innerHTML = `<div class="flex-grow pr-2"><p class="font-bold truncate" style="color: var(--accent-text-dark);">${bet.label}</p><p class="text-secondary truncate">${matchup}</p></div><div class="flex-shrink-0 font-bold text-center w-12" style="color: var(--accent-text-dark);">${oddsText}</div><button data-bet-id="${bet.id}" class="remove-bet-btn p-1 ml-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg></button>`;
            betSlipList.appendChild(betEl);
        });
        comboAnalysisBtn.disabled = betSlip.length < 2;
    }

    function handleBetClick(target) {
        slipContext = { type: 'Custom Bet Slip', settings: '' };
        const gameCard = target.closest('.game-card');
        const gameIndex = gameCard.dataset.gameIndex;
        const { betLabel, betOdds } = target.dataset;
        const betId = `${gameIndex}-${betLabel}`;
        const existingBetIndex = betSlip.findIndex(b => b.gameIndex === gameIndex);
        if (existingBetIndex > -1) {
            const oldBet = betSlip[existingBetIndex];
            if (oldBet.id !== betId) {
                const oldBetEl = gameCard.querySelector(`.bet-option[data-bet-label="${CSS.escape(oldBet.label)}"]`);
                if (oldBetEl) oldBetEl.style.borderColor = 'transparent';
            }
            betSlip.splice(existingBetIndex, 1);
        }
        const isAlreadySelected = target.style.borderColor !== 'transparent' && target.style.borderColor !== '';
        if (!isAlreadySelected) {
            if (betSlip.length >= 20) {
                console.warn("Bet slip is full. Maximum 20 bets allowed.");
                return;
            }
            betSlip.push({ id: betId, gameIndex, label: betLabel, odds: parseFloat(betOdds) });
            target.style.borderColor = 'var(--accent-color)';
        } else {
            target.style.borderColor = 'transparent';
        }
        renderBetSlip();
    }

    function handleBuildMomentumParlay() {
        console.log("Build Momentum Parlay button clicked.");
        const minOddsValue = minOddsFilter.value || 'None';
        const homeOnly = homeTeamsOnlyToggle.checked;
        const homeOnlySetting = homeOnly ? 'Home Only' : 'All';
        slipContext = { type: 'Momentum Parlay', settings: `Min Odds: ${minOddsValue} | Teams: ${homeOnlySetting}` };
        betSlip = [];
        gameCardElements.forEach(card => card.querySelectorAll('.bet-option').forEach(el => el.style.borderColor = 'transparent'));
        const minDecimalOdds = !isNaN(parseInt(minOddsFilter.value, 10)) ? americanToDecimal(parseInt(minOddsFilter.value, 10)) : null;
        const potentialBets = [];
        ALL_SPORTS_DATA.forEach((game, index) => {
            const sport = getGameSport(game);
            const momentumResult = getMomentumAdjustedProbability(game, game.historicalData);
            if (momentumResult.status === 'no_data') return;
            
            const probabilityShift = momentumResult.shift;
            if (Math.abs(probabilityShift) < 0.001) return; // Ignore negligible momentum (0.1%)

            const momentumTeam = probabilityShift > 0 ? 'away' : 'home';
            if (homeOnly && momentumTeam !== 'home') return;

            let pick = { gameIndex: index, momentum: Math.abs(probabilityShift) };
            const highSpreadSports = ['Football', 'Basketball'];
            if (highSpreadSports.includes(sport) && game.spread_away_odds && game.spread_home_odds) {
                pick.label = `${getTeamInfo(game[`${momentumTeam}_team`]).name} ${game[`spread_${momentumTeam}`] > 0 ? '+' : ''}${game[`spread_${momentumTeam}`]}`;
                pick.odds = game[`spread_${momentumTeam}_odds`];
            } else {
                pick.label = getTeamInfo(game[`${momentumTeam}_team`]).name;
                pick.odds = game[`moneyline_${momentumTeam}`];
            }
            if (!pick.odds || (minDecimalOdds && pick.odds < minDecimalOdds)) return;
            pick.id = `${pick.gameIndex}-${pick.label}`;
            potentialBets.push(pick);
        });
        potentialBets.sort((a, b) => b.momentum - a.momentum);
        const topBets = potentialBets.slice(0, 20);
        topBets.forEach(bet => {
            betSlip.push({ id: bet.id, gameIndex: bet.gameIndex, label: bet.label, odds: bet.odds });
            const card = document.getElementById(`game-${bet.gameIndex}`);
            if (card) {
                const betEl = card.querySelector(`.bet-option[data-bet-label="${CSS.escape(bet.label)}"]`);
                if (betEl) betEl.style.borderColor = 'var(--accent-color)';
            }
        });
        renderBetSlip();
    }
    
    function handleGenerateParlayClick() {
        console.log("Analyze Parlay Strategy button clicked.");
        const minOddsValue = minOddsFilter.value || 'None';
        const homeOnly = homeTeamsOnlyToggle.checked;
        const homeOnlySetting = homeOnly ? 'Home Only' : 'All';
        const sportSettings = [];
        document.querySelectorAll('.sport-toggle-checkbox:checked').forEach(checkbox => {
            const sport = checkbox.dataset.sport;
            const strategy = document.getElementById(`strategy-${sport}`).value;
            sportSettings.push(`${sport}: ${strategy.charAt(0).toUpperCase() + strategy.slice(1)}`);
        });
        slipContext = { type: 'Strategy Parlay', settings: `Min Odds: ${minOddsValue} | Teams: ${homeOnlySetting} | ${sportSettings.join(', ')}` };
        const strategies = {};
        document.querySelectorAll('.strategy-select').forEach(select => strategies[select.dataset.sport] = select.value);
        const selectedSports = new Set(Array.from(document.querySelectorAll('.sport-toggle-checkbox:checked')).map(cb => cb.dataset.sport));
        const minDecimalOdds = !isNaN(parseInt(minOddsFilter.value, 10)) ? americanToDecimal(parseInt(minOddsFilter.value, 10)) : null;
        let generatedBets = [];
        const usedGameIndices = new Set();
        const availableGames = ALL_SPORTS_DATA.map((game, index) => ({ ...game, originalIndex: index })).filter(game => selectedSports.has(getGameSport(game)));

        availableGames.forEach((game) => {
            const sport = getGameSport(game);
            const strategy = strategies[sport];
            if (strategy === 'ignore' || !game.moneyline_away || !game.moneyline_home) return;
            const awayEV = calculateEV(0.5, game.moneyline_away);
            const homeEV = calculateEV(0.5, game.moneyline_home);
            if (awayEV <= 0 && homeEV <= 0) return;
            const predictedWinner = awayEV > homeEV ? 'away' : 'home';
            const finalPickTeam = (strategy === 'take') ? predictedWinner : (predictedWinner === 'away' ? 'home' : 'away');
            if (homeOnly && finalPickTeam !== 'home') return;
            let betToAdd = null;
            const isSpreadSport = ['Football', 'Basketball'].includes(sport);
            const canUseSpread = game.spread_away_odds && game.spread_home_odds;
            if (sport === 'Soccer') {
                const soccerDefaultOdds = americanToDecimal(-111);
                betToAdd = { odds: soccerDefaultOdds, label: `${getTeamInfo(game[`${finalPickTeam}_team`]).name} (Spread)`, ev: calculateEV(0.5, soccerDefaultOdds), gameIndex: game.originalIndex };
            } else if (isSpreadSport && canUseSpread) {
                 betToAdd = { odds: game[`spread_${finalPickTeam}_odds`], label: `${getTeamInfo(game[`${finalPickTeam}_team`]).name} ${game[`spread_${finalPickTeam}`] > 0 ? '+' : ''}${game[`spread_${finalPickTeam}`]}`, ev: calculateEV(0.5, game[`spread_${finalPickTeam}_odds`]), gameIndex: game.originalIndex };
            } else {
                 betToAdd = { odds: game[`moneyline_${finalPickTeam}`], label: `${getTeamInfo(game[`${finalPickTeam}_team`]).name} (ML)`, ev: calculateEV(0.5, game[`moneyline_${finalPickTeam}`]), gameIndex: game.originalIndex };
            }
            if (betToAdd && (!minDecimalOdds || betToAdd.odds >= minDecimalOdds)) {
                generatedBets.push(betToAdd);
                usedGameIndices.add(game.originalIndex);
            }
        });
        const PARLAY_CAP = 20;
        const slotsToFill = PARLAY_CAP - generatedBets.length;
        if (slotsToFill > 0) {
            const fillerPicks = [];
            const fillerCandidates = availableGames.filter(game => !usedGameIndices.has(game.originalIndex));
            fillerCandidates.forEach((game) => {
                if (!game.total_over_odds || !game.total_under_odds) return;
                const overEV = calculateEV(0.5, game.total_over_odds);
                const underEV = calculateEV(0.5, game.total_under_odds);
                const pick = (overEV > underEV) ? { ev: overEV, odds: game.total_over_odds, label: `Over ${game.total_over}`, gameIndex: game.originalIndex } : { ev: underEV, odds: game.total_under_odds, label: `Under ${game.total_under}`, gameIndex: game.originalIndex };
                if (!minDecimalOdds || pick.odds >= minDecimalOdds) fillerPicks.push(pick);
            });
            fillerPicks.sort((a, b) => b.ev - a.ev);
            generatedBets.push(...fillerPicks.slice(0, slotsToFill));
        }
        generatedBets.sort((a,b) => b.ev - a.ev);
        currentStrategyBets = generatedBets.slice(0, PARLAY_CAP);
        if (currentStrategyBets.length === 0) {
            parlayBtnText.textContent = 'No Picks Found';
            setTimeout(() => { parlayBtnText.textContent = 'Analyze Parlay Strategy'; }, 2500);
            return;
        }
        strategyComboTotalGamesInput.value = currentStrategyBets.length;
        showStrategyComboAnalysis();
    }

    function showStrategyComboAnalysis() {
        strategyComboModal.classList.remove('hidden');
        setTimeout(() => { 
            strategyComboModal.classList.remove('opacity-0');
            strategyComboModalContent.classList.remove('scale-95');
            calculateAndDisplayStrategyComboAnalysis(currentStrategyBets);
        }, 10);
    }

    function hideStrategyComboModal() {
        strategyComboModal.classList.add('opacity-0');
        strategyComboModalContent.classList.add('scale-95');
        setTimeout(() => strategyComboModal.classList.add('hidden'), 300);
    }
    
    function handleCopyStrategyParlay() {
        if (currentStrategyBets.length > 0) {
            const colors = { containerBg: '#f1f5f9', accent: '#2563eb', textPrimary: '#0f172a', textSecondary: '#475569', border: '#e2e8f0' };
            let htmlToCopy = `<div style="font-family: Inter, sans-serif; color: ${colors.textPrimary};">`;
            htmlToCopy += `<h3 style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">${slipContext.type} (${currentStrategyBets.length} Picks)</h3>`;
            htmlToCopy += `<p style="font-size: 12px; color: ${colors.textSecondary}; margin-bottom: 12px; border-bottom: 1px solid ${colors.border}; padding-bottom: 8px;">${appVersion} | Settings: ${slipContext.settings}</p>`;
            currentStrategyBets.forEach(bet => {
                const oddsText = decimalToAmerican(bet.odds);
                let subtext = '';
                if ((bet.label.toLowerCase().startsWith('over') || bet.label.toLowerCase().startsWith('under')) && bet.gameIndex !== undefined) {
                    const game = ALL_SPORTS_DATA[bet.gameIndex];
                    if (game) subtext = `<p style="margin: 0; font-size: 12px; color: ${colors.textSecondary};">${getTeamInfo(game.away_team).name} @ ${getTeamInfo(game.home_team).name}</p>`;
                }
                htmlToCopy += `<div style="background-color: ${colors.containerBg}; border-radius: 8px; padding: 12px; font-size: 14px; margin-bottom: 8px; border: 1px solid ${colors.border};"><p style="font-weight: 600; margin: 0 0 4px 0; color: ${colors.textPrimary};">${bet.label} <span style="font-weight: 700; color: ${colors.accent};">(${oddsText})</span></p>${subtext}</div>`;
            });
            htmlToCopy += `</div>`;
            copyHtmlToClipboard(htmlToCopy, copyStrategyParlayBtnText, 'Copy Parlay & Close');
        }
         setTimeout(hideStrategyComboModal, 500);
    }

    function updateComboTotals() {
        let totalBets = 0, totalWager = 0;
        comboResultsContainer.querySelectorAll('.combo-checkbox:checked').forEach(box => {
            totalBets += parseInt(box.dataset.numBets);
            totalWager += parseFloat(box.dataset.cost);
        });
        document.getElementById('total-bets-cell').textContent = totalBets;
        document.getElementById('total-wager-cell').textContent = `$${totalWager.toFixed(2)}`;
    }
    
    function copyToClipboard(text, buttonTextElement, originalText) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            buttonTextElement.textContent = 'Copied!';
        } catch (err) {
            console.error('Failed to copy text: ', err);
            buttonTextElement.textContent = 'Copy Failed';
        }
        document.body.removeChild(textArea);
        setTimeout(() => { buttonTextElement.textContent = originalText; }, 2000);
    }

    function copyHtmlToClipboard(html, buttonTextElement, originalText) {
        const tempEl = document.createElement('div');
        tempEl.style.position = 'absolute';
        tempEl.style.left = '-9999px';
        tempEl.innerHTML = html;
        document.body.appendChild(tempEl);
        const range = document.createRange();
        range.selectNodeContents(tempEl);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        try {
            document.execCommand('copy');
            buttonTextElement.textContent = 'Copied!';
        } catch (err) {
            console.error('Failed to copy HTML: ', err);
            buttonTextElement.textContent = 'Copy Failed';
        }
        selection.removeAllRanges();
        document.body.removeChild(tempEl);
        setTimeout(() => { buttonTextElement.textContent = originalText; }, 2000);
    }
    
    function calculateAndDisplayComboAnalysis() {
        const numGames = parseInt(comboTotalGamesInput.value) || betSlip.length;
        const maxComboSize = Math.min(15, numGames);
        
        if (numGames < 2) {
            comboAvgOdds.textContent = '0.00';
            comboResultsContainer.innerHTML = `<p class="text-center text-secondary py-4">You need at least 2 games to analyze round robins.</p>`;
            return;
        }

        const wagerPerBet = parseFloat(wagerPerBetInput.value) || 1;
        const totalOdds = betSlip.reduce((sum, bet) => sum + bet.odds, 0);
        const calculatedAvgOdds = betSlip.length > 0 ? totalOdds / betSlip.length : 0;
        
        comboAvgOdds.textContent = decimalToAmerican(calculatedAvgOdds);

        const overrideAmericanOdds = parseFloat(comboOverrideOddsInput.value);
        const overrideDecimalOdds = americanToDecimal(overrideAmericanOdds);
        const avgOdds = !isNaN(overrideDecimalOdds) ? overrideDecimalOdds : calculatedAvgOdds;
        
        let bestProfitPerWin = -Infinity;
        let bestComboIndex = -1;
        let comboData = [];

        for (let k = 2; k <= maxComboSize; k++) {
            const numCombos = combinations(numGames, k);
            const costForThisComboSize = numCombos * wagerPerBet;
            const payoutPerWinningCombo = (avgOdds ** k) * wagerPerBet;
            let winsNeeded = -1, profitAtBreakEven = 0, profitPerWin = 0;
            for (let w = k; w <= numGames; w++) {
                const winningCombos = combinations(w, k);
                const totalWinnings = winningCombos * payoutPerWinningCombo;
                if (totalWinnings > costForThisComboSize) {
                    winsNeeded = w;
                    profitAtBreakEven = totalWinnings - costForThisComboSize;
                    if(winsNeeded > 0) profitPerWin = profitAtBreakEven / winsNeeded;
                    break;
                }
            }
            if(profitPerWin > bestProfitPerWin) {
                bestProfitPerWin = profitPerWin;
                bestComboIndex = k;
            }
            comboData.push({k, numCombos, costForThisComboSize, winsNeeded, profitAtBreakEven, profitPerWin});
        }

        let resultsHtml = `<table class="w-full text-sm text-left"><thead class="sticky top-0 z-10" style="background-color: var(--container-bg);"><tr class="border-b" style="border-color: var(--border-color);"><th class="p-2 w-8"><input type="checkbox" id="select-all-combos"></th><th class="p-2 font-semibold">Combo Size</th><th class="p-2 font-semibold text-center">Cost</th><th class="p-2 font-semibold text-center">Wins for Profit</th><th class="p-2 font-semibold text-center">Profit @ B/E</th><th class="p-2 font-semibold text-center text-yellow-500">Profit / Win</th></tr></thead><tbody>`;
        comboData.forEach(data => {
            const {k, numCombos, costForThisComboSize, winsNeeded, profitAtBreakEven, profitPerWin} = data;
            const highlightClass = k === bestComboIndex ? 'best-combo-highlight' : '';
            resultsHtml += `<tr class="border-b ${highlightClass}" style="border-color: var(--border-color);"><td class="p-2 text-center"><input type="checkbox" class="combo-checkbox" data-num-bets="${numCombos}" data-cost="${costForThisComboSize.toFixed(2)}"></td><td class="p-2 font-bold">${k}-Teams (${numCombos} bets)</td><td class="p-2 text-center">$${costForThisComboSize.toFixed(2)}</td><td class="p-2 text-center font-bold ${winsNeeded === -1 ? 'text-red-500' : 'text-green-500'}">${winsNeeded !== -1 ? `${winsNeeded} of ${numGames}` : 'N/A'}</td><td class="p-2 text-center ${profitAtBreakEven <= 0 ? '' : 'text-green-500'}">${winsNeeded !== -1 ? `$${profitAtBreakEven.toFixed(2)}` : 'N/A'}</td><td class="p-2 text-center font-semibold ${profitPerWin <= 0 ? '' : 'text-yellow-500'}">${winsNeeded !== -1 ? `$${profitPerWin.toFixed(2)}` : 'N/A'}</td></tr>`;
        });
        resultsHtml += `</tbody><tfoot class="sticky bottom-0" style="background-color: var(--container-bg);"><tr class="border-t-2" style="border-color: var(--text-primary);"><td class="p-2 font-bold text-right" colspan="2">Selected Totals:</td><td id="total-wager-cell" class="p-2 font-bold text-center">$0.00</td><td class="p-2 font-bold text-center" colspan="3"><span id="total-bets-cell">0</span> Bets</td></tr></tfoot></table>`;
        comboResultsContainer.innerHTML = resultsHtml;
        updateComboTotals();
    }
    
    function calculateAndDisplayStrategyComboAnalysis(bets) {
        const numGames = parseInt(strategyComboTotalGamesInput.value) || bets.length;
        const maxComboSize = Math.min(15, numGames);
        if (numGames < 2) {
            strategyComboAvgOdds.textContent = '0.00';
            strategyComboResultsContainer.innerHTML = `<p class="text-center text-secondary py-4">You need at least 2 bets to analyze round robins.</p>`;
            return;
        }
        const wagerPerBet = parseFloat(strategyWagerPerBetInput.value) || 1;
        const totalOdds = bets.reduce((sum, bet) => sum + bet.odds, 0);
        const calculatedAvgOdds = bets.length > 0 ? totalOdds / bets.length : 0;
        strategyComboAvgOdds.textContent = decimalToAmerican(calculatedAvgOdds);
        const overrideAmericanOdds = parseFloat(strategyOverrideOddsInput.value);
        const overrideDecimalOdds = americanToDecimal(overrideAmericanOdds);
        const avgOdds = !isNaN(overrideDecimalOdds) ? overrideDecimalOdds : calculatedAvgOdds;
        let bestRoi = -Infinity, bestComboIndex = -1, comboData = [];
        for (let k = 2; k <= maxComboSize; k++) {
            const numCombos = combinations(numGames, k);
            const costForThisComboSize = numCombos * wagerPerBet;
            const payoutPerWinningCombo = (avgOdds ** k) * wagerPerBet;
            let winsNeeded = -1, profitAtBreakEven = 0, roiAtBreakEven = 0;
            for (let w = k; w <= numGames; w++) {
                const winningCombos = combinations(w, k);
                const totalWinnings = winningCombos * payoutPerWinningCombo;
                if (totalWinnings > costForThisComboSize) {
                    winsNeeded = w;
                    profitAtBreakEven = totalWinnings - costForThisComboSize;
                    if (costForThisComboSize > 0) roiAtBreakEven = (profitAtBreakEven / costForThisComboSize) * 100;
                    break;
                }
            }
            if(roiAtBreakEven > bestRoi) { bestRoi = roiAtBreakEven; bestComboIndex = k; }
            comboData.push({k, numCombos, costForThisComboSize, winsNeeded, profitAtBreakEven, roiAtBreakEven});
        }
        let resultsHtml = `<table class="w-full text-sm text-left"><thead class="sticky top-0 z-10" style="background-color: var(--container-bg);"><tr class="border-b" style="border-color: var(--border-color);"><th class="p-2 w-8"><input type="checkbox" id="select-all-strategy-combos"></th><th class="p-2 font-semibold">Combo Size</th><th class="p-2 font-semibold text-center">Cost</th><th class="p-2 font-semibold text-center">Wins for Profit</th><th class="p-2 font-semibold text-center">Profit @ B/E</th><th class="p-2 font-semibold text-center text-yellow-500">ROI @ B/E</th></tr></thead><tbody>`;
        comboData.forEach(data => {
            const {k, numCombos, costForThisComboSize, winsNeeded, profitAtBreakEven, roiAtBreakEven} = data;
            const highlightClass = k === bestComboIndex ? 'best-combo-highlight' : '';
            resultsHtml += `<tr class="border-b ${highlightClass}" style="border-color: var(--border-color);"><td class="p-2 text-center"><input type="checkbox" class="strategy-combo-checkbox" data-num-bets="${numCombos}" data-cost="${costForThisComboSize.toFixed(2)}"></td><td class="p-2 font-bold">${k}-Teams (${numCombos} bets)</td><td class="p-2 text-center">$${costForThisComboSize.toFixed(2)}</td><td class="p-2 text-center font-bold ${winsNeeded === -1 ? 'text-red-500' : 'text-green-500'}">${winsNeeded !== -1 ? `${winsNeeded} of ${numGames}` : 'N/A'}</td><td class="p-2 text-center ${profitAtBreakEven <= 0 ? '' : 'text-green-500'}">${winsNeeded !== -1 ? `$${profitAtBreakEven.toFixed(2)}` : 'N/A'}</td><td class="p-2 text-center font-semibold ${roiAtBreakEven <= 0 ? '' : 'text-yellow-500'}">${winsNeeded !== -1 ? `+${roiAtBreakEven.toFixed(0)}%` : 'N/A'}</td></tr>`;
        });
        resultsHtml += `</tbody><tfoot class="sticky bottom-0" style="background-color: var(--container-bg);"> <tr class="border-t-2" style="border-color: var(--text-primary);"><td class="p-2 font-bold text-right" colspan="2">Selected Totals:</td><td id="total-strategy-wager-cell" class="p-2 font-bold text-center">$0.00</td><td class="p-2 font-bold text-center" colspan="3"><span id="total-strategy-bets-cell">0</span> Bets</td></tr></tfoot></table>`;
        strategyComboResultsContainer.innerHTML = resultsHtml;
        updateStrategyComboTotals();
    }

    function attachEventListeners() {
        console.log("Attaching dynamic event listeners for game cards...");
        gameListContainer.addEventListener('input', e => {
            if (e.target.classList.contains('prob-slider')) {
                const gameIndex = e.target.dataset.gameIndex;
                const awayProbPercent = parseFloat(e.target.value) / 10;
                const awayInput = document.getElementById(`game-${gameIndex}-away-prob-input`);
                const homeInput = document.getElementById(`game-${gameIndex}-home-prob-input`);
                if(document.activeElement !== awayInput) awayInput.value = awayProbPercent.toFixed(1);
                if(document.activeElement !== homeInput) homeInput.value = (100 - awayProbPercent).toFixed(1);
                const card = document.getElementById(`game-${gameIndex}`);
                if (card) calculateAndDisplayResults(card, gameIndex, awayProbPercent / 100);
                applyFiltersAndSorting();
            }
        });
        gameListContainer.addEventListener('change', e => {
            if (e.target.classList.contains('prob-input')) {
                const gameIndex = e.target.closest('.game-card').dataset.gameIndex;
                const awayInput = document.getElementById(`game-${gameIndex}-away-prob-input`);
                const homeInput = document.getElementById(`game-${gameIndex}-home-prob-input`);
                let value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0) value = 0;
                if (value > 100) value = 100;
                const slider = document.querySelector(`.prob-slider[data-game-index="${gameIndex}"]`);
                if (e.target.id.includes('away')) {
                    slider.value = value * 10;
                    homeInput.value = (100 - value).toFixed(1);
                } else {
                    slider.value = (100 - value) * 10;
                    awayInput.value = (100 - value).toFixed(1);
                }
                const card = document.getElementById(`game-${gameIndex}`);
                if(card) calculateAndDisplayResults(card, gameIndex, parseFloat(slider.value) / 1000);
                applyFiltersAndSorting();
            }
        });

        gameListContainer.addEventListener('click', e => {
            const resetBtn = e.target.closest('.reset-prob-btn');
            if (resetBtn) {
                const gameIndex = resetBtn.dataset.gameIndex;
                const slider = document.querySelector(`.prob-slider[data-game-index="${gameIndex}"]`);
                if (slider) {
                    slider.value = slider.dataset.initialValue;
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            const fiftyBtn = e.target.closest('.fifty-fifty-btn');
            if (fiftyBtn) {
                const gameIndex = fiftyBtn.dataset.gameIndex;
                const slider = document.querySelector(`.prob-slider[data-game-index="${gameIndex}"]`);
                if (slider) {
                    slider.value = 500;
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            const betOption = e.target.closest('.bet-option');
            if (betOption) handleBetClick(betOption);
        });
    }

    // --- SETUP LISTENERS ---
    console.log("Attaching static event listeners...");
    evFilterToggle.addEventListener('change', applyFiltersAndSorting);
    sortSelect.addEventListener('change', applyFiltersAndSorting);
    minOddsFilter.addEventListener('input', applyFiltersAndSorting);
    soccerMarketSelect.addEventListener('change', () => displayGames(ALL_SPORTS_DATA));
    
    if (copyBtn) copyBtn.addEventListener('click', () => { console.log("Copy +EV button clicked."); handleCopyClick(); });
    if (buildMomentumParlayBtn) buildMomentumParlayBtn.addEventListener('click', handleBuildMomentumParlay);
    if (generateParlayBtn) generateParlayBtn.addEventListener('click', handleGenerateParlayClick);
    if (analyzeTodayBtn) {
        console.log("Analyze button found:", analyzeTodayBtn);
        analyzeTodayBtn.addEventListener('click', fetchAndAnalyzeGames);
    } else {
        console.error("Analyze button not found!");
    }
    if (newAnalysisBtn) newAnalysisBtn.addEventListener('click', resetApp);
    
    helpBtn.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
        setTimeout(() => { 
            helpModal.classList.remove('opacity-0');
            helpModalContent.classList.remove('scale-95');
        }, 10);
    });
    closeHelpModalBtn.addEventListener('click', () => {
        helpModal.classList.add('opacity-0');
        helpModalContent.classList.add('scale-95');
        setTimeout(() => helpModal.classList.add('hidden'), 300);
    });
    
    clearSlipBtn.addEventListener('click', () => {
        betSlip = [];
        slipContext = { type: 'Custom Bet Slip', settings: '' };
        gameCardElements.forEach(card => card.querySelectorAll('.bet-option').forEach(el => el.style.borderColor = 'transparent'));
        renderBetSlip();
    });

    betSlipList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-bet-btn');
        if (removeBtn) {
            slipContext = { type: 'Custom Bet Slip', settings: '' };
            const betIdToRemove = removeBtn.dataset.betId;
            const betIndex = betSlip.findIndex(b => b.id === betIdToRemove);
            if(betIndex > -1) {
                const betToRemove = betSlip[betIndex];
                const gameCard = document.getElementById(`game-${betToRemove.gameIndex}`);
                if(gameCard){
                     const betEl = gameCard.querySelector(`.bet-option[data-bet-label="${CSS.escape(betToRemove.label)}"]`);
                     if(betEl) betEl.style.borderColor = 'transparent';
                }
                betSlip.splice(betIndex, 1);
                renderBetSlip();
            }
        }
    });

     copySlipBtn.addEventListener('click', () => {
        if (betSlip.length > 0) {
            const minOddsValue = minOddsFilter.value || 'None';
            const homeOnlySetting = homeTeamsOnlyToggle.checked ? 'Home Only' : 'All';
            if (slipContext.type === 'Custom Bet Slip') {
                slipContext.settings = `Min Odds: ${minOddsValue} | Teams: ${homeOnlySetting}`;
            }
            const colors = { containerBg: '#f1f5f9', accent: '#2563eb', textPrimary: '#0f172a', textSecondary: '#475569', border: '#e2e8f0' };
            let htmlToCopy = `<div style="font-family: Inter, sans-serif; color: ${colors.textPrimary};">`;
            htmlToCopy += `<h3 style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">${slipContext.type} (${betSlip.length} Picks)</h3>`;
            htmlToCopy += `<p style="font-size: 12px; color: ${colors.textSecondary}; margin-bottom: 12px; border-bottom: 1px solid ${colors.border}; padding-bottom: 8px;">${appVersion} | Settings: ${slipContext.settings}</p>`;
            
            betSlip.forEach(bet => {
                const game = ALL_SPORTS_DATA[bet.gameIndex];
                const matchup = `${getTeamInfo(game.away_team).name} @ ${getTeamInfo(game.home_team).name}`;
                 const oddsText = decimalToAmerican(bet.odds);
                htmlToCopy += `<div style="background-color: ${colors.containerBg}; border-radius: 8px; padding: 12px; font-size: 14px; margin-bottom: 8px; border: 1px solid ${colors.border};"><p style="font-weight: 600; margin: 0 0 4px 0; color: ${colors.textPrimary};">${bet.label} <span style="font-weight: 700; color: ${colors.accent};">(${oddsText})</span></p><p style="margin: 0; font-size: 12px; color: ${colors.textSecondary};">${matchup}</p></div>`;
            });
            htmlToCopy += `</div>`;
            copyHtmlToClipboard(htmlToCopy, copySlipBtnText, 'Copy Slip');
        }
    });
    
    comboAnalysisBtn.addEventListener('click', () => {
        if (betSlip.length >= 2) {
            comboTotalGamesInput.value = betSlip.length;
            comboModal.classList.remove('hidden');
            setTimeout(() => {
                comboModal.classList.remove('opacity-0');
                comboModalContent.classList.remove('scale-95');
                calculateAndDisplayComboAnalysis();
            }, 10);
        }
    });
    const hideComboModal = () => {
         comboModal.classList.add('opacity-0');
         comboModalContent.classList.add('scale-95');
         setTimeout(() => comboModal.classList.add('hidden'), 300);
    };
    closeComboModalBtn.addEventListener('click', hideComboModal);
    wagerPerBetInput.addEventListener('input', calculateAndDisplayComboAnalysis);
    comboTotalGamesInput.addEventListener('input', calculateAndDisplayComboAnalysis);
    comboOverrideOddsInput.addEventListener('input', calculateAndDisplayComboAnalysis);
    
    comboResultsContainer.addEventListener('change', (e) => {
        if (e.target.matches('#select-all-combos')) {
            comboResultsContainer.querySelectorAll('.combo-checkbox').forEach(box => box.checked = e.target.checked);
        }
        updateComboTotals();
    });
    
    document.getElementById('select-all-sports').addEventListener('click', () => {
        document.querySelectorAll('.sport-toggle-checkbox').forEach(box => box.checked = true);
    });
    document.getElementById('deselect-all-sports').addEventListener('click', () => {
        document.querySelectorAll('.sport-toggle-checkbox').forEach(box => box.checked = false);
    });

    closeStrategyComboModalBtn.addEventListener('click', hideStrategyComboModal);
    strategyWagerPerBetInput.addEventListener('input', () => calculateAndDisplayStrategyComboAnalysis(currentStrategyBets));
    strategyComboTotalGamesInput.addEventListener('input', () => calculateAndDisplayStrategyComboAnalysis(currentStrategyBets));
    strategyOverrideOddsInput.addEventListener('input', () => calculateAndDisplayStrategyComboAnalysis(currentStrategyBets));
    copyStrategyParlayBtn.addEventListener('click', handleCopyStrategyParlay);

    strategyComboResultsContainer.addEventListener('change', (e) => {
        if (e.target.matches('#select-all-strategy-combos')) {
            strategyComboResultsContainer.querySelectorAll('.strategy-combo-checkbox').forEach(box => box.checked = e.target.checked);
        }
        updateStrategyComboTotals();
    });

    attachEventListeners();

    console.log("script.js loaded and all initial event listeners attached successfully.");
});

