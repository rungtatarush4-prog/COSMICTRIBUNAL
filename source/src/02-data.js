/* ===== Static content: lore, characters, civilisations, catalogues ===== */
const IND_KEYS = ['approval','legitimacy','trust','efficiency','stability','science','environment','education'];
const IND_LABEL = {approval:'Sovereign Approval', legitimacy:'Judicial Legitimacy', trust:'Civilisational Trust', efficiency:'Council Efficiency', stability:'Cosmic Stability', science:'Scientific Advancement', environment:'Environmental Health', education:'Educational Accessibility', treasury:'Treasury'};
const IND_SHORT = {approval:'Approval', legitimacy:'Legitimacy', trust:'Trust', efficiency:'Efficiency', stability:'Stability', science:'Science', environment:'Environment', education:'Education'};
const IND_START = {approval:95, legitimacy:98, trust:90, efficiency:85, stability:92, science:75, environment:80, education:70};

const PRINCIPLES = [
  'Every civilisation retains its fundamental rights.',
  'Every individual retains free will.',
  'Earth remains an independent civilisation.',
  'Cosmic authority must be exercised responsibly.',
  'Invitations to the Cosmos are voluntary.',
  'The Sovereign retains final executive authority within the constitutional framework.',
  'The Tribunal is responsible for judicial proceedings.',
  'The Council advises, administers and implements lawful decisions.',
  'No innocent civilisation should be punished for the actions of another.',
  'Every major decision must have consequences.'
];

const JUDGES = [
  {id:'astraeus', name:'Astraeus', juris:'Time', hue:42, style:'Measured', personality:'Patient and far-sighted; weighs every ruling against the centuries.', expertise:'Precedent and long-term consequence', objective:'Ensure no decision mortgages the future for the present.', values:{stability:1.4, science:0.6, environment:0.8, treasury:0.7, legitimacy:0.8}, evidence:0.9, mercy:0.5, caution:1.1, principle:1.0, trust:82},
  {id:'nyxara', name:'Nyxara', juris:'Night', hue:262, style:'Guarded', personality:'Sceptical and watchful; distrusts anything that has not been examined.', expertise:'Hidden motives, security, unverified claims', objective:'Expose concealed risks before they surface.', values:{stability:1.2, legitimacy:1.0, treasury:0.5}, evidence:1.3, mercy:0.3, caution:1.6, principle:1.0, trust:74},
  {id:'orionis', name:'Orionis', juris:'Celestial Legions', hue:8, style:'Direct', personality:'A disciplined commander who prefers decisive, orderly action.', expertise:'Defence, logistics, emergency deployment', objective:'Keep the Cosmos secure and the legions ready.', values:{stability:1.8, efficiency:1.0, approval:0.3}, evidence:0.7, mercy:0.3, caution:0.6, principle:0.8, trust:80},
  {id:'vespera', name:'Vespera', juris:'Wisdom', hue:290, style:'Reflective', personality:'A contemplative ethicist who asks what each decision says about the Crown.', expertise:'Ethics and the constitutional spirit', objective:'Hold the Crown to its own principles.', values:{legitimacy:1.5, trust:1.0, approval:0.5}, evidence:1.0, mercy:0.7, caution:1.0, principle:1.5, trust:85},
  {id:'ignivar', name:'Ignivar', juris:'Creation', hue:18, style:'Fiery', personality:'A restless innovator, impatient with caution.', expertise:'Engineering, invention, construction', objective:'Build what has never been built.', values:{science:2.0, efficiency:0.6, treasury:0.2, stability:0.3}, evidence:0.6, mercy:0.5, caution:0.4, principle:0.7, trust:78},
  {id:'elyndor', name:'Elyndor', juris:'Peace', hue:190, style:'Conciliatory', personality:'A gentle diplomat who looks for the settlement every party can live with.', expertise:'Mediation and treaties', objective:'Turn every dispute into an agreement.', values:{trust:2.0, stability:1.0, approval:0.4}, evidence:0.9, mercy:0.8, caution:0.9, principle:1.0, trust:86},
  {id:'solenne', name:'Solenne', juris:'Hope', hue:50, style:'Warm', personality:'Warm and optimistic; champions the vulnerable.', expertise:'Welfare, education, humanitarian aid', objective:'Ensure no people is left behind.', values:{approval:1.4, education:1.5, trust:0.6, treasury:0.2}, evidence:0.8, mercy:1.0, caution:0.5, principle:1.0, trust:88},
  {id:'kaelith', name:'Kaelith', juris:'Balance', hue:160, style:'Precise', personality:'Exacting and fiscal; believes every gain must be paid for.', expertise:'Treasury and proportionality', objective:'Keep the treasury and the scales balanced.', values:{treasury:2.0, stability:0.8, legitimacy:0.6}, evidence:1.1, mercy:0.5, caution:1.3, principle:1.1, trust:76},
  {id:'thalor', name:'Thalor', juris:'Knowledge', hue:215, style:'Scholarly', personality:'Scholarly and literal; trusts data over rhetoric.', expertise:'Research, evidence, education', objective:'Let knowledge guide the Crown.', values:{science:1.5, education:1.4}, evidence:1.5, mercy:0.5, caution:1.0, principle:0.9, trust:81},
  {id:'zephyria', name:'Zephyria', juris:'Winds', hue:140, style:'Lyrical', personality:'Free-spirited and ecological; champions movement and living worlds.', expertise:'Environment, migration, change', objective:'Keep the living worlds breathing.', values:{environment:2.0, trust:0.6, approval:0.4}, evidence:0.8, mercy:0.7, caution:0.7, principle:1.0, trust:79},
  {id:'aurion', name:'Aurion', juris:'Justice', hue:46, style:'Formal', personality:'An unbending jurist: rights before convenience.', expertise:'Law, rights, due process', objective:'No ruling without due process; no punishment without guilt.', values:{legitimacy:2.0, trust:0.6}, evidence:1.3, mercy:0.4, caution:1.0, principle:1.9, trust:84},
  {id:'arbiter', name:'Prime Arbiter', juris:'Supreme Arbitration', hue:45, style:'Composed', personality:'The Sovereign’s principal adviser: composed, candid, and a synthesiser of the Twelve.', expertise:'Arbitration, synthesis, briefing', objective:'Give the Sovereign the truth, then let the Sovereign decide.', values:{legitimacy:1.0, stability:1.0, trust:1.0, treasury:0.6, approval:0.6, science:0.5, environment:0.5, education:0.5, efficiency:0.4}, evidence:1.2, mercy:0.6, caution:1.0, principle:1.3, trust:90}
];

