/* ===== GameState + SimulationEngine (no DOM; deterministic given the seed) ===== */
const SAVE_VERSION = 1;
const MODE_NAMES = {sandbox:'Sovereign Sandbox', rise:'Rise to the Throne', crisis:'Crisis Management', tribunal:'Tribunal Mode', creative:'Creative Mode'};
const ENGINE = {interrupts:[], sfx:null};
const STYLE_OF = {devika:'Guarded', riaS:'Direct', riaV:'Precise', anaya:'Reflective', esha:'Composed', ira:'Measured', misha:'Conciliatory', vidyut:'Fiery', kabir:'Warm'};

function nid(st, p) { st.counters[p] = (st.counters[p] || 0) + 1; return p + '-' + String(st.counters[p]).padStart(4, '0'); }
function notify(st, title, body, kind = 'info', link = null) {
  st.notifications.unshift({id:nid(st, 'NTF'), day:st.day, title, body, kind, read:false, link});
  if (st.notifications.length > 200) st.notifications.length = 200;
  ENGINE.sfx = kind === 'alert' ? 'alert' : (ENGINE.sfx || 'chime');
}
function archive(st, type, title, body, ref) { st.archives.unshift({id:nid(st, 'ARC'), day:st.day, type, title, body, ref:ref || ''}); }
function brief(st, text) { st.briefing = {day:st.day, text}; notify(st, 'Prime Arbiter’s briefing', text, 'brief', {screen:'dashboard'}); }
function makeDoc(st, type, title, body, ref) { const d = {id:nid(st, 'DOC'), type, title, body, ref:ref || '', day:st.day}; st.documents.unshift(d); if (st.documents.length > 300) st.documents.length = 300; return d; }
function adjInd(st, k, v) { if (st.ind[k] === undefined || !Number.isFinite(v)) return; st.ind[k] = clamp(st.ind[k] + v, 0, 100); }
function charById(st, id) { return st.chars.find(c => c.id === id); }
function judges(st) { return st.chars.filter(c => c.type === 'judge'); }
function councilMembers(st) { return st.chars.filter(c => c.type === 'council' && c.active !== false); }
function sovName(st) { return st.canon.sovereign; }
function sovTitle(st) { return st.rise && !st.rise.crowned ? 'Candidate for the Cosmic Throne' : st.canon.title; }

/* ---------- GameState construction ---------- */
function newGame(mode = 'sandbox', seed) {
  seed = (Number(seed) >>> 0) || ((Date.now() * 2654435761) >>> 0) || 1;
  const st = {
    meta:{version:SAVE_VERSION, mode, creative:mode === 'creative', seed, created:Date.now(), name:MODE_NAMES[mode] || 'Campaign'},
    rng:seed | 0, day:0,
    ind:Object.assign({}, IND_START), indHist:[],
    treasury:{balance:42000, reserve:1500, tradeBonus:0, budget:Object.fromEntries(BUDGET_CATS.map(b => [b.key, b.base])), ledger:[], hist:[], month:{rev:{}, exp:{}}},
    civs:deep(CIVS), chars:[], petitions:[], cases:[], laws:[], drafts:[], projects:[], events:[], negotiations:[], notifications:[], archives:[], documents:[], timers:[],
    research:{stellar:0, linguistics:0, ecology:0, logistics:0, pedagogy:0},
    edu:{institutions:[{id:'inst-dais', name:'Dhirubhai Ambani International School', civ:'earth', status:'Pilot in progress', students:420, pilot:true, since:-30}], modules:{science:true, civ:true, innovation:true, ethics:true, access:true, environment:false, exchange:false}, scholarships:60, partnerships:[]},
    earth:{visits:0, exchanges:0, delegations:0},
    rg:Object.assign(deep(RG_BASE), {projects:[], hist:[], board:[], lastReport:0}),
    council:{seats:13, departments:[], committees:[], delegations:{}, recommendations:[], quorum:'Simple majority', chair:'The Sovereign'},
    briefing:null, counters:{}, achievements:{}, stats:{verdicts:0, projectsDone:0, treaties:0, positiveMonths:0, crisesResolved:0, lawsEnacted:0, petitionsDecided:0},
    canon:{sovereign:'Tarush Rungta', title:'Sovereign of the Cosmos', arrangement:'sovereign-arbiter', arbiterRole:'Principal Adviser to the Crown', earthNextCollective:1000},
    flags:{ancientStage:0, spiritsLast:-999, fourthDoor:false, lattice:false, earthCollectiveTried:false},
    rise:null, journal:'', cmdLog:[], goal:null
  };
  JUDGES.forEach(j => st.chars.push(Object.assign(deep(j), {type:'judge', memory:[], standing:0, position:j.id === 'arbiter' ? 'Prime Arbiter of the Cosmic Tribunal' : `Judge of ${j.juris}`})));
  st.chars.push({id:'tarush', type:'council', sovereign:true, name:'Tarush Rungta', role:'Sovereign of the Cosmos', ability:'Constitutional executive authority', tags:[], values:{}, personality:'—', dept:'The Crown', trust:100, memory:[], perf:100, tasks:0, busyUntil:0, established:true});
  COUNCIL.forEach(m => st.chars.push(Object.assign(deep(m), {type:'council', style:STYLE_OF[m.id] || 'Composed', memory:[], perf:72, tasks:0, busyUntil:0, established:true, standing:0, position:m.role})));
  st.council.departments = COUNCIL.map(m => ({id:nid(st, 'DEP'), name:m.dept, head:m.id}));
  SCN_PETITIONS.forEach(p => st.petitions.push(makePetition(st, p)));
  st.cases.push(makeCase(st, SCN_CASE));
  const dais = createProject(st, {name:'COSMOS–EDU Pilot at DAIS', cat:'education', cost:900, duration:120, eff:{ind:{education:4, approval:1}, civ:{earth:6}}, special:'dais'}, {free:true, progress:62}).project;
  dais.started = -62;
  const tr = MAJOR_PROJECTS.find(p => p.key === 'transit');
  createProject(st, Object.assign(deep(tr), {key:'transit'}), {free:true, progress:38}).project.started = -38;
  const cr = makeCrisis(st, 'stellar', 'vael'); cr.nextEsc = 20; st.events.push(cr);
  st.negotiations.push({id:nid(st, 'NEG'), title:'Crystal-for-Iridium Compact', parties:['veyari','korr'], topic:'Trade of Veyari resonant crystal for Korr iridium', progress:35, tension:30, round:2, maxRounds:6, nextRound:5, stance:'hold', status:'active', log:['Round 1: opening positions exchanged.']});
  SCN_ARCHIVES.forEach(a => st.archives.push(Object.assign({id:nid(st, 'ARC')}, a)));
  st.archives.sort((a, b) => b.day - a.day);
  st.laws.push({id:'ACT-0000', type:'act', title:'Founding Charter of the Crowned Era', text:'Establishes the Constitutional Principles, the Cosmic Tribunal, the Royal Cosmic Council and the Cosmic Treasury.', provisions:[], issued:-20, status:'in force', implLeft:0, flagged:false, history:['Enacted at the foundation of the Crowned Era.']});
  // six months of prior treasury history for the charts
  let bal = 39400;
  for (let i = 6; i >= 1; i--) { const rev = 5200 + Math.round(staticRng(seed + i)() * 400), exp = 4900 + Math.round(staticRng(seed + i * 7)() * 300); bal += rev - exp; st.treasury.hist.push({day:-i * 30, balance:bal, revenue:rev, expense:exp, reserve:1500}); }
  st.treasury.balance = bal + (42000 - bal); // anchor present balance
  st.indHist.push(Object.assign({day:0}, st.ind));
  applyMode(st, mode);
  st.briefing = {day:0, text:st.rise ? 'Candidate, the Chamber receives you. The Twelve have not yet recognised your claim. Earn their trust and the trust of the member civilisations, and you may petition for recognition. Until then you may advise, decide petitions and preside over hearings, but you may not enact laws.' : BRIEF_OPENING};
  notify(st, 'Prime Arbiter’s briefing', st.briefing.text, 'brief', {screen:'dashboard'});
  ENGINE.sfx = null;
  return st;
}

function applyMode(st, mode) {
  if (mode === 'rise') {
    st.rise = {crowned:false};
    judges(st).forEach((j, i) => { j.trust = 52 + ((i * 7) % 15); });
    st.civs.forEach(c => { if (c.kind !== 'capital') c.rel = Math.max(40, c.rel - 18); });
    Object.assign(st.ind, {approval:62, legitimacy:84, trust:76});
    st.archives = st.archives.filter(a => a.ref !== 'TRB-H-0001');
    archive(st, 'history', 'Candidacy for the Cosmic Throne registered', 'Tarush Rungta has been registered as a candidate for the Cosmic Throne. Recognition requires the endorsement of all Twelve Judges and of the member civilisations.', 'TRB-H-0001');
    st.goal = 'Earn the endorsement of all twelve members of the Tribunal (trust 70+) and of every member civilisation (relation 60+), then petition for recognition from the Private Office.';
  } else if (mode === 'crisis') {
    Object.assign(st.ind, {approval:71, legitimacy:86, trust:68, efficiency:70, stability:58, science:70, environment:55, education:64});
    st.treasury.balance = 18000; st.treasury.reserve = 600;
    const v = st.events.find(e => e.tpl === 'stellar'); v.stage = 2; v.nextEsc = 12;
    [['tidal','thalassine',9], ['shortage','ashen',7], ['storm','korr',11]].forEach(([t, c, n]) => { const e = makeCrisis(st, t, c); e.nextEsc = n; st.events.push(e); });
    st.civs.forEach(c => { if (c.kind === 'member') c.rel = Math.max(35, c.rel - 12); });
    st.goal = 'Bring Cosmic Stability to 80 or higher and resolve every active emergency.';
  } else if (mode === 'tribunal') {
    for (let i = 0; i < 3; i++) st.cases.push(makeCase(st, CASE_TEMPLATES[i % CASE_TEMPLATES.length](st)));
    st.goal = 'Preside over the docket. Keep Judicial Legitimacy above 90 while delivering ten verdicts.';
  } else if (mode === 'creative') {
    st.goal = 'Creative Mode: build civilisations, characters and scenarios freely. Achievements are disabled for this campaign.';
  } else st.goal = 'Govern the Cosmos wisely. There is no final victory, only the record you leave.';
}

/* ---------- Effects ---------- */
function applyEff(st, eff, memo = 'Effect', cat = 'other') {
  if (!eff) return;
  if (eff.ind) for (const k in eff.ind) adjInd(st, k, eff.ind[k]);
  if (eff.civ) for (const k in eff.civ) { const c = civById(st, k); if (c) c.rel = clamp(c.rel + eff.civ[k], 0, 100); }
  if (eff.char) for (const k in eff.char) { const c = charById(st, k); if (c) c.trust = clamp(c.trust + eff.char[k], 0, 100); }
  if (eff.cc > 0) earn(st, eff.cc, cat, memo);
  if (eff.cc < 0) spend(st, -eff.cc, cat, memo);
}
function describeEff(st, eff, cost) {
  const out = [];
  if (cost) out.push({t:`Treasury −${fmt(cost)}M`, neg:true});
  if (!eff) return out;
  if (eff.cc) out.push({t:`Treasury ${eff.cc > 0 ? '+' : '−'}${fmt(Math.abs(eff.cc))}M`, neg:eff.cc < 0});
  if (eff.ind) for (const k in eff.ind) if (eff.ind[k]) out.push({t:`${IND_SHORT[k] || k} ${sgn(eff.ind[k])}`, neg:eff.ind[k] < 0});
  if (eff.civ) for (const k in eff.civ) if (eff.civ[k]) out.push({t:`${civName(st, k)} ${sgn(eff.civ[k])}`, neg:eff.civ[k] < 0});
  if (eff.char) for (const k in eff.char) { const c = charById(st, k); if (c && eff.char[k]) out.push({t:`${c.name} trust ${sgn(eff.char[k])}`, neg:eff.char[k] < 0}); }
  return out;
}
function scaleEff(eff, f) { const e = deep(eff || {}); ['ind','civ','char'].forEach(g => { if (e[g]) for (const k in e[g]) e[g][k] = Math.round(e[g][k] * f * 10) / 10; }); if (e.cc) e.cc = Math.round(e.cc * f); return e; }

/* ---------- Treasury (EconomyEngine core) ---------- */
function ledger(st, type, cat, amount, memo, acct = 'general') {
  const T = st.treasury; const id = nid(st, 'TXN');
  T.ledger.unshift({id, day:st.day, type, cat, amount:Math.round(amount * 100) / 100, memo, acct, balance:Math.round(T.balance)});
  if (T.ledger.length > 500) T.ledger.length = 500;
  const bucket = type === 'revenue' ? T.month.rev : type === 'expense' ? T.month.exp : null;
  if (bucket) bucket[cat] = (bucket[cat] || 0) + amount;
}
function validAmount(a) { return typeof a === 'number' && Number.isFinite(a) && a > 0 && a < 1e9; }
function spend(st, amount, cat, memo, opt = {}) {
  amount = Math.round(Number(amount) * 100) / 100;
  if (!validAmount(amount)) return {ok:false, msg:'Invalid transaction: amount must be a positive number.'};
  const T = st.treasury;
  const avail = T.balance + (opt.useReserve ? T.reserve : 0);
  if (amount > avail) return {ok:false, msg:`Insufficient funds: ${fmtCC(amount)} required, ${fmtCC(avail)} available${opt.useReserve ? ' including the emergency reserve' : ''}.`};
  let fromReserve = 0;
  if (opt.useReserve) { fromReserve = Math.min(T.reserve, amount); T.reserve -= fromReserve; }
  T.balance -= amount - fromReserve;
  ledger(st, 'expense', cat, amount, memo + (fromReserve ? ` (${fmt(fromReserve)}M from reserve)` : ''), fromReserve ? 'reserve' : 'general');
  return {ok:true};
}
function earn(st, amount, cat, memo) {
  amount = Math.round(Number(amount) * 100) / 100;
  if (!validAmount(amount)) return {ok:false, msg:'Invalid transaction.'};
  st.treasury.balance += amount; ledger(st, 'revenue', cat, amount, memo); return {ok:true};
}
function transferToReserve(st, amount) {
  amount = Number(amount);
  if (!validAmount(amount)) return {ok:false, msg:'Enter a positive amount.'};
  if (amount > st.treasury.balance) return {ok:false, msg:`Insufficient funds: only ${fmtCC(st.treasury.balance)} available.`};
  st.treasury.balance -= amount; st.treasury.reserve += amount; ledger(st, 'transfer', 'emergency', amount, 'Allocation to emergency reserve');
  return {ok:true, msg:`${fmtCC(amount)} moved to the emergency reserve.`};
}
function setBudget(st, key, value) {
  const v = Number(value);
  if (!BUDGET_CATS.find(b => b.key === key)) return {ok:false, msg:'Unknown budget category.'};
  if (!Number.isFinite(v) || v < 0 || v > 20000) return {ok:false, msg:'Budget allocations must be between 0 and 20,000.'};
  st.treasury.budget[key] = Math.round(v); return {ok:true};
}
function budgetTotal(st) { return Object.values(st.treasury.budget).reduce((a, b) => a + b, 0); }
function projectedRevenue(st) {
  let contrib = 0; const levy = lawRevenueMod(st, 'contributions');
  st.civs.forEach(c => { if (c.discovered && (c.kind === 'member' || c.kind === 'capital') && c.contribution > 0 && c.rel >= 30) contrib += c.contribution * (0.55 + 0.45 * c.rel / 100) * (0.7 + 0.3 * st.ind.trust / 100) * (1 + levy); });
  const treaties = st.laws.filter(l => l.type === 'treaty' && l.status === 'in force').length;
  return {
    contributions:contrib,
    trade:1200 * (st.ind.trust / 90) * (1 + st.treasury.tradeBonus + treaties * 0.03 + lawRevenueMod(st, 'trade')),
    licensing:Math.max(0, 600 * (st.ind.science / 75) * (1 + lawRevenueMod(st, 'licensing'))),
    infrastructure:600 * (st.ind.stability / 92),
    development:250
  };
}
function lawRevenueMod(st, key) { let m = 0; st.laws.forEach(l => { if (l.status !== 'in force') return; (l.provisions || []).forEach(pk => { const P = PROVISIONS.find(p => p.key === pk); if (P && P.revenue && P.revenue[key]) m += P.revenue[key]; }); }); return m; }
function recurringCosts(st) {
  let laws = 0; st.laws.forEach(l => { if (l.status === 'in force') (l.provisions || []).forEach(pk => { const P = PROVISIONS.find(p => p.key === pk); if (P) laws += P.cost || 0; }); });
  const ped = 1 - 0.1 * st.research.pedagogy;
  const mods = Object.values(st.edu.modules).filter(Boolean).length * 30 * ped;
  const schol = st.edu.scholarships * 0.12 * ped;
  return {laws, edu:mods + schol};
}

