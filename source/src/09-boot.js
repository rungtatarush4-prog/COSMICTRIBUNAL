/* ===== Rendering, input wiring, chamber + map renderers, boot ===== */
const $ = (s, r = document) => r.querySelector(s);
function go(screen) { if (!SCREENS[screen]) return; UI.screen = screen; closeModal(); $('#rail').classList.remove('open'); render(true); window.scrollTo(0, 0); AUDIO.apply(); try { history.replaceState(null, '', '#' + screen); } catch (e) {} }

function buildShell() {
  const items = SCREEN_LIST.slice(); if (ST && ST.meta.mode === 'creative') items.push(['editor', 'World Editor', 'wand']);
  $('#rail').innerHTML = `<div class="brand">${sealSVG(42)}<div><b>Cosmic Tribunal</b><span>Sovereignty beyond worlds</span></div></div><nav class="nav" aria-label="Departments">${items.map(([k, l, ic], i) => `${i === 11 || i === 13 ? '<div class="nav-group">' + (i === 11 ? 'Earthly affairs' : 'Records and command') + '</div>' : i === 0 ? '<div class="nav-group">The Crown</div>' : i === 3 ? '<div class="nav-group">The Cosmos</div>' : ''}<button data-act="go" data-screen="${k}" id="nav-${k}">${icon(ic)}<span>${l}</span><span class="badge" id="nb-${k}" hidden></span></button>`).join('')}</nav>`;
  $('#opsbar').innerHTML = `<button class="iconbtn" id="menuBtn" data-act="menu" aria-label="Open navigation">${icon('menu')}</button>
  <div class="datebox"><b id="opsDate"></b><span id="opsDay"></span></div>
  <div class="timectl" role="group" aria-label="Time controls"><button data-act="speed" data-s="paused" id="sp-paused">Pause</button><button data-act="speed" data-s="normal" id="sp-normal">Play</button><button data-act="speed" data-s="fast" id="sp-fast">Fast</button><button data-act="adv" data-n="1" title="Advance one day">+1d</button><button data-act="adv" data-n="7" title="Advance one week">+1w</button><button data-act="adv" data-n="30" title="Advance one month">+1m</button><button data-act="adv" data-n="360" title="Advance one year">+1y</button></div>
  <form class="cmdwrap" data-form="cmd" autocomplete="off">${icon('search', 15)}<input type="text" id="cmdInput" aria-label="Sovereign’s command" placeholder="Issue a command: “Convene the Cosmic Tribunal”, “Allocate 200 to research”…"></form>
  <div class="opsstats"><div class="opsstat"><small>Treasury</small><b id="opsTreasury"></b></div><div class="opsstat hide-md"><small>Approval</small><b id="opsApproval"></b></div><div class="opsstat hide-md"><small>Stability</small><b id="opsStability"></b></div></div>
  <button class="iconbtn" data-act="sound" id="soundBtn" aria-label="Toggle sound"></button>
  <button class="iconbtn" data-act="drawer" aria-label="Notifications">${icon('bell')}<span class="badge red" id="bellBadge" hidden></span></button>`;
}
function renderOps() {
  if (!ST) return;
  $('#opsDate').textContent = fmtDate(ST.day);
  $('#opsDay').textContent = `Day ${fmt(ST.day)} of the reign · ${UI.speed === 'paused' ? 'paused' : UI.speed === 'fast' ? 'fast-forward' : 'running'}`;
  ['paused','normal','fast'].forEach(s => $('#sp-' + s).setAttribute('aria-pressed', UI.speed === s));
  $('#opsTreasury').textContent = fmtCC(ST.treasury.balance);
  $('#opsApproval').textContent = fmt(ST.ind.approval);
  $('#opsStability').textContent = fmt(ST.ind.stability);
  $('#soundBtn').innerHTML = icon(PREFS.muted ? 'mute' : 'sound');
  const un = ST.notifications.filter(n => !n.read).length; const bb = $('#bellBadge'); bb.hidden = !un; bb.textContent = un > 99 ? '99+' : un;
}
function renderRail() {
  const set = (k, n, red) => { const b = $('#nb-' + k); if (!b) return; b.hidden = !n; b.textContent = n; b.classList.toggle('red', !!red); };
  set('dashboard', activeDevs().length); set('petitions', pendingPetitions().length); set('tribunal', openCases().length);
  set('emergency', activeCrises().length, true); set('council', ST.council.recommendations.filter(r => r.status === 'pending').length); set('diplomacy', activeNegs().length);
  SCREEN_LIST.concat([['editor']]).forEach(([k]) => { const b = $('#nav-' + k); if (b) b.setAttribute('aria-current', UI.screen === k ? 'page' : 'false'); });
}
function render(force) {
  if (!ST) return;
  renderOps(); renderRail();
  const main = $('#main'); const ae = document.activeElement;
  const typing = ae && main.contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && ae.type !== 'checkbox' && ae.type !== 'radio';
  if (!force && (typing || Date.now() - UI.lastRender < 650)) return;
  if (!force && ['map'].includes(UI.screen) && UI.mapInteracting) return;
  UI.lastRender = Date.now();
  const scr = SCREENS[UI.screen] ? UI.screen : 'dashboard';
  try { main.innerHTML = SCREENS[scr](); } catch (e) { console.error(e); main.innerHTML = `<div class="screen">${plate('This screen failed to render', `<p>${esc(e.message)}</p><button class="btn" data-act="go" data-screen="dashboard">Return to the dashboard</button>`)}</div>`; }
  const ch = $('#chamberMain canvas'); if (ch) drawChamber(ch);
  if (scr === 'map') initMap();
  if (UI.refocus) { const el = document.getElementById(UI.refocus); if (el) { el.focus(); try { const n = el.value.length; el.setSelectionRange(n, n); } catch (e) {} } UI.refocus = null; }
  if (UI.drawer) renderDrawer();
}
function renderDrawer() {
  $('#drawer').innerHTML = `<header><h2 style="font-size:20px">Notification centre</h2><div class="btnrow"><button class="btn sm ghost" data-act="readAll">Mark all read</button><button class="btn sm" data-act="drawer">Close</button></div></header><div class="body">${notifList(ST.notifications.slice(0, 120))}</div>`;
}

