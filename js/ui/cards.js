import { goRoute, goTab, shuffle, syncRoute } from '../app.js';
import { LESSONS } from '../data/lessons.js';
import { BUILD_EN, BUILD_SENTS, MIC_SENTS, QZNAMES, SE_ITEMS } from '../data/practice.js';
import { IRFORMS, PAST, PRON, PRONEN, TOP10, VERBS } from '../data/verbs.js';
import { CATS, FLASH } from '../data/vocabulary.js';
import { certDlBtn, fireConfetti } from '../services.js';
import { $, ST, dateVal, esc, mistakeAnswer, normAns, pushScore, regularPastForms, save, saveMistake, srsDueList, srsKnow, srsLearn, todayStr, touchDay, updateTop, uuLine, wordByWord, wordMatchPct } from '../store.js';
import { SPK_SVG_SM, speak, speakBtn } from '../tts.js';
import { renderVerbMastery } from './grammar.js';
import { renderLessons } from './learn.js';
import { openPrintSheet, renderIrregulars, renderSyllables, renderTraps, startExam2, startExam3, startHangman, startMarathon, startMock, startNumDrill, startWordMatch } from './speak.js';
import { renderBuilderPro, renderWriting, startExam4, startExam5 } from './tools.js';

/* ── LAYER 5 · UI — small render helpers (favourite-star buttons, speaker icons) ── */
function favStarBtn(idx){var on=!!ST.favs[idx];return '<button type="button" class="spk sm" data-fav="'+idx+'" aria-label="Favourite word" style="background:'+(on?'var(--orange)':'#94a3b8')+'">'+(on?'★':'☆')+'</button>'}