const COUNCIL = [
  {id:'devika', name:'Devika Joshi', role:'Warden of Cosmic Security', ability:'Cosmic security, protection and portals', tags:['security','evacuation','portal'], values:{stability:1.6, trust:0.5}, personality:'Vigilant and methodical; plans three exits for every door.', dept:'Cosmic Security & Portals', trust:84},
  {id:'riaS', name:'Ria Sanghavi', role:'Royal Swiftblade', ability:'Super speed', tags:['rapid','logistics','supply'], values:{efficiency:1.5, approval:0.6}, personality:'Quick-thinking and impatient with delay.', dept:'Rapid Response', trust:82},
  {id:'riaV', name:'Ria Vaidya', role:'Keeper of Celestial Energy', ability:'Celestial energy manipulation', tags:['stellar','energy'], values:{science:1.2, stability:0.8}, personality:'Intense and precise; speaks in measurements.', dept:'Celestial Energy', trust:80},
  {id:'anaya', name:'Anaya Deshmukh', role:'Guardian of Nature', ability:'Protection of nature', tags:['environment','ecology'], values:{environment:2.0, trust:0.4}, personality:'Principled and fiercely protective of living worlds.', dept:'Natural Protection', trust:83},
  {id:'esha', name:'Esha Jain', role:'Coordinator of Operations', ability:'Agility and coordination', tags:['coordination','logistics','rapid'], values:{efficiency:1.6, stability:0.5}, personality:'Organised and adaptable; makes separate plans connect.', dept:'Operations & Coordination', trust:81},
  {id:'ira', name:'Ira Teny', role:'Shieldbearer of the Crown', ability:'Protective shields', tags:['shield','stellar','security'], values:{stability:1.4, approval:0.5}, personality:'Calm and steadfast; prefers protection to retaliation.', dept:'Protective Shields', trust:85},
  {id:'misha', name:'Misha Shah', role:'Tidecaller', ability:'Control of tides', tags:['tidal','ocean','environment'], values:{environment:1.2, trust:0.8}, personality:'Patient and perceptive; reads currents in people too.', dept:'Tidal Affairs', trust:79},
  {id:'vidyut', name:'Vidyut Sundar', role:'Stormwarden', ability:'Storms and electrical energy', tags:['storm','energy'], values:{science:0.8, efficiency:1.0}, personality:'Energetic and bold; relishes difficult weather.', dept:'Storm & Energy Grid', trust:78},
  {id:'kabir', name:'Kabir Khubchandani', role:'Bulwark of the Crown', ability:'Strength and durability', tags:['reconstruction','security','rapid'], values:{stability:1.2, approval:0.8}, personality:'Steady and loyal; volunteers for the heaviest work.', dept:'Reconstruction', trust:84}
];