/* ---------- Projects (ProjectManager) ---------- */
function createProject(st, spec, o = {}) {
  const cost = Math.round(spec.cost || 0);
  if (spec.req && st.research[spec.req.track] < spec.req.lvl) { const t = RESEARCH_TRACKS.find(x => x.key === spec.req.track); return {ok:false, msg:`Requires ${t.name} level ${spec.req.lvl}.`}; }
  if (spec.key && st.projects.some(p => p.key === spec.key && p.status === 'active')) return {ok:false, msg:`${spec.name} is already under way.`};
  if (cost > 0 && !o.free) { const r = spend(st, cost, spec.cat || 'development', `Project: ${spec.name}`); if (!r.ok) return r; }
  const p = {id:nid(st, 'PRJ'), name:spec.name, cat:spec.cat || 'development', cost, duration:Math.max(1, Math.round(spec.duration || 30)), progress:o.progress || 0, eff:deep(spec.eff || {}), civ:spec.civ || null, special:spec.special || null, inst:spec.inst || null, key:spec.key || null, track:spec.track || null, lvl:spec.lvl || 0, risk:o.risk || null, source:o.source || null, status:'active', started:st.day, desc:spec.desc || ''};
  st.projects.push(p);
  return {ok:true, project:p, msg:`${p.name} begun.`};
}
function projectRate(st) { return (0.55 + 0.45 * st.ind.efficiency / 85) * (1 + 0.06 * st.research.logistics); }
function completeProject(st, p) {
  p.status = 'complete'; p.completed = st.day; p.progress = p.duration;
  applyEff(st, p.eff, `Project ${p.name}`);
  const extra = [];
  switch (p.special) {
    case 'dais': { const i = st.edu.institutions.find(x => x.id === 'inst-dais'); if (i) { i.status = 'Operational pilot'; i.students = 600; } extra.push('DAIS is now an operational COSMOS–EDU pilot institution.'); break; }
    case 'scholar200': st.edu.scholarships += 200; extra.push('200 accessibility scholarships added to COSMOS–EDU.'); break;
    case 'eduinst': { const inst = p.inst || {name:p.name.replace(/^COSMOS–EDU Partner: /, ''), civ:p.civ || 'aurelia'}; st.edu.institutions.push({id:nid(st, 'INS'), name:inst.name, civ:inst.civ, status:'Operational', students:ri(st, 200, 900), since:st.day}); extra.push(`${inst.name} joined COSMOS–EDU.`); break; }
    case 'trade2': st.treasury.tradeBonus += 0.02; extra.push('Trade revenue permanently +2%.'); break;
    case 'fee600': earn(st, 600, 'licensing', 'Verdance Corridor licence fee'); extra.push('Licence fee of CC 600M received.'); break;
    case 'lattice': st.flags.lattice = true; st.events.filter(e => e.status === 'active' && e.tpl === 'stellar').forEach(e => { e.stage = Math.max(1, e.stage - 1); e.nextEsc += 15; }); extra.push('Stellar crises are now easier to contain.'); break;
    case 'research': { st.research[p.track] = Math.max(st.research[p.track], p.lvl); adjInd(st, 'science', 2); if (p.track === 'ecology') adjInd(st, 'environment', 1); if (p.track === 'pedagogy') adjInd(st, 'education', 1); if (p.track === 'logistics') adjInd(st, 'efficiency', 2); extra.push(`${RESEARCH_TRACKS.find(t => t.key === p.track).name} reached level ${p.lvl}.`); break; }
    case 'access': st.edu.institutions.forEach(i => { i.accessible = true; }); extra.push('Every COSMOS–EDU institution is now fully accessible.'); break;
    case 'earthEnv': { const e = civById(st, 'earth'); e.dev.environment = clamp(e.dev.environment + 6, 0, 100); break; }
    case 'earthSci': { const e = civById(st, 'earth'); e.tech = clamp(e.tech + 2, 0, 100); break; }
    case 'fourthDoor': st.flags.fourthDoor = true; extra.push('The Door of Mercy now stands in the Tribunal chamber.'); break;
  }
  if (p.civ) { const c = civById(st, p.civ); if (c) { c.dev.infrastructure = clamp(c.dev.infrastructure + 1, 0, 100); } }
  let riskText = '';
  if (p.risk && rnd(st) < p.risk.chance) { applyEff(st, p.risk.eff, `Complication: ${p.name}`); riskText = ` Complication: ${p.risk.text}`; if (p.source) vindicate(st, p.source, 'bad', p.name); }
  else if (p.source) vindicate(st, p.source, 'good', p.name);
  st.stats.projectsDone++;
  const eff = describeEff(st, p.eff).map(x => x.t).join(', ');
  archive(st, 'project', `Project completed: ${p.name}`, `Completed on ${fmtDate(st.day)}. Effects: ${eff || 'none'}. ${extra.join(' ')}${riskText}`, p.id);
  notify(st, `Project completed: ${p.name}`, (eff ? `Effects: ${eff}. ` : '') + extra.join(' ') + riskText, riskText ? 'alert' : 'success', {screen:'treasury'});
  if (p.cost >= 1000 || riskText) brief(st, `${p.name} is complete.${riskText ? ' It did not go entirely to plan.' + riskText : ' The Council reports it delivered as intended.'}`);
}

/* ---------- Character intelligence ---------- */
const STYLE_OPEN = {Measured:'Across the long arc of time, ', Guarded:'Look closer before you act. ', Direct:'Plainly: ', Reflective:'Consider what this says about the Crown. ', Fiery:'Enough hesitation. ', Conciliatory:'Let us find the common ground. ', Warm:'Think of the people this touches. ', Precise:'The figures matter here. ', Scholarly:'The evidence suggests a course. ', Lyrical:'The winds carry a clear message. ', Formal:'As a matter of law, ', Composed:'Sovereign, '};
const CHOICE_TEXT = {approve:'I advise approval', conditions:'I advise approval with conditions', reject:'I advise rejection', info:'I advise requesting further information first', tribunal:'I advise referral to the Tribunal', act:'I advise acting now'};
const REASON = {
  approval:['the people will welcome it','it will cost us public confidence'], legitimacy:['it strengthens the Tribunal’s standing','it undermines the Tribunal’s standing'], trust:['it builds trust between civilisations','it will strain trust between civilisations'],
  efficiency:['it makes the Council more effective','it burdens the Council'], stability:['it keeps the Cosmos stable','it puts stability at risk'], science:['it advances knowledge','it sets back research'],
  environment:['it heals living worlds','it harms living worlds'], education:['it widens access to learning','it narrows access to learning'], treasury:['it protects the treasury','the cost is too high for what it buys'],
  risk:['the risks are understood','the risks have not been examined'], rel:['the petitioners deserve the Crown’s support','it would damage relations']
};
function charScore(ch, eff, cost = 0) {
  const v = ch.values || {}; let s = 0; const parts = {};
  const add = (k, x) => { s += x; parts[k] = (parts[k] || 0) + x; };
  if (eff && eff.ind) for (const k in eff.ind) add(k, (v[k] || 0.15) * eff.ind[k]);
  if (eff && eff.civ) for (const k in eff.civ) add('rel', (v.trust || 0.25) * eff.civ[k] * 0.1);
  if (cost) add('treasury', -(v.treasury || 0.25) * cost / 400);
  if (eff && eff.cc) add('treasury', (v.treasury || 0.25) * eff.cc / 400);
  return {s, parts};
}
function topReason(parts, positive) {
  let best = null, bv = 0;
  for (const k in parts) { const x = parts[k] * (positive ? 1 : -1); if (x > bv) { bv = x; best = k; } }
  if (!best) return positive ? 'the balance of considerations favours it' : 'the balance of considerations is against it';
  return REASON[best] ? REASON[best][positive ? 0 : 1] : 'of its consequences';
}
function petAdvisers(st, p) {
  const byCls = {Environmental:['zephyria','kaelith'], Scientific:['thalor','nyxara'], Constitutional:['aurion','elyndor'], Educational:['solenne','kaelith'], Development:['ignivar','kaelith'], Humanitarian:['solenne','nyxara'], Cultural:['elyndor','vespera'], Administrative:['kaelith','orionis'], Diplomatic:['elyndor','nyxara']};
  const memberByCls = {Environmental:'anaya', Scientific:'riaV', Constitutional:'devika', Educational:'esha', Development:'kabir', Humanitarian:'riaS', Cultural:'misha', Administrative:'esha', Diplomatic:'misha'};
  const ids = ['arbiter'].concat(byCls[p.cls] || ['vespera','kaelith']).concat([memberByCls[p.cls] || 'esha']);
  return ids.map(id => charById(st, id)).filter(c => c && c.active !== false);
}
function petAdvice(st, p) {
  const urg = {Critical:1.6, High:0.9, Moderate:0.3, Low:0}[p.urgency] || 0;
  const h = p.hidden || {chance:0, eff:{}};
  return petAdvisers(st, p).map(ch => {
    const ap = charScore(ch, p.project.eff, p.cost);
    const sev = Math.max(0.5, -charScore(ch, h.eff).s);
    const riskPen = h.chance * sev * (p.riskRevealed ? 1 : (ch.caution || 1) * 1.4);
    const opts = {
      approve:ap.s - riskPen + urg * 0.3,
      conditions:ap.s * 0.75 - riskPen * 0.5 + 0.15 + (ch.mercy || 0.5) * 0.1 + urg * 0.1,
      reject:charScore(ch, p.rejectEff).s - urg * 0.4,
      info:p.infoRequested ? -99 : ((ch.caution || 1) * 0.9 + (ch.evidence || 1) * 0.3) * h.chance * 2.6 - urg - 0.2,
      tribunal:p.cls === 'Constitutional' ? (ch.principle || 1) * 0.9 + 0.2 : -99
    };
    let choice = 'approve'; for (const k in opts) if (opts[k] > opts[choice]) choice = k;
    let reason;
    if (choice === 'info') reason = REASON.risk[1];
    else if (choice === 'tribunal') reason = 'this is a question of rights between civilisations, and the Tribunal is the proper forum';
    else if (choice === 'reject') reason = topReason(ap.parts, false);
    else reason = topReason(ap.parts, true);
    const prior = ch.memory.filter(m => !m.followed && m.advice !== choice).length;
    const memo = prior >= 3 && rnd(st) < 0.5 ? ' You have set aside my counsel before; I offer it again regardless.' : '';
    return {id:ch.id, name:ch.name, choice, text:`${STYLE_OPEN[ch.style] || ''}${CHOICE_TEXT[choice]}, because ${reason}.${memo}`};
  });
}
function remember(st, ch, entry) {
  if (!ch) return;
  ch.memory.unshift(Object.assign({day:st.day}, entry));
  if (ch.memory.length > 40) ch.memory.length = 40;
  if (entry.followed === true) ch.trust = clamp(ch.trust + 1.5, 0, 100);
  if (entry.followed === false) ch.trust = clamp(ch.trust - 0.8, 0, 100);
}
function vindicate(st, ref, outcome, what) {
  const lines = [];
  st.chars.forEach(ch => {
    const m = ch.memory.find(x => x.ref === ref); if (!m || m.resolved) return; m.resolved = outcome;
    const cautious = ['reject','info','conditions','tribunal'].includes(m.advice);
    if (outcome === 'bad' && cautious && !m.followed) { ch.standing = (ch.standing || 0) + 1; ch.trust = clamp(ch.trust + 2, 0, 100); lines.push(`${ch.name}: “On ${fmtDateShort(m.day)} I advised caution on ${what}. I take no pleasure in being right.”`); }
    else if (outcome === 'bad' && m.advice === 'approve' && m.followed) lines.push(`${ch.name}: “I supported ${what}. I share responsibility for the complication.”`);
    else if (outcome === 'good' && m.advice === 'reject' && !m.followed) { ch.trust = clamp(ch.trust + 1, 0, 100); lines.push(`${ch.name}: “I advised against ${what}. The outcome proved me wrong, and I say so gladly.”`); }
    else if (outcome === 'good' && m.followed && m.advice !== 'reject' && rnd(st) < 0.4) lines.push(`${ch.name}: “${what} has served the Cosmos well.”`);
  });
  if (lines.length) notify(st, 'Your advisers remember', lines.join('\n'), outcome === 'bad' ? 'alert' : 'info', {screen:'office'});
}

/* ---------- Petitions (PetitionManager) ---------- */
const PET_OPEN = ['pending'];
function petAction(st, id, action, data = {}) {
  const p = st.petitions.find(x => x.id === id);
  if (!p) return {ok:false, msg:'Petition not found.'};
  if (!PET_OPEN.includes(p.status)) return {ok:false, msg:`${p.id} is not awaiting a decision (status: ${p.status}).`};
  const adv = petAdvice(st, p);
  const recordAdvice = decision => { adv.forEach(a => remember(st, charById(st, a.id), {ref:p.id, topic:p.title, advice:a.choice, followed:a.choice === decision || (a.choice === 'conditions' && decision === 'approve') || (a.choice === 'approve' && decision === 'conditions')})); p.advice = adv; };
  const c = civById(st, p.civ);
  switch (action) {
    case 'approve': case 'conditions': {
      const cond = action === 'conditions';
      if (cond && c && c.rel < 45 && rnd(st) > c.rel / 100 + 0.25) { c.rel = clamp(c.rel - 2, 0, 100); p.log.push(`${fmtDate(st.day)}: The petitioner declined the proposed conditions.`); p.conditionsDeclined = true; return {ok:true, msg:`${p.petitioner} declined the conditions. The petition remains pending.`}; }
      const cost = Math.round(p.cost * (cond ? 0.75 : 1) * (p.hearingDiscount ? 0.85 : 1));
      const spec = Object.assign(deep(p.project), {cost, duration:Math.round(p.project.duration * (cond ? 1.25 : 1)), civ:p.civ, eff:cond ? scaleEff(p.project.eff, 0.8) : deep(p.project.eff)});
      const risk = p.hidden ? Object.assign(deep(p.hidden), {chance:p.hidden.chance * (cond ? 0.5 : 1)}) : null;
      const r = createProject(st, spec, {risk, source:p.id});
      if (!r.ok) return r;
      recordAdvice(action);
      p.status = 'approved'; p.decision = cond ? 'Approved with conditions' : 'Approved'; p.decidedDay = st.day; p.projectId = r.project.id;
      if (c) c.rel = clamp(c.rel + (cond ? 2 : 3), 0, 100); adjInd(st, 'approval', 0.4);
      p.log.push(`${fmtDate(st.day)}: ${p.decision}. Project ${r.project.id} created${cost ? ` at a cost of ${fmtCC(cost)}` : ''}.`);
      if (data.text) p.response = data.text;
      st.stats.petitionsDecided++;
      archive(st, 'petition', `${p.id} ${p.decision}: ${p.title}`, `${p.petitioner}. ${p.decision}${cond ? ' (75% funding, longer timeline, reporting and audit conditions)' : ''}. Project ${r.project.name} (${r.project.id}).${data.text ? ' Response: ' + data.text : ''}`, p.id);
      makeDoc(st, 'letter', `Response to ${p.id}`, petLetter(st, p, data.text), p.id);
      return {ok:true, msg:`${p.id} ${p.decision.toLowerCase()}. ${r.project.name} has begun.`};
    }
    case 'reject':
      recordAdvice('reject'); applyEff(st, p.rejectEff, `Rejection of ${p.id}`);
      p.status = 'rejected'; p.decision = 'Rejected'; p.decidedDay = st.day; if (data.text) p.response = data.text;
      p.log.push(`${fmtDate(st.day)}: Rejected.`); st.stats.petitionsDecided++;
      archive(st, 'petition', `${p.id} rejected: ${p.title}`, `${p.petitioner}. The petition was rejected.${data.text ? ' Response: ' + data.text : ''}`, p.id);
      makeDoc(st, 'letter', `Response to ${p.id}`, petLetter(st, p, data.text), p.id);
      return {ok:true, msg:`${p.id} rejected.`};
    case 'info':
      if (p.infoRequested) return {ok:false, msg:'Further information has already been requested for this petition.'};
      p.infoRequested = true; p.status = 'awaiting information';
      addTimer(st, 5, 'petInfo', p.id); p.log.push(`${fmtDate(st.day)}: Further information requested (5 days).`);
      return {ok:true, msg:`Further information requested from ${p.petitioner}. Expected in 5 days.`};
    case 'council': {
      if (p.councilReport) return {ok:false, msg:'The Council has already reviewed this petition.'};
      p.status = 'council review'; addTimer(st, 4, 'petCouncil', p.id); p.log.push(`${fmtDate(st.day)}: Referred to the Royal Cosmic Council (4 days).`);
      return {ok:true, msg:'Referred to the Council. A report is due in 4 days.'};
    }
    case 'hearing':
      if (p.hearingDone) return {ok:false, msg:'A hearing has already been held.'};
      p.status = 'hearing scheduled'; addTimer(st, 3, 'petHearing', p.id); p.log.push(`${fmtDate(st.day)}: Petitioner invited to a hearing (3 days).`);
      return {ok:true, msg:`${p.petitioner} has been invited to a hearing in 3 days.`};
    case 'tribunal': {
      const resp = p.respondent ? civById(st, p.respondent) : null;
      const A = {name:c ? c.name : p.petitioner, id:p.civ}, B = resp ? {name:resp.name, id:resp.id} : {name:'The Crown Administration', id:'aurelia'};
      const cs = makeCase(st, genericCase(st, `${A.name} v. ${B.name}`, p.title, 'Petition referral', A, B, `Referred from petition ${p.id}: ${p.request}`, ['Constitutional Principle 1','Constitutional Principle 7'], !resp));
      cs.fromPetition = p.id; st.cases.push(cs);
      recordAdvice('tribunal'); adjInd(st, 'legitimacy', 0.5);
      p.status = 'referred to Tribunal'; p.caseId = cs.id; p.decidedDay = st.day; p.log.push(`${fmtDate(st.day)}: Referred to the Cosmic Tribunal as ${cs.id}.`);
      archive(st, 'petition', `${p.id} referred to the Tribunal`, `Registered as ${cs.id}.`, p.id);
      return {ok:true, msg:`${p.id} referred to the Tribunal as ${cs.id}.`};
    }
    case 'defer': {
      p.deadlineDay += 30; p.deferrals = (p.deferrals || 0) + 1;
      if (c) c.rel = clamp(c.rel - (p.urgency === 'Critical' ? 4 : p.urgency === 'High' ? 2 : 1), 0, 100);
      adjInd(st, 'approval', -0.3); p.log.push(`${fmtDate(st.day)}: Consideration deferred by 30 days.`);
      return {ok:true, msg:`${p.id} deferred. New deadline ${fmtDate(p.deadlineDay)}.`};
    }
    case 'custom': {
      const text = String(data.text || '').trim().slice(0, 2000);
      if (!text) return {ok:false, msg:'Write a response before sending it.'};
      if (!['approve','conditions','reject','defer'].includes(data.disposition)) return {ok:false, msg:'Choose what the response decides.'};
      return petAction(st, id, data.disposition, {text});
    }
  }
  return {ok:false, msg:'Unknown petition action.'};
}
function petLetter(st, p, text) {
  return `To ${p.petitioner},\n\nThe Crown has considered petition ${p.id}, “${p.title}”, submitted on ${fmtDate(p.submitted)}.\n\nDecision: ${p.decision}.\n\n${text || (p.status === 'approved' ? 'The Crown has directed the Council to begin the requested work. Progress will be reported through the Petitions Office.' : 'Having weighed the request, its costs and its risks, the Crown is unable to grant it at this time. The petitioner may submit a revised request.')}\n\nGiven under the Cosmic Seal on ${fmtDate(st.day)}.`;
}
function addTimer(st, days, kind, ref, data) { st.timers.push({id:nid(st, 'TMR'), day:st.day + days, kind, ref, data:data || null}); }

