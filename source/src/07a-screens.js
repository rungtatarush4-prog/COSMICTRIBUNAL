/* ===== Screens, part one ===== */
const SCREENS = {};
const head = (eyebrow, title, sub, actions = '') => `<header class="shead"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="btnrow">${actions}</div>` : ''}</header>`;
const plate = (title, body, o = {}) => `<section class="plate ${o.cls || ''}" ${o.id ? `id="${o.id}"` : ''}>${title ? `<div class="ptitle"><h2>${title}</h2>${o.k ? `<span class="k">${o.k}</span>` : ''}${o.act || ''}</div>` : ''}${body}</section>`;
const person = (ch, sub) => `<div class="person">${sigil(ch.name, ch.hue || (hashStr(ch.name) % 360), 36)}<div style="min-width:0"><b>${esc(ch.name)}</b><small>${esc(sub || ch.position || ch.role || '')}</small></div></div>`;
const lastInd = () => ST.indHist.length > 1 ? ST.indHist[ST.indHist.length - 2] : ST.indHist[0];
const recognisedCount = () => ST.civs.filter(c => c.discovered && c.kind !== 'unknown').length;
const totalPop = () => ST.civs.filter(c => c.discovered).reduce((a, c) => a + c.pop, 0);
const activeCrises = () => ST.events.filter(e => e.kind === 'crisis' && e.status === 'active');
const activeDevs = () => ST.events.filter(e => e.kind === 'development' && e.status === 'active');
const pendingPetitions = () => ST.petitions.filter(p => p.status === 'pending');
const openPetitions = () => ST.petitions.filter(p => ['pending','awaiting information','council review','hearing scheduled'].includes(p.status));
const openCases = () => ST.cases.filter(c => c.status === 'open' || (c.appeal && c.appeal.status === 'pending'));
const activeNegs = () => ST.negotiations.filter(n => n.status === 'active');

/* ---------- 1. Dashboard ---------- */
function intelBriefing() {
  const out = [];
  const cr = activeCrises().sort((a, b) => a.nextEsc - b.nextEsc)[0];
  if (cr) out.push(`<b>Emergency.</b> ${esc(cr.title)} is at stage ${cr.stage}; escalation expected ${cr.nextEsc - ST.day <= 0 ? 'today' : `in ${cr.nextEsc - ST.day} days`}.`);
  const pp = pendingPetitions().sort((a, b) => a.deadlineDay - b.deadlineDay)[0];
  if (pp) out.push(`<b>Petitions.</b> ${pendingPetitions().length} awaiting decision. Nearest deadline: ${esc(pp.id)} in ${Math.max(0, pp.deadlineDay - ST.day)} days.`);
  const oc = openCases(); if (oc.length) out.push(`<b>Tribunal.</b> ${oc.length} case${oc.length > 1 ? 's' : ''} before the Tribunal. ${esc(oc[0].id)} is at “${CASE_STAGES[oc[0].stage]}”.`);
  const neg = activeNegs()[0]; if (neg) out.push(`<b>Diplomacy.</b> ${esc(neg.title)}: ${Math.round(neg.progress)}% agreed, round ${neg.round} on ${fmtDateShort(neg.nextRound)}.`);
  const rev = Object.values(projectedRevenue(ST)).reduce((a, b) => a + b, 0), rc = recurringCosts(ST), exp = budgetTotal(ST) + rc.laws + rc.edu;
  out.push(`<b>Treasury.</b> Projected monthly ${rev >= exp ? 'surplus' : 'deficit'} of ${fmtCC(Math.abs(rev - exp))}. Balance ${fmtCC(ST.treasury.balance)}.`);
  const low = IND_KEYS.filter(k => ST.ind[k] < 50); if (low.length) out.push(`<b>Warning.</b> ${low.map(k => IND_LABEL[k]).join(', ')} below 50.`);
  const busy = councilMembers(ST).filter(m => m.busyUntil > ST.day).length; if (busy) out.push(`<b>Council.</b> ${busy} member${busy > 1 ? 's' : ''} deployed in the field.`);
  const prj = ST.projects.filter(p => p.status === 'active').sort((a, b) => (b.progress / b.duration) - (a.progress / a.duration))[0];
  if (prj) out.push(`<b>Projects.</b> ${esc(prj.name)} is ${Math.round(prj.progress / prj.duration * 100)}% complete.`);
  return out;
}
SCREENS.dashboard = () => {
  const prev = lastInd();
  const inds = IND_KEYS.map(k => { const v = ST.ind[k], d = v - (prev[k] ?? v); return `<div class="ind"><small>${IND_LABEL[k]}</small><b class="${v < 45 ? 'bad' : v < 70 ? 'warn' : ''}">${fmt(v)}</b>${meter(v, indClass(v))}<span class="d ${d > 0.05 ? 'good' : d < -0.05 ? 'bad' : 'faint'}">${Math.abs(d) < 0.05 ? 'Steady since last month' : `${sgn(d)} since last month`}</span></div>`; }).join('');
  const crises = activeCrises();
  const devs = activeDevs();
  const b = ST.briefing || {text:'', day:0};
  return `<div class="screen">
  ${head('Sovereign’s Dashboard', 'Command Centre of the Crown', `${esc(fmtDate(ST.day))}. ${esc(ST.goal || '')}`, `<button class="btn" data-act="assessment">Independent assessment</button><button class="btn primary" data-act="go" data-screen="petitions">Review petitions</button>`)}
  <section class="plate hero"><div class="briefing">${sigil('Prime Arbiter', 45, 64)}<div style="min-width:0;flex:1"><div class="eyebrow">Briefing · ${esc(fmtDate(b.day))}</div><blockquote style="margin-top:6px">${esc(b.text)}</blockquote><cite>The Prime Arbiter, ${esc(ST.canon.arbiterRole)}</cite></div><div style="flex:none" class="hide-sm">${sealSVG(96, true)}</div></div></section>
  <div class="indgrid">${inds}</div>
  ${plate('', `<div class="statline">
    <div><small>Cosmic date</small><b>${esc(fmtDateShort(ST.day))}</b></div>
    <div><small>Recognised civilisations</small><b>${recognisedCount()}</b></div>
    <div><small>Cosmic population</small><b>${fmt1(totalPop())} bn</b></div>
    <div><small>Treasury</small><b>${fmtCC(ST.treasury.balance)}</b></div>
    <div><small>Emergency reserve</small><b>${fmtCC(ST.treasury.reserve)}</b></div>
    <div><small>Active petitions</small><b>${openPetitions().length}</b></div>
    <div><small>Pending cases</small><b>${openCases().length}</b></div>
    <div><small>Negotiations</small><b>${activeNegs().length}</b></div>
    <div><small>Emergency alerts</small><b class="${crises.length ? 'bad' : ''}">${crises.length}</b></div></div>`)}
  <div class="grid g-side">
    <div class="stack" style="gap:16px">
      ${plate('Emergency alerts', crises.length ? `<div class="stack">${crises.map(e => `<div class="alert-row"><div style="flex:1;min-width:0"><b>${esc(e.title)}</b><div class="muted" style="font-size:12.5px">Stage ${e.stage} of 4 · escalation ${e.nextEsc - ST.day <= 0 ? 'imminent' : 'in ' + (e.nextEsc - ST.day) + ' days'}</div></div><span class="stagepips">${[1,2,3,4].map(i => `<i class="${i <= e.stage ? 'on' : ''}"></i>`).join('')}</span><button class="btn sm danger" data-act="go" data-screen="emergency">Respond</button></div>`).join('')}</div>` : '<div class="empty">No active emergencies. The Cosmos is quiet.</div>', {k:`Reserve ${fmtCC(ST.treasury.reserve)}`})}
      ${plate('Decisions awaiting the Crown', devs.length ? `<div class="list">${devs.map(e => `<div class="li"><div class="grow"><h4>${esc(e.title)}</h4><p>${esc(e.desc)}</p><p class="faint" style="font-size:12px;margin-top:4px">Decide by ${esc(fmtDate(e.deadline))} or the default applies.</p></div><button class="btn sm primary" data-act="openDev" data-id="${e.id}">Decide</button></div>`).join('')}</div>` : '<div class="empty">Nothing awaits your decision right now.</div>', {k:`${devs.length} open`})}
      ${plate('Active projects', projectsTable(ST.projects.filter(p => p.status === 'active').slice(0, 6)), {act:'<button class="btn sm ghost" data-act="go" data-screen="treasury">All projects</button>'})}
    </div>
    <div class="stack" style="gap:16px">
      ${plate('Daily intelligence briefing', `<ul class="stack" style="gap:8px;margin:0;padding-left:18px;font-size:13.5px">${intelBriefing().map(l => `<li>${l}</li>`).join('')}</ul>`, {k:esc(fmtDateShort(ST.day))})}
      ${plate('Notification centre', notifList(ST.notifications.slice(0, 7)), {act:`<button class="btn sm ghost" data-act="drawer">Open all</button>`})}
    </div>
  </div></div>`;
};
function projectsTable(list) {
  if (!list.length) return '<div class="empty">No active projects.</div>';
  return `<div class="list">${list.map(p => `<div class="li"><div class="grow"><div class="spread"><h4>${esc(p.name)}</h4><span class="mono faint">${p.id}</span></div><div class="row" style="gap:8px;margin-top:4px"><div style="flex:1;min-width:120px">${meter(p.progress / p.duration * 100, 'blue')}</div><span class="num muted" style="font-size:12px">${Math.round(p.progress / p.duration * 100)}% · ${Math.max(0, Math.ceil((p.duration - p.progress) / projectRate(ST)))} days left</span></div></div></div>`).join('')}</div>`;
}
function notifList(list) {
  if (!list.length) return '<div class="empty">No notifications.</div>';
  return list.map(n => `<div class="ntf ${n.kind} ${n.read ? '' : 'unread'}" data-act="openNotif" data-id="${n.id}" role="button" tabindex="0"><span class="dot"></span><div style="min-width:0"><h4>${esc(n.title)}</h4>${n.body ? `<p>${esc(n.body.length > 220 ? n.body.slice(0, 217) + '…' : n.body)}</p>` : ''}<p class="faint" style="font-size:11px">${esc(fmtDate(n.day))}</p></div></div>`).join('');
}
function devModal(id) {
  const e = ST.events.find(x => x.id === id); if (!e) return;
  const advisers = ['arbiter', 'elyndor', 'kaelith', 'aurion', 'zephyria', 'ignivar'].map(i => charById(ST, i));
  const ops = advisers.slice(0, 4).map(ch => { let best = e.options[0], bs = -1e9; e.options.forEach(o => { const s = charScore(ch, o.eff, o.cost || 0).s + (o.act === 'case' || o.act === 'case-authority' ? (ch.principle || 1) * 0.6 : 0) + (o.char && o.char[ch.id] ? o.char[ch.id] * 0.2 : 0); if (s > bs) { bs = s; best = o; } }); return {ch, o:best}; });
  openModal(`<div class="eyebrow">Decision required · ${esc(e.id)}</div><h2>${esc(e.title)}</h2><p>${esc(e.desc)}</p>
  ${e.corporate ? '<p class="pill warn">Rungta Global matter: paid from corporate funds only</p>' : ''}
  <h3 style="margin-top:14px">Counsel</h3>${ops.map(x => `<div class="opinion">${sigil(x.ch.name, x.ch.hue, 34)}<div><div class="who">${esc(x.ch.name)}</div><p>${esc(STYLE_OPEN[x.ch.style] || '')}I recommend: ${esc(x.o.label)}.</p></div></div>`).join('')}
  <h3 style="margin-top:14px">Options</h3><div class="stack">${e.options.map(o => `<div class="plate flat" style="padding:12px 14px"><div class="spread"><b>${esc(o.label)}</b><button class="btn sm primary" data-act="devChoose" data-id="${e.id}" data-key="${o.key}">Choose</button></div><p class="muted" style="margin:4px 0 6px;font-size:13px">${esc(o.detail || '')}</p>${o.rgCost ? `<div class="effchips"><span class="neg">Rungta Global −${fmtUSD(o.rgCost)}</span></div>` : effChips(ST, Object.assign({}, o.eff, o.char ? {char:o.char} : {}), o.cost)}</div>`).join('')}</div>
  <p class="faint" style="font-size:12px">Decide by ${esc(fmtDate(e.deadline))}. Otherwise: ${esc((e.options.find(o => o.key === e.def) || {label:'no action'}).label)}.</p>`, {wide:true, label:e.title});
}

/* ---------- 2. Tribunal ---------- */
function thronePositions(st) {
  const P = [];
  const order = JUDGES.map(j => j.id).filter(id => id !== 'arbiter');
  const ys = x => 0.64 - 0.2 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 0.5) / 0.43, 2)));
  order.slice(0, 6).forEach((id, i) => { const x = 0.12 + i * 0.056; P.push({id, x, y:ys(x)}); });
  ['arbiter'].concat(order.slice(6)).forEach((id, i) => { const x = 0.60 + i * 0.056; P.push({id, x, y:ys(x)}); });
  return P;
}
function doorPositions(st) {
  const four = st.flags.fourthDoor;
  const base = [{k:'trial', label:'Trial', col:'#4776E6'}, {k:'petition', label:'Petition', col:'#D4AF37'}, {k:'hidden', label:'Hidden Verdict', col:'#7048C8'}];
  if (four) base.push({k:'mercy', label:'Mercy', col:'#7FD6C2'});
  const xs = four ? [0.29, 0.43, 0.57, 0.71] : [0.32, 0.5, 0.68];
  return base.map((d, i) => Object.assign(d, {x:xs[i], y:0.11, w:four ? 0.085 : 0.095, h:0.31}));
}
function chamberHTML(id, interactive = true) {
  const th = thronePositions(ST), doors = doorPositions(ST);
  const hot = interactive ? th.map(t => { const j = charById(ST, t.id); return `<button class="hot" style="left:${(t.x * 100).toFixed(2)}%;top:${((t.y - 0.06) * 100).toFixed(2)}%;width:6.5%;height:16%" data-act="judge" data-id="${t.id}" aria-label="${esc(j.name)}, ${esc(j.juris)}">${esc(j.name)}</button>`; }).join('')
    + doors.map(d => `<button class="hot door" style="left:${(d.x * 100).toFixed(2)}%;top:${((d.y + d.h / 2) * 100).toFixed(2)}%;width:${(d.w * 100).toFixed(2)}%;height:${(d.h * 100).toFixed(2)}%" data-act="door" data-door="${d.k}" aria-label="Door of ${d.label}">${d.label}</button><span class="tag" style="left:${(d.x * 100).toFixed(2)}%;top:${((d.y + d.h + 0.01) * 100).toFixed(2)}%">${d.label}</span>`).join('')
    + `<button class="hot" style="left:50%;top:76%;width:9%;height:20%" data-act="go" data-screen="office" aria-label="The Central Cosmic Throne">Throne</button>` : '';
  return `<div class="chamber" id="${id}"><canvas aria-label="The Cosmic Tribunal chamber: an obsidian floor over a galaxy, twelve floating thrones, the Central Cosmic Throne, and the doors of Trial, Petition and Hidden Verdict" role="img"></canvas>${hot}</div>`;
}
SCREENS.tribunal = () => {
  const tab = UI.tab.tribunal || 'docket';
  const tabs = [['docket', `Docket (${openCases().length})`], ['twelve', 'The Twelve'], ['record', 'Verdict record']];
  let body = '';
  if (tab === 'docket') body = docketView();
  else if (tab === 'twelve') body = `<div class="grid g3">${judges(ST).map(j => judgeCard(j)).join('')}</div>`;
  else body = verdictRecord();
  return `<div class="screen">${head('The Cosmic Tribunal', 'The Chamber Beyond Space and Time', 'The highest judicial institution in the universe. Select a throne to consult a judge, or a door to enter its proceedings.', `<button class="btn" data-act="door" data-door="hidden">Hidden Verdict</button><button class="btn primary" data-act="tab" data-scr="tribunal" data-tab="docket">Open the docket</button>`)}
  ${chamberHTML('chamberMain')}
  <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" data-act="tab" data-scr="tribunal" data-tab="${k}">${l}</button>`).join('')}</div>${body}</div>`;
};
function judgeCard(j) {
  const mem = j.memory.slice(0, 2);
  return plate('', `${person(j, `${j.position}`)}<p style="font-size:13px;margin:10px 0 6px">${esc(j.personality)}</p><dl class="kv"><dt>Expertise</dt><dd>${esc(j.expertise)}</dd><dt>Objective</dt><dd>${esc(j.objective)}</dd><dt>Trust in you</dt><dd><div class="row"><div style="flex:1">${meter(j.trust, indClass(j.trust))}</div><span class="num">${fmt(j.trust)}</span></div></dd>${j.standing ? `<dt>Vindicated</dt><dd>${j.standing} time${j.standing > 1 ? 's' : ''}</dd>` : ''}</dl>${mem.length ? `<div class="sep"></div><div style="font-size:12px" class="muted">${mem.map(m => `${esc(fmtDateShort(m.day))}: advised ${esc(m.advice)} on ${esc(m.topic)} — ${m.followed ? '<span class="good">followed</span>' : '<span class="warn">not followed</span>'}`).join('<br>')}</div>` : ''}<div class="btnrow" style="margin-top:10px"><button class="btn sm" data-act="judge" data-id="${j.id}">Consult</button></div>`);
}
function judgeModal(id) {
  const j = charById(ST, id);
  const pending = pendingPetitions().slice(0, 3), cases = openCases().slice(0, 2);
  const petOps = pending.map(p => { const a = petAdvice(ST, p).find(x => x.id === j.id) || (() => { const ap = charScore(j, p.project.eff, p.cost); return {text:`${STYLE_OPEN[j.style]}${ap.s >= 0 ? CHOICE_TEXT.approve : CHOICE_TEXT.reject}, because ${topReason(ap.parts, ap.s >= 0)}.`}; })(); return `<div class="opinion"><div><div class="who">${esc(p.id)} · ${esc(p.title)}</div><p>${esc(a.text)}</p></div></div>`; }).join('');
  const caseOps = cases.map(c => { const o = c.opinions && c.opinions.find(x => x.id === j.id); return `<div class="opinion"><div><div class="who">${esc(c.id)} · ${esc(c.title)}</div><p>${o ? esc(o.text) : esc(`${STYLE_OPEN[j.style]}I will give my view at deliberation. ${j.evidence > 1.1 ? 'Bring me every piece of evidence first.' : 'Let the parties speak.'}`)}</p></div></div>`; }).join('');
  const warned = j.memory.filter(m => m.resolved === 'bad' && !m.followed).slice(0, 2);
  const opener = j.trust >= 85 ? 'You have governed well. I say so plainly.' : j.trust >= 70 ? 'I am at the Crown’s service.' : j.trust >= 50 ? 'I will advise you, though I have reservations about recent decisions.' : 'I advise because it is my duty. I am not persuaded by your recent course.';
  openModal(`<div class="row" style="gap:14px">${sigil(j.name, j.hue, 72)}<div><div class="eyebrow">${esc(j.position)}</div><h2>${esc(j.name)}</h2><p class="muted" style="margin:0">${esc(j.personality)}</p></div></div>
  <blockquote style="font-family:var(--f-display);font-size:19px;font-style:italic;margin:16px 0;color:var(--pearl)">“${esc(opener)}${warned.length ? ' ' + esc(`I have not forgotten ${warned[0].topic}.`) : ''}”</blockquote>
  <dl class="kv"><dt>Jurisdiction</dt><dd>${esc(j.juris)}</dd><dt>Decision style</dt><dd>${esc(j.style)}; weighs evidence ${j.evidence >= 1.2 ? 'heavily' : j.evidence <= 0.7 ? 'lightly' : 'moderately'}, ${j.mercy >= 0.8 ? 'inclined to mercy' : j.mercy <= 0.35 ? 'strict' : 'even-handed'}</dd><dt>Trust</dt><dd>${fmt(j.trust)} / 100</dd><dt>Values</dt><dd>${Object.entries(j.values).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => esc(IND_LABEL[k] || k)).join(', ')}</dd></dl>
  ${petOps ? `<h3 style="margin-top:14px">On pending petitions</h3>${petOps}` : ''}${caseOps ? `<h3 style="margin-top:14px">On cases before the Tribunal</h3>${caseOps}` : ''}
  <h3 style="margin-top:14px">Record of counsel</h3>${j.memory.length ? `<div style="font-size:12.5px" class="muted">${j.memory.slice(0, 8).map(m => `${esc(fmtDateShort(m.day))} · ${esc(m.topic)}: advised <b>${esc(m.advice)}</b>, ${m.followed ? 'followed' : 'not followed'}${m.resolved ? ` · outcome ${m.resolved === 'bad' ? '<span class="bad">poor</span>' : '<span class="good">good</span>'}` : ''}`).join('<br>')}</div>` : '<p class="faint">No counsel recorded yet.</p>'}`, {wide:true, label:j.name});
}
function docketView() {
  const cases = ST.cases.filter(c => c.status !== 'closed' || UI.sel.case === c.id).sort((a, b) => (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || b.registered - a.registered);
  let sel = caseById(ST, UI.sel.case) || cases[0];
  if (!sel) return plate('', '<div class="empty">The docket is empty. New cases arrive as the Cosmos turns.</div>');
  UI.sel.case = sel.id;
  const list = cases.map(c => `<button class="sel-item" aria-current="${c.id === sel.id}" data-act="sel" data-k="case" data-id="${c.id}"><span class="spread"><span class="mono goldt">${c.id}</span>${statusPill(c.appeal && c.appeal.status === 'pending' ? 'appeal' : c.status)}</span><b style="font-size:13.5px">${esc(c.title)}</b><span class="muted" style="font-size:12px">${esc(c.subject)} · ${esc(CASE_STAGES[c.stage])}</span></button>`).join('');
  return `<div class="grid g-list">${plate('Cases', `<div class="list" style="margin:-6px -8px">${list}</div>`, {k:`${cases.length}`})}${caseView(sel)}</div>`;
}
function caseView(c) {
  const st = c.stage;
  const stages = `<div class="stages">${CASE_STAGES.map((s, i) => `<div class="${i < st ? 'done' : i === st ? 'cur' : ''}"><b>${String(i + 1).padStart(2, '0')}</b>${s}</div>`).join('')}</div>`;
  const ev = c.evidence.map(e => `<div class="li"><span class="mono goldt">${e.id}</span><div class="grow"><h4>${esc(e.title)}</h4><p>${esc(e.desc)}</p></div></div>`).join('') + c.hidden.filter(h => c.revealedHidden.includes(h.id)).map(e => `<div class="li"><span class="mono goldt">${e.id}</span><div class="grow"><h4>${esc(e.title)} <span class="pill purple">newly produced</span></h4><p>${esc(e.desc)}</p></div></div>`).join('');
  const qBtn = (key, q, a, w, enabled) => c.asked[key] ? `<div class="qa"><b style="font-size:13px">${esc(q)}</b><q>${esc(a)}</q></div>` : `<div class="qa"><b style="font-size:13px">${esc(q)}</b><div><button class="btn sm" data-act="caseAsk" data-id="${c.id}" data-key="${key}" ${enabled ? '' : 'disabled'}>Put this question</button></div></div>`;
  const partyQ = ['claimant','respondent'].map(k => `<div><div class="eyebrow" style="margin-top:6px">${k === 'claimant' ? esc(c.claimant.name) : esc(c.respondent.name)}</div>${qBtn(k, c.partyQs[k].q, c.partyQs[k].a, 0, st >= 2 && st <= 5)}</div>`).join('');
  const wit = c.witnesses.map((w, wi) => `<div style="margin-top:8px"><b>${esc(w.name)}</b> <span class="muted" style="font-size:12px">${esc(w.role)}</span>${w.qs.map((q, qi) => qBtn(`w${wi}q${qi}`, q.q, q.a, q.w, st >= 4 && st <= 5)).join('')}</div>`).join('');
  const ops = c.opinions ? c.opinions.map(o => { const j = charById(ST, o.id); return `<div class="opinion">${sigil(j.name, j.hue, 30)}<div><div class="who">${esc(o.name)}</div><p>${esc(o.text)}</p></div></div>`; }).join('') : '';
  const tally = c.opinions ? c.remedies.filter(m => !m.violates).map(m => ({label:m.label, v:c.opinions.filter(o => o.rec === m.key).length})).filter(x => x.v) : [];
  let action = '';
  if (c.status === 'open' && st < 5) action = `<button class="btn primary" data-act="caseAdvance" data-id="${c.id}">Proceed to ${esc(CASE_STAGES[st + 1])}</button>`;
  if (c.status === 'open' && st === 5) action = `<button class="btn primary" data-act="caseAdvance" data-id="${c.id}">Proceed to verdict</button>`;
  const evBtn = c.status === 'open' && st >= 3 && st <= 5 && !c.requestedEvidence && c.hidden.length ? `<button class="btn blue" data-act="caseEvidence" data-id="${c.id}">Request additional evidence</button>` : c.requestedEvidence && c.revealedHidden.length < c.hidden.length ? '<span class="pill blue">Evidence ordered</span>' : '';
  const verdictForm = c.status === 'open' && st >= 5 ? `<div class="plate" style="border-color:var(--line)"><div class="ptitle"><h3>Issue a reasoned ruling</h3><span class="k">Thoroughness ${Math.round(caseThoroughness(c) * 100)}%</span></div>
    <fieldset style="border:0;padding:0;margin:0" class="stack"><legend class="eyebrow">Remedy</legend>${c.remedies.map((m, i) => `<label class="row" style="align-items:flex-start;gap:8px;font-size:13.5px"><input type="radio" name="remedy" value="${m.key}" ${i === 1 ? 'checked' : ''} id="rem-${c.id}-${m.key}"><span><b>${esc(m.label)}</b>${m.cost ? ` <span class="pill warn">Crown share ${fmtCC(m.cost)}</span>` : ''}<br><span class="muted" style="font-size:12.5px">${esc(m.detail)}</span></span></label>`).join('')}</fieldset>
    <div class="eyebrow" style="margin-top:12px">Constitutional grounds cited</div><div class="chips" style="margin-top:6px">${PRINCIPLES.map((p, i) => `<label class="pill" title="${esc(p)}" style="cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" name="ground" value="${i + 1}" id="gr-${c.id}-${i}"> P${i + 1}</label>`).join('')}</div>
    <label class="f" style="margin-top:10px">Reasons<textarea id="reason-${c.id}" placeholder="State the reasons for the ruling. Reasoned rulings carry more weight."></textarea></label>
    <div class="btnrow" style="margin-top:10px"><button class="btn primary" data-act="caseVerdict" data-id="${c.id}">Deliver verdict</button></div></div>` : '';
  const verdictView = c.verdict ? plate('Verdict', `<p style="margin:0"><b>${esc(c.verdict.label)}</b>${c.verdict.revised ? ` → revised on review to <b>${esc(c.verdict.revised)}</b>` : ''}</p><p class="muted" style="font-size:13px">${c.verdict.agree} of 12 concurred · thoroughness ${c.verdict.thor}% · legitimacy ${sgn(c.verdict.legit)} · delivered ${esc(fmtDate(c.verdict.day))}</p>${c.verdict.notes.length ? `<p style="font-size:13px">${esc(c.verdict.notes.join(' '))}</p>` : ''}${c.verdict.reasoning ? `<p style="font-size:13px"><i>${esc(c.verdict.reasoning)}</i></p>` : ''}<div class="btnrow">${(() => { const d = ST.documents.find(x => x.ref === c.id && x.type === 'verdict'); return d ? `<button class="btn sm" data-act="doc" data-id="${d.id}">View verdict document</button>` : ''; })()}</div>
    ${c.appeal && c.appeal.status === 'pending' ? `<div class="preview"><h4>Appeal lodged by ${esc(c.appeal.name)}</h4><p style="font-size:13px;margin:0 0 8px">The appellant asks for constitutional review of the verdict.</p><div class="btnrow"><button class="btn primary" data-act="caseAppeal" data-id="${c.id}" data-dec="review">Convene constitutional review</button><button class="btn" data-act="caseAppeal" data-id="${c.id}" data-dec="uphold">Uphold the verdict</button><button class="btn danger" data-act="caseAppeal" data-id="${c.id}" data-dec="dismiss">Dismiss the appeal</button></div></div>` : c.appeal ? `<p class="muted" style="font-size:13px">Appeal: ${esc(c.appeal.result)}</p>` : ''}`) : '';
  return `<div class="stack" style="gap:14px;min-width:0">
  ${plate(`${esc(c.title)}`, `<div class="row" style="margin:-6px 0 10px"><span class="mono goldt">${c.id}</span><span class="pill">${esc(c.type)}</span>${statusPill(c.status)}<span class="faint" style="font-size:12px">Registered ${esc(fmtDate(c.registered))}</span></div>${stages}
    <dl class="kv" style="margin-top:12px"><dt>Subject</dt><dd>${esc(c.subject)}</dd><dt>Claimant</dt><dd>${esc(c.claimant.name)}</dd><dt>Respondent</dt><dd>${esc(c.respondent.name)}</dd><dt>Allegations</dt><dd>${esc(c.allegations)}</dd><dt>Relevant law</dt><dd>${c.laws.map(esc).join('<br>')}</dd></dl>
    <div class="btnrow" style="margin-top:12px">${action}${evBtn}<button class="btn ghost" data-act="door" data-door="hidden" data-ref="${c.id}">Consult the Ancient Spirits</button></div>`)}
  ${st >= 2 ? plate('Opening statements', `<div class="grid g2"><div><div class="eyebrow">For the claimant</div><p style="font-size:13.5px">${esc(c.argC)}</p></div><div><div class="eyebrow">For the respondent</div><p style="font-size:13.5px">${esc(c.argR)}</p></div></div><div class="sep"></div><div class="eyebrow">Questions to the parties</div><div class="grid g2">${partyQ}</div>`) : ''}
  ${st >= 3 ? plate('Evidence', `<div class="list">${ev}</div>${c.hidden.length > c.revealedHidden.length ? `<p class="faint" style="font-size:12px;margin:6px 0 0">${c.requestedEvidence ? 'Further evidence has been ordered.' : 'The Tribunal may order production of further evidence.'}</p>` : ''}`, {k:`${c.evidence.length + c.revealedHidden.length} items`}) : ''}
  ${st >= 4 ? plate('Witness examination', wit) : ''}
  ${st >= 5 && c.opinions ? plate('Judicial deliberation', `${tally.length ? `<div style="margin-bottom:10px">${barList(tally, {fmt:v => v + ' of 12'})}</div>` : ''}${ops}`) : ''}
  ${verdictForm}${verdictView}
  ${plate('Proceedings log', `<div class="muted" style="font-size:12.5px">${c.log.slice().reverse().map(esc).join('<br>') || 'Registered.'}</div>`)}
  </div>`;
}
function verdictRecord() {
  const v = ST.cases.filter(c => c.verdict).sort((a, b) => b.verdict.day - a.verdict.day);
  const hist = ST.archives.filter(a => a.type === 'verdict' && a.ref.startsWith('TRB-H'));
  return plate('Verdicts of this reign', v.length ? `<div class="tablewrap"><table><thead><tr><th>Case</th><th>Title</th><th>Remedy</th><th class="r">Concurring</th><th class="r">Legitimacy</th><th>Date</th></tr></thead><tbody>${v.map(c => `<tr class="click" data-act="openCase" data-id="${c.id}"><td class="mono">${c.id}</td><td>${esc(c.title)}</td><td>${esc(c.verdict.revised || c.verdict.label)}</td><td class="r">${c.verdict.agree}/12</td><td class="r ${c.verdict.legit < 0 ? 'bad' : 'good'}">${sgn(c.verdict.legit)}</td><td>${esc(fmtDateShort(c.verdict.day))}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No verdicts yet in this reign.</div>') + plate('Historical precedents', hist.map(a => `<div class="li"><span class="mono goldt">${esc(a.ref)}</span><div class="grow"><h4>${esc(a.title)}</h4><p>${esc(a.body)}</p></div></div>`).join(''));
}
function spiritsModal(ref) {
  const ready = ST.day - ST.flags.spiritsLast >= 30;
  const opts = openCases().map(c => `<option value="${c.id}" ${ref === c.id ? 'selected' : ''}>${esc(c.id)} · ${esc(c.title)}</option>`).join('') + pendingPetitions().map(p => `<option value="${p.id}" ${ref === p.id ? 'selected' : ''}>${esc(p.id)} · ${esc(p.title)}</option>`).join('');
  openModal(`<div class="eyebrow">The Door of the Hidden Verdict</div><h2>Audience with the Ancient Spirits</h2><p class="muted">Behind the third door the Ancient Spirits keep what the evidence cannot show. They answer once each month. Consulting them on a matter before the Tribunal unsettles the Twelve: Judicial Legitimacy −0.5, Aurion’s trust −1.</p>
  <label class="f">Matter to lay before the Spirits<select id="spiritRef"><option value="">A general question</option>${opts}</select></label>
  <p class="${ready ? 'good' : 'warn'}" style="font-size:13px">${ready ? 'The Spirits will hear you now.' : `The Spirits are silent until ${esc(fmtDate(ST.flags.spiritsLast + 30))}.`}</p>
  <h3>Sealed records</h3>${ST.archives.filter(a => a.title === 'Audience with the Ancient Spirits').slice(0, 5).map(a => `<p style="font-size:13px" class="muted">${esc(fmtDateShort(a.day))}: ${esc(a.body)}</p>`).join('') || '<p class="faint">No audiences recorded.</p>'}
  <div class="foot"><button class="btn ghost" data-act="closeModal">Leave</button><button class="btn primary" data-act="spirits" ${ready ? '' : 'disabled'}>Ask the Spirits</button></div>`, {label:'Hidden Verdict'});
}

/* ---------- 3. Royal Cosmic Council ---------- */
SCREENS.council = () => {
  const tab = UI.tab.council || 'members';
  const tabs = [['members', 'Members'], ['departments', 'Departments & committees'], ['recs', `Recommendations (${ST.council.recommendations.filter(r => r.status === 'pending').length})`], ['structure', 'Structure & delegation']];
  let body = '';
  const ms = councilMembers(ST);
  if (tab === 'members') {
    const rows = ms.map(m => `<tr><td>${person(m, m.role)}</td><td style="font-size:12.5px">${esc(m.ability)}</td><td style="font-size:12.5px">${esc(m.dept)}</td><td style="min-width:110px">${m.sovereign ? '<span class="faint">—</span>' : `<div class="row" style="gap:6px"><div style="flex:1">${meter(m.trust, indClass(m.trust))}</div><span class="num" style="font-size:12px">${fmt(m.trust)}</span></div>`}</td><td class="r num">${m.sovereign ? '—' : fmt(m.perf)}</td><td>${m.sovereign ? '<span class="pill gold">Crown</span>' : m.busyUntil > ST.day ? `<span class="pill warn">Deployed to ${esc(fmtDateShort(m.busyUntil))}</span>` : '<span class="pill good">Available</span>'}</td><td>${m.sovereign ? '' : `<div class="btnrow"><button class="btn sm" data-act="memberReport" data-id="${m.id}">Report</button><button class="btn sm ghost" data-act="memberReview" data-id="${m.id}" data-a="commend">Commend</button><button class="btn sm ghost" data-act="memberReview" data-id="${m.id}" data-a="guidance">Guidance</button>${m.established ? '' : `<button class="btn sm danger" data-act="memberRelieve" data-id="${m.id}">Relieve</button>`}</div>`}</td></tr>`).join('');
    const vac = vacantSeats(ST);
    const cands = COUNCIL_CANDIDATES.filter(c => !ST.chars.some(x => x.name === c.name && x.active !== false));
    body = plate(`Members of the Council`, `<div class="tablewrap"><table><thead><tr><th>Member</th><th>Ability</th><th>Responsibility</th><th>Trust</th><th class="r">Perf.</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`, {k:`${ms.length} of ${ST.council.seats} seats filled`})
      + plate(`Vacant seats (${vac})`, vac > 0 ? `<p class="muted" style="margin-top:0;font-size:13px">Configurable seats. Appoint a candidate and assign a responsibility.</p><div class="grid g3">${cands.map(c => `<div class="plate flat" style="padding:12px">${person(c, c.role)}<p style="font-size:12.5px;margin:8px 0">${esc(c.ability)}. ${esc(c.personality)}</p><label class="f">Responsibility<input type="text" id="dept-${hashStr(c.name)}" value="${esc(c.role.replace(/ of .*/, '') + ' Office')}"></label><button class="btn sm primary" style="margin-top:8px" data-act="appoint" data-name="${esc(c.name)}">Appoint</button></div>`).join('') || '<div class="empty">No candidates remain.</div>'}</div>` : '<div class="empty">Every seat is filled. Amend the Council structure to add seats.</div>')
      + `<p class="faint" style="font-size:12px">Council members are fictionalised character profiles. Their simulated personalities and opinions are inventions of the game and do not represent the private thoughts of any real person.</p>`;
  } else if (tab === 'departments') {
    const deps = ST.council.departments.map(d => `<tr><td>${esc(d.name)}</td><td><select data-chg="deptHead" data-id="${d.id}" aria-label="Head of ${esc(d.name)}" id="dh-${d.id}">${ms.map(m => `<option value="${m.id}" ${m.id === d.head ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></td></tr>`).join('');
    const coms = ST.council.committees.map(c => `<div class="li"><div class="grow"><h4>${esc(c.name)}</h4><p>Mandate: ${esc(c.mandate)} · Members: ${c.members.map(id => esc((charById(ST, id) || {name:id}).name)).join(', ')}</p></div><button class="btn sm danger" data-act="dissolveCommittee" data-id="${c.id}">Dissolve</button></div>`).join('');
    body = `<div class="grid g2">${plate('Departments', `<div class="tablewrap"><table><thead><tr><th>Department</th><th>Head</th></tr></thead><tbody>${deps}</tbody></table></div><div class="sep"></div><h3>Create a department</h3><div class="row" style="margin-top:8px;align-items:flex-end"><label class="f" style="flex:1 1 180px">Name<input type="text" id="newDeptName" placeholder="e.g. Office of Interstellar Health"></label><label class="f" style="flex:1 1 150px">Head<select id="newDeptHead">${ms.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></label><button class="btn primary" data-act="createDept">Create</button></div><p class="faint" style="font-size:12px">Up to 12 departments improve efficiency. Beyond that, bureaucracy slows the Council.</p>`, {k:`${ST.council.departments.length}`})}
    ${plate('Committees', `${coms || '<div class="empty">No committees.</div>'}<div class="sep"></div><h3>Establish a committee</h3><label class="f" style="margin-top:8px">Name<input type="text" id="comName" placeholder="e.g. Stellar Watch Committee"></label><label class="f" style="margin-top:8px">Mandate<select id="comMandate">${['stellar','environment','tidal','storm','supply','security','coordination'].map(t => `<option>${t}</option>`).join('')}</select></label><div class="chips" style="margin-top:8px">${ms.filter(m => !m.sovereign).map(m => `<label class="pill" style="cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" class="comMember" value="${m.id}" id="cmm-${m.id}"> ${esc(m.name)}</label>`).join('')}</div><button class="btn primary" style="margin-top:10px" data-act="createCommittee">Establish</button><p class="faint" style="font-size:12px">A committee whose mandate matches an emergency adds 8% to response success.</p>`)}</div>`;
  } else if (tab === 'recs') {
    const recs = ST.council.recommendations;
    body = plate('Recommendations from the Council', recs.length ? `<div class="list">${recs.slice(0, 30).map(r => { const m = charById(ST, r.from); return `<div class="li">${sigil(m.name, hashStr(m.name) % 360, 34)}<div class="grow"><h4>${esc(m.name)} <span class="faint" style="font-weight:400;font-size:12px">${esc(fmtDateShort(r.day))}</span></h4><p>${esc(r.text)}</p></div>${r.status === 'pending' ? `<div class="btnrow"><button class="btn sm primary" data-act="rec" data-id="${r.id}" data-ok="1">Accept</button><button class="btn sm" data-act="rec" data-id="${r.id}" data-ok="0">Reject</button></div>` : statusPill(r.status)}</div>`; }).join('')}</div>` : '<div class="empty">No recommendations yet. Members submit them as months pass.</div>');
  } else {
    const classes = ['Environmental','Scientific','Constitutional','Educational','Development','Humanitarian','Cultural','Administrative'];
    body = `<div class="grid g2">${plate('Amend the Council structure', `<div class="stack"><label class="f">Seats on the Council<input type="number" id="seats" min="${ms.length}" max="20" value="${ST.council.seats}"></label><label class="f">Quorum rule<select id="quorum">${['Simple majority','Two-thirds majority','Unanimity'].map(q => `<option ${q === ST.council.quorum ? 'selected' : ''}>${q}</option>`).join('')}</select></label><label class="f">Chair of meetings<select id="chair">${['The Sovereign','The Prime Arbiter','Rotating chair'].map(q => `<option ${q === ST.council.chair ? 'selected' : ''}>${q}</option>`).join('')}</select></label><button class="btn primary" data-act="amendCouncil">Amend structure</button></div>`)}
    ${plate('Delegation of authority', `<p class="muted" style="margin-top:0;font-size:13px">A delegate decides Low and Moderate urgency petitions of that class on your behalf, two days after submission, according to their own judgement.</p><div class="tablewrap"><table><tbody>${classes.map(cl => `<tr><td>${cl}</td><td><select data-chg="delegate" data-cls="${cl}" id="del-${cl}" aria-label="Delegate for ${cl}"><option value="">The Sovereign decides</option>${ms.filter(m => !m.sovereign).map(m => `<option value="${m.id}" ${ST.council.delegations[cl] === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`)}</div>`;
  }
  return `<div class="screen">${head('Royal Cosmic Council', 'United Under the Crown', 'The administrative and protective institution of the Crown. Members advise, administer and implement lawful decisions, and may respectfully disagree with the Sovereign.', `<button class="btn primary" data-act="meeting">Convene emergency meeting</button>`)}
  <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" data-act="tab" data-scr="council" data-tab="${k}">${l}</button>`).join('')}</div>${body}</div>`;
};
function meetingModal(ref) {
  const agenda = meetingAgenda(ST);
  if (!agenda.length) { openModal('<h2>Emergency meeting</h2><div class="empty">There is nothing on the agenda: no emergencies, decisions or pending petitions.</div><div class="foot"><button class="btn primary" data-act="closeModal">Close</button></div>'); return; }
  ref = ref || agenda[0].ref;
  const {options, opinions} = meetingOpinions(ST, ref);
  const counts = options.map(o => ({o, n:opinions.filter(x => x.rec === o.key).length}));
  openModal(`<div class="eyebrow">Royal Cosmic Council · emergency session · ${esc(fmtDate(ST.day))}</div><h2>Convene the Council</h2>
  <label class="f">Agenda item<select data-chg="meetingRef" id="meetingRef">${agenda.map(a => `<option value="${a.ref}" ${a.ref === ref ? 'selected' : ''}>${esc(a.title)}</option>`).join('')}</select></label>
  <h3 style="margin-top:14px">Members heard (${opinions.length} present; deployed members are absent)</h3>${opinions.map(o => { const m = charById(ST, o.id); return `<div class="opinion">${sigil(m.name, hashStr(m.name) % 360, 30)}<div><div class="who">${esc(m.name)} · ${esc(m.role)}</div><p>${esc(o.text)}</p></div></div>`; }).join('') || '<p class="faint">No members are available.</p>'}
  <h3 style="margin-top:14px">Adopt a resolution</h3><div class="stack">${counts.map(({o, n}) => `<div class="spread plate flat" style="padding:10px 12px"><div style="min-width:0"><b>${esc(o.label)}</b> <span class="muted" style="font-size:12px">${n} member${n === 1 ? '' : 's'} in favour</span></div><button class="btn sm primary" data-act="adopt" data-ref="${ref}" data-key="${o.key}">Adopt</button></div>`).join('')}</div>
  <p class="faint" style="font-size:12px">Members whose recommendation you adopt gain trust; others remember being overruled. Minutes are filed in the Archives.</p>`, {wide:true, label:'Council meeting'});
}

/* ---------- 4. Universe Map ---------- */
SCREENS.map = () => {
  const sel = UI.sel.map;
  const c = sel && sel.startsWith('st-') ? null : civById(ST, sel);
  const s = sel && sel.startsWith('st-') ? STATIONS.find(x => x.id === sel) : null;
  const L = UI.mapLayers || (UI.mapLayers = {stations:true, research:true, education:true, protected:true, lanes:true, labels:true});
  let panel;
  if (c) panel = civPanel(c, true);
  else if (s) panel = plate(esc(s.name), `<span class="pill gold">${esc({diplomatic:'Diplomatic station', research:'Research centre', education:'Educational institution', protected:'Protected region', territory:'Cosmic territory'}[s.type])}</span><p style="font-size:13.5px">${esc(s.note)}</p>${s.id === 'st-dais' ? '<button class="btn sm" data-act="go" data-screen="education">Open COSMOS–EDU</button>' : s.id === 'st-concord' ? '<button class="btn sm" data-act="go" data-screen="diplomacy">Open Diplomatic Affairs</button>' : s.type === 'research' ? '<button class="btn sm" data-act="go" data-screen="research">Open Scientific Research</button>' : ''}`);
  else panel = plate('The Cosmic World', `<p class="muted" style="margin-top:0;font-size:13.5px">Drag to pan. Scroll, pinch or use the buttons to zoom. Select a world or station to inspect it.</p><div class="list">${ST.civs.filter(x => x.discovered).map(x => `<div class="li" data-act="mapSel" data-id="${x.id}" role="button" tabindex="0" style="cursor:pointer"><span style="width:10px;height:10px;border-radius:50%;background:${x.color};flex:none;margin-top:5px"></span><div class="grow"><h4>${esc(x.name)}</h4><p>${esc(x.status)} · ${fmt1(x.pop)} bn</p></div>${relPill(x.rel)}</div>`).join('')}</div>`);
  return `<div class="screen">${head('Universe Map', 'The Cosmic World', `${recognisedCount()} recognised civilisations across ${GALAXIES.length} galaxies.`, `<button class="btn" data-act="mapReset">Reset view</button>`)}
  <div class="grid g-side"><div class="mapwrap" id="mapwrap"><canvas id="mapCanvas" role="img" aria-label="Interactive map of galaxies, civilisations and stations"></canvas><div class="mapctl"><button class="iconbtn" data-act="mapZoom" data-z="1.3" aria-label="Zoom in">+</button><button class="iconbtn" data-act="mapZoom" data-z="0.77" aria-label="Zoom out">−</button></div><div class="maplayers">${[['lanes','Relations'],['stations','Diplomatic'],['research','Research'],['education','Education'],['protected','Protected & territories'],['labels','Labels']].map(([k, l]) => `<label><input type="checkbox" data-chg="mapLayer" data-k="${k}" id="ml-${k}" ${L[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div></div><div style="min-width:0">${panel}</div></div></div>`;
};
function civPanel(c, compact) {
  const dev = c.dev;
  const rel = ST.petitions.filter(p => p.civ === c.id && openPetitions().includes(p)).length, cs = ST.cases.filter(x => x.status === 'open' && (x.claimant.civ === c.id || x.respondent.civ === c.id)).length;
  const crisis = activeCrises().filter(e => e.civ === c.id);
  return plate(esc(c.name), `<div class="row" style="margin:-6px 0 10px"><span class="pill ${c.kind === 'capital' ? 'gold' : c.kind === 'independent' ? 'blue' : c.kind === 'observer' ? 'purple' : ''}">${esc(c.status)}</span>${relPill(c.rel)}${crisis.length ? '<span class="pill solid-bad">Emergency</span>' : ''}</div>
  <dl class="kv"><dt>Population</dt><dd>${fmt1(c.pop)} billion</dd><dt>Government</dt><dd>${esc(c.gov)}</dd><dt>Culture</dt><dd>${esc(c.culture)}</dd><dt>Home system</dt><dd>${esc(c.system)} · ${esc((GALAXIES.find(g => g.id === c.galaxy) || {name:''}).name)}</dd><dt>Technology</dt><dd>${fmt(c.tech)} / 100</dd><dt>Economy</dt><dd>${fmt(c.econ)} / 100</dd><dt>Resources</dt><dd>${c.resources.map(esc).join(', ')}</dd><dt>Diplomatic status</dt><dd>${esc(c.status)}${c.contribution ? ` · contributes about ${fmtCC(c.contribution)} a month, voluntarily` : ''}</dd><dt>Relationship</dt><dd>${fmt(c.rel)} / 100 with the Sovereign</dd><dt>Current challenges</dt><dd>${c.challenges.map(esc).join('; ')}${crisis.map(e => `<br><span class="bad">${esc(e.title)} (stage ${e.stage})</span>`).join('')}</dd></dl>
  <div class="sep"></div><div class="eyebrow">Development indicators</div><div class="grid g2" style="gap:8px 16px;margin-top:8px">${Object.entries(dev).map(([k, v]) => `<div><div class="spread" style="font-size:12px"><span>${cap(k)}</span><span class="num muted">${fmt(v)}</span></div>${meter(v, indClass(v))}</div>`).join('')}</div>
  ${(rel || cs) ? `<p class="muted" style="font-size:12.5px">${rel} open petition${rel === 1 ? '' : 's'} · ${cs} case${cs === 1 ? '' : 's'} before the Tribunal</p>` : ''}
  <div class="btnrow" style="margin-top:12px">${c.kind !== 'capital' ? `<button class="btn sm" data-act="civAct" data-id="${c.id}" data-a="envoy">Send envoy (CC 120M)</button><button class="btn sm" data-act="civAct" data-id="${c.id}" data-a="aid">Aid package (CC 800M)</button><button class="btn sm" data-act="civAct" data-id="${c.id}" data-a="trade">Propose trade talks</button>${c.kind === 'observer' ? `<button class="btn sm primary" data-act="civAct" data-id="${c.id}" data-a="invite">Invite to membership</button>` : ''}` : ''}${compact ? `<button class="btn sm ghost" data-act="openCiv" data-id="${c.id}">Full dossier</button>` : ''}${c.id === 'earth' ? '<button class="btn sm ghost" data-act="go" data-screen="earth">Earth Affairs</button>' : ''}</div>
  ${c.id === 'earth' ? '<p class="faint" style="font-size:12px">Earth is an independent civilisation (Principle 3). The Crown cooperates with Earth; it does not govern it.</p>' : ''}`);
}

/* ---------- 5. Civilisations ---------- */
SCREENS.civs = () => {
  const list = ST.civs.filter(c => c.discovered).sort((a, b) => ({capital:0, independent:1, member:2, observer:3}[a.kind] - {capital:0, independent:1, member:2, observer:3}[b.kind]) || a.name.localeCompare(b.name));
  const sel = civById(ST, UI.sel.civ) || list[0]; UI.sel.civ = sel.id;
  return `<div class="screen">${head('Civilisations', 'Peoples of the Cosmos', 'Every civilisation retains its fundamental rights. Membership is voluntary, and contributions are given freely.')}
  <div class="grid g-list">${plate('Recognised civilisations', `<div class="list" style="margin:-6px -8px">${list.map(c => `<button class="sel-item" aria-current="${c.id === sel.id}" data-act="sel" data-k="civ" data-id="${c.id}"><span class="spread"><b style="font-size:13.5px"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c.color};margin-right:7px"></span>${esc(c.name)}</b>${relPill(c.rel)}</span><span class="muted" style="font-size:12px">${esc(c.status)} · ${fmt1(c.pop)} bn · tech ${fmt(c.tech)}</span></button>`).join('')}</div>`, {k:`${list.length}`})}
  ${civPanel(sel, false)}</div></div>`;
};

/* ---------- 6. Petitions Office ---------- */
SCREENS.petitions = () => {
  const f = UI.filter.pet || 'open';
  const all = ST.petitions.slice().sort((a, b) => b.submitted - a.submitted);
  const list = f === 'open' ? all.filter(p => openPetitions().includes(p)) : f === 'decided' ? all.filter(p => !openPetitions().includes(p)) : all;
  const sel = list.find(p => p.id === UI.sel.pet) || list[0];
  if (sel) UI.sel.pet = sel.id;
  const ec = earthCollectiveStatus(ST);
  return `<div class="screen">${head('Petitions Office', 'Requests to the Crown', 'Civilisations, institutions and individuals may petition the Sovereign. Approved petitions become real projects in the simulation.')}
  <div class="plate flat" style="padding:10px 14px"><div class="spread"><div><b>Earth’s collective petition privilege</b> <span class="muted" style="font-size:13px">One collective planetary petition per millennium. Last exercised: EARTH–001–COSMOS (Year 0).</span></div><span class="pill ${ec.eligible ? 'good' : 'blue'}">${ec.eligible ? 'Eligible now' : `Next eligible Year ${ec.next} CE · ${fmt(ec.yearsLeft)} years`}</span></div><p class="faint" style="font-size:12px;margin:4px 0 0">Individual educational, diplomatic and administrative requests from Earth are considered separately and are not limited by this rule.</p></div>
  <div class="tabs">${[['open', `Open (${openPetitions().length})`], ['decided', 'Decided'], ['all', 'All']].map(([k, l]) => `<button aria-selected="${f === k}" data-act="filter" data-k="pet" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="grid g-list">${plate('Petitions', list.length ? `<div class="list" style="margin:-6px -8px">${list.map(p => `<button class="sel-item" aria-current="${sel && p.id === sel.id}" data-act="sel" data-k="pet" data-id="${p.id}"><span class="spread"><span class="mono goldt">${p.id}</span>${p.status === 'pending' ? urgPill(p.urgency) : statusPill(p.status)}</span><b style="font-size:13.5px">${esc(p.title)}</b><span class="muted" style="font-size:12px">${esc(civName(ST, p.civ))} · ${esc(p.cls)}${p.status === 'pending' ? ` · ${Math.max(0, p.deadlineDay - ST.day)} days left` : ''}</span></button>`).join('')}</div>` : '<div class="empty">No petitions in this view.</div>')}
  ${sel ? petitionView(sel) : plate('', '<div class="empty">Select a petition.</div>')}</div></div>`;
};
function petitionView(p) {
  const open = p.status === 'pending';
  const adv = open ? petAdvice(ST, p) : (p.advice || []);
  const cost = Math.round(p.cost * (p.hearingDiscount ? 0.85 : 1));
  const proj = ST.projects.find(x => x.id === p.projectId);
  return `<div class="stack" style="gap:14px;min-width:0">${plate(esc(p.title), `<div class="row" style="margin:-6px 0 10px"><span class="mono goldt">${p.id}</span><span class="pill">${esc(p.cls)}</span>${urgPill(p.urgency)}${statusPill(p.status)}${p.earthIndividual ? '<span class="pill blue">Earth: individual request</span>' : ''}</div>
  <dl class="kv"><dt>Petitioner</dt><dd>${esc(p.petitioner)}</dd><dt>Civilisation</dt><dd>${esc(civName(ST, p.civ))}</dd><dt>Submitted</dt><dd>${esc(fmtDate(p.submitted))}</dd>${open ? `<dt>Deadline</dt><dd>${esc(fmtDate(p.deadlineDay))} (${Math.max(0, p.deadlineDay - ST.day)} days)</dd>` : ''}<dt>Background</dt><dd>${esc(p.background)}</dd><dt>Requested intervention</dt><dd>${esc(p.request)}</dd><dt>Supporting evidence</dt><dd>${p.evidence.map(e => '— ' + esc(e)).join('<br>')}</dd><dt>Estimated cost</dt><dd class="num">${cost ? fmtCC(cost) : 'No cost to the treasury'}${p.hearingDiscount ? ' <span class="pill good">15% co-funded</span>' : ''}</dd><dt>Potential benefits</dt><dd>${esc(p.benefits)}</dd><dt>Potential risks</dt><dd>${esc(p.risks)}${p.riskRevealed && p.hidden ? `<br><span class="warn">Further information: ${esc(p.hidden.text)}</span>` : ''}</dd>${p.councilReport ? `<dt>Council report</dt><dd>${esc(p.councilReport)}</dd>` : ''}${p.hearingDone ? `<dt>Hearing</dt><dd>${esc(p.hearingNote)}</dd>` : ''}<dt>If approved</dt><dd>${esc(p.project.name)} · ${p.project.duration} days ${effChips(ST, p.project.eff)}</dd><dt>If rejected</dt><dd>${effChips(ST, p.rejectEff)}</dd></dl>
  ${open ? `<div class="sep"></div><div class="btnrow"><button class="btn primary" data-act="pet" data-id="${p.id}" data-a="approve">Approve</button><button class="btn" data-act="pet" data-id="${p.id}" data-a="conditions">Approve with conditions</button><button class="btn danger" data-act="pet" data-id="${p.id}" data-a="reject">Reject</button></div><div class="btnrow" style="margin-top:8px"><button class="btn blue sm" data-act="pet" data-id="${p.id}" data-a="info" ${p.infoRequested ? 'disabled' : ''}>Request further information</button><button class="btn blue sm" data-act="pet" data-id="${p.id}" data-a="hearing" ${p.hearingDone ? 'disabled' : ''}>Invite to a hearing</button><button class="btn blue sm" data-act="pet" data-id="${p.id}" data-a="council" ${p.councilReport ? 'disabled' : ''}>Refer to the Council</button><button class="btn blue sm" data-act="pet" data-id="${p.id}" data-a="tribunal">Refer to the Tribunal</button><button class="btn sm" data-act="petCustom" data-id="${p.id}">Custom response</button><button class="btn sm ghost" data-act="pet" data-id="${p.id}" data-a="defer">Defer 30 days</button></div>${p.conditionsDeclined ? '<p class="warn" style="font-size:12.5px">The petitioner declined your earlier conditions.</p>' : ''}` : ''}
  ${proj ? `<div class="sep"></div><div class="eyebrow">Project ${proj.id}</div><div class="row" style="margin-top:6px"><b style="font-size:13.5px">${esc(proj.name)}</b>${statusPill(proj.status === 'complete' ? 'resolved' : 'active')}<div style="flex:1;min-width:120px">${meter(proj.progress / proj.duration * 100, 'blue')}</div></div>` : ''}${p.caseId ? `<p><button class="btn sm" data-act="openCase" data-id="${p.caseId}">Open ${p.caseId}</button></p>` : ''}${p.delegatedBy ? `<p class="muted" style="font-size:12.5px">Decided under delegated authority by ${esc(p.delegatedBy)}.</p>` : ''}${p.response ? `<p style="font-size:13px"><i>Response: ${esc(p.response)}</i></p>` : ''}`)}
  ${adv.length ? plate(open ? 'Adviser recommendations' : 'Advice given at the time', adv.map(a => { const ch = charById(ST, a.id); return `<div class="opinion">${sigil(ch.name, ch.hue || hashStr(ch.name) % 360, 32)}<div><div class="who">${esc(a.name)} <span class="pill ${a.choice === 'approve' ? 'good' : a.choice === 'reject' ? 'bad' : 'blue'}" style="margin-left:6px">${esc(a.choice)}</span></div><p>${esc(a.text)}</p></div></div>`; }).join('')) : ''}
  ${plate('Record', `<div class="muted" style="font-size:12.5px">${[`${fmtDate(p.submitted)}: Submitted.`].concat(p.log).map(esc).join('<br>')}</div>`)}</div>`;
}