const COUNCIL_CANDIDATES = [
  {name:'Seren Valdacourt', role:'Archivist of Echoes', ability:'Perfect recall of recorded history', tags:['knowledge','coordination'], values:{science:1.0, legitimacy:0.8}, personality:'Quiet and exacting; never forgets a promise.'},
  {name:'Taavi Orun', role:'Pathfinder of the Void', ability:'Navigation across uncharted space', tags:['logistics','evacuation','contact'], values:{trust:1.0, science:0.6}, personality:'Curious and restless; happiest at the frontier.'},
  {name:'Noor Elsabeth', role:'Healer of Worlds', ability:'Restoration of damaged biospheres and bodies', tags:['environment','reconstruction','ecology'], values:{approval:1.0, environment:1.0}, personality:'Gentle but unafraid to argue for the injured.'},
  {name:'Kesh Varamund', role:'Lightwright', ability:'Communication across languages and light-years', tags:['contact','coordination'], values:{trust:1.4}, personality:'Charming and diplomatic; listens before speaking.'},
  {name:'Ilan Corvaine', role:'Quartermaster Royal', ability:'Management of strategic reserves', tags:['supply','logistics'], values:{treasury:1.4, efficiency:0.8}, personality:'Frugal and blunt about costs.'},
  {name:'Amaris Thule', role:'Starsinger', ability:'Resonance with stars and ancient signals', tags:['stellar','contact'], values:{science:1.2, stability:0.4}, personality:'Dreamy and intuitive; hears what others miss.'}
];

const GALAXIES = [
  {id:'aurelian', name:'Aurelian Spiral', x:1200, y:800, r:330, arms:4, hue:45, rot:0.3},
  {id:'sol', name:'Sol Reach (Milky Way)', x:560, y:1120, r:240, arms:2, hue:215, rot:1.2},
  {id:'veyari', name:'Veyari Cluster', x:1800, y:420, r:220, arms:3, hue:280, rot:2.1},
  {id:'thal', name:'Thalassine Expanse', x:1880, y:1200, r:230, arms:2, hue:190, rot:0.8},
  {id:'korr', name:'Korr Nebula', x:660, y:420, r:250, arms:3, hue:12, rot:2.7},
  {id:'vael', name:'Vael Drift', x:2140, y:820, r:170, arms:2, hue:330, rot:1.7},
  {id:'deep', name:'The Quiet Deep', x:1500, y:1430, r:180, arms:2, hue:250, rot:0.2}
];

