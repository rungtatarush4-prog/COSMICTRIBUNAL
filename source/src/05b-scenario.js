/* ===== Scenario engine and live game rules ===== */
const DEFAULT_SETTINGS = {petitions:true, cases:true, crises:true, events:true, corporate:true, eventRate:1, crisisSpeed:1, projectSpeed:1, revenueMult:1, drift:1};
const SETTING_LABELS = {petitions:'New petitions arrive', cases:'New Tribunal cases arrive', crises:'Random emergencies occur', events:'Random decisions occur', corporate:'Rungta Global corporate events', eventRate:'Frequency of random events', crisisSpeed:'Speed of crisis escalation', projectSpeed:'Speed of projects', revenueMult:'Treasury revenue', drift:'Natural decline of indicators'};
const SET = st => st.settings || DEFAULT_SETTINGS;
const GOAL_STATS = {verdicts:'Verdicts delivered', crisesResolved:'Emergencies resolved', treaties:'Treaties concluded', projectsDone:'Projects completed', lawsEnacted:'Instruments enacted', petitionsDecided:'Petitions decided'};
const BEAT_KINDS = {message:'Story message', decision:'Decision with choices', crisis:'Emergency', petition:'Petition', case:'Tribunal case'};

function escIn(st, e) { return Math.max(2, Math.round(e.every / (SET(st).crisisSpeed || 1))); }

/* ---------- Live rules and values (Game Editor) ---------- */
function editorGuard(st) { return st.meta.creative ? null : {ok:false, msg:'Unlock Live Controls for this campaign first.'}; }
function unlockEditor(st) {
  if (st.meta.creative) return {ok:true, msg:'Live Controls are already unlocked.'};
  st.meta.creative = true; archive(st, 'history', 'Live Controls unlocked', 'From this day the campaign may be modified freely. Achievements are no longer recorded.', 'EDITOR');
  return {ok:true, msg:'Live Controls unlocked. Achievements are now disabled for this campaign.'};
}
function editorSettings(st, o) {
  const g = editorGuard(st); if (g) return g;
  const s = Object.assign({}, DEFAULT_SETTINGS, st.settings);
  for (const k in DEFAULT_SETTINGS) {
    if (!(k in o)) continue;
    if (typeof DEFAULT_SETTINGS[k] === 'boolean') s[k] = !!o[k];
    else { const n = Number(o[k]); if (!Number.isFinite(n) || n < 0 || n > 5) return {ok:false, msg:`${SETTING_LABELS[k]} must be between 0 and 5.`}; s[k] = n; }
  }
  st.settings = s; return {ok:true, msg:'Game rules updated.'};
}
function editorValues(st, o) {
  const g = editorGuard(st); if (g) return g;
  for (const k of IND_KEYS) if (o[k] !== undefined && o[k] !== '') { const n = Number(o[k]); if (!Number.isFinite(n)) return {ok:false, msg:`${IND_LABEL[k]} must be a number.`}; st.ind[k] = clamp(n, 0, 100); }
  const money = (k, lo, hi, set) => { if (o[k] === undefined || o[k] === '') return null; const n = Number(o[k]); if (!Number.isFinite(n) || n < lo || n > hi) return `Value for ${k} must be between ${lo} and ${fmt(hi)}.`; set(n); return null; };
  const e = money('treasury', 0, 1e7, n => { st.treasury.balance = n; }) || money('reserve', 0, 1e7, n => { st.treasury.reserve = n; }) || money('rgcash', 0, 1e6, n => { st.rg.cash = n; });
  if (e) return {ok:false, msg:e};
  RESEARCH_TRACKS.forEach(t => { if (o['r_' + t.key] !== undefined) st.research[t.key] = clamp(parseInt(o['r_' + t.key], 10) || 0, 0, 5); });
  return {ok:true, msg:'Values updated.'};
}
function editorCiv(st, id, o) {
  const g = editorGuard(st); if (g) return g; const c = civById(st, id); if (!c) return {ok:false, msg:'Civilisation not found.'};
  const name = String(o.name || '').trim(); if (!name) return {ok:false, msg:'A civilisation needs a name.'};
  c.name = name.slice(0, 60); c.rel = clamp(Number(o.rel) || 0, 0, 100); c.pop = clamp(Number(o.pop) || 0.01, 0.01, 1000); c.tech = clamp(Number(o.tech) || 0, 0, 100);
  if (c.kind === 'member') c.contribution = clamp(Number(o.contribution) || 0, 0, 5000);
  return {ok:true, msg:`${c.name} updated.`};
}
function editorChar(st, id, o) {
  const g = editorGuard(st); if (g) return g; const c = charById(st, id); if (!c) return {ok:false, msg:'Character not found.'};
  const name = String(o.name || '').trim(); if (!name) return {ok:false, msg:'A character needs a name.'};
  c.name = name.slice(0, 60); if (o.role) { c.role = String(o.role).slice(0, 80); c.position = c.role; } c.trust = clamp(Number(o.trust) || 0, 0, 100);
  return {ok:true, msg:`${c.name} updated.`};
}
function pushDev(st, key, e) { Object.assign(e, {id:nid(st, 'EVT'), kind:'development', tpl:key, status:'active', created:st.day, deadline:st.day + 20}); st.events.push(e); notify(st, `Decision required: ${e.title}`, e.desc, 'info', {screen:'dashboard'}); return e; }
function editorSpawn(st, kind, a, b) {
  const g = editorGuard(st); if (g) return g;
  if (kind === 'petition') { const p = makePetition(st, pick(st, PET_TEMPLATES)(st)); st.petitions.push(p); notify(st, `New petition: ${p.id}`, p.title, 'info', {screen:'petitions', id:p.id}); return {ok:true, msg:`${p.id} submitted: ${p.title}.`}; }
  if (kind === 'case') { const c = makeCase(st, pick(st, CASE_TEMPLATES)(st)); st.cases.push(c); notify(st, `Case registered: ${c.id}`, c.title, 'info', {screen:'tribunal', id:c.id}); return {ok:true, msg:`${c.id} registered: ${c.title}.`}; }
  if (kind === 'crisis') { if (!CRISIS_TPL[a]) return {ok:false, msg:'Choose a type of emergency.'}; if (!civById(st, b)) return {ok:false, msg:'Choose a civilisation.'}; const e = makeCrisis(st, a, b); st.events.push(e); notify(st, `Emergency: ${e.title}`, e.desc, 'alert', {screen:'emergency'}); return {ok:true, msg:`Emergency begun: ${e.title}.`}; }
  if (kind === 'event') { const t = DEV_TEMPLATES.find(x => x.key === a); if (!t) return {ok:false, msg:'Choose a type of decision.'}; const e = t.make(st); if (!e) return {ok:false, msg:'That event cannot happen right now (for example, a membership request needs an observer civilisation).'}; pushDev(st, t.key, e); return {ok:true, msg:`New decision: ${e.title}.`}; }
  return {ok:false, msg:'Unknown event type.'};
}

