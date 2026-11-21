// Signal-Radar – Konfiguration: Themen, Quellen, Ticker.
// Alles hier ist bewusst als Daten gehalten: Ein neues Thema = ein neuer Eintrag.

export const THEMES = [
  {
    id: "ai", name: "KI & Sprachmodelle", short: "KI",
    wiki: ["ChatGPT", "Anthropic", "OpenAI", "Claude_(language_model)", "Large_language_model"],
    news: ['OpenAI OR Anthropic OR ChatGPT OR "Claude AI"', 'KI-Modell OR "künstliche Intelligenz" Aktie'],
    hn: "llm",
    kw: ["openai", "anthropic", "chatgpt", "claude", "gemini", "künstliche intelligenz", "ki", "ai", "llm", "sprachmodell", "generative ai", "genai", "copilot", "mistral", "xai", "grok", "deepseek"],
    etf: "AIQ", tickers: ["MSFT", "GOOGL", "META"],
  },
  {
    id: "chips", name: "KI-Chips & Halbleiter", short: "Chips",
    wiki: ["Nvidia", "TSMC", "Advanced_Micro_Devices", "Broadcom", "ASML_Holding"],
    news: ["Nvidia OR TSMC OR Broadcom OR ASML OR AMD Chips", "Halbleiter Aktie"],
    hn: "nvidia",
    kw: ["nvidia", "tsmc", "broadcom", "asml", "amd", "halbleiter", "semiconductor", "chip", "chips", "gpu", "hbm", "sk hynix", "micron", "blackwell", "rubin"],
    etf: "SMH", tickers: ["NVDA", "AVGO", "TSM", "ASML"],
  },
  {
    id: "power", name: "Rechenzentren & Strom", short: "Strom",
    wiki: ["Data_center", "Vertiv", "Constellation_Energy", "GE_Vernova"],
    news: ['"data center" power OR electricity demand AI', "Rechenzentrum Strom Netz"],
    hn: "datacenter",
    kw: ["data center", "datacenter", "rechenzentr", "stromnetz", "power grid", "vertiv", "constellation energy", "ge vernova", "gas turbine", "transformer", "strombedarf", "electricity demand", "hyperscaler", "capex"],
    etf: "GRID", tickers: ["VRT", "CEG", "GEV", "ETN"],
  },
  {
    id: "nuclear", name: "Kernkraft & Uran", short: "Uran",
    wiki: ["Small_modular_reactor", "Uranium", "Cameco", "Oklo_Inc."],
    news: ["uranium OR \"small modular reactor\" OR nuclear power stocks", "Kernkraft Uran Aktie"],
    hn: "nuclear",
    kw: ["uran", "uranium", "nuclear", "kernkraft", "atomkraft", "smr", "small modular", "cameco", "oklo", "nuscale", "kernenergie", "fusion"],
    etf: "URA", tickers: ["CCJ", "OKLO", "SMR"],
  },
  {
    id: "defense", name: "Rüstung & Sicherheit", short: "Rüstung",
    wiki: ["Rheinmetall", "Palantir_Technologies", "Hensoldt", "Anduril_Industries"],
    news: ["Rheinmetall OR Hensoldt OR Renk OR Rüstung Aktie", "defense stocks OR Palantir OR Anduril"],
    hn: "defense",
    kw: ["rheinmetall", "hensoldt", "renk", "rüstung", "verteidigung", "defense", "defence", "palantir", "anduril", "nato", "drohne", "drone", "munition", "lockheed", "bundeswehr"],
    etf: "ITA", tickers: ["RHM.DE", "PLTR", "HAG.DE"],
  },
  {
    id: "crypto", name: "Krypto & Bitcoin", short: "Krypto",
    wiki: ["Bitcoin", "Ethereum", "Cryptocurrency", "Stablecoin"],
    news: ["Bitcoin OR Ethereum OR Krypto Kurs", "bitcoin ETF OR crypto market"],
    hn: "bitcoin",
    kw: ["bitcoin", "btc", "ethereum", "krypto", "crypto", "stablecoin", "solana", "coinbase", "microstrategy", "strategy inc", "blockchain", "tether"],
    etf: "IBIT", tickers: ["COIN", "MSTR"],
  },
  {
    id: "gold", name: "Gold & Edelmetalle", short: "Gold",
    wiki: ["Gold_as_an_investment", "Silver_as_an_investment", "Gold"],
    news: ["Goldpreis OR Silberpreis", "gold price OR silver price record"],
    hn: "gold price",
    kw: ["gold", "goldpreis", "silber", "silver", "edelmetall", "platin", "precious metal", "feinunze", "notenbank kauf"],
    etf: "GLD", tickers: ["SLV", "NEM"],
  },
  {
    id: "quantum", name: "Quantencomputing", short: "Quanten",
    wiki: ["Quantum_computing", "IonQ", "Rigetti_Computing", "D-Wave_Systems"],
    news: ["quantum computing stocks OR IonQ OR Rigetti OR D-Wave", "Quantencomputer Aktie"],
    hn: "quantum",
    kw: ["quantum", "quanten", "ionq", "rigetti", "d-wave", "qubit"],
    etf: "QTUM", tickers: ["IONQ", "RGTI", "QBTS"],
  },
  {
    id: "robotics", name: "Robotik & Humanoide", short: "Robotik",
    wiki: ["Humanoid_robot", "Optimus_(robot)", "Figure_AI", "Boston_Dynamics"],
    news: ["humanoid robot OR robotics stocks OR Tesla Optimus", "Robotik humanoide Roboter Aktie"],
    hn: "robotics",
    kw: ["robot", "humanoid", "optimus", "figure ai", "automation", "automatisierung", "unitree"],
    etf: "BOTZ", tickers: ["TSLA", "ISRG", "SYM"],
  },
  {
    id: "space", name: "Raumfahrt", short: "Space",
    wiki: ["SpaceX", "Rocket_Lab", "Starlink", "AST_SpaceMobile"],
    news: ["SpaceX OR \"Rocket Lab\" OR Starlink OR \"space stocks\"", "Raumfahrt Aktie"],
    hn: "spacex",
    kw: ["spacex", "starlink", "rocket lab", "raumfahrt", "satellit", "satellite", "ast spacemobile", "starship", "space stock"],
    etf: "UFO", tickers: ["RKLB", "ASTS"],
  },
  {
    id: "health", name: "Biotech & Abnehmspritzen", short: "Biotech",
    wiki: ["Semaglutide", "Tirzepatide", "Eli_Lilly_and_Company", "Novo_Nordisk"],
    news: ["Eli Lilly OR Novo Nordisk OR GLP-1 OR Wegovy OR Zepbound", "Biotech Aktie Studie"],
    hn: "glp-1",
    kw: ["glp-1", "wegovy", "ozempic", "zepbound", "mounjaro", "eli lilly", "novo nordisk", "biotech", "abnehm", "fda", "pharma", "orforglipron"],
    etf: "XBI", tickers: ["LLY", "NVO"],
  },
  {
    id: "cyber", name: "Cybersecurity", short: "Cyber",
    wiki: ["CrowdStrike", "Palo_Alto_Networks", "Ransomware"],
    news: ["cybersecurity stocks OR CrowdStrike OR \"Palo Alto Networks\" OR Zscaler", "Cyberangriff Hackerangriff Unternehmen"],
    hn: "ransomware",
    kw: ["cyber", "crowdstrike", "palo alto", "zscaler", "ransomware", "hacker", "datenleck", "sicherheitslücke", "breach"],
    etf: "CIBR", tickers: ["CRWD", "PANW", "ZS"],
  },
  {
    id: "ipo", name: "IPOs & Börsengänge", short: "IPOs",
    wiki: ["Initial_public_offering", "Anthropic", "OpenAI", "SpaceX", "Databricks"],
    news: ['IPO OR "files for IPO" OR "going public"', 'Börsengang OR "geht an die Börse"'],
    hn: "ipo",
    kw: ["ipo", "ipos", "börsengang", "going public", "s-1", "börsendebüt", "erstnotiz", "direct listing", "geht an die börse"],
    etf: "IPO", tickers: [],
  },
];