const CIVS = [
  {id:'aurelia', name:'Aurelia', kind:'capital', system:'Throne Star', galaxy:'aurelian', x:1200, y:800, color:'#D4AF37', pop:3.1, gov:'Crown Administration', culture:'Ceremonial and cosmopolitan; seat of the Tribunal and the Council.', tech:92, econ:88, resources:['Administrative services','Starlight conduits'], status:'Cosmic Capital', rel:95, contribution:400, challenges:['Administrative congestion around the Throne Star'], dev:{health:90, education:88, infrastructure:92, environment:80}, discovered:true},
  {id:'earth', name:'Earth', kind:'independent', system:'Sol', galaxy:'sol', x:560, y:1120, color:'#4776E6', pop:8.2, gov:'Many sovereign nations; an independent planetary civilisation', culture:'Young, diverse and inventive.', tech:41, econ:55, resources:['Biodiversity','Human ingenuity','Liquid oceans'], status:'Independent Civilisation', rel:82, contribution:0, challenges:['Climate stress','Uneven access to education','Planetary protection'], dev:{health:62, education:58, infrastructure:55, environment:48}, discovered:true},
  {id:'veyari', name:'Veyari Concord', kind:'member', system:'Veya Prime', galaxy:'veyari', x:1790, y:400, color:'#B58CFF', pop:14.6, gov:'Philosopher-republic of crystal councils', culture:'Contemplative and consensus-driven.', tech:84, econ:70, resources:['Resonant crystal','Light-glass'], status:'Member Civilisation', rel:78, contribution:520, challenges:['Disputes over access to archived knowledge'], dev:{health:80, education:86, infrastructure:78, environment:74}, discovered:true},
  {id:'thalassine', name:'Thalassine Deep', kind:'member', system:'Maris', galaxy:'thal', x:1880, y:1190, color:'#3FC1C9', pop:6.9, gov:'Federation of tidal cities', culture:'Oceanic and communal, with long song-traditions.', tech:66, econ:61, resources:['Deep-brine minerals','Bioluminescent kelp'], status:'Member Civilisation', rel:80, contribution:380, challenges:['Tidal instability caused by a decaying moon'], dev:{health:72, education:66, infrastructure:60, environment:70}, discovered:true},
  {id:'korr', name:'Korr Hegemony', kind:'member', system:'Anvil', galaxy:'korr', x:690, y:380, color:'#E3743B', pop:21.3, gov:'Industrial hegemony under the Forge Assembly', culture:'Proud, industrious and honour-bound.', tech:79, econ:86, resources:['Iridium','Heavy metals','Forge plasma'], status:'Member Civilisation', rel:64, contribution:760, challenges:['Resource scarcity','Environmental complaints from neighbours'], dev:{health:70, education:68, infrastructure:88, environment:41}, discovered:true},
  {id:'lumen', name:'Lumen Archive', kind:'member', system:'Index', galaxy:'aurelian', x:1460, y:560, color:'#9FD3FF', pop:0.9, gov:'Custodial archive-mind collective', culture:'Archival, precise and ancient.', tech:97, econ:58, resources:['Recorded knowledge','Quantum memory'], status:'Member Civilisation', rel:76, contribution:300, challenges:['Pressure to open sealed records'], dev:{health:95, education:97, infrastructure:85, environment:88}, discovered:true},
  {id:'sylvan', name:'Sylvan Reach', kind:'member', system:'Greenhollow', galaxy:'aurelian', x:960, y:1180, color:'#6FCF7F', pop:4.4, gov:'Grove councils', culture:'Arboreal, ecological and ritual.', tech:52, econ:47, resources:['Living timber','Medicinal flora'], status:'Member Civilisation', rel:84, contribution:220, challenges:['Contamination of the Verdance Belt'], dev:{health:74, education:62, infrastructure:46, environment:66}, discovered:true},
  {id:'ashen', name:'Ashen Drift', kind:'member', system:'(nomadic)', galaxy:'korr', x:420, y:660, color:'#C9B79C', pop:2.2, gov:'Nomadic fleet-clans', culture:'Mobile and self-reliant, governed by oral law.', tech:60, econ:44, resources:['Salvage','Navigation lore'], status:'Member Civilisation', rel:70, contribution:150, challenges:['No permanent homeworld','Contested settlement rights'], dev:{health:58, education:50, infrastructure:40, environment:60}, discovered:true},
  {id:'vael', name:'Orrery of Vael', kind:'member', system:'Vael-9', galaxy:'vael', x:2120, y:820, color:'#FF8FB1', pop:5.7, gov:'Astronomer-monarchy', culture:'Celestial, devout and precise.', tech:70, econ:63, resources:['Stellar observatories','Helium-3'], status:'Member Civilisation', rel:81, contribution:330, challenges:['Instability of their star, Vael-9'], dev:{health:76, education:72, infrastructure:70, environment:68}, discovered:true},
  {id:'choir', name:'The Silent Choir', kind:'unknown', system:'Hush', galaxy:'deep', x:1500, y:1420, color:'#8E7CFF', pop:1.4, gov:'Unknown: appears to be a resonance-linked collective', culture:'Communicates in harmonic patterns; intentions unclear.', tech:88, econ:40, resources:['Unknown harmonic materials'], status:'Uncontacted', rel:50, contribution:0, challenges:['No established contact'], dev:{health:70, education:70, infrastructure:60, environment:90}, discovered:false}
];

