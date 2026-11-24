/* ===== UI core: state wiring, time loop, SaveManager, audio, modal, documents, charts ===== */
let ST = null;
const UI = {screen:'dashboard', sel:{}, tab:{}, speed:'paused', drawer:false, acc:0, mapView:null, filter:{}, lastRender:0, draft:null};
const SCREEN_LIST = [
  ['dashboard','Sovereign’s Dashboard','grid'], ['tribunal','Cosmic Tribunal','scales'], ['council','Royal Cosmic Council','crown'], ['map','Universe Map','orbit'],
  ['civs','Civilisations','planet'], ['petitions','Petitions Office','scroll'], ['diplomacy','Diplomatic Affairs','hands'], ['treasury','Cosmic Treasury','coin'],
  ['legislature','Legislative Assembly','quill'], ['research','Scientific Research','flask'], ['education','Cosmic Education','book'], ['earth','Earth Affairs','globe'],
  ['rungta','Rungta Global','tower'], ['archives','Cosmic Archives','vault'], ['emergency','Emergency Operations','alert'], ['office','Sovereign’s Private Office','key'], ['settings','Settings & Saves','gear'], ['studio','Scenario Studio','wand']
];
const ICONS = {
  grid:'<rect x="2" y="2" width="6" height="6"/><rect x="10" y="2" width="6" height="6"/><rect x="2" y="10" width="6" height="6"/><rect x="10" y="10" width="6" height="6"/>',
  scales:'<path d="M9 2v14M4 16h10M3 5h12M3 5l-2 5h4zM15 5l-2 5h4z"/>',
  crown:'<path d="M2 14h14M3 13l-1-8 4 3 3-5 3 5 4-3-1 8z"/>',
  orbit:'<circle cx="9" cy="9" r="2.5"/><ellipse cx="9" cy="9" rx="7.5" ry="3.5" transform="rotate(-25 9 9)"/>',
  planet:'<circle cx="9" cy="9" r="5"/><path d="M1.5 11.5c3 1.5 12 -1.5 15 -5"/>',
  scroll:'<path d="M4 3h9a2 2 0 0 1 2 2v0H6v10a2 2 0 0 1-2 2 2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM6 7h7M6 10h7M6 13h5"/>',
  hands:'<path d="M2 9l4-4 3 2 3-2 4 4-4 4-3-2-3 2z"/>',
  coin:'<circle cx="9" cy="9" r="7"/><path d="M9 4.5v9M6.5 7c0-1 1-1.6 2.5-1.6S11.5 6 11.5 7 10.5 8.4 9 8.7 6.5 9.6 6.5 10.8 7.5 12.5 9 12.5s2.5-.6 2.5-1.6"/>',
  quill:'<path d="M15 2C9 3 5 8 4 14l-1 2M4 14c3-1 6-3 7-6M7 11l3-1"/>',
  flask:'<path d="M7 2v5L3 15h12L11 7V2M6 2h6M5 12h8"/>',
  book:'<path d="M2 3h5a2 2 0 0 1 2 2v11a2 2 0 0 0-2-2H2zM16 3h-5a2 2 0 0 0-2 2v11a2 2 0 0 1 2-2h5z"/>',
  globe:'<circle cx="9" cy="9" r="7"/><path d="M2 9h14M9 2c2.5 2.5 2.5 11.5 0 14M9 2c-2.5 2.5-2.5 11.5 0 14"/>',
  tower:'<path d="M4 16V4l5-2 5 2v12M2 16h14M7 7h1M10 7h1M7 10h1M10 10h1M8 16v-3h2v3"/>',
  vault:'<rect x="2" y="4" width="14" height="11"/><path d="M2 7h14M7 10h4"/>',
  alert:'<path d="M9 2l8 14H1zM9 7v4M9 13v.5"/>',
  key:'<circle cx="6" cy="9" r="3.5"/><path d="M9.5 9H16M13 9v3M15.5 9v2"/>',
  gear:'<circle cx="9" cy="9" r="2.5"/><path d="M9 1.5v2.5M9 14v2.5M1.5 9H4M14 9h2.5M3.7 3.7l1.8 1.8M12.5 12.5l1.8 1.8M3.7 14.3l1.8-1.8M12.5 5.5l1.8-1.8"/>',
  wand:'<path d="M3 15L13 5M11 3l1-1M15 7l1-1M14 3l1 1M10 6l2 2"/>',
  bell:'<path d="M4.5 13V8a4.5 4.5 0 0 1 9 0v5l1.5 1.5h-12zM7.5 16h3"/>',
  sound:'<path d="M2 7h3l4-3v10l-4-3H2zM12 6c1.5 1.5 1.5 4.5 0 6M14 4c2.5 2.5 2.5 7.5 0 10"/>',
  mute:'<path d="M2 7h3l4-3v10l-4-3H2zM12 7l4 4M16 7l-4 4"/>',
  menu:'<path d="M2 4h14M2 9h14M2 14h14"/>',
  reset:'<path d="M3 9a6 6 0 1 0 1.8-4.3M3 2.5v3h3"/>',
  search:'<circle cx="7.5" cy="7.5" r="5"/><path d="M11.5 11.5L16 16"/>'
};
const icon = (k, s = 18, sw = 1.4) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ''}</svg>`;

/* ---------- Preferences (per-viewer conveniences) ---------- */
const PREF_KEY = 'cosmic-tribunal:prefs';
const PREFS = Object.assign({master:0.7, music:0.5, sfx:0.7, muted:true, autosave:true, big:false, calm:false, introSeen:false, slot:'slot-1'}, (() => { try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch (e) { return {}; } })());
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(PREFS)); } catch (e) {} }

/* ---------- SaveManager (browser storage + JSON export/import) ---------- */
const SaveManager = {
  idxKey:'cosmic-tribunal:index', slotKey:id => 'cosmic-tribunal:slot:' + id,
  ok() { try { const k = '__ct_test'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; } },
  list() { try { return JSON.parse(localStorage.getItem(this.idxKey) || '[]'); } catch (e) { return []; } },
  writeIndex(list) { localStorage.setItem(this.idxKey, JSON.stringify(list)); },
  save(id, name, st) {
    try {
      const data = JSON.stringify(st);
      localStorage.setItem(this.slotKey(id), data);
      const list = this.list().filter(s => s.id !== id);
      list.push({id, name:name || id, saved:Date.now(), day:st.day, mode:st.meta.mode, size:data.length});
      this.writeIndex(list);
      return {ok:true, msg:`Saved to “${name || id}”.`};
    } catch (e) { return {ok:false, msg:'Browser storage is unavailable or full. Use Export JSON to keep a copy of your campaign.'}; }
  },
  load(id) {
    try { const raw = localStorage.getItem(this.slotKey(id)); if (!raw) return {ok:false, msg:'That save slot is empty.'}; const o = JSON.parse(raw); const err = validateSave(o); if (err) return {ok:false, msg:err}; return {ok:true, st:migrate(o)}; }
    catch (e) { return {ok:false, msg:'The save could not be read.'}; }
  },
  remove(id) { try { localStorage.removeItem(this.slotKey(id)); this.writeIndex(this.list().filter(s => s.id !== id)); return {ok:true, msg:'Save deleted.'}; } catch (e) { return {ok:false, msg:'Could not delete the save.'}; } }
};
let autosaveTimer = null;
function autosave(now) {
  if (!PREFS.autosave || !ST) return;
  clearTimeout(autosaveTimer);
  const go = () => { const r = SaveManager.save('autosave', 'Autosave', ST); UI.autosaveOk = r.ok; UI.lastAutosave = Date.now(); };
  if (now) go(); else autosaveTimer = setTimeout(go, 1200);
}

/* ---------- Audio (generated with Web Audio; no external assets) ---------- */
const AUDIO = {
  ctx:null, nodes:{},
  init() {
    if (this.ctx) return true;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
    try { this.ctx = new C(); } catch (e) { return false; }
    const c = this.ctx, n = this.nodes;
    n.master = c.createGain(); n.master.connect(c.destination);
    n.music = c.createGain(); n.music.connect(n.master);
    n.sfx = c.createGain(); n.sfx.connect(n.master);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.connect(n.music);
    const amb = c.createGain(); amb.gain.value = 0.16; amb.connect(lp);
    [[55, 'sine', 0.5], [82.41, 'sine', 0.35], [110.3, 'triangle', 0.12], [164.8, 'sine', 0.08]].forEach(([f, t, g]) => { const o = c.createOscillator(); o.type = t; o.frequency.value = f; const gg = c.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(amb); o.start(); });
    const lfo = c.createOscillator(); lfo.frequency.value = 0.05; const lg = c.createGain(); lg.gain.value = 0.06; lfo.connect(lg); lg.connect(amb.gain); lfo.start();
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = c.createBufferSource(); ns.buffer = buf; ns.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 0.6; const ng = c.createGain(); ng.gain.value = 0.035; ns.connect(bp); bp.connect(ng); ng.connect(n.music); ns.start();
    n.chamber = c.createGain(); n.chamber.gain.value = 0; n.chamber.connect(n.music);
    [[220, 0.05], [329.6, 0.035], [440.5, 0.02]].forEach(([f, g]) => { const o = c.createOscillator(); o.frequency.value = f; const gg = c.createGain(); gg.gain.value = g; const tr = c.createOscillator(); tr.frequency.value = 0.3 + f / 2000; const tg = c.createGain(); tg.gain.value = g * 0.6; tr.connect(tg); tg.connect(gg.gain); tr.start(); o.connect(gg); gg.connect(n.chamber); o.start(); });
    this.apply(); return true;
  },
  apply() {
    if (!this.ctx) return; const n = this.nodes, t = this.ctx.currentTime;
    n.master.gain.setTargetAtTime(PREFS.muted ? 0 : PREFS.master, t, 0.1);
    n.music.gain.setTargetAtTime(PREFS.music, t, 0.2);
    n.sfx.gain.setTargetAtTime(PREFS.sfx, t, 0.05);
    n.chamber.gain.setTargetAtTime(UI.screen === 'tribunal' ? 1 : 0, t, 0.8);
    if (!PREFS.muted && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(f, dur, type = 'sine', vol = 0.2, delay = 0) {
    if (!this.ctx || PREFS.muted) return; const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type; o.frequency.value = f; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.nodes.sfx); o.start(t); o.stop(t + dur + 0.05);
  },
  play(kind) {
    if (!this.ctx || PREFS.muted) return;
    if (kind === 'chime') { this.tone(1046.5, 0.9, 'sine', 0.12); this.tone(1568, 1.1, 'sine', 0.06, 0.08); }
    else if (kind === 'alert') { this.tone(466, 0.35, 'triangle', 0.18); this.tone(349, 0.5, 'triangle', 0.16, 0.22); }
    else if (kind === 'click') this.tone(2200, 0.05, 'square', 0.025);
    else if (kind === 'ceremony') { [261.6, 329.6, 392, 523.3, 659.3].forEach((f, i) => this.tone(f, 2.8, 'sine', 0.07, i * 0.14)); }
    else if (kind === 'gavel') { this.tone(120, 0.25, 'square', 0.12); this.tone(90, 0.3, 'sine', 0.2, 0.02); }
  }
};

/* ---------- Starfield ---------- */
function startStarfield() {
  const cv = document.getElementById('starfield'); const ctx = cv.getContext('2d');
  let W, H, stars = [], motes = [];
  const R = staticRng(7);
  const resize = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; stars = Array.from({length:Math.round(W * H / 9000)}, () => ({x:R() * W, y:R() * H, r:R() * 1.3 * dpr + 0.2, a:R() * 0.7 + 0.2, t:R() * 6.28, s:R() * 0.02 + 0.004})); motes = Array.from({length:26}, () => ({x:R() * W, y:R() * H, r:(R() * 1.6 + 0.6) * dpr, v:(R() * 0.15 + 0.05) * dpr})); };
  resize(); addEventListener('resize', resize);
  const neb = () => { const g = ctx.createRadialGradient(W * 0.75, H * 0.2, 0, W * 0.75, H * 0.2, W * 0.6); g.addColorStop(0, 'rgba(112,72,200,0.10)'); g.addColorStop(1, 'rgba(8,11,18,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); const g2 = ctx.createRadialGradient(W * 0.15, H * 0.9, 0, W * 0.15, H * 0.9, W * 0.5); g2.addColorStop(0, 'rgba(71,118,230,0.08)'); g2.addColorStop(1, 'rgba(8,11,18,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); };
  const reduced = () => PREFS.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = 0;
  const frame = ts => {
    requestAnimationFrame(frame);
    if (ts - last < 50) return; last = ts;
    ctx.fillStyle = '#080B12'; ctx.fillRect(0, 0, W, H); neb();
    const still = reduced();
    stars.forEach(s => { if (!still) s.t += s.s * 3; ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(s.t)); ctx.fillStyle = '#F5F3EE'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); });
    ctx.fillStyle = '#F1DCA0';
    motes.forEach(m => { if (!still) { m.y -= m.v; if (m.y < -5) { m.y = H + 5; m.x = Math.random() * W; } } ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill(); });
    ctx.globalAlpha = 1;
  };
  requestAnimationFrame(frame);
}

/* ---------- Sigils and the Cosmic Seal ---------- */
function sigil(name, hue = 45, size = 40) {
  const r = staticRng(hashStr(name)); const n = 4 + Math.floor(r() * 3); const pts = [];
  for (let i = 0; i < n; i++) { const a = r() * 6.283, d = 6 + r() * 11; pts.push([20 + Math.cos(a) * d, 20 + Math.sin(a) * d]); }
  const lines = pts.slice(1).map((p, i) => `<line x1="${pts[i][0].toFixed(1)}" y1="${pts[i][1].toFixed(1)}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}"/>`).join('');
  const id = 'sg' + hashStr(name + size);
  return `<svg class="sigil" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><defs><radialGradient id="${id}" cx="35%" cy="30%"><stop offset="0" stop-color="hsl(${hue} 55% 38%)"/><stop offset="1" stop-color="hsl(${hue} 50% 12%)"/></radialGradient></defs><circle cx="20" cy="20" r="19" fill="url(#${id})" stroke="#D4AF37" stroke-width="1"/><g stroke="hsl(${hue} 70% 80%)" stroke-opacity=".5" stroke-width=".6">${lines}</g>${pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.1" fill="#F5F3EE"/>`).join('')}<text x="20" y="25.5" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="15" font-weight="700" fill="#F1DCA0">${esc(name.replace(/^Prime /, '').charAt(0))}</text></svg>`;
}
function sealSVG(size = 120, spin = false, dark = true) {
  const gold = dark ? '#D4AF37' : '#9A7B1E', ink = dark ? '#F1DCA0' : '#6E5612';
  const stars = Array.from({length:12}, (_, i) => { const a = i / 12 * 6.283 - 1.5708; return `<circle cx="${(60 + Math.cos(a) * 41).toFixed(1)}" cy="${(60 + Math.sin(a) * 41).toFixed(1)}" r="1.8" fill="${ink}"/>`; }).join('');
  const id = 'sealpath' + size + (dark ? 'd' : 'l');
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="The Cosmic Seal"><defs><path id="${id}" d="M60,60 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0"/></defs>
  <g class="${spin ? 'seal-spin' : ''}" style="transform-origin:60px 60px"><circle cx="60" cy="60" r="57" fill="none" stroke="${gold}" stroke-width="1.5"/><circle cx="60" cy="60" r="45" fill="none" stroke="${gold}" stroke-width=".8"/>
  <text font-family="Cormorant Garamond, Georgia, serif" font-size="9.2" letter-spacing="2.6" fill="${ink}" font-weight="700"><textPath href="#${id}" startOffset="0">UNITED UNDER THE CROWN · SOVEREIGNTY BEYOND WORLDS ·</textPath></text></g>
  ${stars}<path d="M42 70 L40 52 L49 59 L60 44 L71 59 L80 52 L78 70 Z" fill="none" stroke="${gold}" stroke-width="1.6" stroke-linejoin="round"/><path d="M42 74 H78" stroke="${gold}" stroke-width="1.6"/>
  <circle cx="60" cy="44" r="2.2" fill="${ink}"/><circle cx="40" cy="52" r="1.8" fill="${ink}"/><circle cx="80" cy="52" r="1.8" fill="${ink}"/><circle cx="49" cy="59" r="1.3" fill="${ink}"/><circle cx="71" cy="59" r="1.3" fill="${ink}"/>
  <path d="M60 78 v12" stroke="${gold}" stroke-width="1.2"/><circle cx="60" cy="92" r="2" fill="none" stroke="${gold}"/></svg>`;
}

/* ---------- Toasts, modal, drawer ---------- */
function toast(msg, kind = '') { const box = document.getElementById('toasts'); while (box.children.length >= 3) box.firstChild.remove(); const t = document.createElement('div'); t.className = 'toast ' + kind; t.setAttribute('role', 'status'); t.textContent = msg; document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), 4200); }
let modalOnClose = null;
function openModal(html, opt = {}) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal ${opt.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(opt.label || 'Dialog')}"><button class="btn ghost sm x" data-act="closeModal" aria-label="Close">Close</button>${html}</div>`;
  root.classList.add('open'); modalOnClose = opt.onClose || null;
  const f = root.querySelector('[autofocus]') || root.querySelector('button:not(.x), input, select, textarea'); if (f) setTimeout(() => f.focus(), 30);
}
function closeModal() { const root = document.getElementById('modalRoot'); root.classList.remove('open'); root.innerHTML = ''; const cb = modalOnClose; modalOnClose = null; if (cb) cb(); }
const PENDING = {};
function confirmBox(o) {
  const id = 'c' + Math.random().toString(36).slice(2, 8); PENDING[id] = o.onConfirm;
  const prev = (o.preview || []).length ? `<div class="preview"><h4>Preview of consequences</h4><div class="effchips">${o.preview.map(p => `<span class="${p.neg ? 'neg' : ''}">${esc(p.t)}</span>`).join('')}</div>${o.note ? `<p class="muted" style="margin:8px 0 0;font-size:12.5px">${esc(o.note)}</p>` : ''}</div>` : (o.note ? `<div class="preview"><h4>Before you confirm</h4><p style="margin:0;font-size:13px">${esc(o.note)}</p></div>` : '');
  openModal(`<div class="eyebrow">${esc(o.eyebrow || 'Confirmation required')}</div><h2>${esc(o.title)}</h2>${o.body ? `<p class="muted">${o.body}</p>` : ''}${prev}<div class="foot"><button class="btn ghost" data-act="closeModal">Cancel</button><button class="btn ${o.danger ? 'danger' : 'primary'}" data-act="confirmYes" data-id="${id}">${esc(o.confirmLabel || 'Confirm')}</button></div>`, {label:o.title});
}

