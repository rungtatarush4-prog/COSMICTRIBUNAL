/* ===== Procedural generators: names, petitions, cases, crises, developments ===== */
const SYL_A = ['Ae','Bel','Cor','Dra','El','Fen','Gal','Hal','Ith','Jor','Kae','Lio','Mor','Nev','Ori','Pel','Quen','Ryn','Sel','Tor','Ul','Vey','Wen','Xan','Yr','Zel','Ash','Bry','Cael','Dov'];
const SYL_B = ['a','an','eth','is','or','une','ara','iel','os','yr','ith','ane','ovar','essa','im'];
function genName(st) { return pick(st, SYL_A) + pick(st, SYL_B) + (chance(st, 0.5) ? ' ' + pick(st, SYL_A) + pick(st, SYL_B).toLowerCase() : ''); }
const TITLES = ['Speaker','Envoy','Delegate','Archon','Councillor','Steward','Elder','Chancellor','Warden','Scholar'];
function genPerson(st) { return pick(st, TITLES) + ' ' + genName(st); }

function memberCivs(st, includeEarth = true) { return st.civs.filter(c => c.discovered && (c.kind === 'member' || c.kind === 'capital' || (includeEarth && c.kind === 'independent'))); }
function civById(st, id) { return st.civs.find(c => c.id === id); }
function civName(st, id) { const c = civById(st, id); return c ? c.name : id; }

