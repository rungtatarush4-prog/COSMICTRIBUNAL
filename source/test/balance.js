const fs=require('fs'),vm=require('vm');
vm.runInThisContext(['01-util','02-data','03-scenario','04-gen','05-engine'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n')+';globalThis.X={newGame,stepDay,crisisRespond,councilMembers,petAction,devResolve,CRISIS_TPL,memberAvailable};');
function run(mode,smart,days){ const st=X.newGame(mode,99);
 for(let i=0;i<days;i++){ X.stepDay(st);
  if(smart){ st.events.filter(e=>e.status==='active'&&e.kind==='crisis').forEach(e=>{ const T=X.CRISIS_TPL[e.tpl]; const o=T.options.find(o=>o.resolve==='full'&&o.tag); if(!o)return; const m=X.councilMembers(st).find(m=>X.memberAvailable(st,m)&&m.tags.includes(o.tag))||X.councilMembers(st).find(m=>X.memberAvailable(st,m)); if(m) X.crisisRespond(st,e.id,o.key,m.id);});
   st.petitions.filter(p=>p.status==='pending').forEach(p=>X.petAction(st,p.id, p.cost<900?'conditions':'reject'));
   st.events.filter(e=>e.status==='active'&&e.kind==='development').forEach(e=>X.devResolve(st,e.id,e.def||e.options[0].key)); }
  if(i%90===89) console.log(mode,smart?'smart':'passive','day',st.day,'bal',Math.round(st.treasury.balance),Object.entries(st.ind).map(([k,v])=>k.slice(0,4)+':'+Math.round(v)).join(' '));
 }}
run('sandbox',false,720); run('sandbox',true,720);