const STATIONS = [
  {id:'st-concord', type:'diplomatic', name:'Concord Station', x:1520, y:930, note:'Neutral ground for intercivilisational negotiations.'},
  {id:'st-solgate', type:'diplomatic', name:'Sol Gate Embassy', x:640, y:1040, note:'The Crown’s embassy to Earth. Earth retains full independence.'},
  {id:'st-forge', type:'research', name:'Ignivar Forge Observatory', x:1660, y:700, note:'Stellar engineering and creation sciences.'},
  {id:'st-index', type:'research', name:'Lumen Deep Index', x:1400, y:500, note:'The largest archive of recorded knowledge in the Cosmos.'},
  {id:'st-academy', type:'education', name:'Academy of the Crown', x:1130, y:880, note:'The Cosmos’s senior institution of civic learning.'},
  {id:'st-dais', type:'education', name:'Dhirubhai Ambani International School (COSMOS–EDU pilot)', x:530, y:1170, note:'First pilot institution of COSMOS–EDU on Earth.'},
  {id:'st-verdance', type:'protected', name:'Verdance Belt Sanctuary', x:880, y:1250, r:80, note:'Protected forest moons of the Sylvan Reach.'},
  {id:'st-tidewell', type:'protected', name:'Tidewell Reserve', x:1960, y:1270, r:70, note:'Protected breeding seas of the Thalassine Deep.'},
  {id:'st-contested', type:'territory', name:'Korr–Drift Contested Nebula', x:540, y:540, r:100, note:'Territory claimed by the Korr Hegemony and used by Ashen Drift fleets.'},
  {id:'st-crownmarch', type:'territory', name:'Crownmarch Territories', x:1280, y:1000, r:90, note:'Cosmic territories administered directly by the Council.'}
];

/* Budget: monthly allocations in CC millions. Effects are per month at 2× baseline, scaled logarithmically. */
const BUDGET_CATS = [
  {key:'education', label:'Education', base:600, eff:{education:1.0, approval:0.2}},
  {key:'healthcare', label:'Healthcare', base:700, eff:{approval:0.6, stability:0.4}},
  {key:'research', label:'Research', base:650, eff:{science:1.0}},
  {key:'infrastructure', label:'Infrastructure', base:800, eff:{stability:0.4, efficiency:0.3}},
  {key:'environment', label:'Environmental restoration', base:550, eff:{environment:1.0}},
  {key:'emergency', label:'Emergency assistance (to reserve)', base:300, eff:{}},
  {key:'administration', label:'Administration', base:500, eff:{efficiency:0.8}},
  {key:'diplomacy', label:'Diplomatic programmes', base:400, eff:{trust:0.8}},
  {key:'development', label:'Civilisational development', base:600, eff:{trust:0.4, approval:0.3}}
];
const REVENUE_CATS = {contributions:'Voluntary membership contributions', trade:'Trade agreements', licensing:'Scientific licensing', infrastructure:'Cosmic infrastructure services', development:'Intercivilisational development programmes', other:'Other receipts'};

const MAJOR_PROJECTS = [
  {key:'transit', name:'Crownmarch Transit Spine', cat:'infrastructure', cost:2200, duration:120, eff:{ind:{stability:3, efficiency:3}}, desc:'A hyperlane spine linking the Capital to the outer territories.'},
  {key:'health', name:'Interstellar Health Network', cat:'healthcare', cost:1600, duration:90, eff:{ind:{approval:3, stability:2}}, desc:'Shared medical relays for every member civilisation.'},
  {key:'library', name:'Grand Library Concordance', cat:'research', cost:1300, duration:110, eff:{ind:{science:3, education:2}, civ:{lumen:4, veyari:4}}, desc:'A shared index between the Lumen Archive and the Veyari crystal libraries.'},
  {key:'verdance', name:'Verdance Belt Restoration', cat:'environment', cost:1800, duration:140, eff:{ind:{environment:5}, civ:{sylvan:10}}, desc:'Decontamination and reforestation of the Verdance Belt moons.'},
  {key:'tidal', name:'Tidal Stabiliser Array', cat:'environment', cost:2000, duration:100, eff:{ind:{environment:3, stability:2}, civ:{thalassine:10}}, desc:'Gravitic stabilisers to calm the Thalassine tides.'},
  {key:'drifthaven', name:'Drifthaven Settlement Charter', cat:'development', cost:1500, duration:120, eff:{ind:{trust:3, stability:1}, civ:{ashen:12, korr:-3}}, desc:'A permanent harbour world for the Ashen Drift fleets.'},
  {key:'lattice', name:'Vael Shield Lattice', cat:'infrastructure', cost:2400, duration:70, req:{track:'stellar', lvl:1}, eff:{ind:{stability:3}, civ:{vael:12}}, special:'lattice', desc:'Shield satellites around Vael-9 that damp stellar flares. Requires Stellar Engineering I.'}
];