/* ---------- Petitions ---------- */
const PET_TEMPLATES = [
  st => { const c = pick(st, memberCivs(st)); const cost = ri(st, 5, 11) * 100; return {petitioner:genPerson(st)+' of '+c.name, civ:c.id, cls:'Humanitarian', urgency:pick(st,['High','Critical','Moderate']), title:`Medical relays for an outbreak on ${c.name}`,
    background:`An outbreak of crystal fever has spread through three settlements of ${c.name}. Local hospitals are at capacity.`, request:'Fund emergency medical relays and treatment supplies.', evidence:['Epidemiological report from local health authorities','Hospital capacity figures'], cost, benefits:'Saves lives and shows the Crown answers in times of need.', risks:'Aid must reach the right hands.',
    project:{name:`${c.name} Medical Relief`, cat:'healthcare', duration:ri(st,20,35), eff:{ind:{approval:2, stability:1}, civ:{[c.id]:8}}}, rejectEff:{ind:{approval:-2, trust:-1}, civ:{[c.id]:-8}},
    hidden:{text:'Auditors report that part of previous aid to this region was diverted by local officials.', chance:0.25, eff:{ind:{trust:-2}}}, hearingNote:'At the hearing, the petitioners agree to independent audit of aid distribution.', deadline:ri(st,20,30)}; },
  st => { const c = pick(st, memberCivs(st, false)); const cost = ri(st, 9, 16) * 100; return {petitioner:genPerson(st)+' of '+c.name, civ:c.id, cls:'Development', urgency:'Low', title:`Starport expansion for ${c.name}`,
    background:`${c.name}’s principal starport handles twice its designed traffic.`, request:'Co-finance a new orbital terminal.', evidence:['Traffic statistics for the last five years','Engineering plans'], cost, benefits:'More trade and smoother travel.', risks:'Construction may run long.',
    project:{name:`${c.name} Orbital Terminal`, cat:'infrastructure', duration:ri(st,60,100), eff:{ind:{efficiency:1, stability:1}, civ:{[c.id]:6}}, special:'trade2'}, rejectEff:{civ:{[c.id]:-4}},
    hidden:{text:'Engineers flag the plans as underestimating costs by about a third.', chance:0.3, eff:{ind:{efficiency:-1}}}, hearingNote:'At the hearing, the petitioners present a phased plan.', deadline:ri(st,50,80)}; },
  st => { const c = pick(st, memberCivs(st, false)); const topic = pick(st, ['dark-matter cartography','stellar seismology','bio-luminescent computing','gravitic agriculture','memory crystals']); return {petitioner:`The ${genName(st)} Institute, ${c.name}`, civ:c.id, cls:'Scientific', urgency:'Low', title:`Research grant for ${topic}`,
    background:`Researchers on ${c.name} have early results in ${topic}.`, request:'Fund a three-year research programme.', evidence:['Peer review of preliminary results','Budget plan'], cost:ri(st,4,9)*100, benefits:'Scientific advancement and licensing revenue.', risks:'Results may not reproduce.',
    project:{name:`Research: ${cap(topic)}`, cat:'research', duration:ri(st,60,90), eff:{ind:{science:2}, civ:{[c.id]:4}}}, rejectEff:{civ:{[c.id]:-3}, ind:{science:-0.5}},
    hidden:{text:'An external reviewer could not reproduce one of the key experiments.', chance:0.25, eff:{ind:{science:-1}}}, hearingNote:'At the hearing, the researchers invite Crown scientists to observe their experiments.', deadline:ri(st,50,80)}; },
  st => { const c = pick(st, memberCivs(st)); const school = c.id === 'earth' ? pick(st, ['a school in Nairobi','a school in São Paulo','a school in Osaka','a school in Pune','a school in Toronto']) : `the ${genName(st)} Academy`; return {petitioner:`Board of ${school}, ${c.name}`, civ:c.id, cls:'Educational', urgency:'Moderate', title:`Request to join COSMOS–EDU: ${school}`,
    background:`Inspired by the DAIS pilot, ${school} on ${c.name} asks to become a COSMOS–EDU partner institution.`, request:'Admit the institution to COSMOS–EDU and fund its first year.', evidence:['Letters of support from families','Accessibility plan'], cost:ri(st,5,8)*100, benefits:'Expands equal educational opportunity.', risks:'Rapid expansion can thin programme quality.',
    project:{name:`COSMOS–EDU Partner: ${school}`, cat:'education', duration:ri(st,40,60), eff:{ind:{education:2}, civ:{[c.id]:5}}, special:'eduinst', inst:{name:cap(school.replace(/^a school in /, 'Partner school, ')), civ:c.id}}, rejectEff:{ind:{education:-0.5}, civ:{[c.id]:-3}},
    hidden:{text:'The school has no accessible facilities yet; adapting them will add time.', chance:0.2, eff:{ind:{approval:-0.5}}}, hearingNote:'At the hearing, students present their own project proposals.', deadline:ri(st,40,70), earthIndividual:c.id === 'earth'}; },
  st => { const c = pick(st, memberCivs(st, false)); const f = pick(st, ['the Glass Wetlands','the Coral Spires','the Floating Forests','the Amber Steppes']); return {petitioner:genPerson(st)+' of '+c.name, civ:c.id, cls:'Environmental', urgency:pick(st,['Moderate','High']), title:`Restoration of ${f}`,
    background:`${f} on ${c.name} have lost much of their native life after decades of industrial runoff.`, request:'Fund a restoration programme.', evidence:['Ecological survey','Satellite imagery'], cost:ri(st,7,13)*100, benefits:'Healthier living worlds.', risks:'Restoration takes time and may displace local industry.',
    project:{name:`Restoration of ${f}`, cat:'environment', duration:ri(st,70,110), eff:{ind:{environment:3}, civ:{[c.id]:7}}}, rejectEff:{ind:{environment:-1}, civ:{[c.id]:-5}},
    hidden:{text:'Local industry has lobbied against the programme and may resist it.', chance:0.25, eff:{ind:{stability:-1}}}, hearingNote:'At the hearing, local industry agrees to a transition plan.', deadline:ri(st,40,70)}; },
  st => { const c = pick(st, memberCivs(st)); return {petitioner:genPerson(st)+' of '+c.name, civ:c.id, cls:'Cultural', urgency:'Low', title:`Recognition of the Festival of ${genName(st)}`,
    background:`${c.name} celebrates an ancient festival of lights and asks that it be recognised across the Cosmos.`, request:'Issue an official proclamation recognising the festival.', evidence:['Historical accounts of the festival'], cost:50, benefits:'Goodwill and cultural exchange.', risks:'Minimal.',
    project:{name:'Festival Recognition', cat:'development', duration:5, eff:{ind:{approval:1, trust:1}, civ:{[c.id]:5}}}, rejectEff:{civ:{[c.id]:-3}}, hidden:{text:'A neighbouring civilisation disputes the festival’s origins.', chance:0.15, eff:{ind:{trust:-0.5}}}, hearingNote:'At the hearing, the delegation performs a short ceremony.', deadline:ri(st,40,60)}; },
  st => ({petitioner:'Earth climate scientists (individual request)', civ:'earth', cls:'Scientific', urgency:'Moderate', title:'Responsible sharing of clean-energy knowledge with Earth',
    background:'A coalition of Earth scientists asks for carefully staged sharing of clean-energy principles, consistent with EARTH–001–COSMOS.', request:'Share foundational clean-energy research through COSMOS–EDU and Earth’s own institutions.', evidence:['Earth emissions data','Proposed staging plan to prevent misuse'], cost:300, benefits:'Supports Earth’s environment without overriding its independence.', risks:'Uneven distribution could strain relations between Earth nations.',
    project:{name:'Earth Clean-Energy Knowledge Programme', cat:'research', duration:60, eff:{ind:{science:1, environment:1}, civ:{earth:6}}}, rejectEff:{civ:{earth:-4}},
    hidden:{text:'Several Earth governments object that the plan favours nations that already have strong research institutions.', chance:0.3, eff:{civ:{earth:-4}}}, hearingNote:'At the hearing, the scientists agree to distribute access through a multinational body.', deadline:60, earthIndividual:true}),
  st => ({petitioner:'Guild of Council Clerks, Aurelia', civ:'aurelia', cls:'Administrative', urgency:'Low', title:'Modernisation of Council records',
    background:'Council clerks still rely on paper-crystal ledgers dating from before the Crowned Era.', request:'Fund a unified records system.', evidence:['Time studies of record retrieval'], cost:300, benefits:'Faster administration.', risks:'Transition disruption.',
    project:{name:'Unified Council Records', cat:'administration', duration:45, eff:{ind:{efficiency:2}}}, rejectEff:{ind:{efficiency:-0.5}}, hidden:{text:'The migration will pause routine processing for two weeks.', chance:0.3, eff:{ind:{efficiency:-1}}}, hearingNote:'At the hearing, the clerks propose a phased migration.', deadline:60})
];