/* ---------- Actions ---------- */
const val = id => { const el = document.getElementById(id); return el ? el.value : ''; };
const ACT = {
  go:d => go(d.screen), closeModal:() => closeModal(),
  confirmYes:d => { const fn = PENDING[d.id]; delete PENDING[d.id]; closeModal(); if (fn) fn(); },
  menu:() => $('#rail').classList.toggle('open'),
  speed:d => { if (d.s !== 'paused') AUDIO.play('click'); setSpeed(d.s); },
  adv:d => { const n = +d.n; const s = advanceDays(n); if (!s) toast(`Advanced ${n === 1 ? 'one day' : n === 7 ? 'one week' : n === 30 ? 'one month' : 'one year'} to ${fmtDate(ST.day)}.`); },
  sound:() => { PREFS.muted = !PREFS.muted; if (!PREFS.muted) { if (!AUDIO.init()) toast('Audio is not supported in this browser.', 'bad'); else AUDIO.play('chime'); } AUDIO.apply(); savePrefs(); renderOps(); toast(PREFS.muted ? 'Sound muted.' : 'Sound on.'); },
  drawer:() => { UI.drawer = !UI.drawer; $('#drawer').classList.toggle('open', UI.drawer); if (UI.drawer) renderDrawer(); else { ST.notifications.forEach(n => n.read = true); renderOps(); } },
  readAll:() => { ST.notifications.forEach(n => n.read = true); renderDrawer(); renderOps(); },
  openNotif:d => { const n = ST.notifications.find(x => x.id === d.id); if (!n) return; n.read = true; if (UI.drawer) { UI.drawer = false; $('#drawer').classList.remove('open'); } if (n.link) { if (n.link.id) { if (n.link.screen === 'tribunal') { UI.sel.case = n.link.id; UI.tab.tribunal = 'docket'; } if (n.link.screen === 'petitions') UI.sel.pet = n.link.id; } go(n.link.screen); } else render(true); },
  assessment:() => assessmentModal(),
  openDev:d => devModal(d.id),
  devChoose:d => { const e = ST.events.find(x => x.id === d.id); const o = e && e.options.find(x => x.key === d.key); if (!o) return; confirmBox({title:o.label, body:esc(e.title), preview:o.rgCost ? [{t:`Rungta Global −${fmtUSD(o.rgCost)}`, neg:true}] : describeEff(ST, Object.assign({}, o.eff, o.char ? {char:o.char} : {}), o.cost), confirmLabel:'Decide', onConfirm:() => run(() => devResolve(ST, d.id, d.key), {kind:'good'})}); },
  judge:d => judgeModal(d.id),
  door:d => { if (d.door === 'trial') { UI.tab.tribunal = 'docket'; go('tribunal'); } else if (d.door === 'petition') go('petitions'); else if (d.door === 'hidden') spiritsModal(d.ref); else openModal(`<div class="eyebrow">The fourth door</div><h2>The Door of Mercy</h2><p>Built at the counsel of the Ancient Spirits, the Door of Mercy reminds every party that the Tribunal may temper judgment with clemency. Its presence has strengthened the Tribunal’s standing across the Cosmos.</p><div class="foot"><button class="btn primary" data-act="closeModal">Close</button></div>`); },
  tab:d => { UI.tab[d.scr] = d.tab; if (UI.screen !== d.scr) go(d.scr); else render(true); },
  sel:d => { UI.sel[d.k] = d.id; render(true); },
  filter:d => { UI.filter[d.k] = d.v; render(true); },
  openCase:d => { UI.sel.case = d.id; UI.tab.tribunal = 'docket'; go('tribunal'); },
  openPet:d => { UI.sel.pet = d.id; UI.filter.pet = 'all'; go('petitions'); },
  openCiv:d => { UI.sel.civ = d.id; go('civs'); },
  caseAdvance:d => run(() => caseAdvance(ST, d.id)),
  caseAsk:d => run(() => caseAsk(ST, d.id, d.key), {silent:true}),
  caseEvidence:d => run(() => caseRequestEvidence(ST, d.id)),
  caseVerdict:d => {
    const c = caseById(ST, d.id); const rem = (document.querySelector(`input[name="remedy"]:checked`) || {}).value;
    const grounds = [...document.querySelectorAll('input[name="ground"]:checked')].map(x => +x.value); const reason = val('reason-' + d.id);
    const m = c.remedies.find(x => x.key === rem); if (!m) return toast('Choose a remedy.', 'bad');
    const agree = c.opinions ? c.opinions.filter(o => Math.abs((c.remedies.find(x => x.key === o.rec) || {lean:0}).lean - m.lean) <= 0.35).length : 0;
    confirmBox({eyebrow:'Verdict preview', title:`Deliver verdict: ${m.label}`, body:`${agree} of the Twelve currently favour a remedy of this kind. Thoroughness of examination: ${Math.round(caseThoroughness(c) * 100)}%. ${grounds.length ? `Citing Principle ${grounds.join(', ')}.` : 'No constitutional grounds cited.'}`, preview:describeEff(ST, m.eff, m.cost), note:m.violates ? `Warning: this remedy breaches Constitutional Principle ${m.violates}. Judicial Legitimacy will fall sharply.` : 'Judicial Legitimacy will rise or fall depending on how well the remedy fits the facts.', confirmLabel:'Deliver verdict', danger:!!m.violates, onConfirm:() => { AUDIO.play('gavel'); run(() => caseVerdict(ST, d.id, rem, grounds, reason), {kind:'good', sfx:'gavel'}); }});
  },
  caseAppeal:d => confirmBox({title:{review:'Convene constitutional review', uphold:'Uphold the verdict', dismiss:'Dismiss the appeal'}[d.dec], note:'A review may substitute a better-founded remedy. Upholding or dismissing keeps the verdict; if it was poorly founded, legitimacy will suffer.', onConfirm:() => run(() => caseAppealDecision(ST, d.id, d.dec))}),
  spirits:() => { const r = consultSpirits(ST, val('spiritRef')); closeModal(); if (r.ok) { AUDIO.play('ceremony'); openModal(`<div class="eyebrow">The Hidden Verdict</div><h2>The Spirits answer</h2><blockquote style="font-family:var(--f-display);font-size:21px;font-style:italic">${esc(r.msg)}</blockquote><div class="foot"><button class="btn primary" data-act="closeModal">Withdraw</button></div>`); } else toast(r.msg, 'bad'); autosave(); render(true); },
  memberReport:d => { const r = memberReport(ST, d.id); autosave(); render(true); openDoc(ST.documents[0].id); },
  memberReview:d => run(() => reviewMember(ST, d.id, d.a)),
  memberRelieve:d => { const m = charById(ST, d.id); confirmBox({title:`Relieve ${m.name} of Council duties`, preview:[{t:'Efficiency −1', neg:true}], danger:true, confirmLabel:'Relieve', onConfirm:() => run(() => relieveMember(ST, d.id))}); },
  appoint:d => { const dept = val('dept-' + hashStr(d.name)); confirmBox({title:`Appoint ${d.name}`, body:`Responsibility: ${esc(dept || 'Unassigned')}`, preview:[{t:'Efficiency +1.5'}, {t:'Fills one vacant seat'}], onConfirm:() => run(() => appointMember(ST, d.name, dept), {kind:'good', sfx:'ceremony'})}); },
  createDept:() => run(() => createDepartment(ST, val('newDeptName'), val('newDeptHead'))),
  createCommittee:() => run(() => createCommittee(ST, val('comName'), [...document.querySelectorAll('.comMember:checked')].map(x => x.value), val('comMandate'))),
  dissolveCommittee:d => run(() => { ST.council.committees = ST.council.committees.filter(c => c.id !== d.id); return {ok:true, msg:'Committee dissolved.'}; }),
  rec:d => run(() => decideRecommendation(ST, d.id, d.ok === '1')),
  amendCouncil:() => { const o = {seats:+val('seats'), quorum:val('quorum'), chair:val('chair')}; confirmBox({title:'Amend the Council structure', body:`Seats: ${o.seats} · Quorum: ${esc(o.quorum)} · Chair: ${esc(o.chair)}`, onConfirm:() => run(() => amendStructure(ST, o))}); },
  meeting:() => meetingModal(),
  adopt:d => { closeModal(); run(() => adoptMeeting(ST, d.ref, d.key), {kind:'good'}); },
  mapReset:() => { UI.mapView = null; UI.sel.map = null; render(true); },
  mapZoom:d => { const cv = $('#mapCanvas'); if (!cv || !UI.mapView) return; const r = cv.getBoundingClientRect(); zoomMap(+d.z, r.width / 2, r.height / 2); },
  mapSel:d => { UI.sel.map = d.id; const c = civById(ST, d.id) || STATIONS.find(s => s.id === d.id); if (c && UI.mapView) { const cv = $('#mapCanvas'); const r = cv ? cv.getBoundingClientRect() : {width:800, height:600}; UI.mapView.x = c.x - r.width / 2 / UI.mapView.s; UI.mapView.y = c.y - r.height / 2 / UI.mapView.s; } go('map'); },
  civAct:d => { const c = civById(ST, d.id); const pv = {envoy:[{t:'Treasury −120M', neg:true}, {t:`${c.name} +2 to +5`}], aid:[{t:'Treasury −800M', neg:true}, {t:`${c.name} +8`}, {t:'Trust +1'}, {t:'Approval +0.5'}], trade:[{t:'Opens a six-round negotiation'}], invite:[{t:`Accepted with probability ${fmt(c.rel)}%`}, {t:'Membership is voluntary'}]}[d.a]; confirmBox({title:{envoy:'Send an envoy', aid:'Send an aid package', trade:'Propose trade talks', invite:'Invite to membership'}[d.a] + ` · ${c.name}`, preview:pv, onConfirm:() => run(() => civAction(ST, d.id, d.a), {kind:'good'})}); },
  pet:d => {
    const p = ST.petitions.find(x => x.id === d.id); if (!p) return;
    const cost = Math.round(p.cost * (p.hearingDiscount ? 0.85 : 1));
    const conf = {approve:{t:'Approve', pv:describeEff(ST, p.project.eff, cost)}, conditions:{t:'Approve with conditions', pv:describeEff(ST, scaleEff(p.project.eff, 0.8), Math.round(cost * 0.75)).concat([{t:`Duration ${Math.round(p.project.duration * 1.25)} days`}, {t:'Risk halved'}])}, reject:{t:'Reject', pv:describeEff(ST, p.rejectEff)}, tribunal:{t:'Refer to the Tribunal', pv:[{t:'Opens a Tribunal case'}, {t:'Legitimacy +0.5'}]}, defer:{t:'Defer consideration', pv:[{t:'Deadline +30 days'}, {t:'Approval −0.3', neg:true}, {t:'Petitioner relation falls', neg:true}]}}[d.a];
    if (!conf) return run(() => petAction(ST, d.id, d.a));
    const note = (d.a === 'approve' || d.a === 'conditions') && p.hidden && !p.riskRevealed ? 'You have not requested further information. Some risks may be unexamined.' : (d.a === 'conditions' ? 'The petitioner may decline conditions if relations are poor.' : '');
    confirmBox({eyebrow:p.id, title:`${conf.t}: ${p.title}`, preview:conf.pv, note, danger:d.a === 'reject', onConfirm:() => run(() => petAction(ST, d.id, d.a), {kind:'good'})});
  },
  petCustom:d => { const p = ST.petitions.find(x => x.id === d.id); openModal(`<div class="eyebrow">${esc(p.id)}</div><h2>Custom response</h2><p class="muted">Write the Crown’s reply to ${esc(p.petitioner)}. The reply is sent as an official letter and archived.</p><label class="f">Response<textarea id="customText" style="min-height:140px" autofocus></textarea></label><label class="f" style="margin-top:8px">The response decides<select id="customDisp"><option value="approve">Approve</option><option value="conditions">Approve with conditions</option><option value="reject">Reject</option><option value="defer">Defer 30 days</option></select></label><div class="foot"><button class="btn ghost" data-act="closeModal">Cancel</button><button class="btn primary" data-act="petCustomSend" data-id="${p.id}">Send response</button></div>`); },
  petCustomSend:d => { const text = val('customText'), disp = val('customDisp'); if (!text.trim()) return toast('Write a response before sending it.', 'bad'); closeModal(); run(() => petAction(ST, d.id, 'custom', {text, disposition:disp}), {kind:'good'}); },
  negNow:d => { const n = ST.negotiations.find(x => x.id === d.id); if (!n) return; n.nextRound = ST.day; run(() => { negRound(ST, n); return {ok:true, msg:`Round held: agreement ${Math.round(n.progress)}%, tension ${Math.round(n.tension)}%.`}; }); },
  summit:() => { const a = val('sumA'), b = val('sumB'), topic = val('sumTopic').trim() || 'Shared cooperation'; if (a === b) return toast('Choose two different civilisations.', 'bad'); confirmBox({title:`Host a summit: ${civName(ST, a)} and ${civName(ST, b)}`, preview:[{t:'Treasury −300M', neg:true}, {t:'Negotiation opens at 30%'}], onConfirm:() => run(() => { const r = spend(ST, 300, 'diplomacy', 'Summit at Concord Station'); if (!r.ok) return r; const n = createNegotiation(ST, [a, b], topic, 30); archive(ST, 'decision', `Summit: ${n.title}`, `${civName(ST, a)} and ${civName(ST, b)} at Concord Station.`, n.id); return {ok:true, msg:`Summit convened. Negotiation ${n.id} opened.`}; }, {kind:'good'})}); },
  treasuryReport:() => { const d = makeDoc(ST, 'treasury', 'Complete Treasury Report', treasuryReportBody(), 'TREASURY'); autosave(); openDoc(d.id); },
  applyBudget:() => {
    const nb = {}; let bad = null; BUDGET_CATS.forEach(b => { const v = Number(val('bud-' + b.key)); if (!Number.isFinite(v) || v < 0 || v > 20000) bad = b.label; nb[b.key] = Math.round(v); });
    if (bad) return toast(`${bad}: allocations must be between 0 and 20,000.`, 'bad');
    const old = budgetTotal(ST), nt = Object.values(nb).reduce((a, b) => a + b, 0);
    const pv = BUDGET_CATS.filter(b => nb[b.key] !== ST.treasury.budget[b.key]).map(b => ({t:`${b.label} ${fmt(ST.treasury.budget[b.key])} → ${fmt(nb[b.key])}`, neg:nb[b.key] < ST.treasury.budget[b.key] && nb[b.key] < b.base}));
    if (!pv.length) return toast('No changes to apply.');
    confirmBox({title:'Apply the revised budget', preview:pv.concat([{t:`Monthly total ${fmt(old)}M → ${fmt(nt)}M`, neg:nt > old}]), note:'Allocations below baseline erode the related indicators each month.', onConfirm:() => run(() => { for (const k in nb) setBudget(ST, k, nb[k]); return {ok:true, msg:'Budget applied from the next monthly settlement.'}; })});
  },
  toReserve:() => { const a = Number(val('reserveAmt')); confirmBox({title:`Allocate ${fmtCC(a || 0)} to the emergency reserve`, preview:[{t:`Balance −${fmt(a || 0)}M`, neg:true}, {t:`Reserve +${fmt(a || 0)}M`}], onConfirm:() => run(() => transferToReserve(ST, a))}); },
  toReserve2:() => { const a = Number(val('reserveAmt2')); confirmBox({title:`Allocate ${fmtCC(a || 0)} to the emergency reserve`, preview:[{t:`Balance −${fmt(a || 0)}M`, neg:true}, {t:`Reserve +${fmt(a || 0)}M`}], onConfirm:() => run(() => transferToReserve(ST, a))}); },
  finance:d => { const pj = MAJOR_PROJECTS.find(x => x.key === d.key); confirmBox({title:`Finance the ${pj.name}`, preview:describeEff(ST, pj.eff, pj.cost).concat([{t:`${pj.duration} days to complete`}]), onConfirm:() => run(() => createProject(ST, Object.assign(deep(pj), {key:pj.key})), {kind:'good'})}); },
  saveDraft:() => run(() => { const r = saveDraft(ST, Object.assign({}, UI.draft)); if (r.ok) UI.draft.id = r.draft.id; return r; }),
  review:() => { UI.review = reviewDraft(ST, UI.draft); render(true); },
  enact:() => {
    const d = UI.draft; const r0 = saveDraft(ST, Object.assign({}, d)); if (!r0.ok) return toast(r0.msg, 'bad'); d.id = r0.draft.id;
    const rv = reviewDraft(ST, d); UI.review = rv;
    const T = LAW_TYPES.find(t => t.key === d.type); const eff = {ind:{}}; d.provisions.forEach(k => { const P = PROVISIONS.find(p => p.key === k); for (const i in P.oneTime) eff.ind[i] = (eff.ind[i] || 0) + P.oneTime[i]; });
    const pv = describeEff(ST, eff).concat(rv.cost ? [{t:`Recurring cost ${fmt(rv.cost)}M per month`, neg:true}] : []).concat([{t:`${T.impl}-day implementation period`}]);
    const flagged = !rv.compatible;
    confirmBox({eyebrow:`${T.label} · ${d.id}`, title:`Sign and enact: ${d.title}`, preview:flagged ? pv.concat([{t:'Legitimacy −6', neg:true}, {t:'Approval −3', neg:true}, {t:'Constitutional challenge before the Tribunal', neg:true}]) : pv, note:flagged ? `Constitutional review found conflicts with Principle ${[...new Set(rv.flags.map(f => f.principle))].join(', ')}. Enacting overrides the review.` : d.type === 'treaty' ? 'The treaty goes to negotiation and is enacted only if talks succeed.' : 'The instrument will be signed under the Cosmic Seal.', danger:flagged, confirmLabel:flagged ? 'Override and enact' : 'Sign and enact', onConfirm:() => { const r = run(() => enactDraft(ST, d.id, flagged), {kind:'good', sfx:'ceremony'}); if (r && r.ok) { UI.draft = null; UI.review = null; if (r.law) { UI.tab.legislature = 'db'; UI.sel.law = r.law.id; } render(true); } }});
  },
  clearDraft:() => { UI.draft = null; UI.review = null; render(true); },
  editDraft:d => { const x = ST.drafts.find(y => y.id === d.id); UI.draft = deep(x); UI.review = null; UI.tab.legislature = 'draft'; render(true); },
  delDraft:d => run(() => { ST.drafts = ST.drafts.filter(x => x.id !== d.id); return {ok:true, msg:'Draft discarded.'}; }),
  amendLaw:d => { const l = ST.laws.find(x => x.id === d.id); UI.draft = {type:l.type, title:l.title + ' (Amended)', text:l.text, impl:l.impl || '', provisions:l.provisions.slice(), target:'', amends:l.id}; UI.review = null; UI.tab.legislature = 'draft'; render(true); toast(`Amending ${l.id}. Edit the draft and enact it to replace the original.`); },
  repeal:d => { const l = ST.laws.find(x => x.id === d.id); confirmBox({title:`Repeal ${l.id}`, body:esc(l.title), preview:l.flagged ? [{t:'Legitimacy +2'}] : [{t:'Stability −0.5', neg:true}, {t:'Ongoing effects end', neg:true}], danger:true, confirmLabel:'Repeal', onConfirm:() => run(() => repealLaw(ST, d.id))}); },
  doc:d => openDoc(d.id),
  copyDoc:d => { const doc = ST.documents.find(x => x.id === d.id); if (!doc) return; copyText(d.fmt === 'html' ? `<!doctype html><meta charset="utf-8"><title>${esc(doc.title)}</title><style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;line-height:1.6}</style>${docHTML(doc).replace(/class="[^"]*"/g, '')}` : docText(doc)); },
  research:d => { const t = RESEARCH_TRACKS.find(x => x.key === d.track), c = researchCost(ST, d.track); confirmBox({title:`Fund ${t.name} level ${c.lvl}`, preview:[{t:`Treasury −${fmt(c.cost)}M`, neg:true}, {t:`${c.duration} days`}, {t:'Science +2 on completion'}], note:t.bonus, onConfirm:() => run(() => fundResearch(ST, d.track), {kind:'good'})}); },
  eduExpand:() => { const name = val('eduName'), civ = val('eduCiv'); if (!name.trim()) return toast('Name the institution first.', 'bad'); const cost = Math.round(700 * (1 - 0.1 * ST.research.pedagogy)); confirmBox({title:`Establish ${name}`, body:`On ${esc(civName(ST, civ))}, as a COSMOS–EDU partner institution.`, preview:[{t:`Treasury −${fmt(cost)}M`, neg:true}, {t:'Education +2 on completion'}, {t:`${civName(ST, civ)} +4`}, {t:'50 days'}], onConfirm:() => run(() => eduExpand(ST, name, civ), {kind:'good'})}); },
  setSchol:() => run(() => setScholarships(ST, Number(val('schol')))),
  eduPartner:d => confirmBox({title:`Partner with ${d.p}`, preview:[{t:'Treasury −200M', neg:true}, {t:'Education +1'}, {t:'Science +0.5'}], onConfirm:() => run(() => eduPartner(ST, d.p), {kind:'good'})}),
  eduAccess:() => confirmBox({title:'Fund the universal accessibility programme', preview:[{t:'Treasury −650M', neg:true}, {t:'Education +3 on completion'}, {t:'Approval +1'}, {t:'60 days'}], onConfirm:() => run(() => createProject(ST, {name:'COSMOS–EDU Universal Accessibility Programme', cat:'education', cost:650, duration:60, eff:{ind:{education:3, approval:1}}, special:'access', key:'access'}), {kind:'good'})}),
  earth:d => { const pv = {visit:[{t:'Treasury −150M', neg:true}, {t:'Approval +2 on return'}, {t:'Earth +4 on return'}], delegation:[{t:'Treasury −100M', neg:true}, {t:'Earth +3'}, {t:'Trust +0.5'}], science:[{t:'Treasury −600M', neg:true}, {t:'Science +1'}, {t:'Earth +6'}, {t:'Needs Earth’s consent'}], environment:[{t:'Treasury −900M', neg:true}, {t:'Environment +2'}, {t:'Earth +8'}, {t:'Needs Earth’s consent'}], exchange:[{t:'Treasury −200M', neg:true}, {t:'Earth +3'}, {t:'Education +1'}]}[d.a]; confirmBox({title:{visit:'Official visit to Earth', delegation:'Invite the representatives of Earth', science:'Scientific cooperation programme', environment:'Environmental assistance', exchange:'Educational exchange'}[d.a], preview:pv, onConfirm:() => run(() => earthAction(ST, d.a), {kind:'good'})}); },
  rgReport:() => { const q = ST.rg.hist.slice(-3); const d = makeDoc(ST, 'report', 'Rungta Global financial report', rgReport(ST, q.reduce((a, h) => a + h.revenue, 0), q.reduce((a, h) => a + h.profit, 0)), 'RG'); autosave(); openDoc(d.id); },
  rgBoard:d => { const a = RG_AGENDA.find(x => x.key === d.key); confirmBox({eyebrow:'Rungta Global board', title:a.label, preview:[{t:`Rungta Global cash −${fmtUSD(a.cost)}`, neg:true}].concat(a.days ? [{t:`${a.days} days`}] : []), note:'Paid from Rungta Global funds only.', onConfirm:() => run(() => rgBoard(ST, d.key), {kind:'good'})}); },
  rgIntl:() => { const m = val('rgMarket'); confirmBox({eyebrow:'Rungta Global board', title:`Expand into ${m}`, preview:[{t:'Rungta Global cash −$220M', neg:true}, {t:'+4 India Express restaurants'}, {t:'+1 luxury hotel'}, {t:'120 days'}], onConfirm:() => run(() => rgBoard(ST, 'intl', m), {kind:'good'})}); },
  rgAppoint:() => run(() => rgAppoint(ST, val('rgRole'), val('rgCand'))),
  crisis:d => { const e = ST.events.find(x => x.id === d.id), T = CRISIS_TPL[e.tpl], o = T.options.find(x => x.key === d.key); const mid = (document.getElementById(`cm-${e.id}-${o.key}`) || {}).value || d.mid; const m = charById(ST, mid); const p = crisisChance(ST, e, o, o.tag ? mid : null);
    if (o.resolve === 'delay') return run(() => crisisRespond(ST, d.id, d.key));
    confirmBox({eyebrow:e.id, title:`${o.label}${o.tag && m ? ` — led by ${m.name}` : ''}`, preview:[{t:`${Math.round(p * 100)}% estimated success`}].concat(o.cost ? [{t:`Cost ${fmt(o.cost)}M (reserve first)`, neg:true}] : []).concat(o.tag && m ? [{t:`${m.name} deployed for 10 days`, neg:true}] : []), note:o.resolve === 'reduce' ? 'If it succeeds, the emergency drops one stage.' : 'If it succeeds, the emergency is resolved.', confirmLabel:'Deploy', onConfirm:() => { const r = run(() => crisisRespond(ST, d.id, d.key, mid), {kind:'good'}); if (r && r.ok) AUDIO.play(r.success ? 'chime' : 'alert'); }}); },
  recognition:() => run(() => petitionRecognition(ST), {kind:'good', sfx:'ceremony'}),
  cmdConsole:() => { const t = val('cmdConsole'); issueCommand(t); },
  cmdExample:d => issueCommand(d.t),
  saveCanon:() => run(() => { const n = val('canSov').trim(), t = val('canTitle').trim(), y = parseInt(val('canEarth'), 10); if (!n || !t) return {ok:false, msg:'Name and title cannot be empty.'}; if (!Number.isInteger(y) || y < 1) return {ok:false, msg:'Enter a valid year.'}; Object.assign(ST.canon, {sovereign:n.slice(0, 60), title:t.slice(0, 80), arrangement:val('canArr'), arbiterRole:val('canArb').slice(0, 80), earthNextCollective:y}); archive(ST, 'history', 'Canon amended', `Leadership arrangement: ${ST.canon.arrangement}.`, 'CANON'); return {ok:true, msg:'Canon saved.'}; }),
  resetCanon:() => run(() => { Object.assign(ST.canon, {sovereign:'Tarush Rungta', title:'Sovereign of the Cosmos', arrangement:'sovereign-arbiter', arbiterRole:'Principal Adviser to the Crown', earthNextCollective:1000}); return {ok:true, msg:'Default canon restored.'}; }),
  saveNew:() => { const name = val('saveName').trim() || 'Campaign'; run(() => SaveManager.save('slot-' + Date.now().toString(36), name, ST)); },
  loadSlot:d => confirmBox({title:'Load this campaign?', note:'The current campaign will be saved to the autosave slot first, unless you are loading the autosave itself.', onConfirm:() => { if (d.id !== 'autosave') SaveManager.save('autosave', 'Autosave', ST); const r = SaveManager.load(d.id); if (!r.ok) return toast(r.msg, 'bad'); ST = r.st; UI.speed = 'paused'; UI.sel = {}; buildShell(); go('dashboard'); toast(`Loaded. ${fmtDate(ST.day)}.`, 'good'); }}),
  overwriteSlot:d => confirmBox({title:`Overwrite “${d.name}”?`, note:'The earlier save in this slot will be replaced by the current campaign.', danger:true, confirmLabel:'Overwrite', onConfirm:() => run(() => SaveManager.save(d.id, d.name, ST))}),
  deleteSlot:d => confirmBox({title:`Delete “${d.name}”?`, note:'This save cannot be recovered. Export it first if you may want it later.', danger:true, confirmLabel:'Delete', onConfirm:() => run(() => SaveManager.remove(d.id))}),
  exportJson:() => copyText(JSON.stringify(ST)),
  showJson:() => fallbackCopy(JSON.stringify(ST, null, 1)),
  importJson:() => {
    const f = $('#importFile'); const txt = val('importText').trim();
    const apply = raw => { let o; try { o = JSON.parse(raw); } catch (e) { return toast('That is not valid JSON.', 'bad'); } const err = validateSave(o); if (err) return toast(err, 'bad'); confirmBox({title:'Import this campaign?', body:`${esc(MODE_NAMES[o.meta.mode] || o.meta.mode)} · ${esc(fmtDate(o.day))}`, note:'The current campaign will be saved to the autosave slot first.', onConfirm:() => { SaveManager.save('autosave', 'Autosave', ST); ST = migrate(o); UI.sel = {}; buildShell(); go('dashboard'); toast('Campaign imported.', 'good'); autosave(true); }}); };
    if (f && f.files && f.files[0]) { const rd = new FileReader(); rd.onload = () => apply(String(rd.result)); rd.onerror = () => toast('The file could not be read.', 'bad'); rd.readAsText(f.files[0]); }
    else if (txt) apply(txt); else toast('Choose a file or paste campaign JSON first.', 'bad');
  },
  newCampaign:() => { const mode = (document.querySelector('input[name="newMode"]:checked') || {}).value || 'sandbox'; const seed = val('newSeed'); confirmBox({title:`Start a new ${MODE_NAMES[mode]} campaign?`, note:'Your current campaign is saved to the autosave slot first. Load it from Save slots to return to it.', onConfirm:() => { SaveManager.save('autosave-prev', 'Previous campaign (before new)', ST); ST = newGame(mode, seed ? Number(seed) : undefined); UI.speed = 'paused'; UI.sel = {}; UI.tab = {}; UI.draft = null; buildShell(); go('dashboard'); autosave(true); showIntro(); }}); },
  replayIntro:() => showIntro(),
  resetAsk:() => { UI.confirmReset = true; render(true); }, resetNo:() => { UI.confirmReset = false; render(true); },
  resetYes:() => { SaveManager.save('autosave-prev', 'Previous campaign (before reset)', ST); ST = newGame(ST.meta.mode, ST.meta.seed); UI.confirmReset = false; UI.sel = {}; UI.speed = 'paused'; buildShell(); go('dashboard'); toast('Campaign reset. The previous state is in the save slot “Previous campaign (before reset)”.', 'good'); autosave(true); },
  cvCreate:() => run(() => creativeCiv(ST, {name:val('cvName'), kind:val('cvKind'), gov:val('cvGov'), culture:val('cvCulture'), pop:val('cvPop'), contribution:val('cvContrib')}), {kind:'good'}),
  chCreate:() => run(() => creativeChar(ST, {name:val('chName'), role:val('chRole'), ability:val('chAbility'), tag:val('chTag'), value:val('chValue'), personality:val('chPers')}), {kind:'good'}),
  evCreate:() => run(() => creativeEvent(ST, {title:val('evTitle'), desc:val('evDesc'), aLabel:val('evA'), aKey:val('evAk'), aVal:val('evAv'), bLabel:val('evB'), bKey:val('evBk'), bVal:val('evBv')}), {kind:'good'}),
  setVal:() => run(() => creativeSet(ST, val('setK'), val('setV'))),
  introEnter:() => { $('#intro').classList.remove('open'); $('#intro').innerHTML = ''; PREFS.introSeen = true; savePrefs(); AUDIO.play('ceremony'); render(true); },
  introSound:() => { PREFS.muted = false; AUDIO.init(); AUDIO.apply(); savePrefs(); AUDIO.play('ceremony'); renderOps(); const b = $('#introSoundBtn'); if (b) { b.textContent = 'Sound on'; b.disabled = true; } },
  introModes:() => { ACT.introEnter(); go('settings'); }
};
const CHG = {
  deptHead:(d, el) => run(() => assignDept(ST, el.value, d.id)),
  delegate:(d, el) => run(() => setDelegation(ST, d.cls, el.value)),
  meetingRef:(d, el) => meetingModal(el.value),
  mapLayer:(d, el) => { UI.mapLayers[d.k] = el.checked; },
  stance:(d, el) => run(() => negSetStance(ST, d.id, el.value)),
  draftField:(d, el) => { UI.draft[d.f] = el.value; if (d.f === 'type') { UI.review = null; render(true); } },
  draftProv:(d, el) => { const s = new Set(UI.draft.provisions); el.checked ? s.add(el.value) : s.delete(el.value); UI.draft.provisions = [...s]; UI.review = null; },
  lawFilter:(d, el) => { UI.filter[d.k] = el.value; render(true); },
  eduModule:(d, el) => run(() => { ST.edu.modules[el.value] = el.checked; return {ok:true, msg:`${EDU_MODULES.find(m => m.key === el.value).name} ${el.checked ? 'added to' : 'removed from'} COSMOS–EDU.`}; }),
  arType:(d, el) => { UI.filter.art = el.value; render(true); },
  crisisMember:(d, el) => { UI.sel['mem-' + d.id] = el.value; render(true); },
  pref:(d, el) => { PREFS[d.k] = el.type === 'checkbox' ? el.checked : Number(el.value); savePrefs(); document.body.classList.toggle('big', !!PREFS.big); document.body.classList.toggle('calm', !!PREFS.calm); if (['master','music','sfx','muted'].includes(d.k)) { if (!PREFS.muted) AUDIO.init(); AUDIO.apply(); renderOps(); } }
};
const INP = {
  draftField:(d, el) => { UI.draft[d.f] = el.value; },
  lawSearch:(d, el) => { UI.filter.lawq = el.value; UI.refocus = el.id; render(true); },
  arSearch:(d, el) => { UI.filter.arq = el.value; UI.refocus = el.id; render(true); },
  journal:(d, el) => { ST.journal = el.value.slice(0, 20000); autosave(); }
};
function wireInput() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act]; if (!fn) return;
    if (el.tagName === 'BUTTON' || el.tagName === 'TR' || el.getAttribute('role') === 'button') e.preventDefault();
    fn(el.dataset, el, e);
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act], tr[data-act]')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Escape') { if (document.getElementById('modalRoot').classList.contains('open')) closeModal(); else if (UI.drawer) ACT.drawer(); }
    if (e.target.id === 'cmdConsole' && e.key === 'Enter') { e.preventDefault(); ACT.cmdConsole(); }
  });
  document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (el && CHG[el.dataset.chg]) CHG[el.dataset.chg](el.dataset, el, e); });
  document.addEventListener('input', e => { const el = e.target.closest('[data-inp]'); if (el && INP[el.dataset.inp]) INP[el.dataset.inp](el.dataset, el, e); });
  document.addEventListener('submit', e => { e.preventDefault(); if (e.target.dataset.form === 'cmd') { const i = $('#cmdInput'); const t = i.value; i.value = ''; i.blur(); issueCommand(t); } });
  $('#modalRoot').addEventListener('click', e => { if (e.target.id === 'modalRoot') closeModal(); });
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (SCREENS[h] && h !== UI.screen) go(h); });
}