/* ── LAYER 5 · UI (continued) — Flashcards, Verb Trainer & Quiz Zone screens ── */
/* ============ FLASHCARDS ============ */
var fcCat='all', fcQueue=[], fcPos=0, fcFlipped=false, fcShuffle=false, fcDir='fwd';
function hardIndices(){var out=[];for(var i=0;i<FLASH.length;i++){if((ST.still[i]||0)>=3)out.push(i)}return out}
function buildQueue(){
  if(fcCat==='hard'){fcQueue=hardIndices();fcPos=0;fcFlipped=false;return}
  if(fcCat==='due'){fcQueue=srsDueList();fcPos=0;fcFlipped=false;return}
  if(fcCat==='fav'){fcQueue=FLASH.map(function(f,i){return i}).filter(function(i){return ST.favs[i]});fcPos=0;fcFlipped=false;return}
  var pool=FLASH.map(function(f,i){return i}).filter(function(i){return fcCat==='all'||FLASH[i].cat===fcCat});
  pool.sort(function(a,b){
    var ka=ST.known[a]?1:0, kb=ST.known[b]?1:0;
    var sa=ST.seen[a]||0, sb=ST.seen[b]||0;
    if(fcShuffle)return Math.random()-0.5;
    if(ka!==kb)return ka-kb; /* unknown first */
    return sa-sb; /* least seen first */
  });
  fcQueue=pool;fcPos=0;fcFlipped=false;
}
function renderCards(){
  var knownCount=Object.keys(ST.known).length;
  var h='<div class="card"><h2 style="font-size:1.2rem">🗂️ Flashcards — '+FLASH.length+' words</h2>';
  h+='<p class="muted">Tap the card to flip it. Words you mark "Still learning" come back more often. Known: <b>'+knownCount+'</b> / '+FLASH.length+'</p>';
  var hardN=hardIndices().length;
  var dueN=srsDueList().length;
  h+='<button class="btn" id="fcDue" type="button" style="width:100%;margin-bottom:10px">🔁 Review due cards — '+dueN+' due today (spaced repetition)</button>';
  h+='<button class="btn orange" id="fcHard" type="button" style="width:100%;margin-bottom:10px">🆘 Hard Words deck — '+hardN+' word'+(hardN===1?'':'s')+' you marked "Still learning" 3+ times</button>';
  h+='<button class="btn ghost" id="fcPrint" type="button" style="width:100%;margin-bottom:10px">📄 Word sheet — the category chosen below</button>';
  h+='<label class="muted" style="font-weight:600">Category</label><select id="fcCatSel" style="margin:6px 0 10px"><option value="all">All categories</option><option value="hard"'+(fcCat==='hard'?' selected':'')+'>🆘 Hard Words ('+hardN+')</option><option value="due"'+(fcCat==='due'?' selected':'')+'>🔁 Due for review ('+dueN+')</option><option value="fav"'+(fcCat==='fav'?' selected':'')+'>⭐ Favourites ('+Object.keys(ST.favs).length+')</option>';
  for(var c in CATS){h+='<option value="'+c+'"'+(fcCat===c?' selected':'')+'>'+CATS[c]+'</option>'}
  h+='</select><label class="pill"><input type="checkbox" id="fcShuffle" '+(fcShuffle?'checked':'')+'> 🔀 Shuffle mode</label>';
  h+='<div style="margin-top:10px"><span class="muted" style="font-weight:600">Direction: </span><span class="seg"><button type="button" id="fcDirF" class="'+(fcDir==='fwd'?'on':'')+'">Spanish → Meaning</button><button type="button" id="fcDirR" class="'+(fcDir==='rev'?'on':'')+'">Meaning → Spanish (recall)</button></span></div>';
  h+='<p class="muted kbhint" style="margin:8px 0 0">⌨️ Keyboard: Space = flip · 1 = Know it · 2 = Still learning</p><p class="muted" style="margin:8px 0 0">🔁 Spaced repetition: "Know it" schedules the card again in 1 → 3 → 7 → 21 → 45 days. "Still learning" brings it back tomorrow. ⭐ star any word to build your Favourites deck.</p></div>';
  var catTot={},catKnown={};
  FLASH.forEach(function(f,i){catTot[f.cat]=(catTot[f.cat]||0)+1;if(ST.known[i])catKnown[f.cat]=(catKnown[f.cat]||0)+1});
  h+='<div class="card fc-cats"><h3 style="margin:0 0 2px">🗂️ Categories — tap one to study it</h3><div class="fpills" id="fcPills"><button type="button" class="fpill on" data-cf="all">All</button><button type="button" class="fpill" data-cf="prog">In progress</button><button type="button" class="fpill" data-cf="done">Completed</button><button type="button" class="fpill" data-cf="new">Not started</button></div><div class="catgrid">';
  for(var ck in CATS){var tot=catTot[ck]||0,kn=catKnown[ck]||0,pct=tot?Math.round(kn/tot*100):0,cst=pct===100?'done':(pct>0?'prog':'new'),off=(100.5*(1-pct/100)).toFixed(1);
    h+='<button type="button" class="catitem" data-catopen="'+ck+'" data-cst="'+cst+'"><svg class="catring" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" stroke-width="4"/><circle cx="20" cy="20" r="16" fill="none" stroke="'+(pct===100?'#10b981':'#4f46e5')+'" stroke-width="4" stroke-linecap="round" stroke-dasharray="100.5" stroke-dashoffset="'+off+'" transform="rotate(-90 20 20)"/></svg><span class="ct"><b>'+CATS[ck]+'</b><span class="muted">'+kn+' / '+tot+' known · '+pct+'%</span></span></button>'}
  h+='</div></div>';
  h+='<div id="fcBody"></div>';
  $('tab-cards').innerHTML=h;
  document.querySelectorAll('[data-catopen]').forEach(function(b){b.addEventListener('click',function(){fcCat=b.getAttribute('data-catopen');var s=$('fcCatSel');if(s)s.value=fcCat;buildQueue();renderCard();$('tab-cards').classList.add('studyfocus');syncRoute('#/study/'+fcCat)})});
  document.querySelectorAll('#fcPills .fpill').forEach(function(p){p.addEventListener('click',function(){document.querySelectorAll('#fcPills .fpill').forEach(function(x){x.classList.remove('on')});p.classList.add('on');var f=p.getAttribute('data-cf');document.querySelectorAll('[data-catopen]').forEach(function(t){t.style.display=(f==='all'||t.getAttribute('data-cst')===f)?'':'none'})})});
  $('fcHard').addEventListener('click',function(){fcCat='hard';var s=$('fcCatSel');if(s)s.value='hard';buildQueue();renderCard();$('tab-cards').classList.add('studyfocus');syncRoute('#/study/hard')});
  $('fcDue').addEventListener('click',function(){fcCat='due';var s=$('fcCatSel');if(s)s.value='due';buildQueue();renderCard();$('tab-cards').classList.add('studyfocus');syncRoute('#/study/due')});
  $('fcDirF').addEventListener('click',function(){fcDir='fwd';fcFlipped=false;renderCards()});
  $('fcDirR').addEventListener('click',function(){fcDir='rev';fcFlipped=false;renderCards()});
  $('fcPrint').addEventListener('click',function(){openPrintSheet(fcCat)});
  $('fcCatSel').addEventListener('change',function(){fcCat=this.value;buildQueue();renderCard();if(fcCat==='all'){$('tab-cards').classList.remove('studyfocus');syncRoute('#/flashcards')}else{$('tab-cards').classList.add('studyfocus');syncRoute('#/study/'+fcCat)}});
  $('fcShuffle').addEventListener('change',function(){fcShuffle=this.checked;buildQueue();renderCard()});
  if(!fcQueue.length)buildQueue();
  renderCard();
}
function renderCard(){
  var body=$('fcBody');if(!body)return;
  if(!fcQueue.length){
    var msg=fcCat==='due'?'<div class="card" style="text-align:center"><h3>🔁 Nothing due today</h3><p class="muted">No cards are due for review right now. Mark some cards "Know it" in any category — they will come back here in 1 day, then 3, 7, 21 and 45 days.</p></div>':(fcCat==='fav'?'<div class="card" style="text-align:center"><h3>⭐ No favourites yet</h3><p class="muted">Tap the ☆ star on any flashcard or lesson word and it will collect here in your own Favourites deck.</p></div>':'<div class="card" style="text-align:center"><h3>🆘 No hard words yet</h3><p class="muted">When you tap "Still learning" on the same word 3 times, it will appear here in your rescue deck automatically.</p></div>');
    body.innerHTML=msg;return}
  if(fcPos>=fcQueue.length){body.innerHTML='<div class="card" style="text-align:center"><h3>🎉 Round complete!</h3><p class="muted">You went through this set. Unknown words will return first next round; known words return on their SRS due dates.</p><button class="btn" id="fcAgain" type="button">↻ Start again</button></div>';var a=$('fcAgain');if(a)a.onclick=function(){buildQueue();renderCard()};return}
  var idx=fcQueue[fcPos];var f=FLASH[idx];
  var dueTag=(ST.srs[idx]&&ST.srs[idx].due)?' · 🔁 '+(dateVal(ST.srs[idx].due)<=dateVal(todayStr())?'due now':'next: '+ST.srs[idx].due):'';
  var h='<div class="card"><p class="muted" style="margin-top:0">'+CATS[f.cat]+' · Card '+(fcPos+1)+' of '+fcQueue.length+(ST.known[idx]?' · ✓ Known':'')+dueTag+'</p>';
  if(!fcFlipped){
    if(fcDir==='rev'){
      h+='<button type="button" class="flashcard" id="fcCard" aria-label="Flashcard. Tap to reveal the Spanish word."><span class="en" style="font-size:1.3rem;font-weight:700">'+esc(f.en)+'</span><span class="ur" style="font-size:1rem">'+esc(f.ur)+'</span>'+uuLine(f.uu)+'<span class="hint">Say the Spanish word aloud, then tap to check 👆</span></button>';
    }else{
      h+='<button type="button" class="flashcard" id="fcCard" aria-label="Flashcard: '+esc(f.es)+'. Tap to flip."><span class="es big">'+esc(f.es)+'</span><span class="hint">Tap card to see the meaning 👆</span></button>';
    }
    h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:10px">'+speakBtn(f.es)+favStarBtn(idx)+'</div>';
  }else{
    h+='<div class="flashcard flipanim" id="fcCard"><div class="es big">'+esc(f.es)+'</div><div class="en" style="font-size:1.05rem;margin-top:6px">'+esc(f.en)+'</div><div class="ur">'+esc(f.ur)+'</div>'+uuLine(f.uu)+'<div style="display:flex;gap:10px;justify-content:center;margin-top:10px">'+speakBtn(f.es)+favStarBtn(idx)+'</div></div>';
    h+='<div class="grid2" style="margin-top:12px"><button class="btn" id="fcKnow" type="button" style="background:var(--green)">✓ Know it</button><button class="btn orange" id="fcLearn" type="button">↻ Still learning</button></div>';
  }
  h+='</div>';
  body.innerHTML=h;
  $('fcCard').onclick=function(){if(!fcFlipped){fcFlipped=true;renderCard()}};
  if(fcFlipped){
    $('fcKnow').onclick=function(){ST.known[idx]=true;ST.seen[idx]=(ST.seen[idx]||0)+1;ST.still[idx]=0;srsKnow(idx);save();updateTop();touchDay();if(fcCat==='hard'||fcCat==='due'){buildQueue();renderCards()}else{fcPos++;fcFlipped=false;renderCard()}};
    $('fcLearn').onclick=function(){delete ST.known[idx];ST.seen[idx]=(ST.seen[idx]||0)+1;ST.still[idx]=(ST.still[idx]||0)+1;srsLearn(idx);save();updateTop();if(fcCat==='due'){buildQueue();renderCards()}else{fcPos++;fcFlipped=false;renderCard()}};
  }
}
/* ============ VERBS ============ */
var curVerb=0, vqState=null, verbTense='present';
function renderVerbs(){
  var h='<div class="card"><h2 style="font-size:1.2rem">✍️ Verb Trainer</h2><p class="muted">The 20 most useful verbs, full present tense. Tap the orange speaker button to hear every form. Then test yourself with the conjugation quiz.</p>';
  h+='<label class="muted" style="font-weight:600">Choose a verb</label><select id="verbSel" style="margin:6px 0 4px">';
  VERBS.forEach(function(v,i){h+='<option value="'+i+'"'+(i===curVerb?' selected':'')+'>'+esc(v.inf)+' — '+esc(v.en)+'</option>'});
  h+='</select></div><div id="verbBody"></div><div id="vmBody"></div>';
  h+='<div id="irrBody"></div>';
  h+='<div class="card"><h3>🧠 Conjugation quiz</h3><p class="muted">Example: "¿Cómo se dice \'we eat\'?" — pick the right form.</p><div id="verbQuizBody"></div></div>';
  $('tab-verbs').innerHTML=h;
  $('verbSel').addEventListener('change',function(){curVerb=parseInt(this.value,10);renderVerbTable();$('tab-verbs').classList.add('verbfocus');syncRoute('#/verb/'+(curVerb+1))});
  renderVerbTable();renderVerbMastery();renderIrregulars();vqState=null;renderVerbQuiz();
}
function renderVerbTable(){
  var v=VERBS[curVerb];var b=$('verbBody');if(!b)return;
  var isTop=TOP10.indexOf(v.id)>=0;
  if(!isTop&&verbTense!=='present')verbTense='present';
  var h='<div class="card"><div style="display:flex;gap:10px;align-items:center"><div style="flex:1"><div class="es big">'+esc(v.inf)+'</div><div class="en">'+esc(v.en)+'</div><div class="ur">'+esc(v.ur)+'</div></div>'+speakBtn(v.inf)+'</div>';
  if(v.note)h+='<div class="feedback ok" style="margin-top:10px">💡 '+esc(v.note)+'</div>';
  h+='<div class="toggles"><span class="seg"><button type="button" data-tense="present" class="'+(verbTense==='present'?'on':'')+'">Present (now)</button><button type="button" data-tense="past" class="'+(verbTense==='past'?'on':'')+'">Past (hablé, comí)</button><button type="button" data-tense="future" class="'+(verbTense==='future'?'on':'')+'">Future (voy a…)</button></span></div>';
  if(!isTop&&verbTense==='past')h+='<p class="muted">This verb is regular, so the past table below follows the standard pattern from Lesson 13. (The top 10 verbs — ser, estar, tener, ir, hacer, poder, querer, saber, decir, ver — have their own irregular past tables.)</p>';
  var forms=v.forms,cap='Present tense';
  if(verbTense==='past'){forms=isTop?PAST[v.id]:regularPastForms(v);cap='Simple past (preterite) — completed actions, "yesterday I..."'}
  if(verbTense==='future'){forms=IRFORMS.map(function(f){return f+' '+v.inf});cap='Near future — "voy a '+v.inf+'" = I am going to '+v.en.replace('to ','')}
  h+='<p style="font-weight:700;margin:8px 0 2px">'+cap+'</p>';
  h+='<table><tr><th>Person</th><th>Form</th><th></th></tr>';
  for(var i=0;i<6;i++){h+='<tr><td class="muted">'+PRON[i]+'<br><span style="font-size:.78rem">'+PRONEN[i]+'</span></td><td><span class="es" style="font-size:1.05rem">'+esc(forms[i])+'</span></td><td style="text-align:right">'+speakBtn(forms[i],true)+'</td></tr>'}
  h+='</table><p style="margin:10px 0 0">📌 Example: <b>'+esc(v.ex)+'</b> '+speakBtn(v.ex.split(' — ')[0],true)+'</p></div>';
  b.innerHTML=h;
  b.querySelectorAll('[data-tense]').forEach(function(btn){btn.addEventListener('click',function(){verbTense=btn.getAttribute('data-tense');renderVerbTable()})});
}
function verbQuizQ(){
  var v=VERBS[Math.floor(Math.random()*VERBS.length)];var p=Math.floor(Math.random()*6);
  var correct=v.forms[p];
  var opts=[correct];
  while(opts.length<4){var rv=VERBS[Math.floor(Math.random()*VERBS.length)];var rp=Math.floor(Math.random()*6);var f=rv.forms[rp];if(opts.indexOf(f)<0)opts.push(f)}
  var pronEn={0:'I',1:'you',2:'he/she',3:'we',4:'you all',5:'they'};
  var enVerb=v.en.replace('to ','').replace(' (who/what you are)','').replace(' (how/where, temporary)','').replace(' (facts)','').replace(' (pleases me)','');
  return{q:'¿Cómo se dice "'+pronEn[p]+' '+enVerb+'" — verb: '+v.inf+'?',opts:shuffle(opts),ans:correct,exp:v.inf+' → '+PRON[p]+' '+correct};
}
function renderVerbQuiz(){
  var b=$('verbQuizBody');if(!b)return;
  if(!vqState)vqState={q:0,score:0,total:10,mistakes:[],cur:verbQuizQ()};
  if(vqState.q>=vqState.total){
    pushScore('Verb conjugation quiz',vqState.score,vqState.total);if(vqState.score>=7){ST.verbPasses=(ST.verbPasses||0)+1}save();
    var h='<p><b>Score: '+vqState.score+' / '+vqState.total+'</b></p>';
    if(vqState.mistakes.length){h+='<h4>Review:</h4>';vqState.mistakes.forEach(function(m){h+='<p class="muted" style="margin:5px 0">• '+esc(m)+'</p>'})}
    h+='<button class="btn" id="vqAgain" type="button">↻ New quiz</button>';b.innerHTML=h;
    $('vqAgain').onclick=function(){vqState=null;renderVerbQuiz()};return;
  }
  var q=vqState.cur;
  var h='<p class="muted">Question '+(vqState.q+1)+' of '+vqState.total+' · Score: '+vqState.score+'</p><p style="font-weight:700">'+esc(q.q)+'</p>';
  q.opts.forEach(function(o){h+='<button type="button" class="opt" data-vopt="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="vqFb"></div>';b.innerHTML=h;
  document.querySelectorAll('[data-vopt]').forEach(function(btn){btn.addEventListener('click',function(){
    var pick=btn.getAttribute('data-vopt');var ok=pick===q.ans;
    document.querySelectorAll('[data-vopt]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-vopt')===q.ans)x.classList.add('correct')});
    if(!ok)btn.classList.add('wrong');else vqState.score++;
    if(!ok){vqState.mistakes.push(q.q+' → '+q.exp);saveMistake(q.q,q.exp)}
    $('vqFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct! ':'❌ Correct answer: <b>'+esc(q.ans)+'</b>. ')+esc(q.exp)+'</div><button class="btn" id="vqNext" type="button" style="width:100%">Next →</button>';
    $('vqNext').onclick=function(){vqState.q++;vqState.cur=verbQuizQ();renderVerbQuiz()};
  })});
}
/* ============ QUIZZES (4 types) ============ */
var gzState=null;
function gzQuestion(type){
  var f=FLASH[Math.floor(Math.random()*FLASH.length)];
  function distract(prop){var o=[f[prop]];var seen={};seen[normAns(f[prop])]=1;var guard=0;while(o.length<4&&guard++<400){var c=FLASH[Math.floor(Math.random()*FLASH.length)];if(normAns(c.es)===normAns(f.es))continue;if(normAns(c.en)===normAns(f.en))continue;var v=c[prop];if(seen[normAns(v)])continue;seen[normAns(v)]=1;o.push(v)}return shuffle(o)}
  if(type==='es-en')return{q:'What does "'+f.es+'" mean?',audio:f.es,opts:distract('en'),ans:f.en,exp:'"'+f.es+'" = '+f.en+' ('+f.ur+')'};
  if(type==='en-es')return{q:'How do you say "'+f.en+'" in Spanish?',opts:distract('es'),ans:f.es,exp:'"'+f.en+'" = '+f.es};
  if(type==='listen')return{q:'Listen and pick the meaning. Tap Play, then choose.',audio:f.es,listen:true,opts:distract('en'),ans:f.en,exp:'You heard "'+f.es+'" = '+f.en};
  /* fill blank: pick a lesson word that really occurs, as a whole word, in one of that lesson's own sentences */
  var LET='A-Za-zÁÉÍÓÚÜÑáéíóúüñ';
  for(var attempt=0;attempt<50;attempt++){
    var Ls=LESSONS[Math.floor(Math.random()*LESSONS.length)];
    var cand=Ls.words.filter(function(w){return w[0].length>=3&&w[0].indexOf(' ')<0&&w[0].indexOf('...')<0&&w[0].indexOf('¿')<0&&w[0].indexOf('?')<0&&w[0].indexOf('¡')<0&&w[0].indexOf('!')<0});
    if(!cand.length)continue;
    var w=cand[Math.floor(Math.random()*cand.length)];
    var key=w[0].replace(/[¿?¡!.,;:()]/g,'');
    if(!key)continue;
    var keyEsc=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    var wordRe=new RegExp('(^|[^'+LET+'])('+keyEsc+')(?!['+LET+'])','i');
    var wordReG=new RegExp('(^|[^'+LET+'])('+keyEsc+')(?!['+LET+'])','i');
    var sn=null;
    for(var si=0;si<Ls.sents.length;si++){if(wordRe.test(Ls.sents[si][0])){sn=Ls.sents[si];break}}
    if(!sn)continue;
    var blank=sn[0].replace(wordReG,'$1_____');
    if(blank===sn[0])continue;
    var opts=[w[0]];var seenO={};seenO[normAns(w[0])]=1;
    var poolW=Ls.words.map(function(x){return x[0]}).concat(FLASH.map(function(x){return x.es}));
    var guard2=0;
    while(opts.length<4&&guard2++<300){var r=poolW[Math.floor(Math.random()*poolW.length)];if(seenO[normAns(r)])continue;seenO[normAns(r)]=1;opts.push(r)}
    if(opts.length<4)continue;
    return{q:'Fill in the blank: '+blank+'  ('+sn[1]+')',opts:shuffle(opts),ans:w[0],exp:'Full sentence: '+sn[0]+' = '+sn[1]};
  }
  var fb=gzQuestion('es-en');fb.q='Fill in the blank — '+fb.q;return fb;
}
function renderQuizHome(){
  syncRoute('#/practice');
  var h='<div class="card"><h2 style="font-size:1.2rem">🧠 Quiz Zone</h2><p class="muted">10 questions per quiz. Instant feedback, and your mistakes are listed at the end so you can fix them.</p>';
  h+='<div class="grid2"><button class="btn" data-qz="es-en" type="button">Spanish → English</button><button class="btn" data-qz="en-es" type="button">English → Spanish</button><button class="btn" data-qz="blank" type="button">✏️ Fill in the blank</button><button class="btn orange" data-qz="listen" type="button">🎧 Listening quiz</button></div>';
  h+='<h3 style="font-size:1rem;margin:16px 0 6px">⚡ More ways to practise</h3><div class="grid2">';
  h+='<button class="btn" id="qzTimed" type="button">⏱️ Timed quiz — 60 seconds'+(ST.timedBest?' (best: '+ST.timedBest+')':'')+'</button>';
  h+='<button class="btn" id="qzListenType" type="button">🎧✍️ Listen &amp; Type</button>';
  h+='<button class="btn" id="qzBuilder" type="button">🧩 Sentence Builder</button>';
  h+='<button class="btn" id="qzSerEstar" type="button">⚖️ Ser vs Estar trainer</button>';
  h+='<button class="btn orange" id="qzExam" type="button">🎓 Final Exam — Level A1'+(ST.examPassed?' ✓ Passed':(ST.done[20]?'':' 🔒'))+'</button>';
  h+='<button class="btn orange" id="qzExam2" type="button">🎓 Final Exam — Level A2'+(ST.exam2Passed?' ✓ Passed':(ST.done[30]?'':' 🔒'))+'</button>';
  h+='<button class="btn" id="qzMatch" type="button">🧩 Word Match game</button>';
  h+='<button class="btn" id="qzHang" type="button">🔤 Ahorcado (hangman)</button>';
  h+='<button class="btn" id="qzNum" type="button">🔢 Numbers &amp; Money drill</button>';
  h+='<button class="btn ghost" id="qzReview" type="button">🔁 Review Mistakes ('+ST.mistakes.length+')</button>';
  h+='<button class="btn orange" id="qzExam3" type="button">🎓 Final Exam — Level B1'+(ST.exam3Passed?' ✓ Passed':(ST.done[40]?'':' 🔒'))+'</button>';
  h+='<button class="btn" id="qzMock" type="button">📝 DELE-Style Mock Exam (25 questions, timed)</button>';
  h+='<button class="btn" id="qzTraps" type="button">⚠️ Urdu-Speaker Trap Trainer</button>';
  h+='<button class="btn" id="qzSyl" type="button">🔤 Syllable Trainer</button>';
  h+='<button class="btn orange" id="qzExam4" type="button">🎓 Final Exam — Level B2'+(ST.exam4Passed?' ✓ Passed':(ST.done[50]?'':' 🔒'))+'</button>';
  h+='<button class="btn orange" id="qzExam5" type="button">🎓 Final Exam — Level C1'+(ST.exam5Passed?' ✓ Passed':(ST.done[60]?'':' 🔒'))+'</button>';
  h+='<button class="btn" id="qzWriting" type="button">✍️ Writing Workshop (12 tasks)</button>';
  h+='<button class="btn" id="qzBuilderPro" type="button">🧩 Sentence Builder Pro + My Phrases</button>';
  h+='<button class="btn" id="qzMarathon" type="button">📝 Dictation Marathon (10 lines)</button>';
  h+='<button class="btn orange" id="qzExamsHub" type="button">🎓 Exams Hub — all finals, mock &amp; certificates</button>';
  h+='<button class="btn ghost" id="qzSearch" type="button">🔎 Search everything</button>';
  h+='<p class="muted kbhint" style="margin:10px 0 0">⌨️ Keyboard: press 1–4 to pick an answer.</p>';
  h+='</div></div>';
  h+='<div id="gzBody"></div>';
  $('tab-quiz').innerHTML=h;
  document.querySelectorAll('[data-qz]').forEach(function(b){b.addEventListener('click',function(){startQuiz(b.getAttribute('data-qz'))})});
  $('qzTimed').onclick=function(){startTimed()};
  $('qzListenType').onclick=function(){startListenType()};
  $('qzBuilder').onclick=function(){startBuilder()};
  $('qzSerEstar').onclick=function(){startSerEstar()};
  $('qzExam').onclick=function(){startExam()};
  $('qzExam2').onclick=function(){startExam2()};
  $('qzMatch').onclick=function(){startWordMatch()};
  $('qzHang').onclick=function(){startHangman()};
  $('qzNum').onclick=function(){startNumDrill()};
  $('qzReview').onclick=function(){startReview()};
  $('qzExam3').onclick=function(){startExam3()};
  $('qzMock').onclick=function(){startMock()};
  $('qzTraps').onclick=function(){renderTraps()};
  $('qzSyl').onclick=function(){renderSyllables()};
  $('qzExam4').onclick=function(){startExam4()};
  $('qzExam5').onclick=function(){startExam5()};
  $('qzWriting').onclick=function(){renderWriting()};
  $('qzBuilderPro').onclick=function(){renderBuilderPro()};
  $('qzMarathon').onclick=function(){startMarathon()};
  $('qzExamsHub').onclick=function(){goRoute('#/exams')};
  $('qzSearch').onclick=function(){goRoute('#/tool/search')};
}
/* ===== Review Mistakes mode ===== */
var rvState=null;
function startReview(){
  goTab('quiz');
  if(!ST.mistakes.length){$('tab-quiz').innerHTML='<div class="card"><h3>🔁 Review Mistakes</h3><p class="muted">No saved mistakes yet — great! When you miss a quiz or lesson question, it will be saved here automatically and this mode will re-quiz only those until you get them right.</p><button class="btn" onclick="renderQuizHome()" type="button">← Back to Quiz Zone</button></div>';return}
  rvState={pool:shuffle(ST.mistakes.slice()),q:0,score:0};
  renderReviewQ();
}
function renderReviewQ(){
  var wrap=$('tab-quiz');
  if(rvState.q>=rvState.pool.length){
    var h='<div class="card"><h3>🔁 Mistake review — done!</h3><p style="font-size:1.1rem"><b>'+rvState.score+' fixed</b> · '+ST.mistakes.length+' still to review</p>';
    h+=ST.mistakes.length?'<div class="feedback no">The ones you missed again stay saved — they will come back next round until they are right.</div>':'<div class="feedback ok">🎉 All mistakes cleared! Every saved mistake is now answered correctly.</div>';
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startReview()" type="button">↻ Review again</button><button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';
    wrap.innerHTML=h;return;
  }
  var m=rvState.pool[rvState.q];
  var ans=mistakeAnswer(m);
  var h='<div class="card"><p class="muted" style="margin-top:0">🔁 Review Mistakes · '+(rvState.q+1)+' of '+rvState.pool.length+' · Fixed: '+rvState.score+'</p>';
  h+='<p style="font-weight:700">'+esc(m.q)+'</p>';
  if(ans){
    h+='<p class="muted">Type the correct answer. Accents, capitals and punctuation do not matter — but the answer itself must match the saved correct answer.</p>';
    h+='<input type="text" id="rvInput" placeholder="Type the correct answer"><div id="rvFb"></div>';
    h+='<button class="btn" id="rvCheck" type="button" style="width:100%;margin-top:10px">Check my answer</button></div>';
  }else{
    h+='<div class="feedback ok">📝 Your saved note: '+esc(m.exp||'Open this topic once more in its lesson or quiz.')+'</div><p class="muted">This mistake has no single typeable answer, so read the note, say the correct answer aloud, then clear it honestly:</p><div id="rvFb"></div>';
    h+='<button class="btn" id="rvKnow" type="button" style="width:100%;margin-top:10px">✅ I know it now — clear this mistake</button></div>';
  }
  wrap.innerHTML=h;
  function rvFinish(good){
    if(good){ST.mistakes=ST.mistakes.filter(function(x){return x.q!==m.q});rvState.score++;save()}
    $('rvFb').innerHTML='<div class="feedback '+(good?'ok':'no')+'">'+(good?'✅ Fixed! This mistake is removed from your list.':'Not yet — the correct answer is: <b>'+esc(ans)+'</b>. '+(m.exp?esc(m.exp):'')+' Say it aloud — it stays on your list and will come round again.')+'</div><button class="btn" id="rvNext" type="button" style="width:100%">'+(rvState.q+1>=rvState.pool.length?'See result →':'Next mistake →')+'</button>';
    $('rvNext').onclick=function(){rvState.q++;renderReviewQ();window.scrollTo({top:0,behavior:'smooth'})};
  }
  if(ans){$('rvCheck').onclick=function(){var v=normAns($('rvInput').value);rvFinish(v!==''&&v===normAns(ans))}}
  else{$('rvKnow').onclick=function(){rvFinish(true)}}
}
/* ===== Timed quiz (60 seconds) ===== */
var tdState=null, tdTimer=null;
function startTimed(){
  if(tdTimer)clearInterval(tdTimer);
  tdState={score:0,answered:0,left:60,cur:gzQuestion('es-en')};
  renderTimedQ();
  tdTimer=setInterval(function(){
    tdState.left--;
    var bar=$('tdBar');if(bar)bar.style.width=(tdState.left/60*100)+'%';
    var lbl=$('tdTime');if(lbl)lbl.textContent=tdState.left;
    if(tdState.left<=0){clearInterval(tdTimer);tdTimer=null;finishTimed()}
  },1000);
}
function renderTimedQ(){
  var wrap=$('tab-quiz');var q=tdState.cur;
  var h='<div class="card"><p class="muted" style="margin-top:0">⏱️ Timed quiz · <b><span id="tdTime">'+tdState.left+'</span>s</b> left · Correct: '+tdState.score+' · Best: '+ST.timedBest+'</p><div class="timerbar"><div id="tdBar" style="width:'+(tdState.left/60*100)+'%"></div></div>';
  h+='<p style="font-weight:700;font-size:1.05rem;margin-top:12px">'+esc(q.q)+'</p>';
  if(q.audio)h+='<div style="margin:4px 0 8px">'+speakBtn(q.audio)+'</div>';
  q.opts.forEach(function(o){h+='<button type="button" class="opt" data-topt="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='</div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-topt]').forEach(function(btn){btn.addEventListener('click',function(){
    if(tdState.left<=0)return;
    var ok=btn.getAttribute('data-topt')===q.ans;
    if(ok)tdState.score++;else saveMistake(q.q,q.exp);
    tdState.answered++;tdState.cur=gzQuestion(Math.random()<0.5?'es-en':'en-es');renderTimedQ();
  })});
}
function finishTimed(){
  var isNewBest=tdState.score>ST.timedBest;
  if(isNewBest){ST.timedBest=tdState.score}
  pushScore('Timed quiz (60s)',tdState.score,tdState.answered);save();
  $('tab-quiz').innerHTML='<div class="card"><h3>⏱️ Time\'s up!</h3><p style="font-size:1.2rem"><b>'+tdState.score+' correct</b> in 60 seconds ('+tdState.answered+' answered)</p><div class="feedback '+(tdState.score>=10?'ok':'no')+'">🏆 Your best: <b>'+ST.timedBest+'</b>. '+(isNewBest&&tdState.score>0?'New personal best!':(tdState.score===ST.timedBest&&tdState.score>0?'You equalled your best — one more correct beats it!':'Beat it next round — speed comes from flashcards.'))+'</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startTimed()" type="button">↻ Play again</button><button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';
}
/* ===== Listen & Type ===== */
var ltState=null;
function startListenType(){
  var m=MIC_SENTS[Math.floor(Math.random()*MIC_SENTS.length)];
  ltState={target:m[0],en:m[1]};
  var h='<div class="card"><h3>🎧✍️ Listen &amp; Type</h3><p class="muted">Listen to the Spanish sentence, then type exactly what you heard. Afterwards you see the correct sentence word by word — green = you got that word, red underlined = check it.</p>';
  h+='<button class="btn orange" id="ltPlay" type="button" style="width:100%">'+SPK_SVG_SM+' Play the sentence</button>';
  h+='<input type="text" id="ltInput" placeholder="Type what you heard in Spanish..." style="margin-top:12px">';
  h+='<div id="ltOut"></div><button class="btn" id="ltCheck" type="button" style="width:100%;margin-top:10px">Check</button>';
  h+='<button class="btn ghost" id="ltNext" type="button" style="width:100%;margin-top:8px">↻ New sentence</button>';
  h+='<button class="btn orange" id="ltMarathon" type="button" style="width:100%;margin-top:8px">🏃 Dictation Marathon — 10 lines, scored per line</button></div>';
  $('tab-quiz').innerHTML=h;
  $('ltPlay').onclick=function(){speak(ltState.target)};
  setTimeout(function(){speak(ltState.target)},300);
  $('ltNext').onclick=function(){startListenType()};
  $('ltMarathon').onclick=function(){startMarathon()};
  $('ltCheck').onclick=function(){
    var v=$('ltInput').value.trim();var pct=wordMatchPct(v,ltState.target);
    $('ltOut').innerHTML='<div class="feedback '+(pct>=80?'ok':'no')+'" style="margin-top:10px"><b>Word match: '+pct+'%</b><br>Correct sentence, word by word:<br><span style="font-size:1.05rem">'+wordByWord(v,ltState.target)+'</span><br><span class="muted">Meaning: '+esc(ltState.en)+'</span></div>';
    if(pct<100)saveMistake('Listen & Type: '+ltState.target,'Correct: '+ltState.target+' = '+ltState.en);
    touchDay();
  };
}
/* ===== Sentence Builder ===== */
var bdState=null;
function startBuilder(){
  var i=Math.floor(Math.random()*BUILD_SENTS.length);
  bdState={words:BUILD_SENTS[i],en:BUILD_EN[i],picked:[]};
  renderBuilder();
}
function renderBuilder(){
  var wrap=$('tab-quiz');
  var rest=bdState.words.map(function(w,i){return i}).filter(function(i){return bdState.picked.indexOf(i)<0});
  var h='<div class="card"><h3>🧩 Sentence Builder</h3><p class="muted">Build this sentence in Spanish: <b>'+esc(bdState.en)+'</b></p>';
  h+='<div class="pronbox" style="min-height:56px;font-size:1.05rem">'+(bdState.picked.length?bdState.picked.map(function(i){return esc(bdState.words[i])}).join(' '):'<span class="muted">Tap the words below, in order…</span>')+'</div>';
  h+='<div>';
  shuffle(rest.slice()).forEach(function(i){h+='<button type="button" class="chip sbword" data-bw="'+i+'" style="font-size:1rem;padding:10px 15px">'+esc(bdState.words[i])+'</button>'});
  h+='</div><div id="bdFb"></div>';
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn ghost small" id="bdUndo" type="button">⌫ Undo</button><button class="btn small" id="bdCheck" type="button">Check sentence</button><button class="btn ghost small" id="bdNew" type="button">↻ New sentence</button></div></div>';
  wrap.innerHTML=h;
  document.querySelectorAll('[data-bw]').forEach(function(b){b.addEventListener('click',function(){bdState.picked.push(parseInt(b.getAttribute('data-bw'),10));renderBuilder()})});
  $('bdUndo').onclick=function(){bdState.picked.pop();renderBuilder()};
  $('bdNew').onclick=function(){startBuilder()};
  $('bdCheck').onclick=function(){
    var built=bdState.picked.map(function(i){return bdState.words[i]}).join(' ');
    var full=bdState.words.join(' ');
    var good=built===full;
    $('bdFb').innerHTML='<div class="feedback '+(good?'ok':'no')+'">'+(good?'✅ Perfect sentence! Listen to it: ':'Not quite. Correct order: <b>'+esc(full)+'</b> ')+speakBtn(full)+'</div>';
    if(!good)saveMistake('Sentence Builder: '+bdState.en,'Correct: '+full);
    if(good){speak(full);touchDay()}
  };
}
var seState=null;
function startSerEstar(){
  seState={items:shuffle(SE_ITEMS.slice()),q:0,score:0};
  renderSerEstar();
}
function renderSerEstar(){
  var wrap=$('tab-quiz');
  if(seState.q>=seState.items.length){
    pushScore('Ser vs Estar trainer',seState.score,seState.items.length);save();
    wrap.innerHTML='<div class="card"><h3>⚖️ Ser vs Estar — finished!</h3><p style="font-size:1.15rem"><b>Score: '+seState.score+' / '+seState.items.length+'</b></p><div class="feedback '+(seState.score>=14?'ok':'no')+'">'+(seState.score>=14?'🎉 You have beaten the #1 beginner confusion! Remember: SER = what it IS, ESTAR = how/where it is NOW.':'Good start! Rule yaad rakho: SER = pehchan (what it is), ESTAR = haalat (how/where now). Try again.')+'</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startSerEstar()" type="button">↻ Play again</button><button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';return;
  }
  var it=seState.items[seState.q];
  var h='<div class="card"><p class="muted" style="margin-top:0">⚖️ Ser vs Estar · '+(seState.q+1)+' of '+seState.items.length+' · Score: '+seState.score+'</p>';
  h+='<p style="font-weight:700;font-size:1.1rem">'+esc(it[0])+'</p><p class="muted">Which verb fills the blank — and which form?</p>';
  var SERF=['soy','eres','es','somos','sois','son'],ESTF=['estoy','estás','está','estamos','estáis','están'];
  var correctArr=it[1]==='ser'?SERF:ESTF,otherArr=it[1]==='ser'?ESTF:SERF;
  var ci=correctArr.indexOf(it[2]);if(ci<0)ci=2;
  var opts=shuffle([it[2],otherArr[ci],correctArr[(ci+2)%6]]);
  function verbOf(o){return SERF.indexOf(o)>=0?'ser':'estar'}
  opts.forEach(function(o){h+='<button type="button" class="opt" data-se="'+esc(o)+'">'+esc(o)+' <span class="muted">('+verbOf(o)+')</span></button>'});
  h+='<div id="seFb"></div></div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-se]').forEach(function(b){b.addEventListener('click',function(){
    var ok=b.getAttribute('data-se')===it[2];
    document.querySelectorAll('[data-se]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-se')===it[2])x.classList.add('correct')});
    if(!ok)b.classList.add('wrong');else seState.score++;
    if(!ok)saveMistake('Ser/Estar: '+it[0],it[3]+' Correct form: '+it[2]);
    $('seFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct — <b>'+esc(it[2])+'</b>. ':'❌ Correct: <b>'+esc(it[2])+'</b> ('+it[1]+'). ')+esc(it[3])+'</div><button class="btn" id="seNext" type="button" style="width:100%">Next →</button>';
    $('seNext').onclick=function(){seState.q++;renderSerEstar();window.scrollTo({top:0,behavior:'smooth'})};
  })});
}
/* ===== Final Exam (A1) ===== */
var exState=null;
function startExam(){
  if(!ST.done[20]){
    $('tab-quiz').innerHTML='<div class="card"><h3>🎓 Final Exam — Level A1 🔒</h3><p class="muted">This exam unlocks when you pass <b>Lesson 20 (Full Conversation Review)</b> — the last lesson of the A1 path (Lessons 1–20). Each lesson quiz you pass opens the next one, so the A1 certificate always means the whole level was really learned — the same rule as the A2 exam.</p><button class="btn" onclick="renderLessons();goTab(\'lessons\')" type="button">📚 Go to my lessons</button> <button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div>';
    return;
  }
  var pool=[];
  LESSONS.slice(0,20).forEach(function(L){L.quiz.forEach(function(q){pool.push({q:'[Lesson '+L.n+'] '+q[0],opts:q[1],ans:q[1][q[2]],exp:q[3]})})});
  var seenQ={},uniq=[];
  pool.forEach(function(p){var k=normAns(p.q);if(seenQ[k])return;seenQ[k]=1;uniq.push(p)});
  exState={items:shuffle(uniq).slice(0,20),q:0,score:0};
  renderExamQ();
}
function renderExamQ(){
  var wrap=$('tab-quiz');
  if(exState.q>=exState.items.length){
    var pass=exState.score>=14;
    if(exState.score>(ST.examBest||0))ST.examBest=exState.score;
    if(pass)ST.examPassed=true;
    pushScore('Final Exam A1',exState.score,20);save();if(pass)fireConfetti();
    var h='';
    if(pass){
      h+='<div class="cert"><div class="seal">🏆</div><div class="kicker">Certificate of Completion</div><h2 style="font-size:1.5rem;margin:6px 0">Level A1 Complete</h2><p style="font-size:1.05rem;margin:4px 0"><b>Farrakh</b> has passed the Spanish A1 Final Exam</p><p class="muted">Score: '+exState.score+' / 20 · '+todayStr()+' · Learn Spanish with Farrakh</p><p style="font-size:1.3rem" class="es">¡Enhorabuena, Farrakh! 🎉</p><p class="muted">📸 Take a screenshot of this card to keep your certificate.</p></div>';
    }else{
      h+='<div class="card"><h3>🎓 Final Exam — not passed yet</h3><p style="font-size:1.15rem"><b>Score: '+exState.score+' / 20</b> — you need 14 to pass.</p><div class="feedback no">No problem at all — review your mistakes, redo a few lessons, and try again. Poco a poco!</div></div>';
    }
    h+='<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startExam()" type="button">↻ Take exam again</button>'+(pass?certDlBtn('A1',exState.score):'')+'<button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';
    wrap.innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});return;
  }
  var it=exState.items[exState.q];
  var h='<div class="card"><p class="muted" style="margin-top:0">🎓 Final Exam A1 · Question '+(exState.q+1)+' of 20 · Score: '+exState.score+' · Pass = 14</p><div class="progressbar"><div style="width:'+(exState.q/20*100)+'%"></div></div>';
  h+='<p style="font-weight:700;font-size:1.03rem;margin-top:10px">'+esc(it.q)+'</p>';
  it.opts.forEach(function(o){h+='<button type="button" class="opt" data-ex="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="exFb"></div></div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-ex]').forEach(function(b){b.addEventListener('click',function(){
    var ok=b.getAttribute('data-ex')===it.ans;
    document.querySelectorAll('[data-ex]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-ex')===it.ans)x.classList.add('correct')});
    if(!ok)b.classList.add('wrong');else exState.score++;
    if(!ok)saveMistake('Exam: '+it.q,'Correct: '+it.ans+'. '+it.exp);
    $('exFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(it.ans)+'</b>. '+esc(it.exp))+'</div><button class="btn" id="exNext" type="button" style="width:100%">'+(exState.q+1>=20?'See my result →':'Next question →')+'</button>';
    $('exNext').onclick=function(){exState.q++;renderExamQ();window.scrollTo({top:0,behavior:'smooth'})};
  })});
}
function startQuiz(type){gzState={type:type,q:0,score:0,total:10,mistakes:[],cur:gzQuestion(type)};renderQuizQ()}
function renderQuizQ(){
  var wrap=$('tab-quiz');
  if(gzState.q>=gzState.total){
    pushScore(QZNAMES[gzState.type],gzState.score,gzState.total);save();
    var h='<div class="card"><h3>🏁 '+QZNAMES[gzState.type]+' — finished!</h3><p style="font-size:1.15rem"><b>Score: '+gzState.score+' / '+gzState.total+'</b></p>';
    h+=gzState.score>=7?'<div class="feedback ok">🎉 Great work! Keep the streak going with flashcards.</div>':'<div class="feedback no">Good effort! Review the mistakes below, then try once more.</div>';
    if(gzState.mistakes.length){h+='<h4>Mistakes to review:</h4>';gzState.mistakes.forEach(function(m){h+='<p class="muted" style="margin:6px 0">• '+esc(m)+'</p>'})}else{h+='<p>✨ No mistakes — perfect round!</p>'}
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="gzAgain" type="button">↻ Play again</button><button class="btn ghost" id="gzBack" type="button">All quizzes</button></div></div>';
    wrap.innerHTML=h;$('gzAgain').onclick=function(){startQuiz(gzState.type)};$('gzBack').onclick=function(){renderQuizHome()};return;
  }
  var q=gzState.cur;
  var h='<div class="card"><p class="muted" style="margin-top:0">'+QZNAMES[gzState.type]+' · Question '+(gzState.q+1)+' of '+gzState.total+' · Score: '+gzState.score+'</p>';
  h+='<p style="font-weight:700;font-size:1.03rem">'+esc(q.q)+'</p>';
  if(q.listen)h+='<button class="btn orange" id="gzPlay" type="button" style="width:100%;margin-bottom:8px">'+SPK_SVG_SM+' Play the word</button>';
  else if(q.audio)h+='<div style="margin:4px 0 8px">Listen: '+speakBtn(q.audio)+'</div>';
  q.opts.forEach(function(o){h+='<button type="button" class="opt" data-gopt="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="gzFb"></div></div>';
  wrap.innerHTML=h;
  var pl=$('gzPlay');if(pl)pl.onclick=function(){speak(q.audio)};
  document.querySelectorAll('[data-gopt]').forEach(function(btn){btn.addEventListener('click',function(){
    var pick=btn.getAttribute('data-gopt');var ok=pick===q.ans;
    document.querySelectorAll('[data-gopt]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-gopt')===q.ans)x.classList.add('correct')});
    if(!ok)btn.classList.add('wrong');else gzState.score++;
    if(!ok){gzState.mistakes.push(q.exp);saveMistake(q.q,q.exp)}
    $('gzFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct! ':'❌ Correct answer: <b>'+esc(q.ans)+'</b>. ')+esc(q.exp)+'</div><button class="btn" id="gzNext" type="button" style="width:100%">'+(gzState.q+1>=gzState.total?'See result →':'Next question →')+'</button>';
    $('gzNext').onclick=function(){gzState.q++;gzState.cur=gzQuestion(gzState.type);renderQuizQ();window.scrollTo({top:0,behavior:'smooth'})};
  })});
}

export { favStarBtn, fcCat, hardIndices, buildQueue, renderCards, renderCard, curVerb, renderVerbs, renderVerbTable, verbQuizQ, renderVerbQuiz, gzState, gzQuestion, renderQuizHome, rvState, startReview, renderReviewQ, tdState, startTimed, renderTimedQ, finishTimed, ltState, startListenType, bdState, startBuilder, renderBuilder, seState, startSerEstar, renderSerEstar, exState, startExam, renderExamQ, startQuiz, renderQuizQ };