function makePetition(st, spec) {
  const p = Object.assign({
    id:nid(st, 'PET'), submitted:st.day, status:'pending', log:[], advice:null, riskRevealed:false, hearingDone:false, councilReport:null, infoRequested:false, conditions:false
  }, deep(spec));
  p.deadlineDay = st.day + (spec.deadline || 40);
  delete p.deadline;
  return p;
}

/* ---------- Judicial cases ---------- */
function makeCase(st, spec) {
  const c = Object.assign({id:nid(st, 'TRB'), registered:st.day, stage:0, status:'open', asked:{}, revealedHidden:[], requestedEvidence:false, opinions:null, verdict:null, appeal:null, log:[]}, deep(spec));
  c.evidence = c.evidence.map((e, i) => Object.assign({id:'E' + (i + 1)}, e));
  c.hidden = (c.hidden || []).map((e, i) => Object.assign({id:'H' + (i + 1)}, e));
  return c;
}
const CASE_TEMPLATES = [
  st => { const ms = memberCivs(st, false).filter(c => c.kind !== 'capital'); const a = pick(st, ms); const b = pick(st, ms.filter(x => x.id !== a.id)); const res = pick(st, ['water ice of the moon Teshar','helium-3 fields of the Brightwell','asteroid belt of Kessan','comet harvest of the Long Orbit']);
    return genericCase(st, `${a.name} v. ${b.name}`, `Rights to the ${res}`, 'Resource allocation conflict', a, b, `${a.name} alleges that ${b.name} has taken more than its agreed share of the ${res}.`, ['Shared Resources Precedent (TRB-H-0007)','Cosmic Resource Accord §2']); },
  st => { const ms = memberCivs(st, false).filter(c => c.kind !== 'capital'); const a = pick(st, ms); const b = pick(st, ms.filter(x => x.id !== a.id)); const tr = pick(st, ['Treaty of Open Lanes','Compact of the Quiet Border','Accord of Shared Light']);
    return genericCase(st, `${a.name} v. ${b.name}`, `Alleged breach of the ${tr}`, 'Treaty violation', a, b, `${a.name} alleges that ${b.name} closed shared space lanes in breach of the ${tr}.`, [tr, 'Constitutional Principle 1']); },
  st => { const off = 'Administrator ' + genName(st); const a = civById(st, 'aurelia');
    return genericCase(st, `Council Inspectorate v. ${off}`, 'Misuse of administrative funds', 'Administrative misconduct', {name:'Council Inspectorate', id:'aurelia'}, {name:off, id:null}, `${off} is alleged to have redirected development funds to unlisted contractors.`, ['Treasury Code §9','Constitutional Principle 4']); },
  st => { const ms = memberCivs(st, false).filter(c => c.kind !== 'capital'); const a = pick(st, ms); const matter = pick(st, ['local education curricula','planetary trade tariffs','the appointment of regional wardens']);
    return genericCase(st, `${a.name} v. The Crown Administration`, `Limits of cosmic authority over ${matter}`, 'Dispute concerning cosmic authority', a, {name:'The Crown Administration', id:'aurelia'}, `${a.name} argues that a Council directive on ${matter} exceeds cosmic authority and violates its fundamental rights.`, ['Constitutional Principle 1','Constitutional Principle 6','Constitutional Principle 8'], true); },
  st => { const ms = memberCivs(st, false).filter(c => c.kind !== 'capital'); const a = pick(st, ms); const b = pick(st, ms.filter(x => x.id !== a.id)); const place = pick(st, ['the Mirror Sea','the Coldfire Nebula','the orbit of Halcyon']);
    return genericCase(st, `${a.name} v. ${b.name}`, `Pollution of ${place}`, 'Environmental violation', a, b, `${a.name} alleges that industrial venting by ${b.name} polluted ${place}.`, ['Cosmic Environmental Covenant §4']); }
];
function genericCase(st, title, subject, type, A, B, allegations, laws, crown) {
  const ev = [], titles = ['Sensor records','Financial ledger','Expert assessment','Official correspondence','Satellite survey','Logistics manifest','Internal memorandum'];
  const used = new Set();
  for (let i = 0; i < 4; i++) { let t; do { t = pick(st, titles); } while (used.has(t)); used.add(t); const w = Math.round((rnd(st) * 3 - 1.3) * 2) / 2 || 0.5; ev.push({title:t, desc:w > 0 ? `Supports the claim of ${A.name}.` : `Supports the position of ${B.name}.`, w}); }
  const hw = Math.round((rnd(st) * 4 - 2) * 2) / 2 || 1;
  const hidden = [{title:'Sealed testimony', desc:hw > 0 ? `A confidential source corroborates ${A.name}’s account.` : `A confidential source undermines ${A.name}’s account.`, w:hw}];
  const wq = () => { const w = Math.round((rnd(st) * 2.4 - 1) * 2) / 2; return w; };
  const w1 = wq(), w2 = wq(), w3 = wq(), w4 = wq();
  const total = ev.reduce((s, e) => s + e.w, 0) + hw + w1 + w2 + w3 + w4;
  const truth = clamp(Math.tanh(total / 3) + (rnd(st) - 0.5) * 0.2, -1, 1);
  const Aid = A.id, Bid = B.id;
  const civE = (a, b) => { const o = {}; if (Aid) o[Aid] = a; if (Bid && Bid !== Aid) o[Bid] = b; return o; };
  return {title, subject, type, claimant:{name:A.name, civ:Aid}, respondent:{name:B.name, civ:Bid}, allegations, laws,
    argC:`${A.name} asks the Tribunal to find in its favour and order a remedy.`, argR:`${B.name} denies the allegations and asks for dismissal.`,
    evidence:ev, hidden,
    witnesses:[
      {name:genPerson(st), role:`Official of ${A.name}`, qs:[{q:'What happened, in your own words?', a:w1 >= 0 ? 'Exactly what the claim says. I saw the records myself.' : 'Honestly, the records were less clear than our leaders say.', w:w1}, {q:'Who benefited?', a:w2 >= 0 ? `Only ${B.name}.` : 'Both sides, if I am candid.', w:w2}]},
      {name:genPerson(st), role:crown ? 'Council official' : `Official of ${B.name}`, qs:[{q:'Did your side follow the rules?', a:w3 <= 0 ? 'To the letter. We have the paperwork.' : 'Mostly. There were shortcuts under pressure.', w:w3}, {q:'Were you instructed to act as you did?', a:w4 > 0 ? 'Yes, by my superiors.' : 'No; I acted within my discretion.', w:w4}]}
    ],
    partyQs:{claimant:{q:'What outcome do you seek?', a:'Recognition of the harm and a fair remedy.', w:0.2}, respondent:{q:'Will you accept the Tribunal’s judgment?', a:'We will, though we expect to be vindicated.', w:-0.2}},
    remedies:[
      {key:'full', label:`Full remedy for ${A.name}`, detail:`${B.name} is found fully responsible.`, lean:1, eff:{ind:{}, civ:civE(10, -10)}, crownLoss:crown},
      {key:'partial', label:`Partial remedy for ${A.name}`, detail:'Responsibility is shared, with a proportionate remedy.', lean:0.5, eff:{ind:{trust:0.5}, civ:civE(6, -4)}, crownLoss:crown},
      {key:'settle', label:'Mediated settlement', detail:'Both parties are directed to a settlement under the Tribunal’s supervision.', lean:0, eff:{ind:{trust:1}, civ:civE(2, 2)}},
      {key:'respondent', label:`Find for ${B.name}`, detail:'The claim fails on the evidence.', lean:-0.6, eff:{ind:{}, civ:civE(-8, 6)}},
      {key:'dismiss', label:'Dismiss the claim', detail:'The claim is dismissed without remedy.', lean:-1, eff:{ind:{}, civ:civE(-10, 4)}}
    ], truth, crown:!!crown};
}