/* ---------- Chamber renderer ---------- */
function drawChamber(cv) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const R = staticRng(42);
  const gal = Array.from({length:1500}, () => { const arm = Math.floor(R() * 3), rr = Math.pow(R(), 0.55); return {rr, th:arm * 2.094 + rr * 4.4 + (R() - 0.5) * 0.55, s:R() * 1.3 + 0.3, a:R() * 0.7 + 0.25, h:R() < 0.35 ? 45 : R() < 0.6 ? 265 : 215}; });
  const stars = Array.from({length:180}, () => ({x:R(), y:R() * 0.62, s:R() * 1.1 + 0.2, a:R() * 0.8 + 0.2, t:R() * 6}));
  const motes = Array.from({length:60}, () => ({x:R(), y:R(), v:R() * 0.0009 + 0.0003, s:R() * 1.4 + 0.4}));
  const cons = [[0.06, 0.08, 0.11, 0.14, 0.16, 0.09], [0.82, 0.07, 0.88, 0.13, 0.93, 0.06], [0.2, 0.3, 0.24, 0.24]];
  const throne = thronePositions(ST), doors = doorPositions(ST);
  const t0 = performance.now();
  const size = () => { const r = cv.getBoundingClientRect(); const w = Math.max(10, Math.round(r.width * dpr)), h = Math.max(10, Math.round(r.height * dpr)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } };
  const ctx = cv.getContext('2d');
  const arch = (x, y, w, h) => { ctx.beginPath(); ctx.moveTo(x - w / 2, y + h); ctx.lineTo(x - w / 2, y + w / 2); ctx.arc(x, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y + h); ctx.closePath(); };
  const frame = ts => {
    if (!cv.isConnected) return;
    size(); const W = cv.width, H = cv.height, t = (ts - t0) / 1000;
    const still = PREFS.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
    let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0C1430'); g.addColorStop(0.5, '#080B12'); g.addColorStop(1, '#04060B'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stars.forEach(s => { ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(s.t + t * 1.5)); ctx.fillStyle = '#F5F3EE'; ctx.fillRect(s.x * W, s.y * H, s.s * dpr, s.s * dpr); });
    ctx.globalAlpha = 0.35; ctx.strokeStyle = '#F1DCA0'; ctx.lineWidth = 0.7 * dpr;
    cons.forEach(c => { ctx.beginPath(); for (let i = 0; i < c.length; i += 2) { const x = c[i] * W, y = c[i + 1] * H; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); for (let i = 0; i < c.length; i += 2) { ctx.fillStyle = '#F1DCA0'; ctx.beginPath(); ctx.arc(c[i] * W, c[i + 1] * H, 1.6 * dpr, 0, 6.283); ctx.fill(); } });
    ctx.globalAlpha = 1;
    // colonnade
    for (let i = 0; i < 12; i++) { const x = W * (0.04 + i * 0.084); const cg = ctx.createLinearGradient(0, H * 0.04, 0, H * 0.56); cg.addColorStop(0, 'rgba(212,175,55,0)'); cg.addColorStop(0.5, 'rgba(212,175,55,.18)'); cg.addColorStop(1, 'rgba(212,175,55,0)'); ctx.fillStyle = cg; ctx.fillRect(x, H * 0.04, 2 * dpr, H * 0.52); }
    ctx.strokeStyle = 'rgba(212,175,55,.35)'; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(0, H * 0.05); ctx.lineTo(W, H * 0.05); ctx.stroke();
    // doors
    doors.forEach((d, i) => {
      const x = d.x * W, y = d.y * H, w = d.w * W, h = d.h * H;
      const pulse = still ? 0.6 : 0.5 + 0.2 * Math.sin(t * 0.9 + i);
      ctx.save(); ctx.shadowColor = d.col; ctx.shadowBlur = 30 * dpr * pulse;
      arch(x, y, w, h); const dg = ctx.createLinearGradient(0, y, 0, y + h); dg.addColorStop(0, d.col); dg.addColorStop(1, 'rgba(8,11,18,.9)'); ctx.globalAlpha = 0.55 * pulse + 0.2; ctx.fillStyle = dg; ctx.fill(); ctx.restore();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 1.6 * dpr; arch(x, y, w, h); ctx.stroke();
      ctx.lineWidth = 0.7 * dpr; arch(x, y + w * 0.12, w * 0.76, h - w * 0.12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + w * 0.3); ctx.lineTo(x, y + h); ctx.stroke();
    });
    // floor
    const cx = W * 0.5, cy = H * 0.75, rx = W * 0.5, ry = H * 0.23;
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.283); const fg = ctx.createRadialGradient(cx, cy - ry * 0.3, 0, cx, cy, rx); fg.addColorStop(0, '#141A2A'); fg.addColorStop(0.7, '#0A0D16'); fg.addColorStop(1, '#05070C'); ctx.fillStyle = fg; ctx.fill(); ctx.restore();
    // galaxy beneath the transparent centre
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.6, ry * 0.6, 0, 0, 6.283); ctx.clip(); ctx.fillStyle = '#02030A'; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    const rot = still ? 0 : t * 0.025;
    gal.forEach(p => { const a = p.th + rot; ctx.globalAlpha = p.a; ctx.fillStyle = `hsl(${p.h} 75% 78%)`; ctx.fillRect(cx + Math.cos(a) * p.rr * rx * 0.58, cy + Math.sin(a) * p.rr * ry * 0.58, p.s * dpr, p.s * dpr); });
    ctx.globalAlpha = 1; const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.16); core.addColorStop(0, 'rgba(255,240,200,.85)'); core.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = core; ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.16, ry * 0.16, 0, 0, 6.283); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(212,175,55,.75)'; ctx.lineWidth = 1.4 * dpr; [0.6, 0.64].forEach(f => { ctx.beginPath(); ctx.ellipse(cx, cy, rx * f, ry * f, 0, 0, 6.283); ctx.stroke(); });
    ctx.strokeStyle = 'rgba(212,175,55,.35)'; ctx.lineWidth = dpr; ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.985, ry * 0.97, 0, 0, 6.283); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; ctx.fillStyle = '#F1DCA0'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rx * 0.7, cy + Math.sin(a) * ry * 0.7, 2 * dpr, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(212,175,55,.25)'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rx * 0.64, cy + Math.sin(a) * ry * 0.64); ctx.lineTo(cx + Math.cos(a) * rx * 0.95, cy + Math.sin(a) * ry * 0.95); ctx.stroke(); }
    const sheen = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry); sheen.addColorStop(0.3, 'rgba(245,243,238,0)'); sheen.addColorStop(0.5, 'rgba(245,243,238,.05)'); sheen.addColorStop(0.7, 'rgba(245,243,238,0)'); ctx.fillStyle = sheen; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.283); ctx.fill();
    // thrones (back to front)
    const drawThrone = (x, by, s, hue, big, i) => {
      const bob = still ? 0 : Math.sin(t * 0.8 + i) * H * 0.006;
      const tw = W * 0.032 * s * (big ? 1.9 : 1), th = H * 0.12 * s * (big ? 1.7 : 1); by += bob;
      ctx.save(); ctx.globalAlpha = 0.5; const gl = ctx.createRadialGradient(x, by + th * 0.18, 0, x, by + th * 0.18, tw * 1.4); gl.addColorStop(0, `hsla(${hue},80%,70%,.55)`); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(x, by + th * 0.18, tw * 1.4, th * 0.12, 0, 0, 6.283); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(x - tw / 2, by); ctx.lineTo(x - tw / 2, by - th * 0.7); ctx.lineTo(x, by - th); ctx.lineTo(x + tw / 2, by - th * 0.7); ctx.lineTo(x + tw / 2, by); ctx.closePath();
      const tg = ctx.createLinearGradient(0, by - th, 0, by); tg.addColorStop(0, big ? '#2A3466' : '#1A2448'); tg.addColorStop(1, '#0B1022'); ctx.fillStyle = tg; ctx.fill(); ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = (big ? 1.8 : 1.1) * dpr; ctx.stroke();
      ctx.beginPath(); ctx.rect(x - tw * 0.68, by - th * 0.26, tw * 1.36, th * 0.08); ctx.fillStyle = '#121A36'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = `hsl(${hue} 80% 78%)`; ctx.beginPath(); ctx.arc(x, by - th * 0.62, (big ? 3.2 : 2) * dpr, 0, 6.283); ctx.fill();
      if (big) { for (let k = -2; k <= 2; k++) { ctx.fillStyle = '#F1DCA0'; ctx.beginPath(); ctx.arc(x + k * tw * 0.22, by - th - H * 0.03 - (2 - Math.abs(k)) * H * 0.012, 2.3 * dpr, 0, 6.283); ctx.fill(); } ctx.strokeStyle = 'rgba(241,220,160,.5)'; ctx.lineWidth = dpr; ctx.beginPath(); for (let k = -2; k <= 2; k++) { const px = x + k * tw * 0.22, py = by - th - H * 0.03 - (2 - Math.abs(k)) * H * 0.012; k === -2 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke(); }
    };
    const showNames = W / dpr > 720;
    throne.slice().sort((a, b) => a.y - b.y).forEach((p, i) => { const j = JUDGES.find(x => x.id === p.id); const s = 0.62 + (p.y - 0.44) * 1.9; drawThrone(p.x * W, p.y * H, s, j.hue, false, i); if (showNames) { ctx.fillStyle = 'rgba(241,220,160,.85)'; ctx.font = `${Math.round(10 * dpr)}px "IBM Plex Sans", sans-serif`; ctx.textAlign = 'center'; ctx.fillText(j.name, p.x * W, p.y * H + 14 * dpr); } });
    drawThrone(cx, H * 0.86, 1.05, 45, true, 99);
    ctx.fillStyle = '#F1DCA0';
    motes.forEach(m => { if (!still) { m.y -= m.v; if (m.y < 0) m.y = 1; } ctx.globalAlpha = 0.25 + 0.25 * Math.sin(m.x * 40 + t); ctx.beginPath(); ctx.arc(m.x * W, m.y * H, m.s * dpr, 0, 6.283); ctx.fill(); });
    ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(cx, H * 0.5, H * 0.3, cx, H * 0.5, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (!still) setTimeout(() => requestAnimationFrame(frame), 33);
  };
  requestAnimationFrame(frame);
}