/* ---------- Scenarios ---------- */
const CRISIS_NAMES = {stellar:'Stellar instability', tidal:'Tidal surges', storm:'Ion storm', shortage:'Supply shortage', ecological:'Biosphere collapse'};
const DEV_NAMES = {dispute:'Resource dispute', membership:'Membership request', breakthrough:'Scientific breakthrough', constitutional:'Constitutional disagreement', summit:'Summit proposal', councilDispute:'Council dispute', eduAssist:'School requests help', corporate:'Rungta Global incident', discovery:'Unknown civilisation discovered', ancient:'Ancient message', earthCollective:'Earth collective petition'};
function blankScenario() {
  return {id:'scn-' + Date.now().toString(36), name:'Untitled scenario', desc:'', briefing:'Sovereign, a new chapter begins.', mode:'sandbox', seed:'',
    start:{ind:{}, treasury:'', reserve:'', rel:{}, crises:[], settings:Object.assign({}, DEFAULT_SETTINGS)},
    beats:[], goals:{win:[], lose:[], days:''}};
}
function blankBeat(n) { return {id:'b' + Date.now().toString(36) + n, title:'New story beat', text:'', kind:'message', trigger:{type:'day', day:5, ind:'stability', op:'<', value:60}, options:[{label:'', ind:'approval', amt:0, cc:0, civ:'', civAmt:0, next:'', delay:0}, {label:'', ind:'approval', amt:0, cc:0, civ:'', civAmt:0, next:'', delay:0}, {label:'', ind:'approval', amt:0, cc:0, civ:'', civAmt:0, next:'', delay:0}], crisis:{tpl:'stellar', civ:'vael'}, petition:{petitioner:'', civ:'earth', cost:500, ind:'approval', amt:2}, case:{a:'korr', b:'sylvan'}}; }

