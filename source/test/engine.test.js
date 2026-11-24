const fs=require('fs'),vm=require('vm');
const code=['01-util','02-data','03-scenario','04-gen','05-engine'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n')+'\n;globalThis.API={newGame,stepDay,petAction,caseAdvance,caseAsk,caseVerdict,caseRequestEvidence,crisisRespond,devResolve,saveDraft,enactDraft,reviewDraft,appointMember,assignDept,civAction,negSetStance,fundResearch,spend,setBudget,validateSave,ENGINE,councilMembers,eduExpand,rgBoard,earthAction,adoptMeeting,meetingAgenda,memberReport,COUNCIL_CANDIDATES,transferToReserve,consultSpirits,petitionRecognition,riseStatus,creativeCiv,creativeEvent,decideRecommendation};';
vm.runInThisContext(code);
const A=API; let fails=0;
const ok=(c,m)=>{ if(!c){fails++;console.log('FAIL',m)} else console.log('ok  ',m)};
let st=A.newGame('sandbox',12345);
// petition approval creates project and deducts cost
const p=st.petitions[0]; const bal=st.treasury.balance; const nP=st.projects.length;
let r=A.petAction(st,p.id,'approve'); ok(r.ok,'approve petition: '+r.msg);
ok(st.projects.length===nP+1,'project created');
ok(Math.abs(bal-st.treasury.balance-p.cost)<0.01,'treasury deducted exactly '+p.cost);
const prj=st.projects.find(x=>x.id===p.projectId); const pr0=prj.progress;
A.stepDay(st); ok(prj.progress>pr0,'time advances project');
// invalid txn
const b2=st.treasury.balance; ok(!A.spend(st,-5,'x','bad').ok && !A.spend(st,NaN,'x','bad').ok && !A.spend(st,1e12,'x','bad').ok && st.treasury.balance===b2,'invalid transactions rejected');
// case flow
const c=st.cases[0]; for(let i=0;i<5;i++) A.caseAdvance(st,c.id);
A.caseAsk(st,c.id,'w0q0'); r=A.caseVerdict(st,c.id,'shared',[9],'Proportionate remedy'); ok(r.ok,'verdict: '+r.msg);
ok(st.archives.some(a=>a.type==='verdict'&&a.ref===c.id),'verdict archived');
// law
r=A.saveDraft(st,{type:'act',title:'Education for All Act',text:'x',provisions:['edu_access']}); ok(r.ok,'draft saved');
r=A.enactDraft(st,r.draft.id); ok(r.ok && st.laws.some(l=>l.title==='Education for All Act'),'law enacted: '+r.msg);
r=A.saveDraft(st,{type:'eo',title:'Bad order',provisions:['earth_override']}); let r2=A.enactDraft(st,r.draft.id); ok(!r2.ok&&r2.needsOverride,'unconstitutional needs override');
// council appointment
r=A.appointMember(st,A.COUNCIL_CANDIDATES[0].name,'Archives & Memory'); ok(r.ok,'appoint: '+r.msg);
ok(st.chars.find(x=>x.name===A.COUNCIL_CANDIDATES[0].name).dept==='Archives & Memory','appointment sets responsibility');
// diplomacy
const k=st.civs.find(x=>x.id==='korr'); const rel=k.rel; r=A.civAction(st,'korr','aid'); ok(r.ok&&k.rel>rel,'diplomatic aid changes relation');
// save/load roundtrip
const json=JSON.stringify(st); const st2=JSON.parse(json); ok(A.validateSave(st2)===null && JSON.stringify(st2)===json,'save/load roundtrip');
// determinism: same seed + same actions
const sa=A.newGame('sandbox',777), sb=A.newGame('sandbox',777); sa.meta.created=sb.meta.created=0;
for(let i=0;i<200;i++){A.stepDay(sa);A.stepDay(sb);} ok(JSON.stringify(sa)===JSON.stringify(sb),'deterministic simulation');
// long run stability
let errs=0; for(let i=0;i<1500;i++){ try{ A.stepDay(st); // play some actions
  if(i%9===0){const pp=st.petitions.find(x=>x.status==='pending'); if(pp) A.petAction(st,pp.id,i%2?'approve':'reject');}
  if(i%13===0){const e=st.events.find(x=>x.status==='active'&&x.kind==='development'); if(e) A.devResolve(st,e.id,e.options[0].key);}
  if(i%7===0){const e=st.events.find(x=>x.status==='active'&&x.kind==='crisis'); if(e){const m=A.councilMembers(st).find(m=>!m.sovereign&&m.busyUntil<=st.day); A.crisisRespond(st,e.id,'shield'===e.tpl?'shield':Object.keys(e)[0]&&require('assert')&&'x',m&&m.id);} }
  if(i%11===0){const cs=st.cases.find(x=>x.status==='open'); if(cs){ if(cs.stage<5) A.caseAdvance(st,cs.id); else A.caseVerdict(st,cs.id,cs.remedies[1].key,[1],''); }}
 }catch(e){errs++; if(errs<3) console.log(e.stack);} }
ok(errs===0,'1500 days without errors; day='+st.day);
ok(Number.isFinite(st.treasury.balance)&&st.treasury.balance>=0,'treasury valid: '+Math.round(st.treasury.balance));
console.log('indicators',JSON.stringify(st.ind));
console.log('counts petitions',st.petitions.length,'cases',st.cases.length,'events',st.events.length,'projects',st.projects.length,'docs',st.documents.length,'notifs',st.notifications.length,'size KB',Math.round(JSON.stringify(st).length/1024));
// rise mode
let rs=A.newGame('rise',5); ok(!A.petitionRecognition(rs).ok,'rise: recognition blocked until endorsed');
// creative
let cs=A.newGame('creative',5); ok(A.creativeCiv(cs,{name:'Test Realm',kind:'member'}).ok && cs.meta.creative,'creative civ');
let ss=A.newGame('sandbox',5); ok(!A.creativeCiv(ss,{name:'X'}).ok,'editor blocked outside creative');
console.log(fails?fails+' FAILURES':'ALL PASS');