/* ---------- Universe map renderer ---------- */
const MAPW = 2400, MAPH = 1600;
let GAL_CACHE = null;
function galaxyCache() {
  if (GAL_CACHE) return GAL_CACHE;
  const c = document.createElement('canvas'); c.width = 1800; c.height = 1200; const g = c.getContext('2d'); const k = 0.75;
  g.fillStyle = '#04060C'; g.fillRect(0, 0, c.width, c.height);
  const R = staticRng(2024);
  for (let i = 0; i < 2600; i++) { g.globalAlpha = R() * 0.6 + 0.1; g.fillStyle = R() < 0.1 ? '#F1DCA0' : '#E8EEFF'; const s = R() * 1.2 + 0.2; g.fillRect(R() * c.width, R() * c.height, s, s); }
  GALAXIES.forEach(G => {
    const cx = G.x * k, cy = G.y * k, r = G.r * k;
    const neb = g.createRadialGradient(cx, cy, 0, cx, cy, r * 1.2); neb.addColorStop(0, `hsla(${G.hue},70%,60%,.22)`); neb.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = 1; g.fillStyle = neb; g.beginPath(); g.arc(cx, cy, r * 1.2, 0, 6.283); g.fill();
    for (let i = 0; i < 2200; i++) { const arm = Math.floor(R() * G.arms), rr = Math.pow(R(), 0.6); const th = G.rot + arm * 6.283 / G.arms + rr * 3.6 + (R() - 0.5) * 0.6; const x = cx + Math.cos(th) * rr * r, y = cy + Math.sin(th) * rr * r * 0.62; g.globalAlpha = (1 - rr) * 0.7 + 0.1; g.fillStyle = `hsl(${G.hue + (R() - 0.5) * 40} 70% ${60 + R() * 30}%)`; const s = R() * 1.6 + 0.3; g.fillRect(x, y, s, s); }
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, r * 0.22); core.addColorStop(0, 'rgba(255,246,220,.9)'); core.addColorStop(1, 'rgba(255,246,220,0)'); g.globalAlpha = 1; g.fillStyle = core; g.beginPath(); g.arc(cx, cy, r * 0.22, 0, 6.283); g.fill();
  });
  GAL_CACHE = c; return c;
}
function fitMapView(w, h) { const s = Math.min(w / MAPW, h / MAPH) * 0.98; return {s, x:(MAPW - w / s) / 2, y:(MAPH - h / s) / 2, fit:s}; }
function zoomMap(f, mx, my) { const v = UI.mapView; const wx = v.x + mx / v.s, wy = v.y + my / v.s; v.s = clamp(v.s * f, v.fit * 0.7, v.fit * 6); v.x = wx - mx / v.s; v.y = wy - my / v.s; }
function initMap() {
  const cv = $('#mapCanvas'); if (!cv) return; const wrap = $('#mapwrap');
  const dpr = Math.min(2, window.devicePixelRatio || 1); const ctx = cv.getContext('2d');
  const rect = () => wrap.getBoundingClientRect();
  if (!UI.mapView) { const r = rect(); UI.mapView = fitMapView(r.width, r.height); }
  const cache = galaxyCache();
  const ptrs = new Map(); let moved = 0, pinch0 = null;
  const toWorld = (sx, sy) => ({x:UI.mapView.x + sx / UI.mapView.s, y:UI.mapView.y + sy / UI.mapView.s});
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY}); moved = 0; UI.mapInteracting = true; cv.classList.add('drag'); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = {d:Math.hypot(a.x - b.x, a.y - b.y), s:UI.mapView.s}; } });
  cv.addEventListener('pointermove', e => { const p = ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const r = rect(); const f = (pinch0.s * d / pinch0.d) / UI.mapView.s; zoomMap(f, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); }
    else { UI.mapView.x -= dx / UI.mapView.s; UI.mapView.y -= dy / UI.mapView.s; } });
  const up = e => { const had = ptrs.has(e.pointerId); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; if (!ptrs.size) { UI.mapInteracting = false; cv.classList.remove('drag'); }
    if (had && moved < 6 && e.type === 'pointerup') { const r = rect(); const w = toWorld(e.clientX - r.left, e.clientY - r.top); const tol = 26 / UI.mapView.s; let best = null, bd = tol;
      ST.civs.filter(c => c.discovered).forEach(c => { const d = Math.hypot(c.x - w.x, c.y - w.y); if (d < bd) { bd = d; best = c.id; } });
      if (!best) STATIONS.forEach(s => { const d = Math.hypot(s.x - w.x, s.y - w.y); if (d < bd) { bd = d; best = s.id; } });
      UI.sel.map = best; render(true); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = rect(); zoomMap(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - r.left, e.clientY - r.top); }, {passive:false});
  const L = UI.mapLayers;
  const frame = ts => {
    if (!cv.isConnected) return;
    const r = rect(); const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const v = UI.mapView, t = ts / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#04060C'; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(dpr * v.s, 0, 0, dpr * v.s, -v.x * v.s * dpr, -v.y * v.s * dpr);
    ctx.drawImage(cache, 0, 0, MAPW, MAPH);
    const px = 1 / v.s;
    ctx.font = `${12 * px}px "IBM Plex Sans", sans-serif`; ctx.textAlign = 'center';
    if (L.labels) { ctx.fillStyle = 'rgba(241,220,160,.35)'; ctx.font = `italic ${15 * px}px "Cormorant Garamond", serif`; GALAXIES.forEach(G => ctx.fillText(G.name, G.x, G.y - G.r * 0.7)); ctx.font = `${12 * px}px "IBM Plex Sans", sans-serif`; }
    const cap = civById(ST, 'aurelia');
    if (L.lanes) ST.civs.filter(c => c.discovered && c.id !== 'aurelia').forEach(c => { ctx.strokeStyle = c.rel >= 75 ? 'rgba(212,175,55,.45)' : c.rel >= 55 ? 'rgba(241,220,160,.25)' : c.rel >= 35 ? 'rgba(233,174,69,.45)' : 'rgba(229,112,95,.6)'; ctx.lineWidth = 1.2 * px; ctx.setLineDash([6 * px, 6 * px]); ctx.beginPath(); ctx.moveTo(cap.x, cap.y); ctx.lineTo(c.x, c.y); ctx.stroke(); });
    ctx.setLineDash([]);
    STATIONS.forEach(s => {
      if ((s.type === 'protected' || s.type === 'territory') && L.protected) { ctx.strokeStyle = s.type === 'protected' ? 'rgba(98,200,147,.7)' : 'rgba(233,140,69,.7)'; ctx.fillStyle = s.type === 'protected' ? 'rgba(98,200,147,.07)' : 'rgba(233,140,69,.07)'; ctx.lineWidth = 1.2 * px; ctx.setLineDash([4 * px, 4 * px]); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); if (L.labels) { ctx.fillStyle = ctx.strokeStyle; ctx.fillText(s.name, s.x, s.y + s.r + 14 * px); } }
      const show = (s.type === 'diplomatic' && L.stations) || (s.type === 'research' && L.research) || (s.type === 'education' && L.education);
      if (!show) return; const z = 6 * px; ctx.lineWidth = 1.2 * px;
      ctx.fillStyle = s.type === 'diplomatic' ? '#7FA3F5' : s.type === 'research' ? '#B79BF2' : '#F1DCA0'; ctx.beginPath();
      if (s.type === 'diplomatic') { ctx.moveTo(s.x, s.y - z); ctx.lineTo(s.x + z, s.y); ctx.lineTo(s.x, s.y + z); ctx.lineTo(s.x - z, s.y); }
      else if (s.type === 'research') { ctx.moveTo(s.x, s.y - z); ctx.lineTo(s.x + z, s.y + z * 0.8); ctx.lineTo(s.x - z, s.y + z * 0.8); }
      else ctx.rect(s.x - z * 0.8, s.y - z * 0.8, z * 1.6, z * 1.6);
      ctx.closePath(); ctx.fill();
      if (UI.sel.map === s.id) { ctx.strokeStyle = '#F5F3EE'; ctx.beginPath(); ctx.arc(s.x, s.y, z * 2, 0, 6.283); ctx.stroke(); }
      if (L.labels && v.s > v.fit * 1.4) { ctx.fillStyle = 'rgba(245,243,238,.7)'; ctx.fillText(s.name.replace(/ \(.*\)/, ''), s.x, s.y - z - 5 * px); }
    });
    const crises = activeCrises();
    ST.civs.filter(c => c.discovered).forEach(c => {
      const rad = (c.kind === 'capital' ? 16 : 10 + Math.min(8, Math.sqrt(c.pop) * 1.6)) * px;
      const pg = ctx.createRadialGradient(c.x - rad * 0.4, c.y - rad * 0.4, rad * 0.1, c.x, c.y, rad); pg.addColorStop(0, '#FFFFFF'); pg.addColorStop(0.25, c.color); pg.addColorStop(1, '#0A0D18');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(c.x, c.y, rad, 0, 6.283); ctx.fill();
      ctx.strokeStyle = c.kind === 'capital' ? '#D4AF37' : c.kind === 'independent' ? '#4776E6' : c.kind === 'observer' ? '#7048C8' : 'rgba(241,220,160,.6)'; ctx.lineWidth = (c.kind === 'capital' ? 2 : 1.3) * px; ctx.beginPath(); ctx.arc(c.x, c.y, rad + 4 * px, 0, 6.283); ctx.stroke();
      if (c.kind === 'capital') { ctx.beginPath(); ctx.arc(c.x, c.y, rad + 8 * px, 0, 6.283); ctx.stroke(); }
      if (crises.some(e => e.civ === c.id)) { const pr = rad + (10 + 6 * Math.sin(t * 3)) * px; ctx.strokeStyle = 'rgba(229,112,95,.85)'; ctx.lineWidth = 2 * px; ctx.beginPath(); ctx.arc(c.x, c.y, pr, 0, 6.283); ctx.stroke(); }
      if (UI.sel.map === c.id) { ctx.strokeStyle = '#F5F3EE'; ctx.lineWidth = 1.6 * px; ctx.setLineDash([3 * px, 3 * px]); ctx.beginPath(); ctx.arc(c.x, c.y, rad + 14 * px, t % 6.283, t % 6.283 + 5.5); ctx.stroke(); ctx.setLineDash([]); }
      if (L.labels) { ctx.fillStyle = '#F5F3EE'; ctx.font = `600 ${13 * px}px "IBM Plex Sans", sans-serif`; ctx.fillText(c.name, c.x, c.y + rad + 18 * px); ctx.font = `${11 * px}px "IBM Plex Sans", sans-serif`; ctx.fillStyle = 'rgba(175,170,156,.9)'; ctx.fillText(c.status, c.x, c.y + rad + 31 * px); }
    });
    setTimeout(() => requestAnimationFrame(frame), 40);
  };
  requestAnimationFrame(frame);
}

