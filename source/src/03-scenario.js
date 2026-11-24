/* ===== Opening campaign content: petitions, case, crisis, archives ===== */
const SCN_PETITIONS = [
  {petitioner:'Tide-Speaker Oruvane of Maris', civ:'thalassine', cls:'Environmental', urgency:'High', title:'Emergency tidal stabilisers for the Maris seas',
   background:'The decaying moon Selka is pulling the Maris seas into surges that have flooded four tidal cities this season. Thalassine engineers can hold the sea walls for roughly two months.',
   request:'Fund a pilot Tidal Stabiliser Array over the three most exposed cities.',
   evidence:['Tidal gauge records showing a 31% rise in surge height over two years','Engineering survey of the sea walls at Corrine, Vash and Lume','Petition signed by 212 tidal city councils'],
   cost:1400, benefits:'Protects 40 million citizens; restores Thalassine confidence in the Crown.', risks:'Gravitic stabilisers are a young technology.',
   project:{name:'Maris Tidal Stabiliser Pilot', cat:'environment', duration:80, eff:{ind:{environment:3, stability:1}, civ:{thalassine:10}}},
   rejectEff:{ind:{approval:-1, trust:-1}, civ:{thalassine:-8}},
   hidden:{text:'Independent modelling shows the stabilisers may disturb the breeding cycles of the protected Tidewell Reserve.', chance:0.35, eff:{ind:{environment:-3}, civ:{thalassine:-2}}},
   hearingNote:'At the hearing, Oruvane offers to co-fund 15% of the array from Thalassine reserves.', deadline:40},
  {petitioner:'First Facet Siraelle of the Veyari Concord', civ:'veyari', cls:'Scientific', urgency:'Moderate', title:'Access to the sealed records of the Lumen Archive',
   background:'The Lumen Archive keeps a sealed vault of records from before the Crowned Era. Veyari philosophers argue that sealed knowledge belongs to every civilisation.',
   request:'Direct the Archive to open its sealed vault to accredited Veyari scholars.',
   evidence:['Correspondence in which the Archive declined three previous requests','A Veyari treatise on the common inheritance of knowledge'],
   cost:300, benefits:'Advances science and honours the Veyari tradition of open inquiry.', risks:'The Lumen Archive considers the vault a matter of its own fundamental rights.',
   project:{name:'Archive Access Accord', cat:'research', duration:40, eff:{ind:{science:2}, civ:{veyari:8, lumen:-7}}},
   rejectEff:{ind:{}, civ:{veyari:-5, lumen:2}},
   hidden:{text:'Lumen custodians privately warn that part of the vault describes stellar weapons from a lost era.', chance:0.3, eff:{ind:{stability:-3}, civ:{lumen:-4}}},
   hearingNote:'At the hearing, Siraelle agrees that records concerning weapons may remain sealed.', deadline:60, respondent:'lumen'},
  {petitioner:'Fleet-Mother Kesra Vaun of the Ashen Drift', civ:'ashen', cls:'Constitutional', urgency:'High', title:'Settlement rights in the Contested Nebula',
   background:'The Ashen Drift have anchored in the Contested Nebula for six generations. The Korr Hegemony now claims the nebula for iridium extraction and has ordered the fleets to leave.',
   request:'Recognise a permanent Drift anchorage within the nebula.',
   evidence:['Navigation logs placing Drift fleets in the nebula for 190 years','The Korr Forge Assembly’s eviction notice'],
   cost:600, benefits:'Secures a home for 2.2 billion nomads.', risks:'The Korr Hegemony will treat recognition as a hostile act.',
   project:{name:'Nebula Anchorage Grant', cat:'development', duration:60, eff:{ind:{trust:2}, civ:{ashen:14, korr:-10}}},
   rejectEff:{ind:{stability:-1}, civ:{ashen:-10, korr:3}},
   hidden:{text:'Korr trade envoys have privately threatened to withhold contributions if the anchorage is granted.', chance:0.4, eff:{ind:{stability:-2}, civ:{korr:-5}}},
   hearingNote:'At the hearing, Kesra Vaun accepts that the matter could be settled by the Tribunal.', deadline:45, respondent:'korr'},
  {petitioner:'COSMOS–EDU Pilot Committee, Dhirubhai Ambani International School', civ:'earth', cls:'Educational', urgency:'Moderate', title:'Accessibility scholarships for the COSMOS–EDU pilot',
   background:'The COSMOS–EDU pilot at DAIS has more applicants than places. Students with disabilities need adapted materials, transport and assistive technology to take part fully.',
   request:'Fund 200 accessibility scholarships for the pilot and its partner schools.',
   evidence:['Enrolment data from the first pilot term','Accessibility audit of pilot materials'],
   cost:450, benefits:'Delivers the equal-opportunity commitment of EARTH–DAIS–001.', risks:'Demand may exceed the fund.',
   project:{name:'COSMOS–EDU Accessibility Scholarship Fund', cat:'education', duration:30, eff:{ind:{education:3, approval:1}, civ:{earth:5}}, special:'scholar200'},
   rejectEff:{ind:{education:-1}, civ:{earth:-4}},
   hidden:{text:'Applications are running well ahead of projections; a waiting list is likely.', chance:0.1, eff:{ind:{approval:-1}}},
   hearingNote:'At the hearing, the committee presents letters from students and families describing the pilot.', deadline:50, earthIndividual:true},
  {petitioner:'Forge Envoy Dravek Ul-Korr', civ:'korr', cls:'Development', urgency:'Moderate', title:'Mining licence in the Verdance Corridor',
   background:'Korr forges need iridium. The richest untouched deposits lie along the Verdance Corridor, beside the Sylvan Reach.',
   request:'Grant a twenty-year extraction licence. The Hegemony will pay a licence fee of CC 600M.',
   evidence:['Geological survey of the corridor','Draft environmental management plan'],
   cost:0, benefits:'Licence fee to the treasury and a warmer relationship with the largest contributor.', risks:'The corridor borders a protected region already subject to litigation.',
   project:{name:'Verdance Corridor Mining Licence', cat:'development', duration:20, eff:{ind:{environment:-4}, civ:{korr:10, sylvan:-12}}, special:'fee600'},
   rejectEff:{ind:{}, civ:{korr:-6, sylvan:2}},
   hidden:{text:'The survey boundary crosses six kilometres into the Verdance Belt Sanctuary.', chance:0.6, eff:{ind:{environment:-3, legitimacy:-2}, civ:{sylvan:-6}}},
   hearingNote:'At the hearing, Dravek offers to fund a restoration bond if mining is permitted.', deadline:40, respondent:'sylvan'}
];

