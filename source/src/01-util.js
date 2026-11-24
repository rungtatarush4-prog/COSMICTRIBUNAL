'use strict';
/* ===== Utilities: escaping, numbers, seeded RNG, calendar ===== */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => Math.round(Number(n) || 0).toLocaleString('en-US');
const fmt1 = n => (Math.round((Number(n) || 0) * 10) / 10).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const fmtCC = n => (n < 0 ? '−' : '') + 'CC ' + fmt(Math.abs(n)) + 'M';
const fmtUSD = n => (n < 0 ? '−' : '') + '$' + fmt(Math.abs(n)) + 'M';
const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '±') + fmt1(Math.abs(n)).replace(/\.0$/, '');
const deep = o => JSON.parse(JSON.stringify(o));
const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/* mulberry32 on the state's integer seed, so every random draw is reproducible from a save */
function rnd(st) { st.rng = (st.rng + 0x6D2B79F5) | 0; let t = st.rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const ri = (st, a, b) => a + Math.floor(rnd(st) * (b - a + 1));
const pick = (st, arr) => arr[Math.floor(rnd(st) * arr.length)];
const chance = (st, p) => rnd(st) < p;
function staticRng(seed) { let s = seed | 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const MONTHS = ['Primus','Lumen','Ember','Tide','Verdance','Zenith','Gale','Harvest','Dusk','Frost','Umbra','Crown'];
const DAYS_PER_MONTH = 30, DAYS_PER_YEAR = 360;
function dateParts(day) { const y = Math.floor(day / DAYS_PER_YEAR) + 1; const r = ((day % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR; return {y: day < 0 ? 0 : y, m: Math.floor(r / 30), d: r % 30 + 1}; }
function fmtDate(day) { const p = dateParts(day); return `${p.d} ${MONTHS[p.m]}, Year ${p.y} CE`; }
function fmtDateShort(day) { const p = dateParts(day); return `${p.d} ${MONTHS[p.m].slice(0,3)} Y${p.y}`; }
function yearOf(day) { return dateParts(day).y; }