/* ---------- Crises ---------- */
const CRISIS_TPL = {
  stellar:{tags:['stellar'], title:c => `Stellar instability at ${c.system}`, desc:c => `The star ${c.system} is shedding mass in irregular pulses. ${c.name} faces rising radiation and flare storms.`, every:24,
    stages:['Irregular pulses detected.','Flare storms are disrupting orbital habitats.','Radiation is forcing populations underground.','Core collapse is imminent.'],
    dmg:[null, {ind:{stability:-2}, rel:-4}, {ind:{stability:-3, approval:-2}, pop:-0.4, rel:-5}, {ind:{stability:-5, trust:-3, approval:-2}, pop:-1.0, rel:-10}], cat:{ind:{stability:-8, approval:-6, trust:-4}, pop:-2.5, rel:-20},
    options:[
      {key:'evacuate', label:'Open evacuation portals', detail:'Devika Joshi’s portals move the most exposed populations to safety.', cost:900, tag:'portal', base:0.55, resolve:'full', eff:{ind:{approval:2, stability:1}, rel:6}},
      {key:'stabilise', label:'Stabilise the stellar core', detail:'Ria Vaidya channels celestial energy into the core. Stellar Engineering research improves the odds.', cost:1200, tag:'stellar', research:'stellar', base:0.38, resolve:'full', eff:{ind:{science:2, stability:2}, rel:12}},
      {key:'shield', label:'Raise flare shields', detail:'Ira Teny’s shields buy time and reduce the crisis by one stage.', cost:600, tag:'shield', base:0.65, resolve:'reduce', eff:{rel:3}},
      {key:'monitor', label:'Monitor and prepare', detail:'Observatories track the star. Delays escalation by 6 days, once per stage. No cost.', cost:0, base:1, resolve:'delay', eff:{}}
    ]},
  tidal:{tags:['tidal','ocean','environment'], title:c => `Tidal surges on ${c.name}`, desc:c => `Gravitational disturbances are driving catastrophic tides across ${c.name}.`, every:18,
    stages:['Unusual surges recorded.','Coastal cities are flooding.','Sea walls are failing.','Tidal collapse threatens entire regions.'],
    dmg:[null, {ind:{environment:-2}, rel:-3}, {ind:{environment:-3, stability:-2}, pop:-0.2, rel:-5}, {ind:{environment:-4, stability:-4, approval:-2}, pop:-0.5, rel:-8}], cat:{ind:{environment:-7, stability:-6, approval:-4}, pop:-1.2, rel:-15},
    options:[
      {key:'calm', label:'Calm the tides', detail:'Misha Shah commands the tides directly.', cost:700, tag:'tidal', base:0.5, resolve:'full', eff:{ind:{environment:2}, rel:10}},
      {key:'barrier', label:'Deploy shield barriers', detail:'Ira Teny shields the coasts while the seas settle (−1 stage).', cost:500, tag:'shield', base:0.65, resolve:'reduce', eff:{rel:3}},
      {key:'evac', label:'Evacuate coastal cities', detail:'Ria Sanghavi and the rapid-response corps move people inland.', cost:800, tag:'rapid', base:0.6, resolve:'full', eff:{ind:{approval:1}, rel:5}},
      {key:'monitor', label:'Monitor and prepare', detail:'Delays escalation by 6 days, once per stage.', cost:0, base:1, resolve:'delay', eff:{}}
    ]},
  storm:{tags:['storm','energy'], title:c => `Ion storm over ${c.name}`, desc:c => `A vast ion storm is collapsing power grids across ${c.name}.`, every:15,
    stages:['Grid fluctuations reported.','Regional blackouts.','Communications lost across a hemisphere.','Total grid failure.'],
    dmg:[null, {ind:{efficiency:-1}, rel:-3}, {ind:{stability:-2, efficiency:-2}, rel:-4}, {ind:{stability:-4, approval:-2}, pop:-0.1, rel:-8}], cat:{ind:{stability:-6, efficiency:-4, approval:-4}, pop:-0.3, rel:-12},
    options:[
      {key:'ground', label:'Absorb the storm', detail:'Vidyut Sundar draws the storm’s charge into himself and disperses it.', cost:600, tag:'storm', base:0.55, resolve:'full', eff:{ind:{stability:1}, rel:9}},
      {key:'repair', label:'Rapid grid repair', detail:'Kabir Khubchandani and engineering crews rebuild key stations (−1 stage).', cost:500, tag:'reconstruction', base:0.7, resolve:'reduce', eff:{rel:3}},
      {key:'coord', label:'Coordinate a cosmic relief grid', detail:'Esha Jain links neighbouring grids to share power.', cost:750, tag:'coordination', base:0.5, resolve:'full', eff:{ind:{efficiency:1, trust:1}, rel:6}},
      {key:'monitor', label:'Monitor and prepare', detail:'Delays escalation by 6 days, once per stage.', cost:0, base:1, resolve:'delay', eff:{}}
    ]},
  shortage:{tags:['supply','logistics'], title:c => `Essential supply shortage on ${c.name}`, desc:c => `A failed harvest and disrupted lanes have left ${c.name} short of food and medicine.`, every:16,
    stages:['Prices rising sharply.','Rationing introduced.','Unrest in major cities.','Famine conditions.'],
    dmg:[null, {ind:{approval:-1}, rel:-3}, {ind:{stability:-2, approval:-1}, rel:-5}, {ind:{stability:-4, approval:-3, trust:-2}, pop:-0.2, rel:-8}], cat:{ind:{stability:-6, approval:-5, trust:-3}, pop:-0.5, rel:-15},
    options:[
      {key:'airlift', label:'Super-speed supply airlift', detail:'Ria Sanghavi delivers supplies across the region in hours.', cost:800, tag:'rapid', base:0.6, resolve:'full', eff:{ind:{approval:2}, rel:8}},
      {key:'market', label:'Open emergency trade lanes', detail:'Esha Jain reroutes traders; cheaper but slower (−1 stage).', cost:300, tag:'coordination', base:0.7, resolve:'reduce', eff:{ind:{trust:1}, rel:2}},
      {key:'reserve', label:'Release strategic reserves', detail:'Draws directly on Crown reserves with no member needed.', cost:1100, base:0.8, resolve:'full', eff:{rel:5}},
      {key:'monitor', label:'Monitor and prepare', detail:'Delays escalation by 6 days, once per stage.', cost:0, base:1, resolve:'delay', eff:{}}
    ]},
  ecological:{tags:['environment','ecology'], title:c => `Biosphere collapse on ${c.name}`, desc:c => `A blight is spreading through the living systems of ${c.name}.`, every:20,
    stages:['Blight detected in outlying regions.','Crops and forests failing.','Ecosystem cascade under way.','Biosphere collapse.'],
    dmg:[null, {ind:{environment:-2}, rel:-3}, {ind:{environment:-3, approval:-1}, rel:-4}, {ind:{environment:-5, stability:-2}, pop:-0.1, rel:-8}], cat:{ind:{environment:-8, stability:-4, approval:-4}, pop:-0.3, rel:-14},
    options:[
      {key:'heal', label:'Protect and heal the biosphere', detail:'Anaya Deshmukh leads restoration of the living systems. Ecological research improves the odds.', cost:800, tag:'environment', research:'ecology', base:0.5, resolve:'full', eff:{ind:{environment:3}, rel:9}},
      {key:'quarantine', label:'Quarantine affected regions', detail:'Devika Joshi seals the blight zones with portals and barriers (−1 stage).', cost:400, tag:'security', base:0.7, resolve:'reduce', eff:{rel:1}},
      {key:'monitor', label:'Monitor and prepare', detail:'Delays escalation by 6 days, once per stage.', cost:0, base:1, resolve:'delay', eff:{}}
    ]}
};
function makeCrisis(st, tpl, civId) {
  const T = CRISIS_TPL[tpl], c = civById(st, civId);
  return {id:nid(st, 'EMG'), kind:'crisis', tpl, civ:civId, title:T.title(c), desc:T.desc(c), stage:1, nextEsc:st.day + Math.max(2, Math.round(T.every / ((st.settings && st.settings.crisisSpeed) || 1))), every:T.every, status:'active', created:st.day, monitored:{}, log:[`${fmtDate(st.day)}: ${T.stages[0]}`]};
}