/* ---------- Opening scene ---------- */
function showIntro() {
  const el = $('#intro');
  const txt = ST.rise && !ST.rise.crowned ? 'Candidate, the Chamber receives you. The Twelve are seated, but they have not yet recognised your claim. Earn their trust, and the trust of every member civilisation.' : ST.meta.mode === 'crisis' ? 'Sovereign, you arrive in a dark hour. Four emergencies are burning across the Cosmos, and the treasury is thin. The Twelve await your orders.' : ST.meta.mode === 'tribunal' ? 'Sovereign, the docket is full. The Twelve are seated and the parties are waiting. Justice delayed is justice denied.' : ST.meta.mode === 'creative' ? 'Sovereign, the Cosmos is yours to shape. Here nothing is fixed, and nothing you build will be counted against the record.' : 'Welcome, Sovereign. The member civilisations have spoken with one voice, and the Twelve have recognised your authority. The Ancient Spirits bear witness. Your first briefing is ready.';
  el.innerHTML = `${chamberHTML('chamberIntro', false)}<div class="welcome"><h1>The Cosmic Tribunal</h1><div class="sub">Sovereignty beyond worlds</div><p>“${esc(txt)}”</p><div class="eyebrow" style="margin-top:-6px">The Prime Arbiter · ${esc(fmtDate(ST.day))}</div><div class="btnrow" style="justify-content:center;margin-top:18px"><button class="btn primary" data-act="introEnter" autofocus>Enter the Chamber</button><button class="btn" data-act="introSound" id="introSoundBtn">${PREFS.muted ? 'Enable sound' : 'Sound on'}</button><button class="btn ghost" data-act="introModes">Choose a campaign mode</button></div></div>`;
  el.classList.add('open'); drawChamber($('#chamberIntro canvas'));
}

/* ---------- Boot ---------- */
function boot(data) {
  startStarfield();
  let restored = false;
  if (data && data.st) { ST = data.st; Object.assign(UI, data.ui || {}); restored = true; }
  else { const r = SaveManager.load('autosave'); if (r.ok) { ST = r.st; restored = true; } else ST = newGame('sandbox'); }
  document.body.classList.toggle('big', !!PREFS.big); document.body.classList.toggle('calm', !!PREFS.calm);
  buildShell(); wireInput();
  const h = location.hash.slice(1); if (SCREENS[h]) UI.screen = h;
  render(true); startClock();
  if (!PREFS.introSeen || !restored) showIntro();
  try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({st:ST, ui:{screen:UI.screen, sel:UI.sel, tab:UI.tab, filter:UI.filter}})); } catch (e) {}
  addEventListener('pagehide', () => autosave(true));
  if (!SaveManager.ok()) toast('Browser storage is unavailable. Export your campaign from Settings to keep it.', 'bad');
}
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot); else boot((window.claude && window.claude.hot && window.claude.hot.data) || {});