const RESEARCH_TRACKS = [
  {key:'stellar', name:'Stellar Engineering', desc:'Stabilising stars and harvesting celestial energy. Improves stellar crisis responses.', bonus:'+15% success against stellar crises per level'},
  {key:'linguistics', name:'Xenolinguistics', desc:'Understanding unfamiliar civilisations and signals. Speeds negotiations and first contact.', bonus:'+4 progress per negotiation round per level'},
  {key:'ecology', name:'Ecological Restoration', desc:'Healing damaged biospheres. Improves environmental crisis responses.', bonus:'+15% environmental crisis success and +1 Environment per level'},
  {key:'logistics', name:'Quantum Logistics', desc:'Moving people and supplies across the Cosmos. Speeds every project.', bonus:'+6% project speed per level'},
  {key:'pedagogy', name:'Cosmic Pedagogy', desc:'Teaching across species and abilities. Lowers COSMOS–EDU costs.', bonus:'−10% COSMOS–EDU costs and +1 Education per level'}
];

const EDU_MODULES = [
  {key:'science', name:'Cosmic science'}, {key:'civ', name:'Civilisational studies'}, {key:'innovation', name:'Innovation'},
  {key:'ethics', name:'Ethics'}, {key:'access', name:'Accessibility'}, {key:'environment', name:'Environmental responsibility'}, {key:'exchange', name:'Intercivilisational exchanges'}
];

/* Legislative provisions. oneTime applies when implementation completes; monthly applies while in force. flags = constitutional principles at risk. */
const PROVISIONS = [
  {key:'edu_access', label:'Universal Education Access', desc:'Guarantees access to COSMOS–EDU learning for every member civilisation that wishes to join.', oneTime:{education:3, approval:1}, monthly:{education:0.25}, cost:60, flags:[]},
  {key:'env_standards', label:'Environmental Protection Standards', desc:'Binding non-contamination standards for extraction industries across the Cosmos.', oneTime:{environment:3}, monthly:{environment:0.25}, civ:{korr:-6, sylvan:5, thalassine:3}, cost:20, flags:[]},
  {key:'open_science', label:'Open Science Licensing', desc:'Places Crown-funded research in a shared commons, waiving licence fees.', oneTime:{science:3, trust:2}, monthly:{science:0.2}, revenue:{licensing:-0.5}, cost:0, flags:[]},
  {key:'judicial_charter', label:'Judicial Independence Charter', desc:'Protects Tribunal judges from executive removal during proceedings.', oneTime:{legitimacy:4}, monthly:{}, cost:0, flags:[]},
  {key:'transparency', label:'Treasury Transparency Act', desc:'Publishes all treasury transactions to member civilisations each month.', oneTime:{approval:2, trust:2}, monthly:{efficiency:-0.05}, cost:10, flags:[]},
  {key:'delegation', label:'Council Delegation Charter', desc:'Authorises Council departments to resolve routine administration without referral.', oneTime:{efficiency:4}, monthly:{efficiency:0.1}, cost:0, flags:[]},
  {key:'free_corridors', label:'Free Movement Corridors', desc:'Opens protected travel corridors between member civilisations.', oneTime:{trust:3, approval:1}, monthly:{stability:-0.05}, revenue:{trade:0.08}, cost:30, flags:[]},
  {key:'access_mandate', label:'Accessibility Mandate', desc:'Requires every Crown institution to serve students and citizens with disabilities.', oneTime:{education:2, approval:1}, monthly:{education:0.1}, cost:25, flags:[]},
  {key:'stellar_watch', label:'Stellar Early-Warning Network', desc:'Funds observatories that warn civilisations of stellar instability.', oneTime:{stability:2, science:1}, monthly:{}, cost:40, crisisBonus:0.08, flags:[]},
  {key:'emergency_powers', label:'Emergency Powers (no sunset clause)', desc:'Grants the Crown open-ended emergency authority over member administrations.', oneTime:{efficiency:5}, monthly:{legitimacy:-0.3}, cost:0, crisisBonus:0.1, flags:[4,1]},
  {key:'emergency_sunset', label:'Emergency Powers (90-day sunset)', desc:'Grants limited emergency authority that expires automatically after 90 days.', oneTime:{efficiency:3}, monthly:{}, cost:0, crisisBonus:0.08, sunset:90, flags:[]},
  {key:'membership_levy', label:'Mandatory Membership Levy', desc:'Requires every known civilisation to join the Cosmos and pay a contribution.', oneTime:{}, monthly:{trust:-0.4}, revenue:{contributions:0.25}, cost:0, flags:[5,1]},
  {key:'collective_sanctions', label:'Collective Sanctions Provision', desc:'Allows sanctions on a civilisation’s allies and neighbours for its violations.', oneTime:{stability:1, trust:-4}, monthly:{}, cost:0, flags:[9]},
  {key:'earth_override', label:'Earth Administration Clause', desc:'Places Earth’s planetary governance under Council administration.', oneTime:{}, monthly:{}, cost:0, flags:[3,1,2]},
  {key:'proclaim_day', label:'Day of United Worlds', desc:'Proclaims an annual day of celebration for all civilisations.', oneTime:{approval:2, trust:1}, monthly:{}, cost:5, flags:[]},
  {key:'research_charter', label:'Institutional Charter: Cosmic Research Institute', desc:'Charters a permanent Crown research institute.', oneTime:{science:2}, monthly:{science:0.15}, cost:45, flags:[]}
];