// Mega-IPO-Radar: Kandidaten, deren Börsengang ein Zyklus-Signal wäre.
export const IPO_WATCH = [
  { id: "anthropic", name: "Anthropic (Claude)", wiki: "Anthropic", query: 'Anthropic IPO OR Börsengang OR "go public" OR valuation', kw: ["anthropic", "claude"] },
  { id: "openai", name: "OpenAI (ChatGPT)", wiki: "OpenAI", query: 'OpenAI IPO OR Börsengang OR "go public" OR valuation', kw: ["openai", "chatgpt", "sam altman"] },
  { id: "spacex", name: "SpaceX / Starlink", wiki: "SpaceX", query: "SpaceX OR Starlink IPO OR Börsengang", kw: ["spacex", "starlink"] },
  { id: "databricks", name: "Databricks", wiki: "Databricks", query: "Databricks IPO OR Börsengang", kw: ["databricks"] },
  { id: "xai", name: "xAI (Grok)", wiki: "XAI_(company)", query: "xAI IPO OR valuation OR funding", kw: ["xai", "grok"] },
  { id: "stripe", name: "Stripe", wiki: "Stripe,_Inc.", query: "Stripe IPO OR Börsengang", kw: ["stripe"] },
];

// Markt-Leiste & Blasen-Meter-Bausteine (Yahoo-Symbole; Stooq als Ersatz)
export const MARKETS = [
  { sym: "^GDAXI", name: "DAX", stooq: "^dax", kind: "index" },
  { sym: "^GSPC", name: "S&P 500", stooq: "^spx", kind: "index" },
  { sym: "QQQ", name: "Nasdaq 100", stooq: "qqq.us", kind: "etf" },
  { sym: "BTC-USD", name: "Bitcoin", stooq: "btcusd", kind: "crypto" },
  { sym: "GC=F", name: "Gold", stooq: "xauusd", kind: "commodity" },
  { sym: "^VIX", name: "VIX (Angst)", stooq: "^vix", kind: "index" },
  { sym: "EURUSD=X", name: "EUR/USD", stooq: "eurusd", kind: "fx" },
];
export const BUBBLE_TICKERS = ["NVDA", "ARKK"];