/* ---------- Tribunal (TribunalManager) ---------- */
const CASE_STAGES = ['Case registration','Preliminary review','Opening statements','Evidence presentation','Witness examination','Judicial deliberation','Verdict','Implementation','Appeal or constitutional review'];
function caseById(st, id) { return st.cases.find(c => c.id === id); }
function casePerceived(c) {
  let s = 0;
  c.evidence.forEach(e => { s += e.w; });
  c.hidden.forEach(e => { if (c.revealedHidden.includes(e.id)) s += e.w; });
  c.witnesses.forEach((w, wi) => w.qs.forEach((q, qi) => { if (c.asked[`w${wi}q${qi}`]) s += q.w; }));
  ['claimant','respondent'].forEach(k => { if (c.asked[k]) s += c.partyQs[k].w; });
  return Math.tanh(s / 3);
}
function caseThoroughness(c) {
  const total = c.witnesses.reduce((a, w) => a + w.qs.length, 0) + 2 + c.hidden.length;
  const done = Object.keys(c.asked).length + c.revealedHidden.length;
  return total ? done / total : 1;
}
function caseAdvance(st, id) {
  const c = caseById(st, id); if (!c) return {ok:false, msg:'Case not found.'};
  if (c.status !== 'open') return {ok:false, msg:'This case is no longer in session.'};
  if (c.stage >= 6) return {ok:false, msg:'Issue a verdict to proceed.'};
  c.stage++;
  if (c.stage === 1) c.log.push(`${fmtDate(st.day)}: Preliminary review — the Prime Arbiter finds the case admissible.`);
  if (c.stage === 5) caseDeliberate(st, c);
  c.log.push(`${fmtDate(st.day)}: Stage ${c.stage + 1}: ${CASE_STAGES[c.stage]}.`);
  return {ok:true, msg:`${c.id}: ${CASE_STAGES[c.stage]}.`};
}
function caseAsk(st, id, key) {
  const c = caseById(st, id); if (!c || c.status !== 'open') return {ok:false, msg:'Case not in session.'};
  if (c.asked[key]) return {ok:false, msg:'That question has already been answered.'};
  const isParty = key === 'claimant' || key === 'respondent';
  if (isParty && c.stage < 2) return {ok:false, msg:'Parties may be questioned from the opening statements onward.'};
  if (!isParty && c.stage < 4) return {ok:false, msg:'Witnesses are examined at the witness examination stage.'};
  if (c.stage > 5) return {ok:false, msg:'Questioning has closed.'};
  c.asked[key] = true;
  if (c.opinions) caseDeliberate(st, c);
  return {ok:true};
}
function caseRequestEvidence(st, id) {
  const c = caseById(st, id); if (!c || c.status !== 'open') return {ok:false, msg:'Case not in session.'};
  if (c.stage < 3 || c.stage > 5) return {ok:false, msg:'Additional evidence may be requested during evidence presentation, witness examination or deliberation.'};
  if (c.requestedEvidence) return {ok:false, msg:'Additional evidence has already been ordered.'};
  if (!c.hidden.length) return {ok:false, msg:'No further evidence is known to exist.'};
  c.requestedEvidence = true; addTimer(st, 3, 'caseEvidence', c.id);
  c.log.push(`${fmtDate(st.day)}: The Tribunal ordered production of further evidence (3 days).`);
  return {ok:true, msg:'Further evidence ordered. It will be produced in 3 days.'};
}
function caseDeliberate(st, c) {
  const per = casePerceived(c); const r = staticRng(hashStr(c.id) + Object.keys(c.asked).length + c.revealedHidden.length);
  const valid = c.remedies.filter(m => !m.violates);
  c.opinions = judges(st).map(j => {
    let lean = per * (j.evidence || 1) + (r() - 0.5) * 0.35;
    if (c.crown && j.id === 'orionis') lean -= 0.3; if (c.crown && j.id === 'aurion') lean += 0.25;
    if (j.id === 'elyndor') lean *= 0.6;
    lean = clamp(lean, -1, 1);
    const rec = valid.reduce((b, m) => Math.abs(m.lean - lean) < Math.abs(b.lean - lean) ? m : b, valid[0]);
    const side = lean > 0.25 ? `the evidence favours ${c.claimant.name}` : lean < -0.25 ? `the claim against ${c.respondent.name} is not made out` : 'responsibility is genuinely divided';
    const extra = j.id === 'aurion' && c.remedies.some(m => m.violates) ? ' I will not countenance any remedy that punishes a party not proven at fault.' : j.id === 'kaelith' && rec.cost ? ` The Crown’s share of ${fmtCC(rec.cost)} is proportionate.` : j.id === 'nyxara' && !c.requestedEvidence && c.hidden.length ? ' We have not seen everything. Order the remaining evidence.' : '';
    return {id:j.id, name:j.name, lean, rec:rec.key, text:`${STYLE_OPEN[j.style] || ''}${cap(side)}. I recommend: ${rec.label}.${extra}`};
  });
}
function caseVerdict(st, id, remKey, grounds = [], reasoning = '') {
  const c = caseById(st, id); if (!c || c.status !== 'open') return {ok:false, msg:'Case not in session.'};
  if (c.stage < 5) return {ok:false, msg:'The Tribunal must complete deliberation before a verdict.'};
  const rem = c.remedies.find(m => m.key === remKey); if (!rem) return {ok:false, msg:'Choose a remedy.'};
  if (rem.cost) { const r = spend(st, rem.cost, 'administration', `Tribunal remedy ${c.id}`); if (!r.ok) return r; }
  if (!c.opinions) caseDeliberate(st, c);
  const thor = caseThoroughness(c);
  const agree = c.opinions.filter(o => Math.abs((c.remedies.find(m => m.key === o.rec) || {lean:0}).lean - rem.lean) <= 0.35).length;
  let legit = 3 - 6 * Math.abs(rem.lean - c.truth) + thor * 3 + (grounds.length ? Math.min(grounds.length, 3) * 0.5 : -1) + (reasoning.trim().length > 40 ? 0.5 : 0);
  if (agree >= 8) legit += 1; if (agree <= 3) legit -= 2;
  const notes = [];
  if (rem.violates) { legit -= 8; adjInd(st, 'approval', -3); ['aurion','vespera'].forEach(j => { const ch = charById(st, j); ch.trust = clamp(ch.trust - 8, 0, 100); }); notes.push(`This remedy breaches Constitutional Principle ${rem.violates}: ${PRINCIPLES[rem.violates - 1]}`); }
  legit = Math.round(legit * 10) / 10;
  adjInd(st, 'legitimacy', legit); adjInd(st, 'trust', legit * 0.25); adjInd(st, 'approval', legit * 0.15);
  applyEff(st, rem.eff, `Verdict ${c.id}`);
  if (rem.project) createProject(st, Object.assign(deep(rem.project), {civ:c.claimant.civ}), {free:true, source:c.id});
  if (rem.crownLoss) { adjInd(st, 'efficiency', -1); notes.push('The Crown accepts the Tribunal’s limits on its authority.'); }
  if (rem.strike) { const law = st.laws.find(l => l.id === rem.strike); if (law && law.status !== 'repealed') { law.status = 'struck down'; law.history.push(`${fmtDate(st.day)}: Struck down by the Tribunal in ${c.id}.`); notes.push(`${law.id} is struck down.`); } }
  if (c.fromPetition && rem.lean > 0.3) { const p = st.petitions.find(x => x.id === c.fromPetition); if (p) { applyEff(st, scaleEff(p.project.eff, rem.lean), `Tribunal order on ${p.id}`); p.status = 'granted by Tribunal'; notes.push(`The request in ${p.id} is granted by order of the Tribunal.`); } }
  else if (c.fromPetition) { const p = st.petitions.find(x => x.id === c.fromPetition); if (p) p.status = 'refused by Tribunal'; }
  c.opinions.forEach(o => { const ch = charById(st, o.id); const followed = Math.abs((c.remedies.find(m => m.key === o.rec) || {lean:0}).lean - rem.lean) <= 0.35; remember(st, ch, {ref:c.id, topic:c.title, advice:o.rec, followed}); });
  c.verdict = {remedy:rem.key, label:rem.label, grounds, reasoning, day:st.day, legit, agree, thor:Math.round(thor * 100), notes};
  c.stage = 7; c.status = 'decided';
  st.stats.verdicts++;
  const body = `Verdict in ${c.id}, ${c.title} (${c.subject}). Remedy: ${rem.label}. ${agree} of 12 members of the Tribunal concurred. Thoroughness of examination: ${Math.round(thor * 100)}%. ${grounds.length ? 'Grounds: ' + grounds.map(g => `Principle ${g}`).join(', ') + '. ' : ''}${reasoning ? 'Reasons: ' + reasoning + ' ' : ''}${notes.join(' ')}`;
  archive(st, 'verdict', `Verdict: ${c.title}`, body, c.id);
  makeDoc(st, 'verdict', `Tribunal Verdict ${c.id}`, verdictDoc(st, c, rem), c.id);
  notify(st, `Verdict delivered in ${c.id}`, `${rem.label}. Judicial Legitimacy ${sgn(legit)}.`, legit < 0 ? 'alert' : 'success', {screen:'tribunal', id:c.id});
  brief(st, legit >= 2 ? `The verdict in ${c.title} has been well received. ${agree} of the Twelve concurred, and the parties regard the process as fair.` : legit >= 0 ? `The verdict in ${c.title} stands, though some observers question parts of the reasoning.` : `The verdict in ${c.title} is being questioned across the Cosmos. ${notes[0] || 'Several judges believe the evidence pointed elsewhere.'}`);
  const wrong = Math.abs(rem.lean - c.truth) > 0.8 || rem.violates;
  if ((wrong || thor < 0.3) && rnd(st) < 0.75) addTimer(st, 6, 'caseAppeal', c.id); else addTimer(st, 5, 'caseClose', c.id);
  return {ok:true, msg:`Verdict delivered. Judicial Legitimacy ${sgn(legit)}.`, legit};
}
function verdictDoc(st, c, rem) {
  return `IN THE COSMIC TRIBUNAL\n${c.id} — ${c.title}\n${c.subject}\n\nClaimant: ${c.claimant.name}\nRespondent: ${c.respondent.name}\n\nAllegations: ${c.allegations}\n\nApplicable law: ${c.laws.join('; ')}\n\nThe Tribunal heard the parties, examined ${c.evidence.length + c.revealedHidden.length} items of evidence and ${Object.keys(c.asked).length} answers from parties and witnesses.\n\nORDER: ${rem.label}. ${rem.detail}\n\n${c.verdict.grounds.length ? 'Constitutional grounds: ' + c.verdict.grounds.map(g => `Principle ${g} (${PRINCIPLES[g - 1]})`).join('; ') + '\n\n' : ''}${c.verdict.reasoning ? 'Reasons of the presiding Sovereign: ' + c.verdict.reasoning + '\n\n' : ''}Concurring: ${c.verdict.agree} of 12.\n\nDelivered on ${fmtDate(st.day)}.`;
}
function caseAppealDecision(st, id, decision) {
  const c = caseById(st, id); if (!c || !c.appeal || c.appeal.status !== 'pending') return {ok:false, msg:'No appeal is pending in this case.'};
  const cur = c.remedies.find(m => m.key === c.verdict.remedy);
  const wrong = Math.abs(cur.lean - c.truth) > 0.8 || cur.violates;
  const best = c.remedies.filter(m => !m.violates).reduce((b, m) => Math.abs(m.lean - c.truth) < Math.abs(b.lean - c.truth) ? m : b);
  let msg;
  if (decision === 'review') {
    if (best.key !== cur.key) { applyEff(st, scaleEff({civ:cur.eff.civ}, -0.5), 'Reversal'); applyEff(st, scaleEff({civ:best.eff.civ, ind:best.eff.ind}, 0.7), 'Revised remedy'); c.verdict.revised = best.label; }
    adjInd(st, 'legitimacy', wrong ? 3 : -1.5); msg = best.key !== cur.key ? `Constitutional review substituted: ${best.label}.` : 'Constitutional review confirmed the original verdict.';
  } else if (decision === 'uphold') { adjInd(st, 'legitimacy', wrong ? -3 : 1); msg = 'The original verdict was upheld.'; }
  else { adjInd(st, 'legitimacy', wrong ? -2 : 0); const l = civById(st, c.appeal.by); if (l) l.rel = clamp(l.rel - 5, 0, 100); msg = 'The appeal was dismissed.'; }
  c.appeal.status = decision; c.appeal.result = msg; c.stage = 8; c.status = 'closed';
  archive(st, 'verdict', `Appeal resolved: ${c.title}`, msg, c.id);
  return {ok:true, msg};
}