/* ---------- Developments (non-crisis events with choices) ---------- */
const DEV_TEMPLATES = [
  {key:'dispute', w:3, make:st => { const ms = memberCivs(st, false).filter(c => c.kind !== 'capital'); const a = pick(st, ms), b = pick(st, ms.filter(x => x.id !== a.id)); return {title:`Resource dispute: ${a.name} and ${b.name}`, desc:`${a.name} and ${b.name} both claim the mineral-rich moon of ${genName(st)}. Tempers are rising in both assemblies.`, civ:a.id, civ2:b.id,
    options:[{key:'tribunal', label:'Refer the dispute to the Tribunal', detail:'Opens a judicial case. Slower but legitimate.', eff:{ind:{legitimacy:1}}, act:'case'},
      {key:'mediate', label:'Open mediated negotiations', detail:'Starts a negotiation at Concord Station.', eff:{ind:{trust:1}}, act:'negotiation'},
      {key:'divide', label:'Divide the moon by executive order', detail:'Fast, but bypasses the Tribunal.', eff:{ind:{efficiency:1, legitimacy:-3}, civ:{[a.id]:-3, [b.id]:-3}}},
      {key:'ignore', label:'Let them settle it themselves', detail:'No cost now; the dispute may grow.', eff:{ind:{stability:-2}, civ:{[a.id]:-2, [b.id]:-2}}}], def:'ignore'}; }},
  {key:'membership', w:2, make:st => { const c = st.civs.find(x => x.discovered && x.kind === 'observer'); if (!c) return null; return {title:`${c.name} requests membership`, desc:`${c.name} formally asks to join the Cosmos as a member civilisation. Membership is voluntary on both sides.`, civ:c.id,
    options:[{key:'accept', label:'Welcome them as members', detail:'They begin contributing and gain Crown protection.', eff:{ind:{trust:2, approval:1}, civ:{[c.id]:10}}, act:'member'},
      {key:'conditions', label:'Accept after an observation period', detail:'Membership in 90 days if relations stay above 50.', eff:{civ:{[c.id]:2}}, act:'member-later'},
      {key:'decline', label:'Decline for now', detail:'They remain independent.', eff:{civ:{[c.id]:-8}}}], def:'conditions'}; }},
  {key:'breakthrough', w:2, make:st => { const c = pick(st, memberCivs(st, false)); const what = pick(st, ['room-temperature fusion lattices','a cure for crystal fever','faster-than-light messaging','self-repairing habitats']); return {title:`Breakthrough on ${c.name}: ${what}`, desc:`Scientists on ${c.name} have achieved ${what}. The Crown holds licensing rights through its research grants.`, civ:c.id,
    options:[{key:'open', label:'Release it to all civilisations', detail:'Science and trust rise; no licence income.', eff:{ind:{science:3, trust:2}, civ:{[c.id]:3}}},
      {key:'license', label:'License it commercially', detail:'CC 900M in licence fees; some resentment.', eff:{ind:{science:1, trust:-1}, cc:900}},
      {key:'classify', label:'Classify it pending safety review', detail:'Safer, slower.', eff:{ind:{stability:1, science:0.5}, civ:{[c.id]:-3}}}], def:'classify'}; }},
  {key:'constitutional', w:2, make:st => { const topic = pick(st, ['whether Council directives bind independent civilisations','whether the Crown may sanction a civilisation without a Tribunal ruling','the limits of emergency powers']); return {title:'Constitutional disagreement among the Twelve', desc:`Aurion and Orionis are publicly divided on ${topic}. Other judges are taking sides.`,
    options:[{key:'review', label:'Convene a constitutional review', detail:'Opens a Tribunal case on the question.', eff:{ind:{legitimacy:2}}, act:'case-authority'},
      {key:'arbiter', label:'Ask the Prime Arbiter to mediate', detail:'A quiet resolution; both judges are heard.', eff:{ind:{legitimacy:1, efficiency:-1}}, char:{aurion:2, orionis:2}},
      {key:'decree', label:'Issue an executive clarification', detail:'Decisive, but some judges see it as overreach.', eff:{ind:{efficiency:2, legitimacy:-3}}, char:{aurion:-6, vespera:-3, orionis:3}}], def:'arbiter'}; }},
  {key:'summit', w:2, make:st => { const ms = memberCivs(st, false).filter(c => c.kind !== 'capital'); const a = pick(st, ms), b = pick(st, ms.filter(x => x.id !== a.id)); return {title:'Proposal for a diplomatic summit', desc:`${a.name} proposes a summit with ${b.name} at Concord Station to agree shared trade lanes.`, civ:a.id, civ2:b.id,
    options:[{key:'host', label:'Host the summit (CC 300M)', detail:'Opens a negotiation with a head start.', cost:300, eff:{ind:{trust:1}}, act:'negotiation-strong'},
      {key:'envoy', label:'Send an envoy only', detail:'A modest gesture.', cost:80, eff:{civ:{[a.id]:2, [b.id]:2}}},
      {key:'decline', label:'Decline', detail:'Saves resources.', eff:{civ:{[a.id]:-3}}}], def:'envoy'}; }},
  {key:'councilDispute', w:2, make:st => { const m = st.chars.filter(c => c.type === 'council' && !c.sovereign); if (m.length < 2) return null; const a = pick(st, m), b = pick(st, m.filter(x => x.id !== a.id)); return {title:`Council dispute: ${a.name} and ${b.name}`, desc:`${a.name} and ${b.name} disagree over which department leads relief operations in the outer territories.`,
    options:[{key:'a', label:`Side with ${a.name}`, detail:`${a.name}’s trust rises; ${b.name}’s falls.`, eff:{ind:{efficiency:1}}, char:{[a.id]:6, [b.id]:-6}},
      {key:'b', label:`Side with ${b.name}`, detail:`${b.name}’s trust rises; ${a.name}’s falls.`, eff:{ind:{efficiency:1}}, char:{[a.id]:-6, [b.id]:6}},
      {key:'committee', label:'Create a joint committee', detail:'Both lead together; slower but harmonious.', eff:{ind:{efficiency:-1}}, char:{[a.id]:2, [b.id]:2}, act:'committee', actData:{members:[a.id, b.id]}}], def:'committee'}; }},
  {key:'eduAssist', w:2, make:st => { const inst = pick(st, st.edu.institutions); if (!inst) return null; return {title:`${inst.name} requests assistance`, desc:`${inst.name} reports a shortage of trained teachers for COSMOS–EDU modules.`, civ:inst.civ,
    options:[{key:'fund', label:'Fund a teacher fellowship (CC 400M)', detail:'Education rises across the programme.', cost:400, eff:{ind:{education:2}, civ:{[inst.civ]:3}}},
      {key:'partial', label:'Provide training materials (CC 120M)', detail:'A smaller boost.', cost:120, eff:{ind:{education:0.8}}},
      {key:'refer', label:'Refer to the Council', detail:'The Council absorbs it within existing budgets.', eff:{ind:{efficiency:-1, education:0.3}}}], def:'refer'}; }},
  {key:'corporate', w:1.5, make:st => { const s = pick(st, st.rg.subsidiaries); const what = pick(st, ['a supplier contamination scare','a data breach','a labour dispute','a viral negative review campaign']); return {title:`Rungta Global: ${what} at ${s.name}`, desc:`${s.name} faces ${what}. This is an Earthly corporate matter; cosmic funds cannot be used.`, corporate:true, sub:s.id,
    options:[{key:'recall', label:'Act decisively (Rungta Global pays $40M)', detail:'Reputation protected.', rgCost:40, rg:{reputation:2, rating:0.1}},
      {key:'pr', label:'Communications response ($8M)', detail:'Cheaper; partial recovery.', rgCost:8, rg:{reputation:-1, rating:-0.05}},
      {key:'wait', label:'Wait for it to pass', detail:'No cost; reputation suffers.', rg:{reputation:-4, rating:-0.2}}], def:'wait'}; }},
  {key:'discovery', w:1.2, make:st => { const name = 'The ' + pick(st, ['Ember','Glass','Hollow','Saffron','Iron','Pale','Lantern','Velvet','Cinder','Mirror']) + ' ' + pick(st, ['Concord','Assembly','Dominion','Commonwealth','Synod','League','Collective','Accord']); return {title:'Discovery of an unknown civilisation', desc:`Deep-survey probes have detected a previously unknown civilisation calling itself ${name}.`, newCiv:name,
    options:[{key:'contact', label:'Send a first-contact mission (CC 350M)', detail:'They are added to the map as observers with good relations.', cost:350, eff:{ind:{science:1}}, act:'discover-warm'},
      {key:'observe', label:'Observe quietly', detail:'They are added to the map; relations start neutral.', eff:{}, act:'discover'},
      {key:'broadcast', label:'Broadcast a welcome', detail:'Generous, but reveals the Cosmos before they are ready.', eff:{ind:{trust:1}}, act:'discover-risky'}], def:'observe'}; }},
  {key:'ancient', w:0.8, make:st => { if (st.flags.ancientStage >= 1) return null; return {title:'A message from an ancient cosmic entity', desc:'A signal older than the Crowned Era has been received at the Lumen Deep Index. It repeats a single phrase in a dead language: “The fourth door is not yet built.”',
    options:[{key:'decode', label:'Commission the Lumen Archive to decode it (CC 250M)', detail:'Science rises; the mystery continues.', cost:250, eff:{ind:{science:1}}, act:'ancient'},
      {key:'spirits', label:'Consult the Ancient Spirits through the Hidden Verdict door', detail:'The Spirits may answer. The Twelve are uneasy.', eff:{ind:{legitimacy:-1}}, act:'ancient-spirits'},
      {key:'ignore', label:'File it in the archives', detail:'No action.', eff:{}}], def:'ignore'}; }},
  {key:'earthCollective', w:0.6, make:st => { if (st.flags.earthCollectiveTried) return null; return {title:'Earth civil society seeks a second collective petition', desc:'A coalition of Earth organisations has submitted what it calls a second collective planetary petition. Under the Constitution, Earth’s collective petition privilege is available once per millennium.', civ:'earth',
    options:[{key:'individual', label:'Consider it as individual requests', detail:'Honours the millennium rule while hearing Earth’s concerns.', eff:{ind:{legitimacy:1}, civ:{earth:3}}, act:'earth-individual'},
      {key:'refuse', label:'Decline as ineligible', detail:'Constitutionally correct; disappointing for Earth.', eff:{ind:{legitimacy:1}, civ:{earth:-4}}},
      {key:'waive', label:'Waive the millennium rule', detail:'Popular on Earth, but sets aside a constitutional rule.', eff:{ind:{legitimacy:-5, approval:1}, civ:{earth:6}}, char:{aurion:-6, kaelith:-3}}], def:'individual'}; }}
];
const CRISIS_SPAWN = [{tpl:'tidal', civs:['thalassine','earth','sylvan']}, {tpl:'storm', civs:['veyari','korr','aurelia','vael']}, {tpl:'shortage', civs:['ashen','sylvan','korr','thalassine']}, {tpl:'ecological', civs:['sylvan','earth','veyari']}, {tpl:'stellar', civs:['vael','veyari','lumen']}];
