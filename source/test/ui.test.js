const { chromium } = require('playwright');
const SHOTS = '/tmp/claude-0/-home-user/10f0e68d-2539-520c-8b4e-b3be939ee1da/scratchpad/shots';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + __dirname + '/page.html');
  await page.waitForTimeout(700);
  await page.screenshot({ path: SHOTS + '/intro.png' });
  await page.click('[data-act="introEnter"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + '/dashboard.png' });
  const screens = await page.$$eval('#rail [data-act="go"]', els => els.map(e => e.dataset.screen));
  for (const s of screens) {
    await page.click(`#nav-${s}`); await page.waitForTimeout(150);
    const bad = await page.$eval('#main', m => m.textContent.includes('failed to render') ? m.textContent.slice(0, 300) : '');
    const len = await page.$eval('#main', m => m.textContent.length);
    console.log(s.padEnd(12), len, bad ? 'BROKEN ' + bad : 'ok');
    if (['tribunal', 'map', 'treasury', 'council', 'emergency'].includes(s)) await page.screenshot({ path: `${SHOTS}/${s}.png` });
  }
  await page.click('#nav-petitions');
  const bal0 = await page.evaluate(() => ST.treasury.balance);
  await page.click('[data-act="pet"][data-a="approve"]'); await page.click('[data-act="confirmYes"]');
  const bal1 = await page.evaluate(() => ST.treasury.balance);
  console.log('petition approved: treasury', bal0, '->', bal1, 'projects', await page.evaluate(() => ST.projects.length));
  await page.click('[data-act="pet"][data-a="info"]');
  await page.click('[data-act="adv"][data-n="7"]'); await page.waitForTimeout(100);
  if (await page.$('#modalRoot.open')) await page.click('#modalRoot [data-act="closeModal"]');
  await page.click('#nav-tribunal');
  for (let i = 0; i < 5; i++) { await page.click('[data-act="caseAdvance"]'); await page.waitForTimeout(50); }
  const asks = await page.$$('[data-act="caseAsk"]'); for (const a of asks.slice(0, 2)) { await a.click().catch(() => {}); }
  await page.click('[data-act="caseAdvance"]');
  await page.click('[data-act="caseVerdict"]'); await page.click('[data-act="confirmYes"]');
  console.log('verdicts', await page.evaluate(() => ST.stats.verdicts), 'archived', await page.evaluate(() => ST.archives.filter(a => a.type === 'verdict').length));
  await page.screenshot({ path: SHOTS + '/tribunal-verdict.png', fullPage: true });
  await page.click('#nav-legislature');
  await page.fill('#lawTitle', 'Cosmic Education Act');
  await page.check('#prov-edu_access');
  await page.click('[data-act="enact"]'); await page.click('[data-act="confirmYes"]');
  console.log('laws', await page.evaluate(() => ST.laws.map(l => l.id + ':' + l.status).join(', ')));
  await page.click('#nav-council'); await page.click('[data-act="meeting"]'); await page.waitForTimeout(100);
  await page.click('[data-act="adopt"]'); await page.waitForTimeout(100);
  console.log('council minutes', await page.evaluate(() => ST.documents.filter(d => d.type === 'minutes').length));
  for (const c of ['Request a complete treasury report', 'Allocate 200 to research', 'Make the planets dance', 'Override Earth government', 'Advance one month']) {
    await page.fill('#cmdInput', c); await page.press('#cmdInput', 'Enter'); await page.waitForTimeout(150);
    if (await page.$('#modalRoot.open [data-act="confirmYes"]')) await page.click('[data-act="confirmYes"]');
    else if (await page.$('#modalRoot.open')) await page.click('#modalRoot [data-act="closeModal"]');
  }
  console.log('cmdLog', JSON.stringify(await page.evaluate(() => ST.cmdLog.map(c => [c.text, c.ok, c.result.slice(0, 70)]))));
  console.log('research budget', await page.evaluate(() => ST.treasury.budget.research));
  await page.click('#nav-map'); await page.waitForTimeout(300);
  const box = await page.$eval('#mapCanvas', c => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y }; });
  const pt = await page.evaluate(() => { const v = UI.mapView, c = civById(ST, 'earth'); return { x: (c.x - v.x) * v.s, y: (c.y - v.y) * v.s }; });
  await page.mouse.click(box.x + pt.x, box.y + pt.y); await page.waitForTimeout(300);
  console.log('map selected', await page.evaluate(() => UI.sel.map));
  await page.screenshot({ path: SHOTS + '/map-sel.png' });
  await page.click('#nav-settings'); await page.click('[data-act="saveNew"]');
  const before = await page.evaluate(() => JSON.stringify(ST));
  const sid = await page.evaluate(() => SaveManager.list().find(s => s.id.startsWith('slot-')).id);
  await page.evaluate(() => advanceDays(40));
  if (await page.$('#modalRoot.open')) await page.click('#modalRoot [data-act="closeModal"]');
  await page.click(`[data-act="loadSlot"][data-id="${sid}"]`); await page.click('[data-act="confirmYes"]');
  const after = await page.evaluate(() => JSON.stringify(ST));
  console.log('load restores exact state:', before === after);
  await page.evaluate(() => { for (let i = 0; i < 10; i++) advanceDays(36); closeModal(); });
  await page.click('#nav-dashboard'); await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + '/dashboard-later.png', fullPage: true });
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  m.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await m.goto('file://' + __dirname + '/page.html'); await m.waitForTimeout(400);
  if (await m.$('#intro.open')) await m.click('[data-act="introEnter"]');
  for (const s of ['dashboard', 'tribunal', 'petitions', 'treasury', 'council', 'legislature', 'settings']) { await m.evaluate(s => go(s), s); await m.waitForTimeout(150); const ov = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth); console.log('mobile', s, 'overflow px', ov); }
  await m.evaluate(() => go('dashboard')); await m.screenshot({ path: SHOTS + '/mobile.png' });
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