/* ---------- Crises (EventEngine: emergencies) ---------- */
function crisisChance(st, e, opt, memberId) {
  const T = CRISIS_TPL[e.tpl]; let p = opt.base;
  const m = memberId ? charById(st, memberId) : null;
  if (opt.tag && m && (m.tags || []).includes(opt.tag)) p += 0.22;
  else if (opt.tag && m && (m.tags || []).some(t => T.tags.includes(t))) p += 0.1;
  p += (st.ind.efficiency - 75) / 250;
  if (e.tpl === 'stellar') p += st.research.stellar * 0.15 + (st.flags.lattice ? 0.15 : 0);
  if (e.tpl === 'ecological' || e.tpl === 'tidal') p += st.research.ecology * 0.15;
  st.laws.forEach(l => { if (l.status === 'in force') (l.provisions || []).forEach(pk => { const P = PROVISIONS.find(x => x.key === pk); if (P && P.crisisBonus) p += P.crisisBonus; }); });
  if (st.council.committees.some(cm => T.tags.includes(cm.mandate))) p += 0.08;
  p -= (e.stage - 1) * 0.06;
  return clamp(p, 0.05, 0.95);
}
function memberAvailable(st, m) { return m && m.type === 'council' && !m.sovereign && m.active !== false && (m.busyUntil || 0) <= st.day; }
function crisisRespond(st, id, optKey, memberId) {
  const e = st.events.find(x => x.id === id); if (!e || e.status !== 'active') return {ok:false, msg:'This emergency is no longer active.'};
  const T = CRISIS_TPL[e.tpl]; const opt = T.options.find(o => o.key === optKey); if (!opt) return {ok:false, msg:'Unknown response.'};
  e.actions = (e.actions || 0) + 1;
  if (opt.resolve === 'delay') {
    if (e.monitored[e.stage]) return {ok:false, msg:'Monitoring has already been used at this stage.'};
    e.monitored[e.stage] = true; e.nextEsc += 6; e.log.push(`${fmtDate(st.day)}: Monitoring ordered; escalation delayed.`);
    return {ok:true, msg:'Observatories are tracking the situation. Escalation delayed by 6 days.'};
  }
  let m = null;
  if (opt.tag) { m = charById(st, memberId); if (!memberAvailable(st, m)) return {ok:false, msg:'Choose an available Council member to lead this response.'}; }
  const p = crisisChance(st, e, opt, memberId);
  if (opt.cost) { const r = spend(st, opt.cost, 'emergency', `Emergency response: ${e.title}`, {useReserve:true}); if (!r.ok) return r; }
  if (m) { m.busyUntil = st.day + 10; m.tasks++; }
  const civ = civById(st, e.civ);
  if (rnd(st) < p) {
    if (m) { m.perf = clamp(m.perf + 5, 0, 100); m.trust = clamp(m.trust + 2, 0, 100); }
    const eff = Object.assign({}, opt.eff, {civ:opt.eff.rel ? {[e.civ]:opt.eff.rel} : undefined});
    if (opt.resolve === 'full' || e.stage <= 1) {
      applyEff(st, eff, 'Crisis resolution'); e.status = 'resolved'; e.resolvedDay = st.day; st.stats.crisesResolved++;
      e.log.push(`${fmtDate(st.day)}: Resolved — ${opt.label}${m ? ' led by ' + m.name : ''}.`);
      archive(st, 'event', `Emergency resolved: ${e.title}`, `${opt.label}${m ? ', led by ' + m.name : ''}, succeeded (${Math.round(p * 100)}% estimated).`, e.id);
      notify(st, `Emergency resolved: ${e.title}`, `${opt.label} succeeded.`, 'success', {screen:'emergency'});
      brief(st, `${e.title} is over. ${m ? m.name + '’s' : 'The Crown’s'} response succeeded and ${civ ? civ.name : 'the region'} is safe.`);
      return {ok:true, success:true, msg:`Success: ${e.title} resolved.`};
    }
    applyEff(st, eff, 'Crisis containment'); e.stage--; e.nextEsc = st.day + e.every;
    e.log.push(`${fmtDate(st.day)}: Contained to stage ${e.stage} — ${opt.label}.`);
    return {ok:true, success:true, msg:`Success: the emergency is reduced to stage ${e.stage}.`};
  }
  if (m) m.perf = clamp(m.perf - 3, 0, 100);
  e.nextEsc = Math.max(st.day + 1, e.nextEsc - 3); adjInd(st, 'approval', -0.5);
  e.log.push(`${fmtDate(st.day)}: ${opt.label} failed${m ? ' despite ' + m.name + '’s efforts' : ''}.`);
  notify(st, `Response failed: ${e.title}`, `${opt.label} did not succeed (${Math.round(p * 100)}% estimated). Escalation is closer.`, 'alert', {screen:'emergency'});
  return {ok:true, success:false, msg:`The response failed. Escalation is now due on ${fmtDate(e.nextEsc)}.`};
}
function escalate(st, e) {
  const T = CRISIS_TPL[e.tpl]; const civ = civById(st, e.civ);
  e.stage++;
  if (e.stage > 4) {
    const d = T.cat; applyEff(st, {ind:d.ind, civ:{[e.civ]:d.rel}}, 'Catastrophe'); if (civ && d.pop) civ.pop = Math.max(0.05, Math.round((civ.pop + d.pop) * 100) / 100);
    e.status = 'catastrophe'; e.resolvedDay = st.day; e.log.push(`${fmtDate(st.day)}: Catastrophe.`);
    archive(st, 'event', `Catastrophe: ${e.title}`, `The emergency escalated beyond containment. ${civ ? civ.name + ' suffered grave losses.' : ''}`, e.id);
    notify(st, `Catastrophe: ${e.title}`, 'The emergency could not be contained.', 'alert', {screen:'emergency'});
    brief(st, `Sovereign, I must report a catastrophe. ${e.title} escalated beyond containment. The Cosmos will judge how we respond now.`);
    if (!e.actions) { const o = charById(st, 'orionis'); notify(st, 'Your advisers remember', `Orionis: “I urged action on ${e.title} at the first stage. Nothing was done.”`, 'alert', {screen:'office'}); o.standing = (o.standing || 0) + 1; adjInd(st, 'approval', -2); }
    ENGINE.interrupts.push({type:'catastrophe', id:e.id}); return;
  }
  const d = T.dmg[e.stage - 1];
  if (d) { applyEff(st, {ind:d.ind, civ:{[e.civ]:d.rel}}, 'Escalation'); if (civ && d.pop) civ.pop = Math.max(0.05, Math.round((civ.pop + d.pop) * 100) / 100); }
  e.nextEsc = st.day + e.every;
  e.log.push(`${fmtDate(st.day)}: Escalated to stage ${e.stage}: ${T.stages[e.stage - 1]}`);
  notify(st, `Emergency escalated: ${e.title}`, `Stage ${e.stage} of 4: ${T.stages[e.stage - 1]}`, 'alert', {screen:'emergency'});
  if (e.stage >= 3) { ENGINE.interrupts.push({type:'escalation', id:e.id}); brief(st, `${e.title} has reached stage ${e.stage}. ${T.stages[e.stage - 1]} I advise immediate action.`); }
}

/* ---------- Developments ---------- */
function devResolve(st, id, optKey) {
  const e = st.events.find(x => x.id === id); if (!e || e.status !== 'active') return {ok:false, msg:'This matter has already been settled.'};
  const o = e.options.find(x => x.key === optKey); if (!o) return {ok:false, msg:'Unknown option.'};
  if (o.cost) { const r = spend(st, o.cost, 'diplomacy', `Decision: ${e.title}`); if (!r.ok) return r; }
  if (o.rgCost) { if (st.rg.cash < o.rgCost) return {ok:false, msg:`Rungta Global has only ${fmtUSD(st.rg.cash)} available. Cosmic funds cannot be used for corporate matters.`}; st.rg.cash -= o.rgCost; }
  applyEff(st, o.eff, `Decision: ${e.title}`);
  if (o.char) applyEff(st, {char:o.char});
  if (o.rg) { st.rg.reputation = clamp(st.rg.reputation + (o.rg.reputation || 0), 0, 100); const s = st.rg.subsidiaries.find(x => x.id === e.sub); if (s && o.rg.rating) s.rating = clamp(Math.round((s.rating + o.rg.rating) * 100) / 100, 1, 5); }
  let extra = '';
  switch (o.act) {
    case 'case': { const a = civById(st, e.civ), b = civById(st, e.civ2); const cs = makeCase(st, genericCase(st, `${a.name} v. ${b.name}`, e.title.replace('Resource dispute: ', 'Rights dispute: '), 'Resource allocation conflict', a, b, e.desc, ['Shared Resources Precedent (TRB-H-0007)'])); st.cases.push(cs); extra = ` Case ${cs.id} registered.`; break; }
    case 'case-authority': { const cs = makeCase(st, CASE_TEMPLATES[3](st)); st.cases.push(cs); extra = ` Case ${cs.id} registered.`; break; }
    case 'negotiation': case 'negotiation-strong': { const n = createNegotiation(st, [e.civ, e.civ2], e.title.replace(/^.*?: /, ''), o.act === 'negotiation-strong' ? 30 : 15); extra = ` Negotiation ${n.id} opened.`; break; }
    case 'member': { const c = civById(st, e.civ); c.kind = 'member'; c.status = 'Member Civilisation'; c.contribution = c.contribution || ri(st, 140, 320); extra = ` ${c.name} is now a member civilisation.`; archive(st, 'history', `${c.name} joins the Cosmos`, 'Membership accepted voluntarily by both parties.', c.id); break; }
    case 'member-later': addTimer(st, 90, 'memberCheck', e.civ); extra = ' Observation period of 90 days begun.'; break;
    case 'committee': createCommittee(st, `Joint Committee on Outer Relief`, o.actData.members, 'coordination'); extra = ' Joint committee created.'; break;
    case 'discover': case 'discover-warm': case 'discover-risky': { const c = discoverCiv(st, e.newCiv, o.act); extra = ` ${c.name} added to the Universe Map.`; break; }
    case 'ancient': st.flags.ancientStage = 1; addTimer(st, 20, 'ancient2', null); extra = ' The Archive expects results in 20 days.'; break;
    case 'ancient-spirits': st.flags.ancientStage = 1; addTimer(st, 5, 'ancient2', null); extra = ' The Spirits will answer within days.'; break;
    case 'earth-individual': st.flags.earthCollectiveTried = true; st.petitions.push(makePetition(st, PET_TEMPLATES[6](st))); { const t = PET_TEMPLATES[3](st); if (t.civ === 'earth') st.petitions.push(makePetition(st, t)); } extra = ' Earth’s requests have been registered as individual petitions.'; break;
    case 'fourth-door': { const r = createProject(st, {name:'The Door of Mercy', cat:'infrastructure', cost:1500, duration:120, eff:{ind:{legitimacy:4, approval:3}}, special:'fourthDoor', key:'fourthDoor'}); if (!r.ok) return r; extra = ' Construction has begun.'; break; }
  }
  if (e.tpl === 'earthCollective') st.flags.earthCollectiveTried = true;
  e.status = 'resolved'; e.choice = o.label; e.resolvedDay = st.day;
  archive(st, 'decision', `Decision: ${e.title}`, `${o.label}.${extra}`, e.id);
  return {ok:true, msg:`${o.label}.${extra}`};
}
function discoverCiv(st, name, mode) {
  let c = st.civs.find(x => !x.discovered);
  if (!c) {
    let x, y, tries = 0;
    do { x = ri(st, 200, 2250); y = ri(st, 180, 1450); tries++; } while (tries < 40 && st.civs.some(o => Math.hypot(o.x - x, o.y - y) < 160));
    const gal = GALAXIES.reduce((b, g) => Math.hypot(g.x - x, g.y - y) < Math.hypot(b.x - x, b.y - y) ? g : b);
    c = {id:'civ' + nid(st, 'CIV').slice(4), name, kind:'observer', system:genName(st), galaxy:gal.id, x, y, color:`hsl(${ri(st, 0, 359)} 70% 65%)`, pop:Math.round((rnd(st) * 9 + 0.5) * 10) / 10, gov:pick(st, ['Elected assembly','Hereditary council','Technocratic directorate','Federation of city-states']), culture:pick(st, ['Cautious and curious.','Proud and expansive.','Contemplative and artistic.','Mercantile and pragmatic.']), tech:ri(st, 35, 85), econ:ri(st, 30, 80), resources:[pick(st, ['Rare isotopes','Fertile worlds','Ancient ruins','Gas giants'])], status:'Observer', rel:50, contribution:0, challenges:['Establishing relations with the Cosmos'], dev:{health:ri(st, 40, 80), education:ri(st, 40, 80), infrastructure:ri(st, 40, 80), environment:ri(st, 40, 90)}, discovered:true, generated:true};
    st.civs.push(c);
  }
  c.discovered = true; c.kind = 'observer'; c.status = 'Observer'; if (c.id !== 'choir') c.name = name || c.name;
  c.rel = mode === 'discover-warm' ? 66 : mode === 'discover-risky' ? 45 : 52;
  if (mode === 'discover-risky' && rnd(st) < 0.4) { adjInd(st, 'stability', -2); notify(st, 'First contact unsettles the newcomers', `${c.name} reacted with alarm to the broadcast.`, 'alert', {screen:'map'}); }
  archive(st, 'history', `Discovery: ${c.name}`, `${c.name} has been recorded in the Cosmic Archives as an observer civilisation.`, c.id);
  return c;
}

/* ---------- Diplomacy (DiplomacyEngine) ---------- */
function createNegotiation(st, parties, topic, start = 15, treatyDraft = null) {
  const n = {id:nid(st, 'NEG'), title:topic.length > 60 ? topic.slice(0, 57) + '…' : topic, parties, topic, progress:start, tension:20, round:1, maxRounds:6, nextRound:st.day + 7, stance:'hold', status:'active', log:[`${fmtDate(st.day)}: Negotiations opened.`], treatyDraft};
  st.negotiations.push(n); return n;
}
function negSetStance(st, id, stance) {
  const n = st.negotiations.find(x => x.id === id); if (!n || n.status !== 'active') return {ok:false, msg:'Negotiation not active.'};
  if (!['concede','hold','press','mediate'].includes(stance)) return {ok:false, msg:'Unknown stance.'};
  n.stance = stance; return {ok:true, msg:`Instructions for round ${n.round}: ${stance}.`};
}
function negRound(st, n) {
  let stance = n.stance, dp, dt;
  if (stance === 'concede' && !spend(st, 150, 'diplomacy', `Concession in ${n.id}`).ok) stance = 'hold';
  const r = rnd(st);
  if (stance === 'concede') { dp = 16 + r * 8; dt = -8; }
  else if (stance === 'press') { dp = 8 + r * 18; dt = 12; }
  else if (stance === 'mediate') { dp = 10 + r * 8; dt = -5; adjInd(st, 'efficiency', -0.3); }
  else { dp = 5 + r * 8; dt = 3; }
  dp += st.research.linguistics * 4 + (st.ind.trust - 80) / 10;
  const relAvg = n.parties.reduce((s, id) => s + (civById(st, id) || {rel:60}).rel, 0) / n.parties.length;
  dp += (relAvg - 65) / 15;
  n.progress = clamp(n.progress + dp, 0, 100); n.tension = clamp(n.tension + dt + (rnd(st) - 0.5) * 6, 0, 100);
  n.log.push(`${fmtDate(st.day)}: Round ${n.round} (${stance}) — progress ${Math.round(n.progress)}%, tension ${Math.round(n.tension)}%.`);
  n.round++; n.stance = 'hold'; n.nextRound = st.day + 7;
  const names = n.parties.map(id => civName(st, id)).join(' and ');
  if (n.progress >= 100) {
    n.status = 'concluded';
    n.parties.forEach(id => { const c = civById(st, id); if (c) c.rel = clamp(c.rel + 6, 0, 100); });
    adjInd(st, 'trust', 2); adjInd(st, 'stability', 1); st.stats.treaties++;
    const d = n.treatyDraft;
    const law = enactLaw(st, {type:'treaty', title:d ? d.title : `Treaty: ${n.title}`, text:d ? d.text : `A treaty between ${names}, concluded under the auspices of the Crown at Concord Station, on: ${n.topic}.`, provisions:d ? d.provisions : [], flagged:false});
    n.lawId = law.id;
    notify(st, `Treaty concluded: ${n.title}`, `${names} have agreed terms. Recorded as ${law.id}.`, 'success', {screen:'diplomacy'});
    brief(st, `Negotiations between ${names} have concluded successfully. The treaty is registered as ${law.id}. Elyndor sends particular congratulations.`);
  } else if (n.tension >= 100 || n.round > n.maxRounds) {
    n.status = 'failed';
    n.parties.forEach(id => { const c = civById(st, id); if (c) c.rel = clamp(c.rel - 5, 0, 100); }); adjInd(st, 'trust', -1);
    notify(st, `Negotiations collapsed: ${n.title}`, n.tension >= 100 ? 'Tension became unbearable and the delegations withdrew.' : 'The rounds ran out without agreement.', 'alert', {screen:'diplomacy'});
    archive(st, 'event', `Negotiations failed: ${n.title}`, `Between ${names}.`, n.id);
  }
}
function civAction(st, civId, action) {
  const c = civById(st, civId); if (!c || !c.discovered) return {ok:false, msg:'Civilisation not found.'};
  c.cooldowns = c.cooldowns || {};
  if ((c.cooldowns[action] || -99) > st.day) return {ok:false, msg:`Already done recently. Available again on ${fmtDate(c.cooldowns[action])}.`};
  let msg;
  switch (action) {
    case 'envoy': { const r = spend(st, 120, 'diplomacy', `Envoy to ${c.name}`); if (!r.ok) return r; const d = ri(st, 2, 5); c.rel = clamp(c.rel + d, 0, 100); c.cooldowns.envoy = st.day + 30; msg = `Envoy received by ${c.name}. Relation +${d}.`; break; }
    case 'aid': { const r = spend(st, 800, 'development', `Aid package to ${c.name}`); if (!r.ok) return r; c.rel = clamp(c.rel + 8, 0, 100); adjInd(st, 'trust', 1); adjInd(st, 'approval', 0.5); c.dev.health = clamp(c.dev.health + 3, 0, 100); c.cooldowns.aid = st.day + 60; msg = `Aid package delivered to ${c.name}. Relation +8.`; break; }
    case 'trade': { if (st.negotiations.some(n => n.status === 'active' && n.parties.includes('aurelia') && n.parties.includes(c.id))) return {ok:false, msg:'A negotiation with this civilisation is already open.'}; const n = createNegotiation(st, ['aurelia', c.id], `Trade agreement between the Crown and ${c.name}`, 20); c.cooldowns.trade = st.day + 30; msg = `Trade negotiation ${n.id} opened with ${c.name}.`; break; }
    case 'invite': {
      if (c.id === 'earth') return {ok:false, msg:'Earth remains an independent civilisation under Constitutional Principle 3. The Crown does not invite Earth to surrender that independence.'};
      if (c.kind !== 'observer') return {ok:false, msg:`${c.name} is already a ${c.status.toLowerCase()}.`};
      c.cooldowns.invite = st.day + 60;
      if (rnd(st) < c.rel / 100) { c.kind = 'member'; c.status = 'Member Civilisation'; c.contribution = ri(st, 140, 320); adjInd(st, 'trust', 2); archive(st, 'history', `${c.name} joins the Cosmos`, 'The invitation was accepted voluntarily.', c.id); msg = `${c.name} accepted the invitation and joined the Cosmos.`; }
      else { msg = `${c.name} declined the invitation. Invitations are voluntary; they may reconsider as relations improve.`; }
      break;
    }
    default: return {ok:false, msg:'Unknown diplomatic action.'};
  }
  archive(st, 'decision', `Diplomacy: ${c.name}`, msg, c.id);
  return {ok:true, msg};
}