/* ---------- Action runner ---------- */
function run(fn, opt = {}) {
  let r;
  try { r = fn(); } catch (e) { console.error(e); toast('Something went wrong: ' + e.message, 'bad'); return; }
  if (r && r.msg && !opt.silent) toast(r.msg, r.ok ? (opt.kind || '') : 'bad');
  if (r && r.ok) { AUDIO.play(opt.sfx || 'click'); autosave(); }
  flushSfx(); render(true);
  return r;
}
function flushSfx() { if (ENGINE.sfx) { AUDIO.play(ENGINE.sfx); ENGINE.sfx = null; } }

/* ---------- Time ---------- */
function setSpeed(s) { UI.speed = s; UI.acc = 0; renderOps(); }
function advanceDays(n) {
  const startDay = ST.day; let stopped = null;
  ENGINE.interrupts = [];
  for (let i = 0; i < n; i++) { stepDay(ST); if (ENGINE.interrupts.length) { stopped = ENGINE.interrupts[0]; break; } }
  ENGINE.interrupts = [];
  flushSfx();
  if (stopped) { UI.speed = 'paused'; showInterrupt(stopped, ST.day - startDay, n); }
  if (ENGINE.monthPassed) { ENGINE.monthPassed = false; autosave(true); } else autosave();
  render(); return stopped;
}
function showInterrupt(it, done, planned) {
  if (it.type === 'scenario-end') { const S = ST.scenario; AUDIO.play(S.status === 'won' ? 'ceremony' : 'alert'); openModal(`<div class="eyebrow">${esc(S.def.name)}</div><h2>${S.status === 'won' ? 'Victory' : 'Defeat'}</h2><div class="briefing" style="margin-top:10px">${sigil('Prime Arbiter', 45, 56)}<div><blockquote>${esc(S.result)}</blockquote><cite>The Prime Arbiter · day ${ST.day}</cite></div></div><p class="muted" style="font-size:13px">You may keep governing this Cosmos, play the scenario again, or build a new one.</p><div class="foot"><button class="btn ghost" data-act="closeModal">Keep playing</button><button class="btn primary" data-act="go" data-screen="studio">Scenario Studio</button></div>`, {label:'Scenario result'}); return; }
  if (it.type === 'story') {
    const ev = it.id && ST.events.find(x => x.id === it.id); const b = it.beat && ST.scenario && ST.scenario.def.beats.find(x => x.id === it.beat);
    const title = ev ? ev.title : b ? b.title : 'The story continues'; const text = ev ? ev.desc : b ? b.text : '';
    AUDIO.play('chime');
    openModal(`<div class="eyebrow">${esc(ST.scenario ? ST.scenario.def.name : 'Story')} · ${esc(fmtDate(ST.day))}</div><h2>${esc(title)}</h2><p style="font-family:var(--f-display);font-size:19px;font-style:italic;line-height:1.5">${esc(text)}</p><div class="foot">${ev ? `<button class="btn primary" data-act="openDev" data-id="${ev.id}">Decide now</button>` : `<button class="btn primary" data-act="closeModal">Continue</button>`}${b && b.kind === 'crisis' ? '<button class="btn" data-act="go" data-screen="emergency">Emergency Operations</button>' : b && b.kind === 'petition' ? '<button class="btn" data-act="go" data-screen="petitions">Petitions Office</button>' : b && b.kind === 'case' ? '<button class="btn" data-act="go" data-screen="tribunal">Open the Tribunal</button>' : ''}</div>`, {label:title});
    return;
  }
  const e = ST.events.find(x => x.id === it.id);
  const title = it.type === 'crisis' ? 'A new emergency' : it.type === 'catastrophe' ? 'Catastrophe' : 'Emergency escalation';
  openModal(`<div class="eyebrow">Time halted${planned > 1 ? ` after ${done} of ${planned} days` : ''}</div><h2>${title}</h2><div class="briefing" style="margin-top:10px">${sigil('Prime Arbiter', 45, 52)}<div><blockquote>${esc(ST.briefing ? ST.briefing.text : (e ? e.desc : ''))}</blockquote><cite>The Prime Arbiter</cite></div></div><div class="foot"><button class="btn ghost" data-act="closeModal">Dismiss</button><button class="btn primary" data-act="go" data-screen="emergency">Open Emergency Operations</button></div>`, {label:title});
  AUDIO.play('alert');
}
let tickTimer = null;
function startClock() {
  let last = performance.now();
  tickTimer = setInterval(() => {
    const now = performance.now(), dt = now - last; last = now;
    if (UI.speed === 'paused' || document.getElementById('modalRoot').classList.contains('open')) return;
    UI.acc += dt; const per = UI.speed === 'fast' ? 140 : 1100;
    let days = 0; while (UI.acc >= per && days < 10) { UI.acc -= per; days++; }
    if (days) advanceDays(days);
  }, 100);
}