function validateScenario(d) {
  if (!d || typeof d !== 'object') return 'That is not a scenario.';
  if (!d.name || typeof d.name !== 'string') return 'The scenario needs a name.';
  if (!Array.isArray(d.beats)) return 'The scenario has no story beats list.';
  if (!d.goals || !Array.isArray(d.goals.win) || !Array.isArray(d.goals.lose)) return 'The scenario goals are missing.';
  if (!MODE_NAMES[d.mode]) return 'Unknown base mode.';
  const ids = new Set(d.beats.map(b => b.id));
  for (const b of d.beats) { if (!BEAT_KINDS[b.kind]) return `Beat “${b.title}” has an unknown type.`; if (b.kind === 'decision' && !(b.options || []).some(o => String(o.label || '').trim())) return `Decision “${b.title}” needs at least one choice.`; for (const o of b.options || []) if (o.next && !ids.has(o.next)) return `A choice in “${b.title}” leads to a beat that no longer exists.`; }
  return null;
}
function goalText(g) {
  if (g.type === 'ind') return `${IND_LABEL[g.key]} ${g.op === '>' ? 'at or above' : 'at or below'} ${g.value}`;
  if (g.type === 'treasury') return `Treasury ${g.op === '>' ? 'at or above' : 'at or below'} ${fmtCC(Number(g.value) || 0)}`;
  if (g.type === 'stat') return `${GOAL_STATS[g.key]}: at least ${g.value}`;
  if (g.type === 'noCrises') return 'No active emergencies';
  if (g.type === 'rel') return `Relations with ${g.civName || g.key} ${g.op === '>' ? 'at or above' : 'at or below'} ${g.value}`;
  return '?';
}
function goalMet(st, g) {
  const cmp = (v, op, x) => op === '>' ? v >= Number(x) : v <= Number(x);
  if (g.type === 'ind') return cmp(st.ind[g.key], g.op, g.value);
  if (g.type === 'treasury') return cmp(st.treasury.balance, g.op, g.value);
  if (g.type === 'stat') return (st.stats[g.key] || 0) >= Number(g.value);
  if (g.type === 'noCrises') return !st.events.some(e => e.kind === 'crisis' && e.status === 'active');
  if (g.type === 'rel') { const c = civById(st, g.key); return c ? cmp(c.rel, g.op, g.value) : false; }
  return false;
}
function startScenario(def) {
  const d = deep(def);
  const st = newGame(d.mode, d.seed ? Number(d.seed) : undefined);
  const S = d.start || {};
  for (const k in (S.ind || {})) if (S.ind[k] !== '' && S.ind[k] !== null && Number.isFinite(Number(S.ind[k]))) st.ind[k] = clamp(Number(S.ind[k]), 0, 100);
  if (S.treasury !== '' && Number.isFinite(Number(S.treasury))) st.treasury.balance = clamp(Number(S.treasury), 0, 1e7);
  if (S.reserve !== '' && Number.isFinite(Number(S.reserve))) st.treasury.reserve = clamp(Number(S.reserve), 0, 1e7);
  for (const id in (S.rel || {})) { const c = civById(st, id); if (c && S.rel[id] !== '' && Number.isFinite(Number(S.rel[id]))) c.rel = clamp(Number(S.rel[id]), 0, 100); }
  st.settings = Object.assign({}, DEFAULT_SETTINGS); for (const k in DEFAULT_SETTINGS) if (S.settings && k in S.settings) st.settings[k] = typeof DEFAULT_SETTINGS[k] === 'boolean' ? !!S.settings[k] : clamp(Number(S.settings[k]) || 0, 0, 5);
  if (S.clean) { st.petitions = []; st.cases = []; st.negotiations = []; st.events = []; }
  (S.crises || []).forEach(x => { if (!CRISIS_TPL[x.tpl] || !civById(st, x.civ)) return; const old = st.events.find(e => e.kind === 'crisis' && e.status === 'active' && e.tpl === x.tpl && e.civ === x.civ); if (old) { old.stage = clamp(parseInt(x.stage, 10) || 1, 1, 4); return; } const e = makeCrisis(st, x.tpl, x.civ); e.stage = clamp(parseInt(x.stage, 10) || 1, 1, 4); st.events.push(e); });
  st.indHist = [Object.assign({day:0}, st.ind)];
  st.meta.creative = true; st.meta.scenario = d.name; st.meta.name = d.name;
  st.scenario = {def:d, fired:{}, status:'active', log:[]};
  const goals = d.goals.win.map(goalText);
  st.goal = `Scenario “${d.name}”. ${goals.length ? (d.goals.days ? `Win if, after ${d.goals.days} days: ` : 'Win: ') + goals.join('; ') + '.' : d.goals.days ? `Govern for ${d.goals.days} days.` : 'No win condition: play as you wish.'}${d.goals.lose.length ? ' Lose if: ' + d.goals.lose.map(goalText).join('; ') + '.' : ''}`;
  st.briefing = {day:0, text:d.briefing || 'A new chapter begins.'};
  st.notifications = []; notify(st, `Scenario begins: ${d.name}`, d.briefing || '', 'brief', {screen:'dashboard'});
  archive(st, 'history', `Scenario begun: ${d.name}`, d.desc || '', 'SCENARIO');
  scenarioTick(st);
  ENGINE.interrupts = []; ENGINE.sfx = null;
  return st;
}
function fireBeat(st, b) {
  const S = st.scenario; if (!S || !b) return;
  S.fired[b.id] = st.day; S.log.push(`${fmtDate(st.day)}: ${b.title}`);
  const civOf = id => civById(st, id) ? id : 'aurelia';
  if (b.kind === 'message') {
    brief(st, `${b.title}. ${b.text}`); archive(st, 'history', b.title, b.text, 'SCENARIO');
  } else if (b.kind === 'decision') {
    const opts = (b.options || []).filter(o => String(o.label || '').trim()).map((o, i) => {
      const amt = Number(o.amt) || 0, cc = Number(o.cc) || 0, ca = Number(o.civAmt) || 0;
      const eff = {ind:amt ? {[o.ind]:amt} : {}}; if (o.civ && ca && civById(st, o.civ)) eff.civ = {[o.civ]:ca}; if (cc > 0) eff.cc = cc;
      return {key:'s' + i, label:o.label, detail:o.next ? 'The story continues from this choice.' : '', cost:cc < 0 ? -cc : 0, eff, scnNext:o.next || null, scnDelay:Math.max(0, parseInt(o.delay, 10) || 0)};
    });
    const e = {id:nid(st, 'EVT'), kind:'development', tpl:'scenario', title:b.title, desc:b.text, options:opts, status:'active', created:st.day, deadline:st.day + 30, def:(opts.find(o => !o.cost) || opts[0] || {}).key};
    st.events.push(e); notify(st, `Decision required: ${b.title}`, b.text, 'alert', {screen:'dashboard'});
    ENGINE.interrupts.push({type:'story', id:e.id}); return;
  } else if (b.kind === 'crisis') {
    const tpl = CRISIS_TPL[b.crisis.tpl] ? b.crisis.tpl : 'stellar'; const e = makeCrisis(st, tpl, civOf(b.crisis.civ)); if (b.text) e.desc = b.text; st.events.push(e);
    notify(st, `Emergency: ${e.title}`, e.desc, 'alert', {screen:'emergency'}); brief(st, `${b.title}. ${e.desc}`);
  } else if (b.kind === 'petition') {
    const P = b.petition, civ = civOf(P.civ), amt = Number(P.amt) || 0;
    const p = makePetition(st, {petitioner:P.petitioner || genPerson(st), civ, cls:'Development', urgency:'High', title:b.title, background:b.text || 'Submitted in the course of the scenario.', request:b.text || b.title, evidence:['Submitted as part of the scenario'], cost:Math.max(0, Number(P.cost) || 0), benefits:'As set out by the petitioner.', risks:'Not yet assessed.', project:{name:b.title, cat:'development', duration:30, eff:{ind:amt ? {[P.ind]:amt} : {}, civ:{[civ]:5}}}, rejectEff:{civ:{[civ]:-5}}, hidden:null, hearingNote:'The petitioner presents the case in person.', deadline:40});
    st.petitions.push(p); notify(st, `New petition: ${p.id}`, p.title, 'info', {screen:'petitions', id:p.id});
  } else if (b.kind === 'case') {
    const A = civById(st, civOf(b.case.a)), B = civById(st, civOf(b.case.b));
    const c = makeCase(st, genericCase(st, `${A.name} v. ${B.name}`, b.title, 'Scenario case', A, B, b.text || b.title, ['Constitutional Principle 7'])); st.cases.push(c);
    notify(st, `Case registered: ${c.id}`, c.title, 'info', {screen:'tribunal', id:c.id});
  }
  ENGINE.interrupts.push({type:'story', beat:b.id});
}
function scenarioTick(st) {
  const S = st.scenario; if (!S || S.status !== 'active') return;
  S.def.beats.forEach(b => {
    if (S.fired[b.id] !== undefined) return;
    const t = b.trigger || {};
    if (t.type === 'day' && st.day >= (parseInt(t.day, 10) || 0)) fireBeat(st, b);
    else if (t.type === 'cond' && IND_KEYS.includes(t.ind) && (t.op === '>' ? st.ind[t.ind] >= Number(t.value) : st.ind[t.ind] <= Number(t.value))) fireBeat(st, b);
  });
  const G = S.def.goals;
  const lost = G.lose.find(g => goalMet(st, g));
  const timeUp = G.days && st.day >= Number(G.days);
  const won = G.win.length && st.day >= 1 && (!G.days || timeUp) && G.win.every(g => goalMet(st, g));
  if (lost) endScenario(st, 'lost', `Defeat: ${goalText(lost)}.`);
  else if (won) endScenario(st, 'won', `Victory: ${G.win.map(goalText).join('; ')}.`);
  else if (timeUp) endScenario(st, G.win.length ? 'lost' : 'won', G.win.length ? `Time ran out after ${G.days} days before the goals were met.` : `You governed for ${G.days} days. The scenario is complete.`);
}
function endScenario(st, status, text) {
  const S = st.scenario; S.status = status; S.endDay = st.day; S.result = text;
  archive(st, 'history', `Scenario ${status === 'won' ? 'won' : 'lost'}: ${S.def.name}`, text, 'SCENARIO');
  makeDoc(st, 'proclamation', `${S.def.name}: ${status === 'won' ? 'Victory' : 'Defeat'}`, `${text}\n\nDays governed: ${st.day}. Verdicts: ${st.stats.verdicts}. Emergencies resolved: ${st.stats.crisesResolved}. Treaties: ${st.stats.treaties}.\n\nApproval ${fmt(st.ind.approval)}, legitimacy ${fmt(st.ind.legitimacy)}, stability ${fmt(st.ind.stability)}, treasury ${fmtCC(st.treasury.balance)}.`, 'SCENARIO');
  notify(st, status === 'won' ? 'Scenario won' : 'Scenario lost', text, status === 'won' ? 'success' : 'alert', {screen:'studio'});
  ENGINE.interrupts.push({type:'scenario-end'});
}
function scenarioChoice(st, o) {
  if (!o || !o.scnNext || !st.scenario) return;
  const b = st.scenario.def.beats.find(x => x.id === o.scnNext); if (!b) return;
  if (o.scnDelay > 0) addTimer(st, o.scnDelay, 'scnBeat', b.id); else fireBeat(st, b);
}