const SCN_CASE = {
  title:'Sylvan Reach v. Korr Hegemony', subject:'Contamination of the Verdance Belt', type:'Environmental violation',
  claimant:{name:'Grove Speaker Ilvaren', civ:'sylvan'}, respondent:{name:'Forge Envoy Dravek Ul-Korr', civ:'korr'},
  allegations:'Korr extraction platforms discharged forge slag into the Verdance Belt, poisoning the forests of three moons, in breach of the Treaty of Clear Skies.',
  laws:['Cosmic Environmental Covenant §4 (duty of non-contamination)','Treaty of Clear Skies, Article 2','Constitutional Principle 9 (no punishment of the innocent)'],
  argC:'The isotopes in the slag match Korr forge plasma and nothing else. The Hegemony licensed the platforms and must answer for them.',
  argR:'The platforms were run by the Vantar Combine, a private contractor. Ashen Drift salvage ships were also operating in the Belt.',
  evidence:[
    {title:'Spectral sensor logs', desc:'Isotope signatures in the Belt match Korr forge plasma.', w:2},
    {title:'Extraction permits', desc:'Permits were issued to the Vantar Combine, not to Hegemony agencies.', w:-1},
    {title:'Forest loss survey', desc:'Sylvan rangers record the loss of 4,000 km² of canopy.', w:1},
    {title:'Korr compliance audit', desc:'A Korr audit certified the platforms as compliant last year.', w:-1}
  ],
  hidden:[
    {title:'Vantar Combine ledger', desc:'Payments from the Combine to two Korr inspectors to ignore discharge limits.', w:2},
    {title:'Ashen Drift salvage logs', desc:'Drift ships were never within 3 light-hours of the platforms. Korr’s claim against them is unfounded.', w:0.5, clearsThird:true}
  ],
  witnesses:[
    {name:'Ranger Teyla Moss', role:'Sylvan forest ranger', qs:[
      {q:'What did you observe in the Belt?', a:'Grey ash falling for nine days, then the canopy dying from the roots upward.', w:1},
      {q:'Could the slag have come from any other source?', a:'Nothing else in the region burns forge plasma. Only Korr platforms do.', w:0.5}]},
    {name:'Foreman Gaskar', role:'Former Vantar Combine shift foreman', qs:[
      {q:'Who ordered the discharges?', a:'Our managers. Korr inspectors told us to keep the quotas up and not to worry about the vents.', w:1.5},
      {q:'Were Ashen Drift ships near the platforms?', a:'I heard rumours. I never saw one myself.', w:-0.3}]}
  ],
  partyQs:{
    claimant:{q:'What remedy would restore the Belt?', a:'Decontamination of three moons and a guarantee that no forge will vent near the Reach again.', w:0.3},
    respondent:{q:'Did the Hegemony authorise the Combine’s conduct?', a:'We licensed them. We did not instruct them to vent. Our inspectors are under investigation.', w:0.4}
  },
  remedies:[
    {key:'full', label:'Full liability on the Korr Hegemony', detail:'Korr funds the entire restoration and accepts trade sanctions.', lean:1.0, eff:{ind:{environment:4}, civ:{korr:-12, sylvan:12}}, project:{name:'Verdance Belt Restoration (Korr-funded)', cat:'environment', duration:120, eff:{ind:{environment:3}, civ:{sylvan:6}}}},
    {key:'shared', label:'Shared responsibility and licensing reform', detail:'Korr funds 60% of restoration, the Crown 40% (CC 900M), and Korr reforms its contractor licensing.', lean:0.6, cost:900, eff:{ind:{environment:4, trust:1}, civ:{korr:-5, sylvan:9}}, project:{name:'Verdance Belt Restoration (shared)', cat:'environment', duration:110, eff:{ind:{environment:3}, civ:{sylvan:5}}}},
    {key:'contractor', label:'Liability on the Vantar Combine only', detail:'The contractor is liable; Korr must enforce the judgment.', lean:0.1, eff:{ind:{environment:2}, civ:{korr:3, sylvan:-2}}},
    {key:'dismiss', label:'Dismiss for insufficient evidence', detail:'The claim is dismissed.', lean:-1.0, eff:{ind:{environment:-2}, civ:{sylvan:-15, korr:4}}},
    {key:'collective', label:'Sanctions on Korr and the Ashen Drift', detail:'Both Korr and the Drift fleets alleged to have been present are sanctioned.', lean:1.0, violates:9, eff:{ind:{trust:-3}, civ:{korr:-12, sylvan:8, ashen:-20}}}
  ],
  truth:0.6
};