/* ---------- Documents (DocumentGenerator view) ---------- */
const DOC_LABEL = {verdict:'Tribunal Verdict', order:'Executive Order', law:'Official Instrument', amendment:'Constitutional Amendment', invitation:'Royal Invitation', letter:'Diplomatic Letter', minutes:'Council Meeting Minutes', report:'Official Report', briefing:'Emergency Briefing', charter:'Educational Charter', certificate:'Appointment Certificate', proclamation:'Official Proclamation', treasury:'Treasury Report'};
function docHTML(d) {
  return `<article class="doc" aria-label="${esc(d.title)}"><div class="dhead">${sealSVG(84, false, false)}<small>${esc(DOC_LABEL[d.type] || 'Official Document')} · The Cosmic World</small><h3>${esc(d.title)}</h3><div class="dref">Ref. ${esc(d.id)}${d.ref ? ' · ' + esc(d.ref) : ''} · ${esc(fmtDate(d.day))}</div></div><div class="dbody">${esc(d.body)}</div><div class="dsign"><div class="sigline"><i>${esc(ST.canon.sovereign)}</i>${esc(sovTitle(ST))}</div><div style="text-align:right;font-family:var(--f-body);font-size:11px;letter-spacing:.2em;color:#7A6524">UNITED UNDER THE CROWN</div></div></article>`;
}
function docText(d) { return `${(DOC_LABEL[d.type] || 'Official Document').toUpperCase()} — THE COSMIC WORLD\n${d.title}\nRef. ${d.id}${d.ref ? ' · ' + d.ref : ''} · ${fmtDate(d.day)}\n\n${d.body}\n\n______________________\n${ST.canon.sovereign}\n${sovTitle(ST)}\n[Cosmic Seal]\nUNITED UNDER THE CROWN`; }
function openDoc(id) {
  const d = ST.documents.find(x => x.id === id); if (!d) return toast('Document not found.', 'bad');
  openModal(`${docHTML(d)}<div class="foot"><span class="muted" style="font-size:12px;margin-right:auto;max-width:46ch">Printing and file downloads are blocked inside this viewer. Copy the text or the HTML and paste it into any editor to print or keep it.</span><button class="btn" data-act="copyDoc" data-id="${d.id}" data-fmt="text">Copy text</button><button class="btn" data-act="copyDoc" data-id="${d.id}" data-fmt="html">Copy HTML</button><button class="btn primary" data-act="closeModal">Done</button></div>`, {wide:true, label:d.title});
}
function copyText(text, fallbackEl) {
  try { navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard.', 'good'), () => fallbackCopy(text)); } catch (e) { fallbackCopy(text); }
}
function fallbackCopy(text) {
  openModal(`<h2>Copy manually</h2><p class="muted">The clipboard is not available here. The text is selected below; press Ctrl+C or Cmd+C.</p><textarea id="manualCopy" style="width:100%;min-height:260px">${esc(text)}</textarea><div class="foot"><button class="btn primary" data-act="closeModal">Done</button></div>`);
  setTimeout(() => { const t = document.getElementById('manualCopy'); if (t) { t.focus(); t.select(); } }, 50);
}

/* ---------- Charts (SVG, drawn to one scale) ---------- */
function niceMax(v) { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); const m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e; }
function lineChart(series, opt = {}) {
  const W = opt.w || 640, H = opt.h || 200, P = {l:52, r:14, t:12, b:24};
  const all = series.flatMap(s => s.data.map(d => d[1])); const xs = series.flatMap(s => s.data.map(d => d[0]));
  if (!all.length) return '<div class="empty">No data yet. Advance time to build a history.</div>';
  const minV = opt.min !== undefined ? opt.min : Math.min(0, ...all), maxV = opt.max !== undefined ? opt.max : niceMax(Math.max(...all) * 1.05);
  const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1);
  const X = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), Y = v => H - P.b - (v - minV) / (maxV - minV) * (H - P.t - P.b);
  const ticks = 4; let grid = '';
  for (let i = 0; i <= ticks; i++) { const v = minV + (maxV - minV) * i / ticks; grid += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="rgba(241,220,160,.08)"/><text x="${P.l - 6}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${opt.fmt ? opt.fmt(v) : fmt(v)}</text>`; }
  const xl = [x0, Math.round((x0 + x1) / 2), x1].map(x => `<text x="${X(x).toFixed(1)}" y="${H - 6}" text-anchor="middle">${fmtDateShort(x)}</text>`).join('');
  const paths = series.map(s => { const d = s.data.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(''); const last = s.data[s.data.length - 1];
    const area = s.area ? `<path d="${d}L${X(last[0]).toFixed(1)},${Y(minV).toFixed(1)}L${X(s.data[0][0]).toFixed(1)},${Y(minV).toFixed(1)}Z" fill="${s.color}" fill-opacity=".1"/>` : '';
    return `${area}<path d="${d}" fill="none" stroke="${s.color}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${X(last[0]).toFixed(1)}" cy="${Y(last[1]).toFixed(1)}" r="3" fill="${s.color}"/>`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || 'Chart')}">${grid}${xl}${paths}</svg><div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
}
function barList(items, opt = {}) {
  const max = Math.max(1, ...items.map(i => i.v));
  return `<div class="stack" style="gap:7px">${items.map(i => `<div><div class="spread" style="font-size:12.5px"><span>${esc(i.label)}</span><span class="num muted">${opt.fmt ? opt.fmt(i.v) : fmt(i.v)}</span></div><div class="meter ${i.cls || ''}"><i style="width:${(i.v / max * 100).toFixed(1)}%"></i></div></div>`).join('')}</div>`;
}
function effChips(st, eff, cost) { const d = describeEff(st, eff, cost); return d.length ? `<div class="effchips">${d.map(x => `<span class="${x.neg ? 'neg' : ''}">${esc(x.t)}</span>`).join('')}</div>` : '<span class="faint" style="font-size:12px">No direct indicator effects</span>'; }
function meter(v, cls = '') { return `<div class="meter ${cls}" role="meter" aria-valuenow="${Math.round(v)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${clamp(v, 0, 100)}%"></i></div>`; }
function indClass(v) { return v >= 70 ? '' : v >= 45 ? 'warn' : 'bad'; }
function relPill(v) { return v >= 75 ? `<span class="pill good">Cordial ${fmt(v)}</span>` : v >= 55 ? `<span class="pill gold">Steady ${fmt(v)}</span>` : v >= 35 ? `<span class="pill warn">Strained ${fmt(v)}</span>` : `<span class="pill bad">Hostile ${fmt(v)}</span>`; }
function urgPill(u) { return `<span class="pill ${u === 'Critical' ? 'solid-bad' : u === 'High' ? 'bad' : u === 'Moderate' ? 'warn' : ''}">${esc(u)}</span>`; }
function statusPill(s) { const m = {pending:'gold', approved:'good', rejected:'bad', expired:'bad', 'in force':'good', implementing:'blue', repealed:'bad', 'struck down':'bad', amended:'purple', expired2:'', open:'gold', decided:'blue', closed:'', active:'gold', concluded:'good', failed:'bad', resolved:'good', catastrophe:'solid-bad'}; return `<span class="pill ${m[s] || ''}">${esc(s)}</span>`; }