/* ---------- Laws (LawManager) ---------- */
function lawPrefix(type) { return (LAW_TYPES.find(t => t.key === type) || LAW_TYPES[0]).prefix; }
function reviewDraft(st, d) {
  const flags = []; let cost = 0;
  (d.provisions || []).forEach(pk => { const P = PROVISIONS.find(p => p.key === pk); if (!P) return; cost += P.cost || 0; (P.flags || []).forEach(f => flags.push({principle:f, provision:P.label})); });
  const eff = {ind:{}}; (d.provisions || []).forEach(pk => { const P = PROVISIONS.find(p => p.key === pk); if (P) for (const k in P.oneTime) eff.ind[k] = (eff.ind[k] || 0) + P.oneTime[k]; });
  let yes = 0; const votes = judges(st).map(j => { const s = charScore(j, eff, cost * 6).s - flags.length * (j.principle || 1) * 3 + (j.trust - 70) / 40; const v = s > -0.3; if (v) yes++; return {id:j.id, name:j.name, yes:v}; });
  const ops = [];
  const aur = charById(st, 'aurion'), ves = charById(st, 'vespera'), kae = charById(st, 'kaelith'), arb = charById(st, 'arbiter');
  ops.push({name:aur.name, text:flags.length ? `This draft conflicts with Principle ${[...new Set(flags.map(f => f.principle))].join(', ')}. I cannot endorse it.` : 'I find nothing in this text that offends the Constitution.'});
  ops.push({name:ves.name, text:flags.length ? 'A Crown that writes this law tells the Cosmos its principles are negotiable.' : 'It is a worthy instrument, if implemented with care.'});
  ops.push({name:kae.name, text:cost ? `It will cost ${fmtCC(cost)} each month while in force. Budget for it.` : 'It carries no recurring cost.'});
  ops.push({name:arb.name, text:flags.length ? 'My advice is to amend the draft before enactment. If you enact it as written, expect a constitutional challenge before the Tribunal.' : 'The draft is constitutionally compatible. You may proceed.'});
  return {compatible:!flags.length, flags, cost, yes, no:12 - yes, votes, opinions:ops};
}
function saveDraft(st, d) {
  const title = String(d.title || '').trim().slice(0, 140);
  if (!title) return {ok:false, msg:'Give the instrument a title.'};
  if (!LAW_TYPES.find(t => t.key === d.type)) return {ok:false, msg:'Choose a legal classification.'};
  let draft = d.id ? st.drafts.find(x => x.id === d.id) : null;
  if (!draft) { draft = {id:nid(st, 'DRF'), created:st.day}; st.drafts.unshift(draft); }
  Object.assign(draft, {type:d.type, title, text:String(d.text || '').slice(0, 6000), impl:String(d.impl || '').slice(0, 1000), provisions:(d.provisions || []).filter(k => PROVISIONS.find(p => p.key === k)), target:d.target || null, amends:d.amends || draft.amends || null});
  return {ok:true, draft, msg:`Draft ${draft.id} saved.`};
}
function enactDraft(st, draftId, override) {
  const d = st.drafts.find(x => x.id === draftId); if (!d) return {ok:false, msg:'Draft not found.'};
  if (st.rise && !st.rise.crowned) return {ok:false, msg:'As a candidate you hold no legislative authority. Earn recognition first.'};
  const rv = reviewDraft(st, d);
  if (d.type === 'amend' && rv.yes < 8) return {ok:false, msg:`Constitutional amendments require the support of 8 of the 12 members of the Tribunal. Current support: ${rv.yes}.`};
  if (!rv.compatible && !override) return {ok:false, needsOverride:true, msg:'The constitutional review found conflicts. Confirm the override to enact anyway.'};
  if (d.type === 'treaty') {
    if (!d.target) return {ok:false, msg:'Choose the civilisation with which to negotiate this treaty.'};
    const n = createNegotiation(st, ['aurelia', d.target], d.title, 20, deep(d)); st.drafts = st.drafts.filter(x => x !== d);
    return {ok:true, msg:`Treaty sent to negotiation (${n.id}). It will be enacted if the negotiation succeeds.`};
  }
  const law = enactLaw(st, {type:d.type, title:d.title, text:d.text, impl:d.impl, provisions:d.provisions, flagged:!rv.compatible, amends:d.amends});
  st.drafts = st.drafts.filter(x => x !== d);
  if (!rv.compatible) {
    adjInd(st, 'legitimacy', -6); adjInd(st, 'approval', -3);
    [['aurion', -8], ['vespera', -5]].forEach(([id, v]) => { const ch = charById(st, id); ch.trust = clamp(ch.trust + v, 0, 100); remember(st, ch, {ref:law.id, topic:law.title, advice:'reject', followed:false}); });
    const cs = makeCase(st, {title:`Advocate-General v. The Crown`, subject:`Constitutional review of ${law.id}`, type:'Constitutional disagreement', claimant:{name:'Advocate-General of the Tribunal', civ:null}, respondent:{name:'The Crown', civ:null},
      allegations:`${law.id} “${law.title}” conflicts with Constitutional Principle ${[...new Set(rv.flags.map(f => f.principle))].join(', ')}.`, laws:rv.flags.map(f => `Principle ${f.principle}: ${PRINCIPLES[f.principle - 1]}`),
      argC:'The Constitution binds the Crown. The provisions cannot stand.', argR:'The Sovereign retains final executive authority, and the measures serve the Cosmos.',
      evidence:[{title:'Text of the instrument', desc:'The provisions as enacted.', w:2}, {title:'Constitutional review opinion', desc:'The pre-enactment review found conflicts.', w:1.5}, {title:'Statement of necessity', desc:'The Crown’s explanation of why the measure was needed.', w:-1}],
      hidden:[{title:'Correspondence from member civilisations', desc:'Several civilisations objected formally before enactment.', w:1}],
      witnesses:[{name:'Aurion', role:'Judge of Justice', qs:[{q:'Is the conflict with the Constitution real?', a:'It is unambiguous.', w:1}, {q:'Could the measure be amended to comply?', a:'Yes, by removing the offending provisions.', w:0.5}]}],
      partyQs:{claimant:{q:'What do you ask the Tribunal to do?', a:'Strike down the offending instrument.', w:0.3}, respondent:{q:'Will the Crown accept the ruling?', a:'The Crown is bound by the Constitution and will comply.', w:0.3}},
      remedies:[{key:'strike', label:`Strike down ${law.id}`, detail:'The instrument is void.', lean:1, eff:{ind:{legitimacy:3}}, strike:law.id}, {key:'amend', label:'Order amendment within 30 days', detail:'The Crown must remove the offending provisions.', lean:0.6, eff:{ind:{legitimacy:2}}, strike:law.id}, {key:'uphold', label:'Uphold the instrument', detail:'The instrument stands.', lean:-1, eff:{ind:{trust:-2}}}], truth:0.9});
    st.cases.push(cs);
    notify(st, `Constitutional challenge filed against ${law.id}`, `The Advocate-General has filed ${cs.id}.`, 'alert', {screen:'tribunal', id:cs.id});
  }
  return {ok:true, law, msg:`${law.id} enacted. Implementation period: ${law.implLeft} days.`};
}
function enactLaw(st, o) {
  const T = LAW_TYPES.find(t => t.key === o.type) || LAW_TYPES[0];
  st.counters['LAW-' + T.prefix] = (st.counters['LAW-' + T.prefix] || 0) + 1;
  const id = `${T.prefix}-Y${yearOf(st.day)}-${String(st.counters['LAW-' + T.prefix]).padStart(3, '0')}`;
  const law = {id, type:o.type, title:o.title, text:o.text || '', impl:o.impl || '', provisions:o.provisions || [], issued:st.day, status:'implementing', implLeft:T.impl, flagged:!!o.flagged, amends:o.amends || null, history:[`${fmtDate(st.day)}: Enacted as ${T.label}.`]};
  (law.provisions || []).forEach(pk => { const P = PROVISIONS.find(p => p.key === pk); if (P && P.sunset) law.sunsetAt = st.day + T.impl + P.sunset; });
  if (o.amends) { const old = st.laws.find(l => l.id === o.amends); if (old) { old.status = 'amended'; old.history.push(`${fmtDate(st.day)}: Amended by ${id}.`); } }
  st.laws.push(law); st.stats.lawsEnacted++;
  archive(st, 'law', `${id} ${law.title}`, `${T.label} enacted on ${fmtDate(st.day)}.${law.flagged ? ' Enacted despite constitutional objections.' : ''}`, id);
  makeDoc(st, o.type === 'amend' ? 'amendment' : o.type === 'eo' ? 'order' : 'law', `${id} ${law.title}`, lawDoc(st, law), id);
  return law;
}
function lawDoc(st, law) {
  const T = LAW_TYPES.find(t => t.key === law.type);
  const provs = (law.provisions || []).map((pk, i) => { const P = PROVISIONS.find(p => p.key === pk); return P ? `Article ${i + 1}. ${P.label}. ${P.desc}` : ''; }).join('\n');
  return `${T.label.toUpperCase()}\n${law.id} — ${law.title}\n\nIssued on ${fmtDate(law.issued)} by ${st.canon.sovereign}, ${st.canon.title}.\n\n${law.text || ''}\n\n${provs}\n\nImplementation: ${law.impl || `The Royal Cosmic Council shall implement this instrument within ${T.impl} days.`}\n\nConstitutional compatibility: ${law.flagged ? 'Enacted notwithstanding the objections of the constitutional review.' : 'Compatible with the Constitutional Principles.'}`;
}
function repealLaw(st, id) {
  const l = st.laws.find(x => x.id === id); if (!l) return {ok:false, msg:'Law not found.'};
  if (!['in force','implementing'].includes(l.status)) return {ok:false, msg:`${l.id} is not in force.`};
  if (l.id === 'ACT-0000') return {ok:false, msg:'The Founding Charter cannot be repealed by ordinary instrument.'};
  if (st.rise && !st.rise.crowned) return {ok:false, msg:'As a candidate you hold no legislative authority.'};
  l.status = 'repealed'; l.history.push(`${fmtDate(st.day)}: Repealed.`);
  if (l.flagged) adjInd(st, 'legitimacy', 2); else { adjInd(st, 'stability', -0.5); }
  archive(st, 'law', `${l.id} repealed`, l.title, l.id);
  return {ok:true, msg:`${l.id} repealed.`};
}

