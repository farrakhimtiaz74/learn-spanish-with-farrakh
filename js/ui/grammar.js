import { goTab, shuffle, syncRoute } from '../app.js';
import { LESSONS } from '../data/lessons.js';
import { COND_STEM, GRAM_MIST, GRAM_UR, TENSE_NAMES } from '../data/practice.js';
import { IRFORMS, PAST, PRON, TOP10, VERBS } from '../data/verbs.js';
import { fireConfetti } from '../services.js';
import { $, ST, esc, pushScore, regularPastForms, save, saveMistake, touchDay } from '../store.js';
import { speakBtn } from '../tts.js';
import { openLesson, renderLessons } from './learn.js';

function renderGrammar(filter){
  goTab('lessons');syncRoute('#/grammar');
  var f=(filter||'').toLowerCase();
  var lvName=function(n){return n>50?'C1':(n>40?'B2':(n>30?'B1':(n>20?'A2':'A1')))};
  var h='<button class="btn ghost small" onclick="renderLessons();goTab(\'lessons\')" type="button">← Lesson list</button>';
  h+='<div class="card"><div class="kicker">📚 Reference</div><h2 style="font-size:1.25rem;margin:4px 0">Grammar Reference Library</h2><p class="muted">The grammar rule of every lesson 1–50 in one searchable place: rule, Roman Urdu note, 3 examples you can hear, and the one mistake to avoid.</p><input type="text" id="gramSearch" placeholder="Search a rule… e.g. past, gusta, si, que" value="'+esc(filter||'')+'"></div>';
  var shown=0,lastLv='';
  LESSONS.forEach(function(L,i){
    var rule=L.ex;
    if(f&&(L.t+' '+rule+' '+GRAM_UR[i]).toLowerCase().indexOf(f)<0)return;
    var lv=lvName(L.n);
    if(lv!==lastLv){h+='<h3 style="margin:16px 0 2px">Level '+lv+'</h3>';lastLv=lv}
    shown++;
    h+='<div class="card"><p class="muted" style="margin-top:0">Lesson '+L.n+' · Level '+lv+'</p><h3 style="font-size:1.05rem">'+esc(L.t)+'</h3><p style="margin:6px 0">'+esc(rule)+'</p><p class="ur" style="margin:4px 0">🇵🇰 '+esc(GRAM_UR[i])+'</p>';
    L.sents.forEach(function(sn){h+='<div class="wordrow"><div class="txt"><div class="es">'+esc(sn[0])+'</div><div class="en">'+esc(sn[1])+'</div></div>'+speakBtn(sn[0],true)+'</div>'});
    h+='<div class="feedback no" style="margin-top:10px">⚠️ <b>Common mistake:</b> '+esc(GRAM_MIST[i])+'</div>';
    h+='<button class="btn small ghost" type="button" onclick="openLesson('+i+')">Open Lesson '+L.n+' →</button></div>';
  });
  if(!shown)h+='<div class="card"><p class="muted">No rules match "'+esc(filter||'')+'". Try: ser, past, gusta, por, que, si…</p></div>';
  $('tab-lessons').innerHTML=h;
  var inp=$('gramSearch');var gt=null;
  if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);inp.addEventListener('input',function(){var v=this.value;if(gt)clearTimeout(gt);gt=setTimeout(function(){renderGrammar(v)},220)})}
  if(!filter)window.scrollTo({top:0,behavior:'smooth'});
}
/* ============ ROUND 4: VERB MASTERY SYSTEM ============ */
/* ── LAYER 3 · LEARNING LOGIC — verb-form rules for the Mastery System: pure functions, content + verb in, forms out; the screens below only render their results ── */
function imperfectForms(v){
  var inf=v.inf;
  if(v.id==='ser')return['era','eras','era','éramos','erais','eran'];
  if(v.id==='ir')return['iba','ibas','iba','íbamos','ibais','iban'];
  if(v.id==='ver')return['veía','veías','veía','veíamos','veíais','veían'];
  if(v.id==='gustar')return['me gustaba','te gustaba','le gustaba','nos gustaba','os gustaba','les gustaba'];
  var stem=inf.slice(0,-2),end=inf.slice(-2);
  var A=['aba','abas','aba','ábamos','abais','aban'],E=['ía','ías','ía','íamos','íais','ían'];
  var e2=(end==='ar')?A:E;
  return e2.map(function(x){return stem+x});
}
function conditionalForms(v){
  var stem=COND_STEM[v.id];if(!stem)return null;
  return['ía','ías','ía','íamos','íais','ían'].map(function(x){return stem+x});
}
function verbFormsFor(v,tense){
  if(tense==='present')return v.forms;
  if(tense==='past')return TOP10.indexOf(v.id)>=0?PAST[v.id]:regularPastForms(v);
  if(tense==='imperfect')return imperfectForms(v);
  if(tense==='future')return IRFORMS.map(function(f){return f+' '+v.inf});
  if(tense==='conditional')return conditionalForms(v);
  return v.forms;
}
function verbMasteryQ(){
  var pool=[];
  VERBS.forEach(function(v){var st=ST.verbStats[v.id];var w=2;if(st&&st.a>=3){var acc=st.c/st.a;w=1+Math.round((1-acc)*4)}pool.push({v:v,w:w})});
  var tot=0;pool.forEach(function(p){tot+=p.w});var r=Math.random()*tot,v=pool[0].v;
  for(var i=0;i<pool.length;i++){r-=pool[i].w;if(r<=0){v=pool[i].v;break}}
  var tenses=['present','past','imperfect','future'];if(COND_STEM[v.id])tenses.push('conditional');
  var tense=tenses[Math.floor(Math.random()*tenses.length)];
  var forms=verbFormsFor(v,tense);var pIdx=Math.floor(Math.random()*6);
  var correct=forms[pIdx];var opts=[correct];
  var guard=0;
  while(opts.length<4&&guard++<300){var rv=VERBS[Math.floor(Math.random()*VERBS.length)];var rf=verbFormsFor(rv,tense);if(!rf)continue;var f2=rf[Math.floor(Math.random()*6)];if(opts.indexOf(f2)<0)opts.push(f2)}
  var pronEn={0:'I',1:'you',2:'he/she',3:'we',4:'you all',5:'they'};
  var enVerb=v.en.replace('to ','').replace(' (who/what you are)','').replace(' (how/where, temporary)','').replace(' (facts)','').replace(' (pleases me)','');
  return{q:'['+TENSE_NAMES[tense]+'] "'+pronEn[pIdx]+' '+enVerb+'" — verb: '+v.inf+' ('+PRON[pIdx]+')',opts:shuffle(opts),ans:correct,exp:v.inf+' · '+TENSE_NAMES[tense]+' · '+PRON[pIdx]+' '+correct,vid:v.id};
}
function trackVerb(q,ok){
  var st=ST.verbStats[q.vid]||{a:0,c:0};st.a++;if(ok)st.c++;ST.verbStats[q.vid]=st;save();
}
var vmState=null, vgeState=null;
/* ── LAYER 5 · UI (continued) — Verb Mastery screens ── */
function renderVerbMastery(){
  var b=$('vmBody');if(!b)return;
  var h='<div class="card"><div class="kicker">🏆 New · Verb Mastery</div><h3 style="font-size:1.12rem;margin:4px 0">Verb Mastery System</h3><p class="muted">Mixed drills across ALL tenses — present, preterite, imperfect, voy-a future and conditional. The engine watches your accuracy per verb and serves your WEAK verbs more often, automatically.</p>';
  h+='<div class="grid2"><button class="btn" id="vmStart" type="button">🏋️ Start mastery drill (10)</button><button class="btn orange" id="vgeStart" type="button">🎓 Verb Grand Exam (20)'+(ST.verbExamPassed?' ✓ Passed':'')+'</button></div>';
  h+='<div id="vmPlay" style="margin-top:10px"></div>';
  h+='<h4 style="margin:14px 0 4px">Your mastery per verb</h4>';
  VERBS.forEach(function(v){var st=ST.verbStats[v.id];var pct=(st&&st.a)?Math.round(st.c/st.a*100):null;
    h+='<div style="display:flex;gap:8px;align-items:center;margin:5px 0"><span style="flex:0 0 92px"><b>'+esc(v.inf)+'</b></span><div class="progressbar" style="flex:1"><div style="width:'+(pct==null?0:pct)+'%;background:'+(pct==null?'#cbd5e1':(pct>=80?'var(--green)':(pct>=50?'var(--orange)':'var(--red)')))+'"></div></div><span class="muted" style="flex:0 0 86px;text-align:right">'+(pct==null?'not drilled':pct+'% ('+st.c+'/'+st.a+')')+'</span></div>'});
  if(ST.verbExamPassed)h+='<div class="feedback ok" style="margin-top:10px">🎓 <b>Verb Grand Exam: PASSED</b> — best score '+ST.verbExamBest+'/20. Your verbs are officially strong.</div>';
  h+='</div>';
  b.innerHTML=h;
  $('vmStart').onclick=function(){vmState={q:0,score:0,cur:verbMasteryQ()};renderVmQ()};
  $('vgeStart').onclick=function(){vgeState={q:0,score:0,cur:verbMasteryQ()};renderVgeQ()};
}
function renderVmQ(){
  var b=$('vmPlay');if(!b||!vmState)return;
  if(vmState.q>=10){
    pushScore('Verb Mastery drill',vmState.score,10);save();
    b.innerHTML='<div class="feedback '+(vmState.score>=7?'ok':'no')+'">🏋️ Drill done: <b>'+vmState.score+' / 10</b>. '+(vmState.score>=7?'Strong! The weak-verb engine will keep polishing the rest.':'Good work — your weakest verbs were noted and will come back more often.')+'</div><button class="btn" type="button" onclick="vmState={q:0,score:0,cur:verbMasteryQ()};renderVmQ()">↻ Drill again</button>';
    renderVerbMasteryKeep();touchDay();return;
  }
  var q=vmState.cur;
  var h='<p class="muted" style="margin:4px 0">Mastery drill · '+(vmState.q+1)+' of 10 · Score: '+vmState.score+'</p><p style="font-weight:700">'+esc(q.q)+'</p>';
  q.opts.forEach(function(o){h+='<button type="button" class="opt" data-vm="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="vmFb"></div>';b.innerHTML=h;
  document.querySelectorAll('[data-vm]').forEach(function(btn){btn.addEventListener('click',function(){
    var ok=btn.getAttribute('data-vm')===q.ans;trackVerb(q,ok);
    document.querySelectorAll('[data-vm]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-vm')===q.ans)x.classList.add('correct')});
    if(!ok){btn.classList.add('wrong');saveMistake('Verb mastery: '+q.q,q.exp)}else vmState.score++;
    $('vmFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(q.ans)+'</b>. '+esc(q.exp))+'</div><button class="btn" id="vmNext" type="button" style="width:100%">Next →</button>';
    $('vmNext').onclick=function(){vmState.q++;vmState.cur=verbMasteryQ();renderVmQ()};
  })});
}
function renderVerbMasteryKeep(){var b=$('vmBody');if(!b)return;var play=$('vmPlay');var keep=play?play.innerHTML:'';renderVerbMastery();var p2=$('vmPlay');if(p2)p2.innerHTML=keep}
function renderVgeQ(){
  var b=$('vmPlay');if(!b||!vgeState)return;
  if(vgeState.q>=20){
    var pass=vgeState.score>=14;
    if(vgeState.score>(ST.verbExamBest||0))ST.verbExamBest=vgeState.score;
    if(pass)ST.verbExamPassed=true;
    pushScore('Verb Grand Exam',vgeState.score,20);save();
    b.innerHTML='<div class="feedback '+(pass?'ok':'no')+'">🎓 <b>Verb Grand Exam: '+vgeState.score+' / 20</b> — '+(pass?'✅ PASSED (pass = 14). ¡Tus verbos son fuertes!':'not yet — pass is 14. Your weakest verbs are marked in the mastery list above; drill them and retry.')+'</div><button class="btn" type="button" onclick="vgeState={q:0,score:0,cur:verbMasteryQ()};renderVgeQ()">↻ Retake the exam</button>';
    if(pass)fireConfetti();
    renderVerbMasteryKeep();touchDay();return;
  }
  var q=vgeState.cur;
  var h='<p class="muted" style="margin:4px 0">🎓 Verb Grand Exam · '+(vgeState.q+1)+' of 20 · Score: '+vgeState.score+' · Pass = 14</p><div class="progressbar"><div style="width:'+(vgeState.q/20*100)+'%"></div></div><p style="font-weight:700;margin-top:8px">'+esc(q.q)+'</p>';
  q.opts.forEach(function(o){h+='<button type="button" class="opt" data-vge="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="vgeFb"></div>';b.innerHTML=h;
  document.querySelectorAll('[data-vge]').forEach(function(btn){btn.addEventListener('click',function(){
    var ok=btn.getAttribute('data-vge')===q.ans;trackVerb(q,ok);
    document.querySelectorAll('[data-vge]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-vge')===q.ans)x.classList.add('correct')});
    if(!ok)btn.classList.add('wrong');else vgeState.score++;
    $('vgeFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(q.ans)+'</b>. '+esc(q.exp))+'</div><button class="btn" id="vgeNext" type="button" style="width:100%">'+(vgeState.q+1>=20?'See my result →':'Next →')+'</button>';
    $('vgeNext').onclick=function(){vgeState.q++;vgeState.cur=verbMasteryQ();renderVgeQ()};
  })});
}

export { renderGrammar, imperfectForms, conditionalForms, verbFormsFor, verbMasteryQ, trackVerb, vmState, renderVerbMastery, renderVmQ, renderVerbMasteryKeep, renderVgeQ };