const SCN_ARCHIVES = [
  {day:-40, type:'history', title:'Recognition of the Sovereign', ref:'TRB-H-0001', body:'Following unanimous recognition by the member civilisations, Tarush Rungta, formerly a candidate for the Cosmic Throne, was elevated to Sovereign of the Cosmos. The Twelve Judges recognised his authority, the Ancient Spirits acknowledged his leadership, and the Prime Arbiter accepted appointment as principal adviser to the Crown.'},
  {day:-38, type:'petition', title:'EARTH–001–COSMOS: Earth’s collective cosmic petition', ref:'EARTH–001–COSMOS', body:'Earth exercised its collective cosmic petition privilege, which is available once per millennium. The petition requested: (1) planetary protection; (2) responsible sharing of scientific knowledge; (3) recognition of Earth as a civilisation; (4) environmental cooperation; and (5) peaceful relations with the Cosmos. The Crown accepted the petition. Earth remains an independent civilisation, and the next collective petition becomes available in Year 1000 CE.'},
  {day:-30, type:'decision', title:'EARTH–DAIS–001: Homecoming visit and COSMOS–EDU', ref:'EARTH–DAIS–001', body:'The Sovereign approved: an official homecoming visit to Dhirubhai Ambani International School; an invitation for the school to visit the Cosmic Tribunal; the establishment of COSMOS–EDU; a commitment to equal educational opportunity; accessibility for students with disabilities; and the expansion of the programme to other schools. DAIS is designated the first pilot institution.'},
  {day:-120, type:'verdict', title:'In re Thalassine Fishing Rights', ref:'TRB-H-0007', body:'The Tribunal held that migratory deep-sea species are a shared resource and that no member civilisation may claim exclusive rights over them. Precedent for shared-resource disputes.'},
  {day:-75, type:'verdict', title:'Veyari Concord v. Lumen Archive (First Hearing)', ref:'TRB-H-0011', body:'The Tribunal declined to compel the Lumen Archive to open its sealed vault, holding that a civilisation’s custody of its own records is protected by Principle 1. The question of shared scientific inheritance was left open.'},
  {day:-20, type:'law', title:'ACT-0000 Founding Charter of the Crowned Era', ref:'ACT-0000', body:'Establishes the Constitutional Principles, the Cosmic Tribunal, the Royal Cosmic Council and the Cosmic Treasury.'}
];

const BRIEF_OPENING = 'Welcome to the Chamber, Sovereign. The Twelve are seated and the Council stands ready. Five petitions await your judgement, the Tribunal has registered Sylvan Reach v. Korr Hegemony, and the treasury holds CC 42,000M. One matter cannot wait: the star Vael-9 is destabilising, and the Orrery of Vael has asked for help. I recommend you review the emergency first, then the petitions with the shortest deadlines.';