/* ---------- Council (CouncilManager) ---------- */
function createCommittee(st, name, members, mandate) {
  name = String(name || '').trim().slice(0, 80);
  if (!name) return {ok:false, msg:'Name the committee.'};
  if (!members || members.length < 2) return {ok:false, msg:'A committee needs at least two members.'};
  const c = {id:nid(st, 'COM'), name, members:members.slice(0, 6), mandate:mandate || 'coordination', created:st.day};
  st.council.committees.push(c); adjInd(st, 'efficiency', 0.5);
  return {ok:true, msg:`${name} established.`};
}
function createDepartment(st, name, head) {
  name = String(name || '').trim().slice(0, 80);
  if (!name) return {ok:false, msg:'Name the department.'};
  if (st.council.departments.some(d => d.name.toLowerCase() === name.toLowerCase())) return {ok:false, msg:'A department with that name already exists.'};
  const h = charById(st, head); if (!h || h.type !== 'council') return {ok:false, msg:'Choose a head from the Council.'};
  st.council.departments.push({id:nid(st, 'DEP'), name, head});
  const n = st.council.departments.length; adjInd(st, 'efficiency', n <= 12 ? 1 : -1.5);
  return {ok:true, msg:n <= 12 ? `${name} created under ${h.name}.` : `${name} created. Warning: the Council now has ${n} departments and bureaucracy is slowing it down.`};
}
function assignDept(st, charId, deptId) {
  const m = charById(st, charId), d = st.council.departments.find(x => x.id === deptId);
  if (!m || !d) return {ok:false, msg:'Choose a member and department.'};
  d.head = m.id; m.dept = d.name; m.position = `Head, ${d.name}`; m.trust = clamp(m.trust + 1, 0, 100);
  return {ok:true, msg:`${m.name} now leads ${d.name}.`};
}
function vacantSeats(st) { return st.council.seats - councilMembers(st).length; }
function appointMember(st, candName, deptName) {
  if (vacantSeats(st) <= 0) return {ok:false, msg:'There are no vacant seats. Amend the Council structure to add seats.'};
  const c = COUNCIL_CANDIDATES.find(x => x.name === candName); if (!c) return {ok:false, msg:'Candidate not found.'};
  if (st.chars.some(x => x.name === c.name)) return {ok:false, msg:`${c.name} already serves.`};
  const id = 'cm' + nid(st, 'CMB').slice(4);
  const ch = Object.assign(deep(c), {id, type:'council', style:pick(st, ['Composed','Measured','Direct','Warm']), memory:[], perf:65, tasks:0, busyUntil:0, trust:72, dept:deptName || 'Unassigned', position:c.role, established:false, appointed:st.day, standing:0});
  st.chars.push(ch);
  if (deptName) { const d = st.council.departments.find(x => x.name === deptName); if (d) d.head = id; else st.council.departments.push({id:nid(st, 'DEP'), name:deptName, head:id}); }
  adjInd(st, 'efficiency', 1.5);
  archive(st, 'decision', `Appointment: ${c.name}`, `${c.name} appointed to the Royal Cosmic Council as ${c.role}.`, id);
  makeDoc(st, 'certificate', `Appointment of ${c.name}`, `By authority of the Crown, ${c.name} is appointed to the Royal Cosmic Council as ${c.role}${deptName ? ', with responsibility for ' + deptName : ''}.\n\nAbility recognised: ${c.ability}.\n\nUNITED UNDER THE CROWN.\n\nGiven on ${fmtDate(st.day)}.`, id);
  return {ok:true, msg:`${c.name} appointed to the Council.`};
}
function relieveMember(st, id) {
  const m = charById(st, id); if (!m || m.type !== 'council' || m.sovereign) return {ok:false, msg:'Member not found.'};
  if (m.established) return {ok:false, msg:`${m.name} holds an established seat recognised at the founding of the Crowned Era. Reassign responsibilities instead.`};
  m.active = false; st.council.departments.forEach(d => { if (d.head === id) d.head = 'tarush'; }); adjInd(st, 'efficiency', -1);
  archive(st, 'decision', `${m.name} relieved of Council duties`, '', id);
  return {ok:true, msg:`${m.name} has left the Council.`};
}
function memberReport(st, id) {
  const m = charById(st, id); if (!m) return {ok:false, msg:'Member not found.'};
  const lines = [];
  const tags = m.tags || [];
  const crises = st.events.filter(e => e.kind === 'crisis' && e.status === 'active');
  if (tags.some(t => ['security','portal','evacuation'].includes(t))) lines.push(`Security posture: stability at ${fmt(st.ind.stability)}. ${crises.length} active emergencies. Portal network ${crises.length > 1 ? 'under strain' : 'nominal'}.`);
  if (tags.some(t => ['stellar','energy'].includes(t))) lines.push(`Stellar Engineering at level ${st.research.stellar}. ${crises.filter(e => e.tpl === 'stellar').map(e => `${e.title}: stage ${e.stage}`).join('; ') || 'No active stellar emergencies.'}`);
  if (tags.some(t => ['environment','ecology','tidal','ocean'].includes(t))) lines.push(`Environmental Health at ${fmt(st.ind.environment)}. The environment budget is ${fmtCC(st.treasury.budget.environment)} per month against a baseline of ${fmtCC(550)}.`);
  if (tags.some(t => ['rapid','logistics','supply','coordination'].includes(t))) lines.push(`Council efficiency at ${fmt(st.ind.efficiency)}. ${st.projects.filter(p => p.status === 'active').length} projects active. Project speed ${Math.round(projectRate(st) * 100)}% of standard.`);
  if (tags.some(t => ['reconstruction','storm'].includes(t))) lines.push(`Infrastructure budget ${fmtCC(st.treasury.budget.infrastructure)} per month. Grid and reconstruction crews ready.`);
  if (!lines.length) lines.push(`Department operating normally. ${st.projects.filter(p => p.status === 'active').length} projects across the Council.`);
  const busy = m.busyUntil > st.day ? ` I am currently deployed until ${fmtDate(m.busyUntil)}.` : ' I am available for deployment.';
  const mood = m.trust >= 80 ? 'I serve with full confidence in the Crown.' : m.trust >= 60 ? 'I serve faithfully, though I would welcome more of my recommendations being heard.' : 'I must say plainly that I feel my counsel is rarely heeded.';
  const body = `Report of ${m.name}, ${m.role}\nDepartment: ${m.dept}\nDate: ${fmtDate(st.day)}\n\n${lines.join('\n\n')}\n\n${mood}${busy}`;
  makeDoc(st, 'report', `Report: ${m.name}`, body, m.id);
  m.trust = clamp(m.trust + 0.5, 0, 100);
  return {ok:true, msg:`${m.name} submitted a report.`, body};
}
function reviewMember(st, id, action) {
  const m = charById(st, id); if (!m) return {ok:false, msg:'Member not found.'};
  if (action === 'commend') { if ((m.lastCommend || -99) > st.day - 30) return {ok:false, msg:`${m.name} was commended recently.`}; m.lastCommend = st.day; m.trust = clamp(m.trust + 4, 0, 100); m.perf = clamp(m.perf + 2, 0, 100); return {ok:true, msg:`${m.name} has been commended.`}; }
  if (action === 'guidance') { m.perf = clamp(m.perf + 4, 0, 100); m.trust = clamp(m.trust - 2, 0, 100); return {ok:true, msg:`Guidance issued to ${m.name}. Performance should improve; ${m.name} took it soberly.`}; }
  return {ok:false, msg:'Unknown review action.'};
}
function setDelegation(st, cls, memberId) {
  if (!memberId) { delete st.council.delegations[cls]; return {ok:true, msg:`Authority over ${cls} petitions returned to the Sovereign.`}; }
  const m = charById(st, memberId); if (!m || m.type !== 'council' || m.sovereign) return {ok:false, msg:'Choose a Council member.'};
  st.council.delegations[cls] = memberId; return {ok:true, msg:`${m.name} may now decide Low and Moderate urgency ${cls} petitions.`};
}
function amendStructure(st, o) {
  const seats = Number(o.seats);
  if (!Number.isInteger(seats) || seats < councilMembers(st).length || seats > 20) return {ok:false, msg:`Seats must be a whole number between ${councilMembers(st).length} (current members) and 20.`};
  st.council.seats = seats; if (o.quorum) st.council.quorum = o.quorum; if (o.chair) st.council.chair = o.chair;
  archive(st, 'decision', 'Council structure amended', `Seats: ${seats}. Quorum: ${st.council.quorum}. Chair: ${st.council.chair}.`, 'COUNCIL');
  return {ok:true, msg:'Council structure amended.'};
}
function meetingAgenda(st) {
  const items = [];
  st.events.filter(e => e.status === 'active').forEach(e => items.push({ref:e.id, kind:e.kind, title:e.title}));
  st.petitions.filter(p => p.status === 'pending').slice(0, 6).forEach(p => items.push({ref:p.id, kind:'petition', title:`${p.id}: ${p.title}`}));
  return items;
}
function meetingOpinions(st, ref) {
  const members = councilMembers(st).filter(m => !m.sovereign && (m.busyUntil || 0) <= st.day);
  const ev = st.events.find(e => e.id === ref), p = st.petitions.find(x => x.id === ref);
  let options = [];
  if (ev && ev.kind === 'crisis') options = CRISIS_TPL[ev.tpl].options.map(o => ({key:o.key, label:o.label, eff:Object.assign({}, o.eff, {ind:Object.assign({stability:2}, o.eff.ind || {})}), cost:o.cost, tag:o.tag}));
  else if (ev) options = ev.options.map(o => ({key:o.key, label:o.label, eff:o.eff, cost:o.cost || 0}));
  else if (p) options = [{key:'approve', label:'Approve', eff:p.project.eff, cost:p.cost}, {key:'conditions', label:'Approve with conditions', eff:scaleEff(p.project.eff, 0.8), cost:p.cost * 0.75}, {key:'reject', label:'Reject', eff:p.rejectEff, cost:0}, {key:'info', label:'Request further information', eff:{}, cost:0}];
  return {options, opinions:members.map(m => {
    let best = options[0], bs = -1e9;
    options.forEach(o => { let s = charScore(m, o.eff, o.cost).s; if (o.tag && (m.tags || []).includes(o.tag)) s += 1.2; if (o.key === 'monitor') s -= 0.5; if (o.key === 'info' && p) s = (p.hidden ? p.hidden.chance : 0) * 3 - 0.3; s += (staticRng(hashStr(m.id + o.key + st.day))() - 0.5) * 0.4; if (s > bs) { bs = s; best = o; } });
    const own = best.tag && (m.tags || []).includes(best.tag);
    return {id:m.id, name:m.name, rec:best ? best.key : null, text:`${STYLE_OPEN[m.style] || ''}I recommend: ${best ? best.label : '—'}.${own ? ' I can lead this myself.' : ''}`};
  })};
}
function adoptMeeting(st, ref, key) {
  const {opinions} = meetingOpinions(st, ref);
  const ev = st.events.find(e => e.id === ref), p = st.petitions.find(x => x.id === ref);
  let r;
  if (ev && ev.kind === 'crisis') {
    const opt = CRISIS_TPL[ev.tpl].options.find(o => o.key === key);
    let mem = null;
    if (opt && opt.tag) { const cands = councilMembers(st).filter(m => memberAvailable(st, m)); mem = cands.find(m => (m.tags || []).includes(opt.tag)) || cands[0]; if (!mem) return {ok:false, msg:'No Council member is available to lead this response.'}; }
    r = crisisRespond(st, ref, key, mem ? mem.id : null);
  } else if (ev) r = devResolve(st, ref, key);
  else if (p) r = petAction(st, ref, key);
  else return {ok:false, msg:'Agenda item not found.'};
  if (!r.ok) return r;
  opinions.forEach(o => remember(st, charById(st, o.id), {ref:ref + ':council', topic:'Council meeting', advice:o.rec, followed:o.rec === key}));
  adjInd(st, 'efficiency', 0.5);
  const item = ev ? ev.title : p.title;
  makeDoc(st, 'minutes', `Council minutes, ${fmtDate(st.day)}`, `MINUTES OF THE ROYAL COSMIC COUNCIL\nConvened by the Sovereign in emergency session on ${fmtDate(st.day)}.\nQuorum: ${st.council.quorum}. Chair: ${st.council.chair}.\n\nAgenda: ${item}\n\nMembers heard:\n${opinions.map(o => `— ${o.name}: ${o.text}`).join('\n')}\n\nResolution adopted: ${key}. ${r.msg}\n\nUNITED UNDER THE CROWN.`, ref);
  return {ok:true, msg:`Council resolution adopted. ${r.msg}`};
}
function genRecommendation(st) {
  const ms = councilMembers(st).filter(m => !m.sovereign); if (!ms.length) return;
  if (st.council.recommendations.filter(r => r.status === 'pending').length >= 4) return;
  const m = pick(st, ms); const v = m.values || {};
  const topKey = Object.keys(v).sort((a, b) => v[b] - v[a])[0] || 'efficiency';
  const map = {environment:'environment', education:'education', science:'research', stability:'infrastructure', efficiency:'administration', trust:'diplomacy', approval:'healthcare', treasury:null, legitimacy:'administration'};
  const cat = map[topKey];
  let rec;
  if (cat && chance(st, 0.6)) { const amt = ri(st, 1, 3) * 50; rec = {kind:'budget', cat, amt, text:`Increase the ${BUDGET_CATS.find(b => b.key === cat).label} budget by ${fmtCC(amt)} per month.`}; }
  else { const opts = MAJOR_PROJECTS.filter(pj => !st.projects.some(x => x.key === pj.key && x.status === 'active') && !(pj.req && st.research[pj.req.track] < pj.req.lvl)); const pj = opts.length ? pick(st, opts) : null; if (pj) rec = {kind:'project', key:pj.key, text:`Finance the ${pj.name} (${fmtCC(pj.cost)}).`}; else { const t = pick(st, RESEARCH_TRACKS); rec = {kind:'research', track:t.key, text:`Fund the next level of ${t.name}.`}; } }
  st.council.recommendations.unshift(Object.assign({id:nid(st, 'REC'), from:m.id, day:st.day, status:'pending'}, rec));
  notify(st, `Recommendation from ${m.name}`, rec.text, 'info', {screen:'council'});
}
function decideRecommendation(st, id, accept) {
  const r = st.council.recommendations.find(x => x.id === id); if (!r || r.status !== 'pending') return {ok:false, msg:'Recommendation not pending.'};
  const m = charById(st, r.from); let res = {ok:true, msg:''};
  if (accept) {
    if (r.kind === 'budget') res = setBudget(st, r.cat, st.treasury.budget[r.cat] + r.amt);
    else if (r.kind === 'project') { const pj = MAJOR_PROJECTS.find(x => x.key === r.key); res = createProject(st, Object.assign(deep(pj), {key:pj.key})); }
    else if (r.kind === 'research') res = fundResearch(st, r.track);
    if (!res.ok) return res;
    r.status = 'accepted'; remember(st, m, {ref:r.id, topic:r.text, advice:'act', followed:true});
    return {ok:true, msg:`Accepted: ${r.text}`};
  }
  r.status = 'rejected'; remember(st, m, {ref:r.id, topic:r.text, advice:'act', followed:false}); m.trust = clamp(m.trust - 1, 0, 100);
  return {ok:true, msg:`Recommendation from ${m.name} declined.`};
}

/* ---------- Research, Education, Earth ---------- */
function researchCost(st, track) { const lvl = st.research[track] + 1; return {lvl, cost:900 * lvl, duration:50 + 25 * lvl}; }
function fundResearch(st, track) {
  const t = RESEARCH_TRACKS.find(x => x.key === track); if (!t) return {ok:false, msg:'Unknown research track.'};
  if (st.research[track] >= 5) return {ok:false, msg:`${t.name} is fully researched.`};
  if (st.projects.some(p => p.special === 'research' && p.track === track && p.status === 'active')) return {ok:false, msg:`${t.name} research is already under way.`};
  const c = researchCost(st, track);
  return createProject(st, {name:`${t.name} ${['I','II','III','IV','V'][c.lvl - 1]}`, cat:'research', cost:c.cost, duration:c.duration, eff:{}, special:'research', track, lvl:c.lvl});
}
function eduExpand(st, name, civId) {
  name = String(name || '').trim().slice(0, 100); if (!name) return {ok:false, msg:'Name the institution.'};
  const c = civById(st, civId); if (!c || !c.discovered) return {ok:false, msg:'Choose a civilisation.'};
  if (c.rel < 40) return {ok:false, msg:`${c.name} has not consented to a new institution. Relations must be 40 or higher.`};
  const cost = Math.round(700 * (1 - 0.1 * st.research.pedagogy));
  return createProject(st, {name:`COSMOS–EDU Partner: ${name}`, cat:'education', cost, duration:50, eff:{ind:{education:2}, civ:{[civId]:4}}, special:'eduinst', inst:{name, civ:civId}, civ:civId});
}
function setScholarships(st, n) { n = Number(n); if (!Number.isInteger(n) || n < 0 || n > 20000) return {ok:false, msg:'Scholarships must be a whole number from 0 to 20,000.'}; st.edu.scholarships = n; return {ok:true, msg:`COSMOS–EDU scholarships set to ${fmt(n)}.`}; }
function eduPartner(st, partner) {
  const list = ['Lumen Archive','Academy of the Crown','Veyari Crystal Libraries','Thalassine Song Schools'];
  if (!list.includes(partner)) return {ok:false, msg:'Unknown partner.'};
  if (st.edu.partnerships.includes(partner)) return {ok:false, msg:`${partner} is already a partner.`};
  const r = spend(st, 200, 'education', `COSMOS–EDU partnership: ${partner}`); if (!r.ok) return r;
  st.edu.partnerships.push(partner); adjInd(st, 'education', 1); adjInd(st, 'science', 0.5);
  return {ok:true, msg:`${partner} is now a COSMOS–EDU partner.`};
}
function earthAction(st, action) {
  const e = civById(st, 'earth');
  const consent = () => e.rel >= 40 || rnd(st) < e.rel / 60;
  switch (action) {
    case 'visit': { if (st.timers.some(t => t.kind === 'visitDone')) return {ok:false, msg:'An official visit is already under way.'}; const r = spend(st, 150, 'diplomacy', 'Official visit to Earth'); if (!r.ok) return r; addTimer(st, 5, 'visitDone', 'earth'); makeDoc(st, 'invitation', 'Notice of Official Visit to Earth', `The Sovereign of the Cosmos will make an official visit to Earth, at the invitation of its peoples and with full respect for the independence of its nations.\n\nThe visit will honour the COSMOS–EDU pilot at Dhirubhai Ambani International School and meet Earth’s scientific and environmental partners.\n\nGiven on ${fmtDate(st.day)}.`, 'EARTH'); return {ok:true, msg:'The official visit to Earth has begun. It will conclude in 5 days.'}; }
    case 'delegation': { const r = spend(st, 100, 'diplomacy', 'Earth delegation received'); if (!r.ok) return r; e.rel = clamp(e.rel + 3, 0, 100); adjInd(st, 'trust', 0.5); st.earth.delegations++; makeDoc(st, 'invitation', 'Royal Invitation to the Representatives of Earth', `The Crown invites the representatives of Earth to the Cosmic Tribunal at Aurelia, to be received with the honours due to an independent civilisation.\n\nGiven on ${fmtDate(st.day)}.`, 'EARTH'); archive(st, 'decision', 'Earth delegation received at Aurelia', '', 'EARTH'); return {ok:true, msg:'Representatives of Earth were received at the Tribunal. Earth relation +3.'}; }
    case 'science': if (!consent()) return {ok:true, msg:'Earth’s governments declined the proposal for now. Earth is independent and may refuse.'}; return createProject(st, {name:'Earth Scientific Cooperation Programme', cat:'research', cost:600, duration:60, eff:{ind:{science:1}, civ:{earth:6}}, special:'earthSci', civ:'earth', key:'earthSci'});
    case 'environment': if (!consent()) return {ok:true, msg:'Earth’s governments declined the proposal for now.'}; return createProject(st, {name:'Earth Environmental Assistance', cat:'environment', cost:900, duration:90, eff:{ind:{environment:2}, civ:{earth:8}}, special:'earthEnv', civ:'earth', key:'earthEnv'});
    case 'exchange': { const r = spend(st, 200, 'education', 'Earth educational exchange'); if (!r.ok) return r; e.rel = clamp(e.rel + 3, 0, 100); adjInd(st, 'education', 1); st.earth.exchanges++; e.dev.education = clamp(e.dev.education + 1, 0, 100); return {ok:true, msg:'Educational exchange completed: 300 students from Earth and the Cosmos exchanged places.'}; }
  }
  return {ok:false, msg:'Unknown action.'};
}
function earthCollectiveStatus(st) { const y = yearOf(st.day); const next = st.canon.earthNextCollective; return {eligible:y >= next, next, yearsLeft:Math.max(0, next - y)}; }