const LAW_TYPES = [
  {key:'act', label:'Cosmic Act', prefix:'ACT', impl:30},
  {key:'eo', label:'Executive Order', prefix:'EO', impl:7},
  {key:'amend', label:'Constitutional Amendment', prefix:'AMD', impl:45},
  {key:'directive', label:'Administrative Directive', prefix:'DIR', impl:10},
  {key:'treaty', label:'Diplomatic Treaty', prefix:'TRT', impl:20},
  {key:'charter', label:'Institutional Charter', prefix:'CHR', impl:30},
  {key:'proclamation', label:'Official Proclamation', prefix:'PROC', impl:1}
];

const RG_BASE = {
  cash:1850, reputation:82, hq:'Rungta Global Tower, Mumbai',
  subsidiaries:[
    {id:'hosp', name:'Rungta Hospitality', sector:'Luxury hospitality', units:14, unitLabel:'luxury hotels', rev:9.0, margin:0.22, rating:4.7},
    {id:'tie', name:'The India Express', sector:'Restaurant empire', units:46, unitLabel:'restaurants', rev:1.6, margin:0.16, rating:4.6},
    {id:'culinary', name:'Rungta Culinary Ventures', sector:'Culinary brands and catering', units:9, unitLabel:'brands', rev:3.2, margin:0.14, rating:4.4},
    {id:'capital', name:'Rungta Capital', sector:'Business investments', units:22, unitLabel:'holdings', rev:2.5, margin:0.35, rating:4.3},
    {id:'tech', name:'Rungta Technologies', sector:'Technology', units:5, unitLabel:'product lines', rev:6.0, margin:0.25, rating:4.2}
  ],
  executives:[
    {role:'Chief Executive Officer', name:'Meera Kapadia', skill:78},
    {role:'Chief Financial Officer', name:'Arjun Malhotra', skill:74},
    {role:'President, Rungta Hospitality', name:'Sofia Lindqvist', skill:80},
    {role:'President, The India Express', name:'Rohan Iyer', skill:76}
  ],
  markets:['India','United Arab Emirates','United Kingdom','Singapore'],
  expansionTargets:['United States','Japan','France','Australia','Canada','Kenya','Brazil','Germany']
};
const RG_CANDIDATES = [
  {name:'Leah Fernandes', skill:84, trait:'Turnaround specialist'}, {name:'Daniel Okafor', skill:79, trait:'Growth-focused'},
  {name:'Priya Natarajan', skill:82, trait:'Operational excellence'}, {name:'Marco Bellini', skill:75, trait:'Hospitality veteran'},
  {name:'Hana Sato', skill:81, trait:'Digital transformation'}
];

const SEALS_TEXT = 'UNITED UNDER THE CROWN';