// Allgemeine Nachrichten-Feeds (RSS/Atom). Ausfälle sind normal und werden nur protokolliert.
export const FEEDS = [
  { name: "tagesschau Wirtschaft", url: "https://www.tagesschau.de/wirtschaft/index~rss2.xml", lang: "de" },
  { name: "Handelsblatt Finanzen", url: "https://www.handelsblatt.com/contentexport/feed/finanzen", lang: "de" },
  { name: "FAZ Finanzen", url: "https://www.faz.net/rss/aktuell/finanzen/", lang: "de" },
  { name: "Spiegel Wirtschaft", url: "https://www.spiegel.de/wirtschaft/index.rss", lang: "de" },
  { name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", lang: "en" },
  { name: "CNBC Tech", url: "https://www.cnbc.com/id/19854910/device/rss/rss.html", lang: "en" },
  { name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", lang: "en" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", lang: "en" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", lang: "en" },
  // Reddit removed: it blocks unauthenticated requests from cloud servers (HTTP 404/429 since 2023/24)
];

// Signal-Wörter: markieren Schlagzeilen, die eher "Ereignis" als Rauschen sind.
export const SIGNAL_WORDS = [
  { tag: "IPO", kw: ["ipo", "börsengang", "going public", "s-1", "börsendebüt", "erstnotiz"] },
  { tag: "Übernahme", kw: ["übernahme", "acquire", "acquisition", "merger", "fusion mit", "takeover", "kauft"] },
  { tag: "Rekord", kw: ["rekord", "record", "all-time high", "allzeithoch", "höchststand"] },
  { tag: "Absturz", kw: ["crash", "absturz", "plunge", "einbruch", "sell-off", "selloff", "ausverkauf", "tumble"] },
  { tag: "Blase", kw: ["bubble", "blase", "überbewertet", "overvalued", "euphorie", "mania", "froth"] },
  { tag: "Zinsen", kw: ["fed", "ezb", "ecb", "zinsen", "rate cut", "zinssenkung", "rate hike", "powell", "lagarde"] },
  { tag: "Zahlen", kw: ["earnings", "quartalszahlen", "umsatz", "revenue", "guidance", "prognose", "beats estimates"] },
  { tag: "Finanzierung", kw: ["funding", "finanzierungsrunde", "raises", "valuation", "bewertung", "series"] },
  { tag: "Regulierung", kw: ["regulierung", "regulation", "sec", "verbot", "ban", "kartell", "antitrust", "zölle", "tariff"] },
];

// ---------- Anlageklassen (für Einsteiger erklärt) ----------
// sym = Yahoo-Symbol (bevorzugt Euro-Börse), alt = Ersatz, falls nicht abrufbar.
export const ASSETS = [
  { id: "world", name: "Welt-Aktien (MSCI World)", sym: "EUNL.DE", alt: "URTH", group: "Aktien", core: true,
    what: "Ein ETF mit rund 1.400 großen Firmen aus 23 Industrieländern. Der Klassiker für den langfristigen Vermögensaufbau.",
    examples: "z. B. iShares Core MSCI World (IE00B4L5Y983) oder Vanguard FTSE All-World (IE00BK5BQT80)" },
  { id: "sp500", name: "USA (S&P 500)", sym: "SXR8.DE", alt: "SPY", group: "Aktien",
    what: "Die 500 größten US-Firmen. Stark von Tech-Konzernen wie Apple, Microsoft und Nvidia geprägt." },
  { id: "europe", name: "Europa (STOXX 600)", sym: "EXSA.DE", alt: "VGK", group: "Aktien",
    what: "600 Firmen aus Europa. Günstiger bewertet als die USA, weniger Tech." },
  { id: "dax", name: "Deutschland (DAX)", sym: "^GDAXI", group: "Aktien",
    what: "Die 40 größten deutschen Börsenfirmen wie SAP, Siemens und Allianz." },
  { id: "em", name: "Schwellenländer", sym: "IS3N.DE", alt: "EEM", group: "Aktien",
    what: "Firmen aus China, Indien, Taiwan, Brasilien und anderen. Mehr Wachstum, mehr Schwankung." },
  { id: "nasdaq", name: "Tech (Nasdaq 100)", sym: "QQQ", group: "Aktien",
    what: "Die 100 größten Tech-nahen US-Firmen. Steigt in Boomphasen stark und fällt im Crash besonders tief." },
  { id: "bonds", name: "Staatsanleihen", sym: "IEF", group: "Sicherheit",
    what: "Kredite an Staaten mit festen Zinsen. Bremsen Verluste, wenn Aktien fallen (meistens)." },
  { id: "gold", name: "Gold", sym: "GC=F", group: "Rohstoffe",
    what: "Krisenwährung seit Jahrtausenden. Bringt keine Zinsen, schützt aber gegen Inflation und Chaos.",
    examples: "z. B. Xetra-Gold (DE000A0S9GB0), physisch hinterlegt" },
  { id: "silver", name: "Silber", sym: "SI=F", group: "Rohstoffe",
    what: "Wie Gold, aber auch Industriemetall (Solar, Elektronik). Schwankt deutlich stärker als Gold." },
  { id: "oil", name: "Öl (Brent)", sym: "BZ=F", group: "Rohstoffe",
    what: "Wichtigster Rohstoff der Weltwirtschaft. Sehr politisch, eher zum Beobachten als zum Anlegen." },
  { id: "realestate", name: "Immobilien-Aktien (REITs)", sym: "VNQ", group: "Sachwerte",
    what: "Firmen, die Immobilien besitzen und Mieten ausschütten. Reagieren stark auf Zinsen." },
  { id: "moneymarket", name: "Geldmarkt-ETF (Euro)", sym: "XEON.DE", group: "Sicherheit",
    what: "Legt Geld zum Tageszins der Banken untereinander an. Fast so sicher wie Tagesgeld, aber an der Börse handelbar und ohne Lockzins-Wechsel.",
    examples: "z. B. Xtrackers EUR Overnight Rate Swap (LU0290358497)" },
  { id: "inflation", name: "Inflationsgeschützte Anleihen", sym: "TIP", group: "Sicherheit",
    what: "Anleihen, deren Rückzahlung mit der Inflation steigt. Schützen Kaufkraft, wenn die Preise unerwartet stark steigen." },
  { id: "quality", name: "Qualitäts-Aktien (Faktor)", sym: "QUAL", group: "Faktoren",
    what: "Firmen mit hoher Profitabilität und wenig Schulden. Forschung zeigt: Qualität brachte langfristig eine Zusatzrendite (u. a. Novy-Marx 2013)." },
  { id: "smallvalue", name: "Kleine, günstige Firmen (Small Value)", sym: "VBR", group: "Faktoren",
    what: "Kleinere Firmen mit niedriger Bewertung. Der Klassiker der Faktor-Forschung (Fama & French 1992), aber mit langen Durststrecken." },
  { id: "infra", name: "Infrastruktur", sym: "IGF", group: "Sachwerte",
    what: "Betreiber von Stromnetzen, Häfen, Flughäfen, Pipelines. Stabile, oft inflationsgekoppelte Einnahmen. Profitiert vom Ausbau für KI-Rechenzentren und Energiewende." },
  { id: "privcredit", name: "Private Credit (Kredit-Fonds)", sym: "BIZD", group: "Neuere Bausteine",
    what: "Fonds, die Firmen direkt Kredite geben, statt über Banken. Hohe Zinsen, aber in Krisen deutlich riskanter als Anleihen. Gerade stark im Kommen." },
  { id: "commodities", name: "Rohstoffe breit", sym: "DBC", group: "Rohstoffe",
    what: "Korb aus Öl, Gas, Metallen und Agrar. Schützt in Inflationsphasen, bringt langfristig aber wenig Rendite." },
  { id: "btc", name: "Bitcoin", sym: "BTC-USD", group: "Krypto",
    what: "Digitales, knappes Geld ohne Bank. Riesige Chancen, aber auch Abstürze von 70 % und mehr." },
  { id: "eth", name: "Ethereum", sym: "ETH-USD", group: "Krypto",
    what: "Plattform für Apps und Stablecoins auf der Blockchain. Schwankt noch stärker als Bitcoin." },
];

// ---------- Superinvestoren (13F-Pflichtmeldungen an die US-Börsenaufsicht SEC) ----------
// kw: muss im offiziellen SEC-Namen vorkommen, sonst wird der Eintrag verworfen (Schutz vor falscher CIK).
export const INVESTORS = [
  { id: "buffett", person: "Warren Buffett", fund: "Berkshire Hathaway", cik: 1067983, kw: "berkshire", style: "Kauft großartige Firmen zu fairen Preisen und hält sie jahrzehntelang." },
  { id: "burry", person: "Michael Burry", fund: "Scion Asset Management", cik: 1649339, kw: "scion", style: "Querdenker. Sah die Finanzkrise 2008 kommen („The Big Short“)." },
  { id: "ackman", person: "Bill Ackman", fund: "Pershing Square", cik: 1336528, kw: "pershing", style: "Wenige, große Wetten auf Qualitätsfirmen, mischt sich aktiv ein." },
  { id: "dalio", person: "Ray Dalio", fund: "Bridgewater Associates", cik: 1350694, kw: "bridgewater", style: "Größter Hedgefonds der Welt, denkt in Wirtschaftszyklen." },
  { id: "druckenmiller", person: "Stanley Druckenmiller", fund: "Duquesne Family Office", cik: 1536411, kw: "duquesne", style: "Legendärer Trend-Investor, früher Partner von George Soros." },
  { id: "tepper", person: "David Tepper", fund: "Appaloosa", cik: 1656456, kw: "appaloosa", style: "Kauft mutig, wenn andere in Panik verkaufen." },
  { id: "klarman", person: "Seth Klarman", fund: "Baupost Group", cik: 1061768, kw: "baupost", style: "Value-Investor mit viel Sicherheitsabstand und oft hoher Cash-Quote." },
  { id: "lilu", person: "Li Lu", fund: "Himalaya Capital", cik: 1709323, kw: "himalaya", style: "Von Charlie Munger geschätzt, sehr konzentriert und sehr langfristig." },
  { id: "loeb", person: "Dan Loeb", fund: "Third Point", cik: 1040273, kw: "third point", style: "Aktivist: kauft Firmen und drängt auf Veränderungen." },
  { id: "einhorn", person: "David Einhorn", fund: "Greenlight Capital", cik: 1079114, kw: "greenlight", style: "Value-Investor, wettet auch gegen überbewertete Firmen." },
  { id: "wood", person: "Cathie Wood", fund: "ARK Invest", cik: 1697748, kw: "ark", style: "Setzt auf disruptive Zukunftstechnologien. Hohes Risiko, hohe Schwankung." },
  { id: "coleman", person: "Chase Coleman", fund: "Tiger Global", cik: 1167483, kw: "tiger", style: "Wachstums- und Tech-Investor, öffentlich und privat." },
];

// ---------- Analysten & Profi-Stimmen (aus Schlagzeilen der letzten Tage) ----------
export const ANALYST_QUERIES = [
  { q: '"price target" raises OR cuts OR upgrade OR downgrade', lang: "en" },
  { q: "strategist stocks outlook Goldman OR \"Morgan Stanley\" OR JPMorgan OR \"Bank of America\" OR UBS", lang: "en" },
  { q: '"Warren Buffett" OR "Ray Dalio" OR "Michael Burry" OR "Cathie Wood" OR "Jamie Dimon" OR "Bill Ackman" OR "Stanley Druckenmiller"', lang: "en" },
  { q: "Analyst Kursziel hebt OR senkt OR Kaufempfehlung", lang: "de" },
  { q: "Stratege OR Chefvolkswirt Börse Aktien erwartet OR warnt", lang: "de" },
];
export const PEOPLE = [
  "Warren Buffett", "Charlie Munger", "Ray Dalio", "Michael Burry", "Cathie Wood", "Jamie Dimon", "Bill Ackman", "Stanley Druckenmiller", "David Tepper",
  "Jerome Powell", "Christine Lagarde", "Larry Fink", "Jeremy Siegel", "Tom Lee", "Dan Ives", "Mike Wilson", "David Kostin", "Jeffrey Gundlach", "Mohamed El-Erian",
  "Howard Marks", "Jeremy Grantham", "Peter Thiel", "Elon Musk", "Jensen Huang", "Sam Altman", "Dario Amodei",
  "Goldman Sachs", "Morgan Stanley", "JPMorgan", "Bank of America", "BofA", "Citi", "UBS", "Deutsche Bank", "Barclays", "Wedbush", "Bernstein", "Jefferies", "Wells Fargo", "HSBC", "Commerzbank", "DZ Bank", "Berenberg", "Warburg", "Mizuho", "Evercore", "Piper Sandler", "BlackRock", "Vanguard", "Bridgewater",
];

// ---------- Aktien-Universum für Analysten-Konsens & „versteckte Perlen“ ----------
export const UNIVERSE = [
  "SAP.DE", "SIE.DE", "ALV.DE", "MUV2.DE", "IFX.DE", "ENR.DE", "DTE.DE", "ADS.DE", "DB1.DE", "MC.PA", "ASML", "RACE", "NOVN.SW",
  "AAPL", "MSFT", "AMZN", "GOOGL", "META", "NVDA", "TSLA", "AVGO", "TSM", "AMD", "NFLX", "COST", "JPM", "V", "BRK-B", "LLY", "UNH",
  "ANET", "VST", "NRG", "AXON", "UBER", "SHOP", "MELI", "NU", "HOOD", "APP", "PLTR", "CRWD", "SONY", "BABA", "CCJ", "RKLB", "IONQ", "OKLO", "COIN", "CEG", "GEV", "VRT", "ISRG", "NVO",
];

// ---------- Ereignis-Arten: Welche Nachricht wirkt wie? ----------
// impact: typische Richtung je Anlageklasse ("up" / "down" / "mixed" / "flat") + kurzer Grund.
// Das sind historische Muster, keine Garantie. Quellen stehen in "evidence".
export const EVENTS = [
  { id: "rates", name: "Zinsen & Notenbanken", icon: "🏦",
    kw: ["fed", "ezb", "ecb", "fomc", "leitzins", "zinsentscheid", "zinssenkung", "zinserhöhung", "rate cut", "rate hike", "interest rate", "powell", "lagarde", "notenbank", "central bank"],
    q: ["Fed OR EZB Zinsentscheid OR Leitzins", "Fed rate decision OR ECB interest rates"],
    impact: { aktien: ["up", "Senkung = Rückenwind"], anleihen: ["up", "bei Senkung"], gold: ["up", "bei Senkung"], immobilien: ["up", "Kredite werden billiger"], krypto: ["up", "mehr Risikolust"] },
    why: "Niedrigere Zinsen machen Kredite billiger und Aktien attraktiver als das Sparkonto. Höhere Zinsen wirken umgekehrt.",
    evidence: "Gut belegt: Überraschende Zinsentscheide bewegen Aktien am selben Tag deutlich (Bernanke & Kuttner, Journal of Finance 2005)." },
  { id: "inflation", name: "Inflation", icon: "🛒",
    kw: ["inflation", "verbraucherpreise", "teuerung", "cpi", "consumer prices", "preisanstieg"],
    q: ["Inflation Verbraucherpreise", "inflation CPI report"],
    impact: { aktien: ["down", "wenn höher als erwartet"], anleihen: ["down", "Zinsen steigen"], gold: ["up", "langfristiger Schutz"], immobilien: ["mixed", "Sachwert, aber höhere Zinsen"], krypto: ["mixed", "uneinheitlich"] },
    why: "Steigt die Inflation stärker als erwartet, rechnen Märkte mit höheren Zinsen. Das drückt die Kurse.",
    evidence: "Überraschend hohe Inflationszahlen gehen historisch mit fallenden Anleihe- und meist auch Aktienkursen einher. Am deutlichsten war das 2022." },
  { id: "tariffs", name: "Zölle & Handelsstreit", icon: "🚢",
    kw: ["zoll", "zölle", "tariff", "tariffs", "handelskrieg", "handelsstreit", "trade war", "sanktion", "sanktionen", "sanctions", "exportverbot", "export ban", "export controls"],
    q: ["Zölle OR Handelsstreit OR Sanktionen", "tariffs OR trade war OR export controls"],
    impact: { aktien: ["down", "besonders Export & Chips"], anleihen: ["up", "sicherer Hafen"], gold: ["up", "Unsicherheit"], immobilien: ["flat", "kaum direkt"], krypto: ["down", "Risiko raus"] },
    why: "Zölle verteuern Waren, schaden exportstarken Firmen und erhöhen die Unsicherheit.",
    evidence: "Die Zollrunden 2018/19 und 2025 lösten jeweils deutliche Kursrückgänge aus, am stärksten bei exportabhängigen Branchen." },
  { id: "geopolitics", name: "Krieg & Geopolitik", icon: "⚔️",
    kw: ["krieg", "war", "angriff", "attack", "invasion", "militär", "military", "rakete", "missile", "konflikt", "conflict", "waffenruhe", "ceasefire", "ukraine", "russland", "russia", "taiwan", "iran", "israel", "nahost", "middle east"],
    q: ["Krieg OR Konflikt OR Angriff Börse", "geopolitical tensions markets war"],
    impact: { aktien: ["down", "kurz, meist erholt"], anleihen: ["up", "sicherer Hafen"], gold: ["up", "Krisenwährung"], immobilien: ["flat", "kaum direkt"], krypto: ["mixed", "uneinheitlich"] },
    why: "Krisen lösen erst Angst aus. Langfristig zählen aber Gewinne und Zinsen mehr als Schlagzeilen.",
    evidence: "Nach geopolitischen Schocks erholten sich breite Aktienmärkte historisch meist innerhalb von Wochen bis wenigen Monaten. Gold und Öl reagieren zuerst." },
  { id: "elections", name: "Wahlen & Regierung", icon: "🗳️",
    kw: ["wahl", "election", "regierung", "government", "koalition", "coalition", "präsident", "president", "kanzler", "bundestag", "kongress", "congress", "shutdown", "haushalt", "budget", "schuldenbremse"],
    q: ["Regierung Haushalt OR Wahl Börse", "election OR government shutdown markets"],
    impact: { aktien: ["flat", "langfristig gering"], anleihen: ["mixed", "bei Schulden-Themen"], gold: ["flat", "–"], immobilien: ["flat", "–"], krypto: ["mixed", "bei Regulierung"] },
    why: "Rund um Wahlen schwanken die Kurse etwas stärker. Langfristig spielt die Partei an der Macht für die Börse kaum eine Rolle.",
    evidence: "Langfristige Aktienrenditen unterscheiden sich historisch kaum danach, welche Partei regiert. Die Schwankung rund um Wahltermine steigt kurzfristig." },
  { id: "earnings", name: "Quartalszahlen", icon: "📊",
    kw: ["earnings", "quartalszahlen", "quarterly results", "quartal", "umsatz", "revenue", "guidance", "prognose", "beats estimates", "misses estimates", "übertrifft", "verfehlt", "gewinnwarnung", "profit warning"],
    q: ["Quartalszahlen übertrifft OR verfehlt", "earnings beat OR miss estimates"],
    impact: { aktien: ["mixed", "je Firma stark"], anleihen: ["flat", "–"], gold: ["flat", "–"], immobilien: ["flat", "–"], krypto: ["flat", "–"] },
    why: "Überraschungen bei den Zahlen bewegen einzelne Aktien stark, den Gesamtmarkt meist kaum.",
    evidence: "Kurse reagieren nach Zahlen-Überraschungen oft noch wochenlang in dieselbe Richtung (Post-Earnings-Announcement-Drift, Bernard & Thomas, 1989)." },
  { id: "mna", name: "Übernahmen & Deals", icon: "🤝",
    kw: ["übernahme", "übernimmt", "acquisition", "acquire", "acquires", "merger", "fusion", "takeover", "buyout", "kauft"],
    q: ["Übernahme Milliarden", "acquisition billion deal"],
    impact: { aktien: ["mixed", "Ziel ↑, Käufer oft ↓"], anleihen: ["flat", "–"], gold: ["flat", "–"], immobilien: ["flat", "–"], krypto: ["flat", "–"] },
    why: "Die übernommene Firma springt meist um den Aufpreis nach oben. Der Käufer zahlt oft zu viel.",
    evidence: "Ziel-Firmen gewinnen im Schnitt deutlich. Käufer schneiden danach eher schwach ab, vor allem bei großen Deals (Moeller, Schlingemann & Stulz, 2005)." },
  { id: "regulation", name: "Regulierung & Gerichte", icon: "⚖️",
    kw: ["regulierung", "regulation", "kartell", "antitrust", "verbot", "ban", "klage", "lawsuit", "strafe", "fine", "eu-kommission", "ai act", "gericht", "court"],
    q: ["Kartellverfahren OR Regulierung OR EU-Kommission Strafe", "antitrust OR regulators fine company"],
    impact: { aktien: ["down", "betroffene Branche"], anleihen: ["flat", "–"], gold: ["flat", "–"], immobilien: ["flat", "–"], krypto: ["mixed", "bei Krypto-Regeln"] },
    why: "Neue Regeln oder Strafen treffen gezielt einzelne Firmen oder Branchen, selten den ganzen Markt.",
    evidence: "Kartell- und Regulierungsnachrichten bewegen vor allem die betroffenen Aktien. Der breite Markt reagiert meist kaum." },
  { id: "energy", name: "Energie & Rohstoffe", icon: "🛢️",
    kw: ["ölpreis", "oil price", "opec", "gaspreis", "gas price", "strompreis", "rohstoff", "commodity", "lithium", "kupfer", "copper", "brent"],
    q: ["Ölpreis OR Gaspreis OR OPEC", "oil prices OPEC"],
    impact: { aktien: ["down", "bei Ölschock"], anleihen: ["down", "Inflationsgefahr"], gold: ["up", "Inflation"], immobilien: ["flat", "–"], krypto: ["flat", "–"] },
    why: "Steigt der Ölpreis stark, wird alles teurer: mehr Inflation, weniger Konsum.",
    evidence: "Große Ölpreisschocks gingen historisch oft schwächeren Konjunkturphasen voraus (Hamilton, 1983 und später)." },
  { id: "economy", name: "Konjunktur & Arbeitsmarkt", icon: "🏭",
    kw: ["arbeitsmarkt", "arbeitslos", "jobs report", "payrolls", "unemployment", "rezession", "recession", "bip", "gdp", "konjunktur", "pmi", "ifo", "wachstum", "economic growth"],
    q: ["Konjunktur OR Rezession OR Arbeitsmarkt", "recession OR jobs report OR GDP growth"],
    impact: { aktien: ["mixed", "schwach = Zinshoffnung"], anleihen: ["up", "bei Schwäche"], gold: ["up", "bei Schwäche"], immobilien: ["mixed", "–"], krypto: ["mixed", "–"] },
    why: "Schwache Wirtschaftsdaten machen Zinssenkungen wahrscheinlicher. Echte Rezessionen drücken aber die Gewinne.",
    evidence: "Börsen laufen der Wirtschaft im Schnitt etwa 6 Monate voraus. Schlechte Daten sind deshalb oft schon im Kurs." },
  { id: "realestate", name: "Immobilien & Bauzinsen", icon: "🏠",
    kw: ["immobilien", "real estate", "hauspreise", "house prices", "bauzinsen", "mortgage", "hypothek", "mieten", "miete", "rent", "wohnungsbau", "baugenehmigung", "vonovia"],
    q: ["Immobilienpreise OR Bauzinsen", "house prices OR mortgage rates"],
    impact: { aktien: ["flat", "–"], anleihen: ["flat", "–"], gold: ["flat", "–"], immobilien: ["mixed", "Zinsen entscheiden"], krypto: ["flat", "–"] },
    why: "Immobilienpreise hängen stark an den Bauzinsen: Steigen die Zinsen, sinkt meist die Nachfrage.",
    evidence: "Der Zinsanstieg 2022/23 ließ die deutschen Wohnimmobilienpreise erstmals seit über einem Jahrzehnt fallen." },
];

// ---------- Neue Forschung (frei zugängliche Studien-Archive) ----------
export const RESEARCH_FEEDS = [
  { name: "Journal of Finance", url: "https://onlinelibrary.wiley.com/feed/15406261/most-recent", journal: true },
  { name: "Journal of Financial Economics", url: "https://rss.sciencedirect.com/publication/science/0304405X", journal: true },
  { name: "NBER Working Papers", url: "https://back.nber.org/rss/new.xml" },
  { name: "EZB Working Papers", url: "https://www.ecb.europa.eu/rss/wppub.html" },
  { name: "BIZ Working Papers", url: "https://www.bis.org/doclist/wppubls.rss" },
  { name: "US-Notenbank (FEDS)", url: "https://www.federalreserve.gov/feeds/feds.xml" },
  { name: "arXiv Finanzwissenschaft", url: "https://rss.arxiv.org/rss/q-fin" },
];

// Peer-reviewed top journals (queried via OpenAlex: citations, DOI, open-access copy)
export const TOP_JOURNALS = [
  { name: "Journal of Finance", issn: "0022-1082" },
  { name: "Journal of Financial Economics", issn: "0304-405X" },
  { name: "Review of Financial Studies", issn: "0893-9454" },
  { name: "Journal of Financial and Quantitative Analysis", issn: "0022-1090" },
  { name: "Review of Finance", issn: "1572-3097" },
  { name: "American Economic Review", issn: "0002-8282" },
  { name: "Quarterly Journal of Economics", issn: "0033-5533" },
  { name: "Econometrica", issn: "0012-9682" },
  { name: "Journal of Political Economy", issn: "0022-3808" },
  { name: "Review of Economic Studies", issn: "0034-6527" },
  { name: "Management Science", issn: "0025-1909" },
  { name: "Journal of Monetary Economics", issn: "0304-3932" },
];

// KI-Organisationen auf Hugging Face/GitHub → börsennotierte Mutter (nur wo eindeutig)
export const AI_ORGS = {
  "meta-llama": "META", "facebook": "META", "google": "GOOGL", "google-deepmind": "GOOGL", "microsoft": "MSFT", "nvidia": "NVDA",
  "qwen": "BABA (Alibaba)", "apple": "AAPL", "ibm-granite": "IBM", "ibm": "IBM", "amazon": "AMZN", "salesforce": "CRM", "tencent": "Tencent (HK)",
};

// ---------- Immobilien (offizielle Statistik) ----------
export const REAL_ESTATE = {
  hpi: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hpi_q?format=JSON&lang=DE&geo=DE&purchase=TOTAL&unit=RCH_A",
  mortgage: "https://data-api.ecb.europa.eu/service/data/MIR/M.DE.B.A2C.AM.R.A.2250.EUR.N?lastNObservations=36&format=jsondata",
  bund10: "https://data-api.ecb.europa.eu/service/data/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y?lastNObservations=260&format=jsondata",
  stocks: ["VNA.DE", "VNQ"],
};

// ---------- Rohstoff-Monitor (Terminkontrakte, nächster Liefermonat; Yahoo-Symbole) ----------
export const COMMODITIES = [
  { id: "brent", name: "Rohöl Brent", sym: "BZ=F", unit: "$/Barrel", group: "Energie" },
  { id: "wti", name: "Rohöl WTI", sym: "CL=F", unit: "$/Barrel", group: "Energie" },
  { id: "ttf", name: "Erdgas Europa (TTF)", sym: "TTF=F", unit: "€/MWh", group: "Energie" },
  { id: "natgas", name: "Erdgas USA (Henry Hub)", sym: "NG=F", unit: "$/MMBtu", group: "Energie" },
  { id: "heatoil", name: "Heizöl / Diesel", sym: "HO=F", unit: "$/Gallone", group: "Energie" },
  { id: "copper", name: "Kupfer", sym: "HG=F", unit: "$/Pfund", group: "Industriemetalle" },
  { id: "aluminium", name: "Aluminium", sym: "ALI=F", unit: "$/Tonne", group: "Industriemetalle" },
  { id: "gold", name: "Gold", sym: "GC=F", unit: "$/Unze", group: "Edelmetalle" },
  { id: "silver", name: "Silber", sym: "SI=F", unit: "$/Unze", group: "Edelmetalle" },
  { id: "platinum", name: "Platin", sym: "PL=F", unit: "$/Unze", group: "Edelmetalle" },
  { id: "palladium", name: "Palladium", sym: "PA=F", unit: "$/Unze", group: "Edelmetalle" },
  { id: "wheat", name: "Weizen", sym: "ZW=F", unit: "US-Cent/Scheffel", group: "Agrar" },
  { id: "corn", name: "Mais", sym: "ZC=F", unit: "US-Cent/Scheffel", group: "Agrar" },
  { id: "soy", name: "Sojabohnen", sym: "ZS=F", unit: "US-Cent/Scheffel", group: "Agrar" },
  { id: "sugar", name: "Zucker", sym: "SB=F", unit: "US-Cent/Pfund", group: "Agrar" },
  { id: "coffee", name: "Kaffee", sym: "KC=F", unit: "US-Cent/Pfund", group: "Agrar" },
  { id: "cocoa", name: "Kakao", sym: "CC=F", unit: "$/Tonne", group: "Agrar" },
  { id: "cotton", name: "Baumwolle", sym: "CT=F", unit: "US-Cent/Pfund", group: "Agrar" },
];

// ---------- Nutzungs-Signale: Wer baut wirklich mit welcher KI? (wöchentliche Downloads) ----------
// owner = wer dahintersteht; listed = börsennotiert bzw. wichtigster börsennotierter Partner/Investor
export const ADOPTION = [
  { id: "openai", name: "OpenAI (ChatGPT)", pypi: "openai", npm: "openai", owner: "OpenAI (privat)", listed: "Partner: MSFT" },
  { id: "anthropic", name: "Anthropic (Claude)", pypi: "anthropic", npm: "@anthropic-ai/sdk", owner: "Anthropic (privat)", listed: "Investoren: AMZN, GOOGL" },
  { id: "google", name: "Google Gemini", pypi: "google-genai", npm: "@google/genai", owner: "Alphabet", listed: "GOOGL" },
  { id: "langchain", name: "LangChain (KI-Agenten)", pypi: "langchain", npm: "langchain", owner: "LangChain (privat)", listed: null },
  { id: "transformers", name: "Hugging Face Transformers", pypi: "transformers", npm: null, owner: "Hugging Face (privat)", listed: null },
  { id: "torch", name: "PyTorch (KI-Training)", pypi: "torch", npm: null, owner: "Linux Foundation, von Meta gestartet", listed: "META" },
];
