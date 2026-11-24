/* ===== CommandInterpreter: natural-language instructions → validated game actions ===== */
const CMD_EXAMPLES = ['Convene the Cosmic Tribunal immediately', 'Request a complete treasury report', 'Invite the representatives of Earth', 'Establish a new educational institution', 'Ask the Prime Arbiter for an independent assessment', 'Schedule a Royal Cosmic Council meeting', 'Review all pending petitions', 'Prepare a diplomatic summit', 'Draft a new Cosmic Act', 'Request an update on COSMOS–EDU', 'Allocate 200 to research', 'Cut administration by 100', 'Approve PET-0004', 'Send an envoy to the Korr Hegemony', 'Fund stellar engineering research', 'Report from Devika Joshi', 'Advance one month', 'Pause', 'Save the game', 'Open the universe map'];
const NUMW = {one:1, a:1, an:1, two:2, three:3, four:4, five:5, six:6, seven:7, ten:10};
function findCiv(t) { return ST.civs.filter(c => c.discovered).find(c => t.includes(c.name.toLowerCase()) || t.includes(c.name.toLowerCase().replace(/^the /, '')) || t.includes(c.id) || t.includes(c.name.toLowerCase().split(' ')[0])); }
function findMember(t) { return councilMembers(ST).filter(m => !m.sovereign).find(m => t.includes(m.name.toLowerCase()) || t.includes(m.name.toLowerCase().split(' ')[0]) && !['ria'].includes(m.name.toLowerCase().split(' ')[0])) || (t.includes('ria s') || t.includes('swiftblade') ? charById(ST, 'riaS') : t.includes('ria v') || t.includes('celestial energy') ? charById(ST, 'riaV') : null); }
function findBudgetCat(t) { const syn = {education:'education', school:'education', health:'healthcare', healthcare:'healthcare', medical:'healthcare', research:'research', science:'research', infrastructure:'infrastructure', environment:'environment', environmental:'environment', restoration:'environment', emergency:'emergency', administration:'administration', admin:'administration', diplomacy:'diplomacy', diplomatic:'diplomacy', development:'development'}; for (const k in syn) if (t.includes(k)) return syn[k]; return null; }