/* ---------- Built-in example scenarios ---------- */
const EXAMPLE_SCENARIOS = [
  {id:'ex-choir', example:true, name:'The Silent Choir Awakens', desc:'An unknown civilisation stirs in the Quiet Deep. Make first contact, keep the Cosmos calm, and win their trust.', briefing:'Sovereign, the Lumen Deep Index has detected harmonic signals from the Quiet Deep. Something old is waking. The Twelve are divided on how to answer.', mode:'sandbox', seed:'',
    start:{ind:{stability:80}, treasury:'', reserve:'', rel:{}, crises:[], settings:Object.assign({}, DEFAULT_SETTINGS, {eventRate:0.6})},
    beats:[
      {id:'c1', title:'A song from the Quiet Deep', text:'The signal repeats every nineteen hours. Thalor believes it is a greeting; Nyxara believes it is a warning.', kind:'message', trigger:{type:'day', day:2}},
      {id:'c2', title:'Answer the Choir?', text:'The Choir’s song is growing louder. The Twelve await your instruction.', kind:'decision', trigger:{type:'day', day:6}, options:[
        {label:'Answer with a song of welcome', ind:'trust', amt:2, cc:-300, civ:'', civAmt:0, next:'c3', delay:5},
        {label:'Listen silently and study the signal', ind:'science', amt:3, cc:0, civ:'', civAmt:0, next:'c4', delay:8},
        {label:'Raise shields around the Quiet Deep', ind:'stability', amt:2, cc:-500, civ:'', civAmt:0, next:'c5', delay:4}]},
      {id:'c3', title:'The Choir replies', text:'The Silent Choir answers with a harmony that every civilisation hears. Their delegation waits at Concord Station. Show them a united Cosmos: raise civilisational trust and conclude a treaty.', kind:'message', trigger:{type:'chain'}},
      {id:'c4', title:'The signal decoded', text:'Thalor’s scholars decode the song: it is a map of the Quiet Deep and a request for help against a dying star.', kind:'crisis', trigger:{type:'chain'}, crisis:{tpl:'stellar', civ:'lumen'}},
      {id:'c5', title:'Fear spreads', text:'The shields are read as hostility. Merchant fleets avoid the Deep, and member civilisations ask whether the Crown is preparing for war.', kind:'decision', trigger:{type:'chain'}, options:[
        {label:'Lower the shields and apologise', ind:'trust', amt:3, cc:0, civ:'', civAmt:0, next:'c3', delay:3},
        {label:'Hold firm', ind:'approval', amt:-3, cc:0, civ:'', civAmt:0, next:'', delay:0}]},
      {id:'c6', title:'Unrest over the Deep', text:'Stability is slipping. The Council urges you to calm the Cosmos before the Choir arrives.', kind:'message', trigger:{type:'cond', ind:'stability', op:'<', value:65}}
    ],
    goals:{win:[{type:'ind', key:'trust', op:'>', value:88}, {type:'stat', key:'treaties', value:1}], lose:[{type:'ind', key:'stability', op:'<', value:45}], days:240}},
  {id:'ex-winter', example:true, name:'The Long Winter of Vael', desc:'Vael-9 is collapsing, the treasury is thin, and two more emergencies are coming. Survive 150 days and end every emergency.', briefing:'Sovereign, Vael-9 has entered its final phase. Our reserves are low, and the Orrery of Vael begs for rescue. Every credit will matter.', mode:'sandbox', seed:'',
    start:{ind:{approval:78, stability:70}, treasury:14000, reserve:400, rel:{vael:60}, crises:[{tpl:'stellar', civ:'vael', stage:3}], settings:Object.assign({}, DEFAULT_SETTINGS, {crises:false, crisisSpeed:1.2})},
    beats:[
      {id:'w1', title:'Refugees from Vael', text:'Two million refugees have reached Aurelia. Where should they go?', kind:'decision', trigger:{type:'day', day:10}, options:[
        {label:'Shelter them in the Capital', ind:'approval', amt:3, cc:-600, civ:'vael', civAmt:8, next:'', delay:0},
        {label:'Ask the Thalassine Deep to take them', ind:'trust', amt:-1, cc:0, civ:'thalassine', civAmt:-6, next:'w2', delay:6},
        {label:'Close the borders', ind:'approval', amt:-5, cc:0, civ:'vael', civAmt:-15, next:'', delay:0}]},
      {id:'w2', title:'Tides rise under the strain', text:'The refugee fleets have unsettled the Thalassine seas.', kind:'crisis', trigger:{type:'chain'}, crisis:{tpl:'tidal', civ:'thalassine'}},
      {id:'w3', title:'Supply lines break', text:'The winter has frozen the outer trade lanes.', kind:'crisis', trigger:{type:'day', day:45}, crisis:{tpl:'shortage', civ:'ashen'}},
      {id:'w4', title:'Korr offers a loan', text:'The Forge Assembly offers CC 3,000M in exchange for mining rights near the Verdance Belt.', kind:'decision', trigger:{type:'cond', ind:'approval', op:'<', value:70}, options:[
        {label:'Accept the loan', ind:'environment', amt:-4, cc:3000, civ:'korr', civAmt:8, next:'', delay:0},
        {label:'Decline politely', ind:'legitimacy', amt:1, cc:0, civ:'korr', civAmt:-3, next:'', delay:0}]}
    ],
    goals:{win:[{type:'noCrises'}, {type:'stat', key:'crisesResolved', value:2}], lose:[{type:'treasury', op:'<', value:0}, {type:'ind', key:'approval', op:'<', value:40}], days:150}}
];