/* ---------- Rungta Global (separate Earthly finances, USD millions) ---------- */
function rgExecMult(st) { const s = st.rg.executives.reduce((a, e) => a + e.skill, 0) / st.rg.executives.length; return 0.85 + s / 500; }
function rgMonthly(st) {
  const R = st.rg; let rev = 0, profit = 0;
  R.subsidiaries.forEach(s => { const r = s.units * s.rev * (s.rating / 4.5) * (R.reputation / 80) * rgExecMult(st); rev += r; profit += r * s.margin; s.lastRev = Math.round(r * 10) / 10; });
  R.cash = Math.round((R.cash + profit) * 10) / 10;
  R.hist.push({day:st.day, revenue:Math.round(rev), profit:Math.round(profit), cash:Math.round(R.cash)}); if (R.hist.length > 48) R.hist.shift();
  R.reputation = clamp(R.reputation + (82 - R.reputation) * 0.03, 0, 100);
  R.subsidiaries.forEach(s => { s.rating = clamp(Math.round((s.rating + (4.5 - s.rating) * 0.03) * 100) / 100, 1, 5); });
  if (st.day - R.lastReport >= 90) { R.lastReport = st.day; const q = R.hist.slice(-3); const qr = q.reduce((a, h) => a + h.revenue, 0), qp = q.reduce((a, h) => a + h.profit, 0); makeDoc(st, 'report', `Rungta Global quarterly report`, rgReport(st, qr, qp), 'RG'); notify(st, 'Rungta Global quarterly results', `Revenue ${fmtUSD(qr)}, profit ${fmtUSD(qp)}, cash ${fmtUSD(R.cash)}.`, 'info', {screen:'rungta'}); }
}
function rgReport(st, qr, qp) {
  const R = st.rg;
  return `RUNGTA GLOBAL — FINANCIAL REPORT\nFounder and Chairman: ${st.canon.sovereign}\nHeadquarters: ${R.hq}\nDate: ${fmtDate(st.day)}\n\nQuarter revenue: ${fmtUSD(qr)}\nQuarter profit: ${fmtUSD(qp)}\nCash position: ${fmtUSD(R.cash)}\nReputation index: ${fmt(R.reputation)}/100\nMarkets: ${R.markets.join(', ')}\n\nSubsidiaries:\n${R.subsidiaries.map(s => `— ${s.name}: ${s.units} ${s.unitLabel}, rating ${s.rating.toFixed(2)}, monthly revenue ${fmtUSD(s.lastRev || 0)}`).join('\n')}\n\nRungta Global’s finances are held entirely separately from the Cosmic Treasury.`;
}
const RG_AGENDA = [
  {key:'tie5', label:'Open five new India Express restaurants', cost:90, days:60, sub:'tie', units:5},
  {key:'hotel', label:'Open a new luxury hotel', cost:140, days:180, sub:'hosp', units:1},
  {key:'brand', label:'Launch a new culinary brand', cost:45, days:75, sub:'culinary', units:1},
  {key:'invest', label:'Acquire two new business investments', cost:100, days:30, sub:'capital', units:2},
  {key:'tech', label:'Launch a new technology product line', cost:60, days:90, sub:'tech', units:1},
  {key:'dividend', label:'Declare a shareholder dividend ($100M)', cost:100, days:0}
];
function rgBoard(st, key, market) {
  const R = st.rg; const a = RG_AGENDA.find(x => x.key === key);
  if (key === 'intl') {
    if (!R.expansionTargets.includes(market)) return {ok:false, msg:'Choose a target market.'};
    if (R.cash < 220) return {ok:false, msg:`International expansion needs $220M. Rungta Global has ${fmtUSD(R.cash)}. Cosmic funds cannot be used.`};
    R.cash -= 220; R.projects.push({id:nid(st, 'RGP'), label:`International expansion: ${market}`, end:st.day + 120, intl:market}); R.expansionTargets = R.expansionTargets.filter(m => m !== market);
    R.board.unshift({day:st.day, text:`Board approved expansion into ${market} ($220M).`}); return {ok:true, msg:`Expansion into ${market} approved. Completion in 120 days.`};
  }
  if (!a) return {ok:false, msg:'Unknown agenda item.'};
  if (R.cash < a.cost) return {ok:false, msg:`The board cannot approve this: it costs ${fmtUSD(a.cost)} and Rungta Global has ${fmtUSD(R.cash)}. Cosmic funds cannot be used for Rungta Global.`};
  R.cash -= a.cost;
  if (key === 'dividend') { R.reputation = clamp(R.reputation + 1, 0, 100); R.board.unshift({day:st.day, text:'Board declared a $100M dividend.'}); return {ok:true, msg:'Dividend declared.'}; }
  R.projects.push({id:nid(st, 'RGP'), label:a.label, end:st.day + a.days, sub:a.sub, units:a.units});
  R.board.unshift({day:st.day, text:`Board approved: ${a.label} (${fmtUSD(a.cost)}).`});
  return {ok:true, msg:`Approved: ${a.label}. Completion in ${a.days} days.`};
}
function rgAppoint(st, role, cand) {
  const e = st.rg.executives.find(x => x.role === role), c = RG_CANDIDATES.find(x => x.name === cand);
  if (!e || !c) return {ok:false, msg:'Choose a role and candidate.'};
  if (st.rg.executives.some(x => x.name === c.name)) return {ok:false, msg:`${c.name} already holds a role.`};
  const old = e.name; e.name = c.name; e.skill = c.skill; st.rg.board.unshift({day:st.day, text:`${c.name} appointed ${role}, succeeding ${old}.`});
  return {ok:true, msg:`${c.name} appointed ${role}.`};
}

/* ---------- Hidden Verdict: the Ancient Spirits ---------- */
function consultSpirits(st, ref) {
  if (st.day - st.flags.spiritsLast < 30) return {ok:false, msg:`The Spirits answer once each month. Next audience: ${fmtDate(st.flags.spiritsLast + 30)}.`};
  st.flags.spiritsLast = st.day; adjInd(st, 'legitimacy', -0.5); const a = charById(st, 'aurion'); a.trust = clamp(a.trust - 1, 0, 100);
  const c = caseById(st, ref), p = st.petitions.find(x => x.id === ref);
  let text;
  if (c) text = c.truth > 0.3 ? `The Spirits murmur that the truth in ${c.id} lies with ${c.claimant.name}.` : c.truth < -0.3 ? `The Spirits murmur that ${c.respondent.name} has been wronged by the accusation in ${c.id}.` : `The Spirits say that in ${c.id} the fault is shared.`;
  else if (p) { p.riskRevealed = true; text = p.hidden ? `The Spirits reveal a hidden matter in ${p.id}: ${p.hidden.text}` : `The Spirits see nothing hidden in ${p.id}.`; }
  else text = 'The Spirits speak of a door not yet built, and of mercy not yet given form.';
  archive(st, 'history', 'Audience with the Ancient Spirits', text, ref || 'SPIRITS');
  return {ok:true, msg:text};
}

/* ---------- Rise to the Throne ---------- */
function riseStatus(st) {
  const js = judges(st); const jEnd = js.filter(j => j.trust >= 70).length;
  const ms = st.civs.filter(c => c.discovered && (c.kind === 'member' || c.kind === 'capital')); const cEnd = ms.filter(c => c.rel >= 60).length;
  return {jEnd, jTotal:js.length, cEnd, cTotal:ms.length, ready:jEnd === js.length && cEnd === ms.length};
}
function petitionRecognition(st) {
  if (!st.rise || st.rise.crowned) return {ok:false, msg:'You already hold the Throne.'};
  const s = riseStatus(st);
  if (!s.ready) return {ok:false, msg:`Recognition must be unanimous. Endorsements: ${s.jEnd}/${s.jTotal} members of the Tribunal, ${s.cEnd}/${s.cTotal} member civilisations.`};
  st.rise.crowned = true; st.rise.day = st.day; adjInd(st, 'approval', 10); adjInd(st, 'legitimacy', 5);
  archive(st, 'history', 'Recognition of the Sovereign', `Following unanimous recognition by the member civilisations and the Twelve, ${st.canon.sovereign} was elevated to Sovereign of the Cosmos on ${fmtDate(st.day)}.`, 'TRB-H-0001');
  makeDoc(st, 'proclamation', 'Proclamation of Recognition', `Be it known across every world: ${st.canon.sovereign}, having earned the unanimous recognition of the member civilisations and the Twelve, is elevated to ${st.canon.title}.\n\nThe Constellation Crown, the Cosmic Staff and the Central Cosmic Throne are entrusted to the Sovereign, under the Constitution.\n\nUNITED UNDER THE CROWN.\n\nGiven on ${fmtDate(st.day)}.`, 'TRB-H-0001');
  grantAchievement(st, 'crowned');
  brief(st, 'Sovereign. The Twelve rise for you. The member civilisations have spoken with one voice. The Throne is yours, and so is the responsibility.');
  return {ok:true, msg:'You have been recognised as Sovereign of the Cosmos.'};
}

/* ---------- Achievements ---------- */
const ACHIEVEMENTS = [
  {key:'first_verdict', name:'First Ruling', desc:'Deliver your first Tribunal verdict.', test:st => st.stats.verdicts >= 1},
  {key:'builder', name:'Builder of Worlds', desc:'Complete five projects.', test:st => st.stats.projectsDone >= 5},
  {key:'peacemaker', name:'Peacemaker', desc:'Conclude three treaties.', test:st => st.stats.treaties >= 3},
  {key:'teacher', name:'Teacher of Worlds', desc:'Have ten COSMOS–EDU institutions.', test:st => st.edu.institutions.length >= 10},
  {key:'balanced', name:'Balanced Books', desc:'Run twelve months in surplus.', test:st => st.stats.positiveMonths >= 12},
  {key:'guardian', name:'Guardian of the Cosmos', desc:'Resolve five emergencies.', test:st => st.stats.crisesResolved >= 5},
  {key:'lawgiver', name:'Lawgiver', desc:'Enact five instruments.', test:st => st.stats.lawsEnacted >= 5},
  {key:'mercy', name:'The Fourth Door', desc:'Build the Door of Mercy.', test:st => st.flags.fourthDoor},
  {key:'crowned', name:'Unanimous', desc:'Earn recognition in Rise to the Throne.', test:st => st.rise && st.rise.crowned}
];
function grantAchievement(st, key) {
  if (st.meta.creative || st.achievements[key]) return;
  const a = ACHIEVEMENTS.find(x => x.key === key); if (!a) return;
  st.achievements[key] = st.day; notify(st, `Achievement: ${a.name}`, a.desc, 'success', {screen:'office'});
}
function checkAchievements(st) { ACHIEVEMENTS.forEach(a => { if (a.test(st)) grantAchievement(st, a.key); }); }

/* ---------- Creative Mode editor ---------- */
function creativeGuard(st) { if (st.meta.mode !== 'creative') return {ok:false, msg:'The World Editor is only available in Creative Mode campaigns.'}; st.meta.creative = true; return null; }
function creativeCiv(st, f) {
  const g = creativeGuard(st); if (g) return g;
  const name = String(f.name || '').trim().slice(0, 60); if (!name) return {ok:false, msg:'Name the civilisation.'};
  const c = discoverCiv(st, name, 'discover'); c.generated = true; c.name = name;
  if (f.kind === 'member') { c.kind = 'member'; c.status = 'Member Civilisation'; c.contribution = Math.max(0, Math.min(2000, Number(f.contribution) || 200)); }
  c.gov = String(f.gov || c.gov).slice(0, 80); c.culture = String(f.culture || c.culture).slice(0, 200); c.pop = Math.max(0.01, Math.min(500, Number(f.pop) || c.pop));
  return {ok:true, msg:`${name} created.`};
}
function creativeChar(st, f) {
  const g = creativeGuard(st); if (g) return g;
  const name = String(f.name || '').trim().slice(0, 60); if (!name) return {ok:false, msg:'Name the character.'};
  if (vacantSeats(st) <= 0) st.council.seats++;
  const id = 'cm' + nid(st, 'CMB').slice(4);
  st.chars.push({id, type:'council', name, role:String(f.role || 'Councillor').slice(0, 60), ability:String(f.ability || 'Unspecified').slice(0, 80), tags:[f.tag || 'coordination'], values:{[f.value || 'efficiency']:1.4}, personality:String(f.personality || 'Newly created.').slice(0, 160), dept:'Unassigned', style:'Composed', memory:[], perf:70, tasks:0, busyUntil:0, trust:75, established:false, standing:0, position:String(f.role || 'Councillor')});
  return {ok:true, msg:`${name} joins the Council.`};
}
function creativeEvent(st, f) {
  const g = creativeGuard(st); if (g) return g;
  const title = String(f.title || '').trim().slice(0, 100); if (!title) return {ok:false, msg:'Give the event a title.'};
  const mk = (l, k, v) => ({key:'o' + Math.random().toString(36).slice(2, 6), label:String(l || 'Option').slice(0, 80), detail:'Custom option', eff:{ind:{[k]:clamp(Number(v) || 0, -20, 20)}}});
  st.events.push({id:nid(st, 'EVT'), kind:'development', tpl:'custom', title, desc:String(f.desc || '').slice(0, 600), options:[mk(f.aLabel, f.aKey, f.aVal), mk(f.bLabel, f.bKey, f.bVal)], status:'active', created:st.day, deadline:st.day + 30, def:null});
  return {ok:true, msg:'Custom event created. It appears under Decisions awaiting the Crown.'};
}
function creativeSet(st, k, v) { const g = creativeGuard(st); if (g) return g; if (k === 'treasury') { const n = Number(v); if (!Number.isFinite(n) || n < 0 || n > 1e7) return {ok:false, msg:'Treasury must be between 0 and 10,000,000.'}; st.treasury.balance = n; return {ok:true, msg:'Treasury set.'}; } if (!IND_KEYS.includes(k)) return {ok:false, msg:'Unknown indicator.'}; st.ind[k] = clamp(Number(v) || 0, 0, 100); return {ok:true, msg:`${IND_LABEL[k]} set.`}; }