function interpret(raw) {
  const text = String(raw || '').trim(); const t = text.toLowerCase().replace(/[–—]/g, '-');
  if (!t) return {ok:false, msg:'Type an instruction first.'};
  // Constitutional refusals: explain rather than pretend
  if (/(override|annex|govern|rule over|take over|take control|administer|control)\b.*\bearth|earth('s)?\b.*(laws?|government|nations?).*(override|replace|abolish|control)/.test(t)) return {ok:false, msg:'Refused. Earth remains an independent civilisation (Constitutional Principle 3). The Crown can cooperate with Earth, but cannot govern it or override its laws.'};
  if (/(cosmic|treasury|credits|cc).*(rungta|india express|corporate)|(rungta|india express).*(cosmic funds|treasury|credits)/.test(t)) return {ok:false, msg:'Refused. Rungta Global and the Cosmic Treasury keep separate finances. Cosmic Credits cannot fund the business, and business funds cannot enter the treasury.'};
  if (/(force|compel|order|require)\b.*\b(join|membership|become a member)/.test(t)) return {ok:false, msg:'Refused. Invitations to the Cosmos are voluntary (Constitutional Principle 5). You can invite an observer civilisation from its dossier.'};
  if (/(punish|sanction).*(allies|neighbou?rs|everyone|all of them)/.test(t)) return {ok:false, msg:'Refused. No innocent civilisation may be punished for the actions of another (Constitutional Principle 9).'};
  if (/^(help|commands|what can|\?)/.test(t)) return {ok:true, msg:'Supported instructions include: ' + CMD_EXAMPLES.join('; ') + '.', nav:() => { UI.tab.office = 'command'; go('office'); }};
  // Time
  if (/^(pause|stop time|halt)/.test(t)) return {ok:true, msg:'Time paused.', run:() => setSpeed('paused')};
  if (/^(resume|play|start time|continue)/.test(t)) return {ok:true, msg:'Time resumed at normal speed.', run:() => setSpeed('normal')};
  if (/fast.?forward/.test(t)) return {ok:true, msg:'Fast-forward engaged. Major emergencies will halt it.', run:() => setSpeed('fast')};
  let m = t.match(/(advance|skip|pass|wait)\b.*?\b(\d+|one|a|an|two|three|four|five|six|seven|ten)?\s*(day|week|month|year)s?/);
  if (m) { const n = m[2] ? (NUMW[m[2]] || parseInt(m[2], 10)) : 1; const days = n * {day:1, week:7, month:30, year:360}[m[3]]; if (!Number.isFinite(days) || days < 1 || days > 3600) return {ok:false, msg:'Advance between one day and ten years at a time.'}; return {ok:true, msg:`Advancing ${n} ${m[3]}${n > 1 ? 's' : ''}.`, run:() => { const s = advanceDays(days); return s ? 'Time halted early by an emergency.' : `Now ${fmtDate(ST.day)}.`; }}; }
  if (/\bsave\b/.test(t) && !/scholar/.test(t)) return {ok:true, msg:'', run:() => { const r = SaveManager.save('quicksave', 'Quick save', ST); return r.msg; }};
  // Tribunal
  if (/(convene|summon|open|assemble).*tribunal|tribunal.*(session|convene)/.test(t)) return {ok:true, msg:openCases().length ? `The Tribunal is convened. ${openCases()[0].id} is before it.` : 'The Tribunal is convened, but the docket is empty.', nav:() => { UI.tab.tribunal = 'docket'; if (openCases()[0]) UI.sel.case = openCases()[0].id; go('tribunal'); }};
  // Treasury
  if (/treasury report|financial report|report on the treasury|state of the treasury/.test(t)) return {ok:true, msg:'Treasury report prepared.', run:() => { const d = makeDoc(ST, 'treasury', 'Complete Treasury Report', treasuryReportBody(), 'TREASURY'); setTimeout(() => openDoc(d.id), 30); }};
  m = t.match(/(allocate|increase|add|raise|boost|fund)\s+(?:cc\s*)?(\d[\d,]*)\s*(?:m|million|cc)?\s*(?:more\s+)?(?:to|for|into|in)\s+(?:the\s+)?([a-z ]+)/);
  if (m) {
    const amt = parseInt(m[2].replace(/,/g, ''), 10);
    if (/reserve/.test(m[3])) return {ok:true, confirm:{title:`Allocate ${fmtCC(amt)} to the emergency reserve`, preview:[{t:`Balance −${fmt(amt)}M`, neg:true}, {t:`Reserve +${fmt(amt)}M`}]}, run:() => transferToReserve(ST, amt)};
    const cat = findBudgetCat(m[3]); if (!cat) return {ok:false, msg:`“${m[3].trim()}” is not a budget category. Categories: ${BUDGET_CATS.map(b => b.label).join(', ')}.`};
    const b = BUDGET_CATS.find(x => x.key === cat), nv = ST.treasury.budget[cat] + amt;
    return {ok:true, confirm:{title:`Raise the ${b.label} budget by ${fmtCC(amt)} a month`, preview:[{t:`${b.label}: ${fmt(ST.treasury.budget[cat])}M → ${fmt(nv)}M per month`}, {t:`Spending +${fmt(amt)}M per month`, neg:true}].concat(Object.keys(b.eff).map(k => ({t:`${IND_SHORT[k]} improves monthly`}))), note:'The change applies from the next monthly settlement.'}, run:() => { const r = setBudget(ST, cat, nv); return r.ok ? {ok:true, msg:`${b.label} budget set to ${fmtCC(nv)} a month.`} : r; }};
  }
  m = t.match(/(cut|reduce|decrease|lower)\s+(?:the\s+)?([a-z ]+?)\s+(?:budget\s+)?by\s+(?:cc\s*)?(\d[\d,]*)/);
  if (m) { const cat = findBudgetCat(m[2]); const amt = parseInt(m[3].replace(/,/g, ''), 10); if (!cat) return {ok:false, msg:`“${m[2].trim()}” is not a budget category.`}; const b = BUDGET_CATS.find(x => x.key === cat), nv = Math.max(0, ST.treasury.budget[cat] - amt); return {ok:true, confirm:{title:`Cut the ${b.label} budget by ${fmtCC(amt)} a month`, preview:[{t:`${b.label}: ${fmt(ST.treasury.budget[cat])}M → ${fmt(nv)}M per month`}, {t:`Spending −${fmt(amt)}M per month`}].concat(nv < b.base ? Object.keys(b.eff).map(k => ({t:`${IND_SHORT[k]} declines monthly`, neg:true})) : [])}, run:() => setBudget(ST, cat, nv)}; }
  // Petitions
  m = t.match(/(approve|reject|defer)\s+(?:petition\s+)?(pet-?\s*\d+)/);
  if (m) { const id = 'PET-' + m[2].replace(/\D/g, '').padStart(4, '0'); const p = ST.petitions.find(x => x.id === id); if (!p) return {ok:false, msg:`There is no petition ${id}.`}; if (p.status !== 'pending') return {ok:false, msg:`${id} is not awaiting a decision (status: ${p.status}).`}; const a = m[1]; return {ok:true, confirm:{title:`${cap(a)} ${id}: ${p.title}`, preview:a === 'approve' ? describeEff(ST, p.project.eff, Math.round(p.cost * (p.hearingDiscount ? 0.85 : 1))) : a === 'reject' ? describeEff(ST, p.rejectEff) : [{t:'Deadline +30 days'}, {t:'Petitioner relation falls slightly', neg:true}], note:a === 'approve' && p.hidden && !p.riskRevealed ? 'Further information has not been requested. Some risks may be unexamined.' : ''}, run:() => petAction(ST, id, a), nav:() => { UI.sel.pet = id; go('petitions'); }}; }
  if (/(review|show|list|see|open).*(petitions?)|petitions office/.test(t)) return {ok:true, msg:`${pendingPetitions().length} petitions await decision.`, nav:() => { UI.filter.pet = 'open'; go('petitions'); }};
  // Earth
  if (/invite.*(representatives?|delegat|envoys?).*earth|earth.*(delegation|representatives)/.test(t)) return {ok:true, confirm:{title:'Invite the representatives of Earth', preview:[{t:'Treasury −100M', neg:true}, {t:'Earth +3'}, {t:'Trust +0.5'}], note:'Earth’s delegates are received as representatives of an independent civilisation.'}, run:() => earthAction(ST, 'delegation')};
  if (/(visit|travel to).*earth/.test(t)) return {ok:true, confirm:{title:'Make an official visit to Earth', preview:[{t:'Treasury −150M', neg:true}, {t:'Approval +2 on return'}, {t:'Earth +4 on return'}]}, run:() => earthAction(ST, 'visit')};
  // Education
  if (/cosmos.?edu|update on (the )?education|education (update|report)/.test(t)) return {ok:true, msg:'COSMOS–EDU update prepared.', run:() => { const E = ST.edu; const d = makeDoc(ST, 'report', 'COSMOS–EDU Programme Update', `COSMOS–EDU PROGRAMME UPDATE\nDate: ${fmtDate(ST.day)}\n\nEducational Accessibility: ${fmt(ST.ind.education)}/100\nInstitutions: ${E.institutions.length}\n${E.institutions.map(i => `— ${i.name} (${civName(ST, i.civ)}): ${i.status}, ${fmt(i.students)} students${i.accessible ? ', fully accessible' : ''}`).join('\n')}\n\nScholarships funded: ${fmt(E.scholarships)}\nModules: ${EDU_MODULES.filter(m => E.modules[m.key]).map(m => m.name).join(', ')}\nPartners: ${E.partnerships.join(', ') || 'none yet'}\nMonthly programme cost: ${fmtCC(recurringCosts(ST).edu)}\n\nThe pilot at Dhirubhai Ambani International School remains the model for expansion under EARTH–DAIS–001.`, 'EARTH–DAIS–001'); setTimeout(() => openDoc(d.id), 30); }};
  if (/(establish|create|found|open|build).*(school|institution|academy|university|educational)/.test(t)) return {ok:true, msg:'Name the new institution and choose its civilisation, then confirm. Institutions need the host civilisation’s consent.', nav:() => { go('education'); setTimeout(() => { const el = document.getElementById('eduName'); if (el) { el.focus(); el.scrollIntoView({block:'center'}); } }, 60); }};
  // Advisers
  if (/prime arbiter|independent assessment|assessment/.test(t)) return {ok:true, msg:'', run:() => assessmentModal()};
  if (/(schedule|convene|call|hold).*(council|meeting)/.test(t)) return {ok:true, msg:'', run:() => meetingModal()};
  const mem = /report/.test(t) ? findMember(t) : null;
  if (mem) return {ok:true, msg:'', run:() => { const r = memberReport(ST, mem.id); const d = ST.documents[0]; setTimeout(() => openDoc(d.id), 30); return r.msg; }};
  // Diplomacy
  if (/summit/.test(t)) return {ok:true, msg:'Choose the two parties and the topic for the summit at Concord Station.', nav:() => { go('diplomacy'); setTimeout(() => { const el = document.getElementById('sumA'); if (el) { el.focus(); el.scrollIntoView({block:'center'}); } }, 60); }};
  m = t.match(/(envoy|ambassador)\s+to\s+(.+)/);
  if (m) { const c = findCiv(m[2]); if (!c) return {ok:false, msg:`No known civilisation matches “${m[2]}”.`}; return {ok:true, confirm:{title:`Send an envoy to ${c.name}`, preview:[{t:'Treasury −120M', neg:true}, {t:`${c.name} +2 to +5`}]}, run:() => civAction(ST, c.id, 'envoy')}; }
  m = t.match(/(aid|assistance|relief)\s+(?:package\s+)?(?:to|for)\s+(.+)/);
  if (m) { const c = findCiv(m[2]); if (!c) return {ok:false, msg:`No known civilisation matches “${m[2]}”.`}; return {ok:true, confirm:{title:`Send an aid package to ${c.name}`, preview:[{t:'Treasury −800M', neg:true}, {t:`${c.name} +8`}, {t:'Trust +1'}, {t:'Approval +0.5'}]}, run:() => civAction(ST, c.id, 'aid')}; }
  // Laws
  m = t.match(/draft.*\b(act|law|order|amendment|directive|treaty|charter|proclamation)\b/);
  if (m) { const map = {act:'act', law:'act', order:'eo', amendment:'amend', directive:'directive', treaty:'treaty', charter:'charter', proclamation:'proclamation'}; return {ok:true, msg:`A new ${LAW_TYPES.find(x => x.key === map[m[1]]).label} is open for drafting.`, nav:() => { UI.draft = {type:map[m[1]], title:'', text:'', impl:'', provisions:[], target:''}; UI.review = null; UI.tab.legislature = 'draft'; go('legislature'); setTimeout(() => { const el = document.getElementById('lawTitle'); if (el) el.focus(); }, 60); }}; }
  // Research
  const tr = RESEARCH_TRACKS.find(x => t.includes(x.name.toLowerCase()) || t.includes(x.key));
  if (tr && /(fund|research|study|begin|start)/.test(t)) { const c = researchCost(ST, tr.key); return {ok:true, confirm:{title:`Fund ${tr.name} level ${c.lvl}`, preview:[{t:`Treasury −${fmt(c.cost)}M`, neg:true}, {t:`${c.duration} days`}, {t:'Science +2 on completion'}], note:tr.bonus}, run:() => fundResearch(ST, tr.key)}; }
  // Navigation
  const nav = SCREEN_LIST.find(([k, l]) => t.includes(l.toLowerCase().replace('’s', '').replace('sovereign ', '')) || t.includes(k) || (k === 'map' && /map|universe/.test(t)) || (k === 'civs' && /civilisations|civilizations/.test(t)) || (k === 'emergency' && /emergenc/.test(t)) || (k === 'rungta' && /rungta|india express/.test(t)) || (k === 'office' && /private office|office/.test(t)) || (k === 'settings' && /settings|saves?\b|load/.test(t)) || (k === 'archives' && /archive/.test(t)));
  if (nav && /(open|go|show|view|take me|display|navigate|see)/.test(t)) return {ok:true, msg:`Opening ${nav[1]}.`, nav:() => go(nav[0])};
  return {ok:false, msg:`“${text}” is not an instruction the Crown’s offices can carry out yet. Nothing has been changed. Type “help” to see supported instructions.`};
}
function issueCommand(text) {
  const r = interpret(text);
  const log = res => { ST.cmdLog.unshift({day:ST.day, text, ok:r.ok, result:res}); if (ST.cmdLog.length > 60) ST.cmdLog.length = 60; };
  if (!r.ok) { log(r.msg); toast(r.msg, 'bad'); render(true); return; }
  const exec = () => {
    let out = r.run ? r.run() : null;
    if (r.nav) r.nav();
    let msg = r.msg || '';
    if (out && typeof out === 'object') { msg = out.msg || msg; if (!out.ok) { log(msg); toast(msg, 'bad'); render(true); return; } }
    else if (typeof out === 'string') msg = out;
    log(msg || 'Done.'); if (msg) toast(msg, 'good'); AUDIO.play('click'); flushSfx(); autosave(); render(true);
  };
  if (r.confirm) confirmBox(Object.assign({eyebrow:'Command preview', confirmLabel:'Confirm instruction', onConfirm:exec}, r.confirm));
  else exec();
}
function assessmentModal() {
  const ks = IND_KEYS.slice().sort((a, b) => ST.ind[b] - ST.ind[a]);
  const best = ks[0], worst = ks[ks.length - 1];
  const h = ST.treasury.hist.slice(-3); const trend = h.length >= 2 ? h[h.length - 1].balance - h[0].balance : 0;
  const recs = [];
  activeCrises().sort((a, b) => b.stage - a.stage).slice(0, 1).forEach(e => recs.push(`Respond to ${e.title} before it reaches stage ${e.stage + 1}.`));
  pendingPetitions().sort((a, b) => a.deadlineDay - b.deadlineDay).slice(0, 1).forEach(p => recs.push(`Decide ${p.id} (${p.title}); its deadline is ${fmtDate(p.deadlineDay)}.`));
  if (ST.ind[worst] < 70) { const b = BUDGET_CATS.find(x => x.eff[worst]); recs.push(`${IND_LABEL[worst]} is your weakest indicator.${b ? ` Consider raising the ${b.label} budget.` : ''}`); }
  if (trend < -2000) recs.push('The treasury has fallen sharply over recent months. Review the budget.');
  const jt = judges(ST).reduce((a, j) => a + j.trust, 0) / 12; const low = judges(ST).filter(j => j.trust < 60);
  if (low.length) recs.push(`${low.map(j => j.name).join(', ')} ${low.length > 1 ? 'have' : 'has'} lost confidence in your leadership.`);
  if (!recs.length) recs.push('The Cosmos is in good order. Use this calm to invest in research and education.');
  const text = `Sovereign, my independent assessment. Your strongest position is ${IND_LABEL[best]} at ${fmt(ST.ind[best])}; your weakest is ${IND_LABEL[worst]} at ${fmt(ST.ind[worst])}. The treasury stands at ${fmtCC(ST.treasury.balance)}${h.length >= 2 ? `, ${trend >= 0 ? 'up' : 'down'} ${fmtCC(Math.abs(trend))} over the last quarter` : ''}. The Twelve’s average trust in you is ${fmt(jt)}.`;
  const d = makeDoc(ST, 'briefing', 'Independent Assessment of the Prime Arbiter', text + '\n\nRecommendations:\n' + recs.map((r, i) => `${i + 1}. ${r}`).join('\n'), 'ARBITER');
  openModal(`<div class="eyebrow">${esc(fmtDate(ST.day))}</div><h2>Independent assessment</h2><div class="briefing" style="margin-top:10px">${sigil('Prime Arbiter', 45, 56)}<div><blockquote>${esc(text)}</blockquote><cite>The Prime Arbiter</cite></div></div><h3 style="margin-top:14px">Recommendations</h3><ol style="font-size:14px">${recs.map(r => `<li>${esc(r)}</li>`).join('')}</ol><div class="foot"><button class="btn" data-act="doc" data-id="${d.id}">View as document</button><button class="btn primary" data-act="closeModal">Thank you</button></div>`, {label:'Assessment'});
}