/* ---------- Simulation step ---------- */
function stepDay(st) {
  st.day++;
  // timers
  const due = st.timers.filter(t => t.day <= st.day); st.timers = st.timers.filter(t => t.day > st.day);
  due.forEach(t => runTimer(st, t));
  // projects
  const rate = projectRate(st);
  st.projects.forEach(p => { if (p.status !== 'active') return; p.progress = Math.min(p.duration, p.progress + rate); if (p.progress >= p.duration) completeProject(st, p); });
  // laws
  st.laws.forEach(l => {
    if (l.status === 'implementing') { l.implLeft--; if (l.implLeft <= 0) { l.status = 'in force'; l.history.push(`${fmtDate(st.day)}: Entered into force.`); (l.provisions || []).forEach(pk => { const P = PROVISIONS.find(p => p.key === pk); if (P) { applyEff(st, {ind:P.oneTime, civ:P.civ}, `Law ${l.id}`); } }); notify(st, `${l.id} is now in force`, l.title, 'success', {screen:'legislature'}); } }
    if (l.status === 'in force' && l.sunsetAt && st.day >= l.sunsetAt) { l.status = 'expired'; l.history.push(`${fmtDate(st.day)}: Expired under its sunset clause.`); notify(st, `${l.id} has expired`, 'The sunset clause has taken effect.', 'info', {screen:'legislature'}); }
  });
  // emergencies and developments
  st.events.forEach(e => {
    if (e.status !== 'active') return;
    if (e.kind === 'crisis' && st.day >= e.nextEsc) escalate(st, e);
    if (e.kind === 'development' && e.deadline && st.day >= e.deadline) {
      let def = e.options.find(o => o.key === e.def) || e.options.find(o => !o.cost && !o.rgCost);
      if (def && (def.cost || def.rgCost)) def = e.options.find(o => !o.cost && !o.rgCost);
      if (def) { devResolve(st, e.id, def.key); e.choice = `${def.label} (by default: no decision was made)`; notify(st, `Decided by default: ${e.title}`, `No decision was made before the deadline. Outcome: ${def.label}.`, 'alert', {screen:'dashboard'}); adjInd(st, 'approval', -0.5); }
      else { e.status = 'expired'; }
    }
  });
  // petitions: deadlines and delegated authority
  st.petitions.forEach(p => {
    if (p.status !== 'pending') return;
    const del = st.council.delegations[p.cls];
    if (del && ['Low','Moderate'].includes(p.urgency) && st.day - p.submitted >= 2) {
      const m = charById(st, del); if (m && m.active !== false) {
        const adv = petAdvice(st, p); const mine = adv.find(a => a.id === del) || {choice:charScore(m, p.project.eff, p.cost).s > 0 ? 'approve' : 'reject'};
        const ch = ['approve','conditions','reject'].includes(mine.choice) ? mine.choice : 'conditions';
        const r = petAction(st, p.id, ch, {text:`Decided under delegated authority by ${m.name}.`});
        if (r.ok) { p.delegatedBy = m.name; notify(st, `${m.name} decided ${p.id}`, `${p.title}: ${p.decision || ch}.`, 'info', {screen:'petitions'}); }
        else if (ch !== 'reject') { petAction(st, p.id, 'reject', {text:`Declined under delegated authority by ${m.name}: insufficient funds.`}); }
        return;
      }
    }
    if (st.day > p.deadlineDay) {
      p.status = 'expired'; const c = civById(st, p.civ); if (c) c.rel = clamp(c.rel - 6, 0, 100); adjInd(st, 'approval', -1); adjInd(st, 'trust', -1);
      if (p.urgency === 'Critical' || p.urgency === 'High') applyEff(st, p.rejectEff, 'Expired petition');
      p.log.push(`${fmtDate(st.day)}: Expired without decision.`);
      notify(st, `Petition expired: ${p.id}`, `${p.title} expired without a decision. ${p.petitioner} is aggrieved.`, 'alert', {screen:'petitions'});
      archive(st, 'petition', `${p.id} expired`, p.title, p.id);
    }
  });
  // negotiations
  st.negotiations.forEach(n => { if (n.status === 'active' && st.day >= n.nextRound) negRound(st, n); });
  // Rungta Global projects
  st.rg.projects = st.rg.projects.filter(p => {
    if (p.end > st.day) return true;
    if (p.intl) { st.rg.markets.push(p.intl); const t = st.rg.subsidiaries.find(s => s.id === 'tie'); t.units += 4; st.rg.subsidiaries.find(s => s.id === 'hosp').units += 1; }
    else { const s = st.rg.subsidiaries.find(x => x.id === p.sub); if (s) s.units += p.units; }
    st.rg.board.unshift({day:st.day, text:`Completed: ${p.label}.`}); notify(st, `Rungta Global: ${p.label} complete`, '', 'success', {screen:'rungta'});
    return false;
  });
  // procedural generation
  spawn(st);
  if (st.day % DAYS_PER_MONTH === 0) monthTick(st);
  if (st.rise && !st.rise.crowned && st.day % 10 === 0) { const s = riseStatus(st); if (s.ready && !st.rise.notified) { st.rise.notified = true; notify(st, 'Recognition is within reach', 'All Twelve and every member civilisation now endorse you. Petition for recognition from the Private Office.', 'success', {screen:'office'}); } }
}
function runTimer(st, t) {
  const p = st.petitions.find(x => x.id === t.ref);
  switch (t.kind) {
    case 'petInfo': if (!p) break; p.riskRevealed = true; p.status = 'pending'; p.extraInfo = p.hidden ? p.hidden.text : 'No additional concerns were found.'; p.log.push(`${fmtDate(st.day)}: Further information received.`); notify(st, `Information received: ${p.id}`, p.extraInfo, 'info', {screen:'petitions', id:p.id}); break;
    case 'petCouncil': {
      if (!p) break; const adv = petAdvice(st, p); const memberAdv = adv[adv.length - 1];
      p.councilReport = memberAdv ? `${memberAdv.name} reports for the Council: ${memberAdv.text}` : 'The Council has no recommendation.';
      if (p.hidden && rnd(st) < 0.5) { p.riskRevealed = true; p.councilReport += ` The Council also notes: ${p.hidden.text}`; }
      p.status = 'pending'; p.log.push(`${fmtDate(st.day)}: Council report received.`); notify(st, `Council report on ${p.id}`, p.councilReport, 'info', {screen:'petitions', id:p.id}); break;
    }
    case 'petHearing': if (!p) break; p.hearingDone = true; p.hearingDiscount = /co-fund|offer|agree/.test(p.hearingNote || '') ; p.status = 'pending'; { const c = civById(st, p.civ); if (c) c.rel = clamp(c.rel + 3, 0, 100); } p.log.push(`${fmtDate(st.day)}: Hearing held. ${p.hearingNote || ''}`); notify(st, `Hearing held: ${p.id}`, p.hearingNote || 'The petitioner presented their case in person.', 'info', {screen:'petitions', id:p.id}); break;
    case 'caseEvidence': { const c = caseById(st, t.ref); if (!c) break; c.hidden.forEach(h => { if (!c.revealedHidden.includes(h.id)) c.revealedHidden.push(h.id); }); if (c.opinions) caseDeliberate(st, c); c.log.push(`${fmtDate(st.day)}: Further evidence produced.`); notify(st, `New evidence in ${c.id}`, c.hidden.map(h => h.title).join(', '), 'info', {screen:'tribunal', id:c.id}); break; }
    case 'caseAppeal': { const c = caseById(st, t.ref); if (!c || c.status !== 'decided') break; const rem = c.remedies.find(m => m.key === c.verdict.remedy); const loser = rem.lean > 0 ? c.respondent : c.claimant; c.appeal = {by:loser.civ, name:loser.name, status:'pending', day:st.day}; c.stage = 8; notify(st, `Appeal lodged in ${c.id}`, `${loser.name} has appealed the verdict and asks for constitutional review.`, 'alert', {screen:'tribunal', id:c.id}); break; }
    case 'caseClose': { const c = caseById(st, t.ref); if (c && c.status === 'decided') { c.status = 'closed'; c.log.push(`${fmtDate(st.day)}: Implementation complete. Case closed.`); } break; }
    case 'visitDone': { const e = civById(st, 'earth'); e.rel = clamp(e.rel + 4, 0, 100); adjInd(st, 'approval', 2); st.earth.visits++; archive(st, 'history', 'Official visit to Earth concluded', 'The Sovereign visited Earth, including the COSMOS–EDU pilot at DAIS.', 'EARTH'); notify(st, 'Official visit to Earth concluded', 'Earth relation +4, approval +2.', 'success', {screen:'earth'}); break; }
    case 'memberCheck': { const c = civById(st, t.ref); if (c && c.kind === 'observer') { if (c.rel >= 50) { c.kind = 'member'; c.status = 'Member Civilisation'; c.contribution = c.contribution || 200; notify(st, `${c.name} joins the Cosmos`, 'The observation period ended well.', 'success', {screen:'civs'}); } else notify(st, `${c.name} remains an observer`, 'Relations fell below 50 during the observation period.', 'info', {screen:'civs'}); } break; }
    case 'ancient2': st.flags.ancientStage = 2; st.events.push({id:nid(st, 'EVT'), kind:'development', tpl:'ancient2', title:'The fourth door', desc:'The signal is decoded. It describes the Tribunal chamber with four doors: Trial, Petition, Hidden Verdict, and a fourth, of Mercy, that was never built. The Spirits say the Cosmos will be steadier when justice has a door for clemency.', options:[{key:'build', label:'Commission the Door of Mercy (CC 1,500M, 120 days)', detail:'Legitimacy +4 and Approval +3 on completion.', eff:{}, act:'fourth-door'}, {key:'decline', label:'Leave the chamber as it is', detail:'No cost.', eff:{ind:{legitimacy:-0.5}}}], status:'active', created:st.day, deadline:st.day + 40, def:'decline'}); notify(st, 'The ancient message is decoded', 'A new decision awaits.', 'alert', {screen:'dashboard'}); break;
  }
}
function spawn(st) {
  const tribunal = st.meta.mode === 'tribunal', crisisMode = st.meta.mode === 'crisis';
  const pending = st.petitions.filter(p => p.status === 'pending').length;
  if (pending < 8 && chance(st, tribunal ? 0.03 : 0.055)) { const p = makePetition(st, pick(st, PET_TEMPLATES)(st)); st.petitions.push(p); notify(st, `New petition: ${p.id}`, `${p.petitioner}: ${p.title} (${p.urgency})`, 'info', {screen:'petitions', id:p.id}); }
  const openCases = st.cases.filter(c => c.status === 'open').length;
  if (openCases < (tribunal ? 5 : 3) && chance(st, tribunal ? 0.06 : 0.018)) { const c = makeCase(st, pick(st, CASE_TEMPLATES)(st)); st.cases.push(c); notify(st, `Case registered: ${c.id}`, `${c.title} — ${c.subject}`, 'info', {screen:'tribunal', id:c.id}); }
  const activeCrises = st.events.filter(e => e.kind === 'crisis' && e.status === 'active');
  if (activeCrises.length < (crisisMode ? 4 : 2) && st.day > 10 && chance(st, crisisMode ? 0.03 : 0.014)) {
    const s = pick(st, CRISIS_SPAWN); const civ = pick(st, s.civs.filter(id => !activeCrises.some(e => e.civ === id && e.tpl === s.tpl)));
    if (civ) { const e = makeCrisis(st, s.tpl, civ); st.events.push(e); notify(st, `Emergency: ${e.title}`, e.desc, 'alert', {screen:'emergency'}); brief(st, `A new emergency: ${e.title}. ${e.desc} Escalation is expected within ${e.every} days.`); ENGINE.interrupts.push({type:'crisis', id:e.id}); }
  }
  const activeDev = st.events.filter(e => e.kind === 'development' && e.status === 'active').length;
  if (activeDev < 4 && chance(st, 0.045)) {
    const pool = DEV_TEMPLATES.filter(t => t.key !== 'membership' || st.civs.some(c => c.discovered && c.kind === 'observer'));
    const tot = pool.reduce((a, t) => a + t.w, 0); let r = rnd(st) * tot; let tpl = pool[0];
    for (const t of pool) { r -= t.w; if (r <= 0) { tpl = t; break; } }
    const e = tpl.make(st);
    if (e) { Object.assign(e, {id:nid(st, 'EVT'), kind:'development', tpl:tpl.key, status:'active', created:st.day, deadline:st.day + 20}); st.events.push(e); notify(st, `Decision required: ${e.title}`, e.desc, 'info', {screen:'dashboard'}); }
  }
}
function monthTick(st) {
  const T = st.treasury;
  const rev = projectedRevenue(st);
  const withheld = st.civs.filter(c => c.discovered && c.kind === 'member' && c.contribution > 0 && c.rel < 30);
  for (const k in rev) if (rev[k] > 0) earn(st, rev[k], k, `Monthly ${REVENUE_CATS[k].toLowerCase()}`);
  if (withheld.length) notify(st, 'Contributions withheld', `${withheld.map(c => c.name).join(', ')} withheld voluntary contributions because relations fell below 30.`, 'alert', {screen:'civs'});
  const rc = recurringCosts(st);
  const total = budgetTotal(st) + rc.laws + rc.edu;
  const f = total > T.balance ? Math.max(0, T.balance / total) : 1;
  if (f < 1) { notify(st, 'Budget shortfall', `The treasury could fund only ${Math.round(f * 100)}% of this month’s budget. Programmes were cut proportionally.`, 'alert', {screen:'treasury'}); adjInd(st, 'approval', -2); adjInd(st, 'efficiency', -2); }
  BUDGET_CATS.forEach(b => {
    const amt = T.budget[b.key] * f; if (amt <= 0) return;
    if (b.key === 'emergency') { T.balance -= amt; T.reserve += amt; ledger(st, 'expense', 'emergency', amt, 'Monthly allocation to emergency reserve', 'reserve'); }
    else spend(st, amt, b.key, `Monthly ${b.label.toLowerCase()} budget`);
  });
  if (rc.laws * f > 0) spend(st, rc.laws * f, 'administration', 'Recurring costs of laws in force');
  if (rc.edu * f > 0) spend(st, rc.edu * f, 'education', 'COSMOS–EDU modules and scholarships');
  // budget effects on indicators
  BUDGET_CATS.forEach(b => { const ratio = (T.budget[b.key] * f) / b.base; const d = clamp(Math.log(Math.max(ratio, 0.05)) * 2, -3, 2); for (const k in b.eff) adjInd(st, k, d * b.eff[k]); });
  // law monthly effects
  st.laws.forEach(l => { if (l.status === 'in force') (l.provisions || []).forEach(pk => { const P = PROVISIONS.find(p => p.key === pk); if (P && P.monthly) for (const k in P.monthly) adjInd(st, k, P.monthly[k] * f); }); });
  // education programme
  const mods = Object.values(st.edu.modules).filter(Boolean).length;
  adjInd(st, 'education', (mods * 0.05 + Math.min(st.edu.scholarships, 2000) / 2000 + st.edu.institutions.length * 0.04 - 0.35) * f);
  if (st.edu.modules.ethics) adjInd(st, 'legitimacy', 0.03); if (st.edu.modules.environment) adjInd(st, 'environment', 0.08); if (st.edu.modules.exchange) adjInd(st, 'trust', 0.08);
  // natural drift and pressure
  IND_KEYS.forEach(k => { if (k !== 'approval') adjInd(st, k, -(st.ind[k] - 60) * 0.012); });
  st.events.forEach(e => { if (e.kind === 'crisis' && e.status === 'active') { adjInd(st, 'stability', -0.3 * e.stage); adjInd(st, 'approval', -0.15 * e.stage); } });
  const pendingOld = st.petitions.filter(p => p.status === 'pending' && st.day - p.submitted > 20).length; adjInd(st, 'approval', -0.15 * pendingOld);
  const others = IND_KEYS.filter(k => k !== 'approval').reduce((a, k) => a + st.ind[k], 0) / 7;
  adjInd(st, 'approval', (others - st.ind.approval) * 0.08);
  st.civs.forEach(c => { if (c.kind !== 'capital' && c.discovered) c.rel = clamp(c.rel + (65 - c.rel) * 0.01 + (st.ind.trust - 75) / 300, 0, 100); c.pop = Math.round(c.pop * 1.001 * 1000) / 1000; });
  // bookkeeping
  const r = Object.values(T.month.rev).reduce((a, b) => a + b, 0), x = Object.values(T.month.exp).reduce((a, b) => a + b, 0);
  T.hist.push({day:st.day, balance:Math.round(T.balance), revenue:Math.round(r), expense:Math.round(x), reserve:Math.round(T.reserve), rev:deep(T.month.rev), exp:deep(T.month.exp)});
  if (T.hist.length > 120) T.hist.shift();
  if (r >= x) st.stats.positiveMonths++;
  T.month = {rev:{}, exp:{}};
  st.indHist.push(Object.assign({day:st.day}, st.ind)); if (st.indHist.length > 120) st.indHist.shift();
  if (chance(st, 0.7)) genRecommendation(st);
  rgMonthly(st);
  checkAchievements(st);
  notify(st, `Monthly treasury statement: ${MONTHS[dateParts(st.day - 1).m]}`, `Revenue ${fmtCC(r)}, expenditure ${fmtCC(x)}, balance ${fmtCC(T.balance)}, reserve ${fmtCC(T.reserve)}.`, 'info', {screen:'treasury'});
  ENGINE.monthPassed = true;
}

/* ---------- Validation of imported saves ---------- */
function validateSave(o) {
  if (!o || typeof o !== 'object') return 'The file is not a campaign save.';
  const req = ['meta','rng','day','ind','treasury','civs','chars','petitions','cases','laws','projects','events','archives'];
  for (const k of req) if (!(k in o)) return `The save is missing “${k}”.`;
  if (o.meta.version > SAVE_VERSION) return 'This save was created by a newer version of the game.';
  if (!Number.isFinite(o.treasury.balance)) return 'The treasury balance in this save is invalid.';
  return null;
}
function migrate(o) {
  const base = newGame(o.meta.mode || 'sandbox', o.meta.seed || 1);
  for (const k in base) if (!(k in o)) o[k] = base[k];
  ['flags','stats','canon','council','edu','earth','rg','research'].forEach(k => { for (const j in base[k]) if (!(j in o[k])) o[k][j] = base[k][j]; });
  return o;
}
