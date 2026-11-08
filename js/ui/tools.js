import { askConfirm, goTab, showNotice, shuffle, syncRoute } from '../app.js';
import { LESSONS } from '../data/lessons.js';
import { CH_TYPES, CINEMA, CLINIC, SCEN, TEMPLATES_PRO, WRITING } from '../data/practice.js';
import { CATS, FLASH } from '../data/vocabulary.js';
import { applyAnim, applyFontSize, certDlBtn, fireConfetti, grandCert2Html, sndOk } from '../services.js';
import { $, LIVE_URL, ST, dateVal, esc, normAns, pushScore, save, saveMistake, todayStr, touchDay } from '../store.js';
import { SPK_SVG_SM, setSlowMode, slowMode, speak, speakBtn } from '../tts.js';
import { buildQueue, fcCat, renderCards, renderQuizHome } from './cards.js';
import { renderLessons, speakQueue } from './learn.js';
import { renderProgress, renderSpeak } from './speak.js';


var simState=null;
function renderSimList(){
  goTab('speak');syncRoute('#/simulator');
  var h='<button class="btn ghost small" onclick="renderSpeak()" type="button">← Back to Speak</button>';
  h+='<div class="card"><div class="kicker">🎬 Real-life simulator</div><h2 style="font-size:1.25rem;margin:4px 0">Conversation Simulator</h2><p class="muted">15 real situations. The other person speaks — YOU choose your Spanish reply and the story moves. A wrong pick explains itself in Roman Urdu and lets you retry the same step. First-try answers build your score.</p></div>';
  SCEN.forEach(function(s,i){var done=ST.simDone[s.t];
    h+='<button type="button" class="lessonitem" onclick="startSim('+i+')"><span class="lring" style="background:#e8eef7"><i>'+(i+1)+'</i></span><span class="lt"><b>'+esc(s.t)+'</b><span class="muted">'+s.steps.length+' decision points'+(done!=null?' · best score: '+done+'/'+s.steps.length+' ✓':'')+'</span></span><span class="arr" style="color:var(--orange);font-weight:800">›</span></button>'});
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
}
function startSim(i){
  syncRoute('#/simulator/'+i);
  simState={s:SCEN[i],step:0,score:0,tried:false,log:[]};
  renderSimTurn();
  setTimeout(function(){if(simState)speak(simState.s.steps[0][0])},350);
}
function renderSimTurn(){
  var wrap=$('tab-speak');var s=simState;if(!s)return;
  var h='<button class="btn ghost small" onclick="renderSimList()" type="button">← All scenarios</button>';
  h+='<div class="card"><div class="kicker">'+esc(s.s.t)+' · Step '+(Math.min(s.step+1,s.s.steps.length))+' of '+s.s.steps.length+' · ⭐ First-try score: '+s.score+'</div>';
  s.log.forEach(function(l){h+='<div class="rpline '+(l.who==='them'?'them':'me')+'"><div class="who" style="font-size:.72rem;font-weight:700;color:var(--blue)">'+(l.who==='them'?'🗣️ Them':'🙋 You')+'</div><div class="es" style="font-size:1.02rem">'+esc(l.es)+'</div>'+(l.en?'<div class="en">'+esc(l.en)+'</div>':'')+'</div>'});
  if(s.step>=s.s.steps.length){
    var total=s.s.steps.length;var pct=Math.round(s.score/total*100);
    if(ST.simDone[s.s.t]==null||s.score>ST.simDone[s.s.t]){ST.simDone[s.s.t]=s.score;save()}
    var fb=pct>=80?'🌟 Excellent — you handled "'+s.s.t+'" like someone who lives in Spanish. Natural, polite, precise.':(pct>=50?'👍 Solid! You got through it. Re-read the steps where you needed a second try — those exact lines are the ones real life will ask you.':'💪 First steps! The wrong picks taught you the pattern: short, polite, specific. Play it once more and watch the score climb.');
    h+='<div class="feedback ok">🏁 <b>Scenario complete: '+s.score+' / '+total+' first-try ('+pct+'%)</b><br>'+fb+'</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" onclick="startSim('+SCEN.indexOf(s.s)+')">↻ Play it again</button><button class="btn ghost" type="button" onclick="renderSimList()">All scenarios</button></div>';
    h+='</div>';wrap.innerHTML=h;touchDay();return;
  }
  var t=s.s.steps[s.step];
  h+='<div class="rpline them"><div class="who" style="font-size:.72rem;font-weight:700;color:var(--blue)">🗣️ Them — tap 🔊 to hear again</div><div style="display:flex;gap:8px;align-items:flex-start"><div style="flex:1"><div class="es" style="font-size:1.05rem">'+esc(t[0])+'</div><div class="en">'+esc(t[1])+'</div></div>'+speakBtn(t[0],true)+'</div></div>';
  h+='<p style="font-weight:700;margin:10px 0 2px">🙋 Your reply:</p><div id="simOpts">';
  shuffle(t[2].map(function(c,ci){return ci})).forEach(function(ci){h+='<button type="button" class="opt simopt" data-sim="'+ci+'">'+esc(t[2][ci])+'</button>'});
  h+='</div><div id="simFb"></div></div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-sim]').forEach(function(b){b.addEventListener('click',function(){
    var pick=parseInt(b.getAttribute('data-sim'),10);var ok=pick===t[3];
    if(!ok){
      b.classList.add('wrong');b.disabled=true;
      $('simFb').innerHTML='<div class="feedback no">❌ Not that one. 🇵🇰 '+esc(t[4])+'<br><b>Try again</b> — the story waits for the right reply.</div>';
      s.tried=true;return;
    }
    document.querySelectorAll('[data-sim]').forEach(function(x){x.disabled=true;if(parseInt(x.getAttribute('data-sim'),10)===t[3])x.classList.add('correct')});
    if(!s.tried)s.score++;
    $('simFb').innerHTML='<div class="feedback ok">✅ '+(s.tried?'Correct now — that is the natural reply.':'First try — perfect!')+' '+speakBtn(t[2][t[3]],true)+'</div><button class="btn" id="simNext" type="button" style="width:100%">'+(s.step+1>=s.s.steps.length?'See my result →':'Continue →')+'</button>';
    $('simNext').onclick=function(){s.log.push({who:'them',es:t[0],en:t[1]});s.log.push({who:'me',es:t[2][t[3]],en:''});s.step++;s.tried=false;renderSimTurn();if(s.step<s.s.steps.length)setTimeout(function(){speak(s.s.steps[s.step][0])},300)};
  })});
}


var clinicState=null, clinicTest=null;
function renderClinic(){
  goTab('speak');syncRoute('#/clinic');
  var h='<button class="btn ghost small" onclick="renderSpeak()" type="button">← Back to Speak</button>';
  h+='<div class="card"><div class="kicker">🗣️ Fix the hard sounds</div><h2 style="font-size:1.25rem;margin:4px 0">Pronunciation Clinic</h2><p class="muted">Six sound trainers for the sounds Urdu speakers find hardest. Each sound: a simple explanation, 8 minimal pairs to hear and say, and a mini-test where you identify what you hear. Use 🔊 then Record &amp; Compare on the Speak tab for the full training.</p></div>';
  CLINIC.forEach(function(c,i){var done=ST.clinicDone[c.id];
    h+='<button type="button" class="lessonitem" onclick="openClinic('+i+')"><span class="lring" style="background:#e8eef7"><i>'+(i+1)+'</i></span><span class="lt"><b>'+esc(c.t)+'</b><span class="muted">'+c.pairs.length+' minimal pairs'+(done!=null?' · mini-test best: '+done+'/5 ✓':' · mini-test waiting')+'</span></span><span class="arr" style="color:var(--orange);font-weight:800">›</span></button>'});
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
}
function openClinic(i){
  syncRoute('#/clinic/'+i);
  clinicState={c:CLINIC[i]};
  var c=clinicState.c;
  var h='<button class="btn ghost small" onclick="renderClinic()" type="button">← All sounds</button>';
  h+='<div class="card"><div class="kicker">Pronunciation Clinic</div><h2 style="font-size:1.25rem;margin:4px 0">'+esc(c.t)+'</h2><p>'+esc(c.en)+'</p><p class="ur">🇵🇰 '+esc(c.ur)+'</p>';
  h+='<h3 style="margin-top:12px">👂 Minimal pairs — hear the difference</h3><p class="muted">Tap each word, say it after the voice, then say BOTH words in the pair back-to-back. The tiny sound difference changes the whole meaning.</p>';
  c.pairs.forEach(function(pr){
    h+='<div class="wordrow"><div class="txt"><span class="es">'+esc(pr[0])+'</span> &nbsp;vs&nbsp; <span class="es">'+esc(pr[1])+'</span><div class="en">'+esc(pr[2])+'</div></div>'+speakBtn(pr[0])+' '+speakBtn(pr[1])+'</div>';
  });
  h+='<div id="clinicTestBody" style="margin-top:14px"><button class="btn orange" id="clinicTestBtn" type="button" style="width:100%">🎯 Mini-test — which word do you hear? (5 rounds)</button></div></div>';
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
  $('clinicTestBtn').onclick=function(){
    var qs=[];var prs=shuffle(c.pairs.slice());
    for(var k=0;k<5&&k<prs.length;k++){var pr=prs[k];var side=Math.random()<0.5?0:1;qs.push({pair:pr,ans:pr[side]})}
    clinicTest={qs:qs,q:0,score:0};renderClinicTest();
    setTimeout(function(){if(clinicTest)speak(clinicTest.qs[0].ans)},300);
  };
}
function renderClinicTest(){
  var b=$('clinicTestBody');if(!b||!clinicTest)return;var c=clinicState.c;
  if(clinicTest.q>=clinicTest.qs.length){
    var sc=clinicTest.score;
    if(ST.clinicDone[c.id]==null||sc>ST.clinicDone[c.id]){ST.clinicDone[c.id]=sc;save()}
    b.innerHTML='<div class="feedback '+(sc>=4?'ok':'no')+'">🎯 Mini-test done: <b>'+sc+' / '+clinicTest.qs.length+'</b>. '+(sc>=4?'Your ear owns this sound now!':'Good start — listen to the pairs above once more and retake it. Ears learn by repetition.')+'</div><button class="btn orange" type="button" onclick="openClinic('+CLINIC.indexOf(c)+')">↻ Back to this sound</button>';
    if(sc>=4)sndOk();touchDay();return;
  }
  var q=clinicTest.qs[clinicTest.q];
  var h='<p class="muted" style="margin:4px 0">Mini-test · Round '+(clinicTest.q+1)+' of '+clinicTest.qs.length+' · Score: '+clinicTest.score+'</p>';
  h+='<button class="btn orange" id="ctPlay" type="button" style="width:100%">'+SPK_SVG_SM+' Play the mystery word</button>';
  h+='<p style="font-weight:700;margin:10px 0 2px">Which word did you hear?</p>';
  [q.pair[0],q.pair[1]].forEach(function(w){h+='<button type="button" class="opt" data-ct="'+esc(w)+'">'+esc(w)+'</button>'});
  h+='<div id="ctFb"></div>';b.innerHTML=h;
  $('ctPlay').onclick=function(){speak(q.ans)};
  document.querySelectorAll('[data-ct]').forEach(function(btn){btn.addEventListener('click',function(){
    var ok=btn.getAttribute('data-ct')===q.ans;
    document.querySelectorAll('[data-ct]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-ct')===q.ans)x.classList.add('correct')});
    if(!ok)btn.classList.add('wrong');else clinicTest.score++;
    $('ctFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Sharp ears!':'❌ You heard: <b>'+esc(q.ans)+'</b>. Listen again: ')+speakBtn(q.ans,true)+'</div><button class="btn" id="ctNext" type="button" style="width:100%">Next →</button>';
    $('ctNext').onclick=function(){clinicTest.q++;renderClinicTest();if(clinicTest.q<clinicTest.qs.length)setTimeout(function(){speak(clinicTest.qs[clinicTest.q].ans)},300)};
  })});
}
var wrState=null;
function renderWriting(){
  goTab('quiz');syncRoute('#/writing');
  var h='<button class="btn ghost small" onclick="renderQuizHome()" type="button">← Quiz Zone</button>';
  h+='<div class="card"><div class="kicker">✍️ Write it yourself</div><h2 style="font-size:1.25rem;margin:4px 0">Writing Workshop</h2><p class="muted">'+WRITING.length+' guided tasks, growing from single sentences to short texts. You write first — THEN reveal the model answer and check yourself with the checklist. <b>Honest note:</b> there is no AI checker here. Checking is self-guided against the model answer — which is exactly how real self-study works.</p></div>';
  WRITING.forEach(function(w,i){h+='<button type="button" class="lessonitem" onclick="openWriting('+i+')"><span class="lring" style="background:#e8eef7"><i>'+(i+1)+'</i></span><span class="lt"><b>'+esc(w.t)+'</b><span class="muted">Level: '+esc(w.lv)+'</span></span><span class="arr" style="color:var(--orange);font-weight:800">›</span></button>'});
  if(ST.drafts.length){
    h+='<div class="card"><h3>📝 My saved drafts ('+ST.drafts.length+')</h3><p class="muted">Saved with your progress on this device — and in your cloud account if you are signed in. Tap a draft to read it, or delete it.</p>';
    ST.drafts.slice().reverse().forEach(function(d){h+='<div class="wordrow"><div class="txt"><b>'+esc(d.title)+'</b><div class="en" style="white-space:pre-wrap">'+esc(d.text)+'</div><div class="muted">'+esc(d.date)+'</div></div><button class="btn small ghost" type="button" data-deldraft="'+d.id+'">🗑️ Delete</button></div>'});
    h+='</div>';
  }
  $('tab-quiz').innerHTML=h;
  document.querySelectorAll('[data-deldraft]').forEach(function(b){b.addEventListener('click',function(){var id=b.getAttribute('data-deldraft');askConfirm('Delete this draft?','This saved draft will be removed from this device.',function(){ST.drafts=ST.drafts.filter(function(d){return String(d.id)!==String(id)});save();renderWriting()})})});
}
function openWriting(i){
  var w=WRITING[i];wrState={w:w};
  var h='<button class="btn ghost small" onclick="renderWriting()" type="button">← All writing tasks</button>';
  h+='<div class="card"><div class="kicker">Writing Workshop · '+esc(w.lv)+'</div><h2 style="font-size:1.25rem;margin:4px 0">'+esc(w.t)+'</h2>';
  h+='<p style="font-weight:700">'+esc(w.pe)+'</p><p class="ur">🇵🇰 '+esc(w.pu)+'</p>';
  h+='<label class="muted" style="font-weight:600">Write your Spanish here:</label><textarea id="wrText" rows="7" placeholder="Escribe aquí… (write here — mistakes are welcome, they are the lesson)"></textarea>';
  h+='<div class="grid2" style="margin-top:10px"><button class="btn orange" id="wrReveal" type="button">👀 Reveal the model answer</button><button class="btn" id="wrSave" type="button">💾 Save my draft</button></div><div id="wrFb"></div>';
  h+='<div id="wrModel"></div></div>';
  $('tab-quiz').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
  $('wrSave').onclick=function(){
    var txt=$('wrText').value.trim();
    if(!txt){$('wrFb').innerHTML='<div class="feedback no" style="margin-top:10px">Write something first — even two lines. Then save it.</div>';return}
    ST.drafts.push({id:Date.now(),title:w.t,text:txt,date:todayStr()});if(ST.drafts.length>100)ST.drafts=ST.drafts.slice(-100);save();
    $('wrFb').innerHTML='<div class="feedback ok" style="margin-top:10px">💾 Draft saved on this device. You can find it in the Writing Workshop list.</div>';sndOk();
  };
  $('wrReveal').onclick=function(){
    var mine=$('wrText').value.trim();
    var m='<div class="pronbox" style="margin-top:12px"><b>📖 Model answer:</b><br><span class="es" style="font-size:1.02rem;white-space:pre-wrap">'+esc(w.model)+'</span> '+speakBtn(w.model)+'</div>';
    m+='<h4>✅ Self-check — compare honestly:</h4>';
    w.check.forEach(function(ch,ci){m+='<p style="margin:6px 0">☐ '+esc(ch)+'</p>'});
    m+='<p class="muted">Tick each point in your head against YOUR text (use the styled ☐ list — no boxes to tap, just honest checking). Fix one thing, then save the improved draft.</p>';
    if(!mine)m+='<div class="feedback no">You revealed the model before writing! Next time write FIRST, even badly — comparing your own words is where the learning happens.</div>';
    $('wrModel').innerHTML=m;touchDay();
  };
}
var cinState=null;
function cinemaLocked(s){return s.need&&!ST.done[s.need]}
function renderCinema(){
  goTab('speak');syncRoute('#/cinema');
  var h='<button class="btn ghost small" onclick="renderSpeak()" type="button">← Back to Speak</button>';
  h+='<div class="card"><div class="kicker">🎬 Listen like a film</div><h2 style="font-size:1.25rem;margin:4px 0">Listening Cinema</h2><p class="muted">10 longer stories (graded A2–B2). Listen first — the transcript stays HIDDEN until you finish the 4 questions; then every line becomes tap-to-hear. First 3 are open; the rest unlock at Lessons 30, 40 and 50.</p></div>';
  CINEMA.forEach(function(s,i){var lk=cinemaLocked(s);var done=ST.cinemaDone[s.t];
    h+='<button type="button" class="lessonitem'+(lk?' locked':'')+'" '+(lk?'disabled':'onclick="openCinema('+i+')"')+'><span class="lring" style="background:#e8eef7"><i>'+(lk?'🔒':(i+1))+'</i></span><span class="lt"><b>'+esc(s.t)+'</b><span class="muted">Level '+s.lv+' · '+s.lines.length+' lines · 4 questions'+(lk?' · unlocks after Lesson '+s.need:(done?' · ✓ watched ('+done+'/4)':''))+'</span></span><span class="arr" style="color:var(--orange);font-weight:800">›</span></button>'});
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
}
function openCinema(i){
  syncRoute('#/cinema/'+i);
  var s=CINEMA[i];cinState={s:s,q:0,score:0};
  var h='<button class="btn ghost small" onclick="renderCinema()" type="button">← All cinema stories</button>';
  h+='<div class="card"><div class="kicker">Listening Cinema · Level '+s.lv+'</div><h2 style="font-size:1.3rem;margin:4px 0">'+esc(s.t)+'</h2>';
  h+='<div class="grid2"><button class="btn" id="cinNormal" type="button">'+SPK_SVG_SM+' Play the story — Normal</button><button class="btn orange" id="cinSlow" type="button">🐢 Play — Slow</button><button class="btn ghost" id="cinLine" type="button">🔂 Line by line (listen &amp; repeat)</button></div>';
  h+='<p class="muted">🎧 Listen at least twice. The written story appears only AFTER the questions — ears first, eyes second.</p><div id="cinQuiz"></div><div id="cinTranscript"></div></div>';
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
  var full=s.lines.join(' ');
  $('cinNormal').onclick=function(){var pv=slowMode;setSlowMode(false);speak(full);setSlowMode(pv)};
  $('cinSlow').onclick=function(){var pv=slowMode;setSlowMode(true);speak(full);setSlowMode(pv)};
  $('cinLine').onclick=function(){speakQueue(s.lines)};
  renderCinQ();
}
function renderCinQ(){
  var b=$('cinQuiz');if(!b||!cinState)return;var s=cinState.s;
  if(cinState.q>=s.qs.length){
    if(ST.cinemaDone[s.t]==null||cinState.score>ST.cinemaDone[s.t]){ST.cinemaDone[s.t]=cinState.score}
    pushScore('Cinema: '+s.t,cinState.score,4);save();
    b.innerHTML='<div class="feedback '+(cinState.score>=3?'ok':'no')+'">🎬 Story finished: <b>'+cinState.score+' / 4</b>. '+(cinState.score===4?'Perfect listening — cinema level!':'Now read the transcript below, tap any line to hear it, and the hard parts will turn easy.')+'</div>';
    var th='<h3 style="margin-top:14px">📜 Transcript — tap any line to hear it</h3>';
    s.lines.forEach(function(ln){th+='<div class="wordrow" data-say="'+esc(ln)+'" style="cursor:pointer"><div class="txt"><div class="es">'+esc(ln)+'</div></div>'+speakBtn(ln,true)+'</div>'});
    $('cinTranscript').innerHTML=th;touchDay();return;
  }
  var q=s.qs[cinState.q];
  var h='<p class="muted" style="margin:10px 0 2px">Question '+(cinState.q+1)+' of 4</p><p style="font-weight:700">'+esc(q[0])+'</p>';
  q[1].forEach(function(o,oi){h+='<button type="button" class="opt" data-cin="'+oi+'">'+esc(o)+'</button>'});
  h+='<div id="cinFb"></div>';b.innerHTML=h;
  document.querySelectorAll('[data-cin]').forEach(function(btn){btn.addEventListener('click',function(){
    var ok=parseInt(btn.getAttribute('data-cin'),10)===q[2];
    document.querySelectorAll('[data-cin]').forEach(function(x){x.disabled=true;if(parseInt(x.getAttribute('data-cin'),10)===q[2])x.classList.add('correct')});
    if(!ok)btn.classList.add('wrong');else cinState.score++;
    $('cinFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(q[1][q[2]])+'</b>. '+esc(q[3]))+'</div><button class="btn" id="cinNext" type="button" style="width:100%">'+(cinState.q+1>=4?'Finish — show the transcript →':'Next question →')+'</button>';
    $('cinNext').onclick=function(){cinState.q++;renderCinQ()};
  })});
}
/* ── LAYER 3 + 5 — B2 Final Exam: the paper is built from Layer 1 content by Layer 3 rules and rendered by Layer 5 ── */
/* ============ ROUND 4: B2 FINAL EXAM ============ */
var ex4State=null;
function startExam4(){
  goTab('quiz');
  if(!ST.done[50]){
    $('tab-quiz').innerHTML='<div class="card"><h3>🎓 Final Exam — Level B2 🔒</h3><p class="muted">This exam unlocks when you pass <b>Lesson 50 (My Spanish Story — Full Review)</b> — the last lesson of the B2 path (Lessons 41–50). 20 unique questions from those lessons; pass mark is 14.</p><button class="btn" onclick="renderLessons();goTab(\'lessons\')" type="button">📚 Go to my lessons</button> <button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div>';
    return;
  }
  var pool=[];
  LESSONS.slice(40,50).forEach(function(L){L.quiz.forEach(function(q){pool.push({q:'[Lesson '+L.n+'] '+q[0],opts:q[1],ans:q[1][q[2]],exp:q[3]})})});
  var seenQ={},uniq=[];
  pool.forEach(function(pp){var k=normAns(pp.q);if(seenQ[k])return;seenQ[k]=1;uniq.push(pp)});
  ex4State={items:shuffle(uniq).slice(0,20),q:0,score:0};
  renderExam4Q();
}
function renderExam4Q(){
  var wrap=$('tab-quiz');
  if(ex4State.q>=ex4State.items.length){
    var pass=ex4State.score>=14;
    if(ex4State.score>(ST.exam4Best||0))ST.exam4Best=ex4State.score;
    if(pass)ST.exam4Passed=true;
    pushScore('Final Exam B2',ex4State.score,20);save();
    var h='';
    if(pass){
      h+='<div class="cert"><div class="seal">🏆</div><div class="kicker">Certificate of Completion</div><h2 style="font-size:1.5rem;margin:6px 0">Level B2 Complete</h2><p style="font-size:1.05rem;margin:4px 0"><b>Farrakh</b> has passed the Spanish B2 Final Exam</p><p class="muted">Score: '+ex4State.score+' / 20 · '+todayStr()+' · Learn Spanish with Farrakh</p><p style="font-size:1.3rem" class="es">¡Enhorabuena, Farrakh! Nivel B2 🎉</p><p class="muted">📸 Take a screenshot of this card to keep your certificate.</p></div>';
      if(ST.examPassed&&ST.exam2Passed&&ST.exam3Passed)h+=grandCert2Html();
    }else{
      h+='<div class="card"><h3>🎓 B2 Final Exam — not passed yet</h3><p style="font-size:1.15rem"><b>Score: '+ex4State.score+' / 20</b> — you need 14 to pass.</p><div class="feedback no">Close! Review the mistakes from Lessons 41–50 — the subjunctive and conditional questions love a second look — and try again.</div></div>';
    }
    h+='<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startExam4()" type="button">↻ Take exam again</button>'+(pass?certDlBtn('B2',ex4State.score):'')+'<button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';
    wrap.innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
    if(pass)fireConfetti();
    return;
  }
  var it=ex4State.items[ex4State.q];
  var h='<div class="card"><p class="muted" style="margin-top:0">🎓 Final Exam B2 · Question '+(ex4State.q+1)+' of 20 · Score: '+ex4State.score+' · Pass = 14</p><div class="progressbar"><div style="width:'+(ex4State.q/20*100)+'%"></div></div>';
  h+='<p style="font-weight:700;font-size:1.03rem;margin-top:10px">'+esc(it.q)+'</p>';
  it.opts.forEach(function(o){h+='<button type="button" class="opt" data-ex4="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="ex4Fb"></div></div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-ex4]').forEach(function(b){b.addEventListener('click',function(){
    var ok=b.getAttribute('data-ex4')===it.ans;
    document.querySelectorAll('[data-ex4]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-ex4')===it.ans)x.classList.add('correct')});
    if(!ok)b.classList.add('wrong');else ex4State.score++;
    if(!ok)saveMistake('B2 Exam: '+it.q,'Correct: '+it.ans+'. '+it.exp);
    $('ex4Fb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(it.ans)+'</b>. '+esc(it.exp))+'</div><button class="btn" id="ex4Next" type="button" style="width:100%">'+(ex4State.q+1>=20?'See my result →':'Next question →')+'</button>';
    $('ex4Next').onclick=function(){ex4State.q++;renderExam4Q();window.scrollTo({top:0,behavior:'smooth'})};
  })});
}
/* ── LAYER 3 · LEARNING LOGIC — weekly-challenge progress, Weakness Doctor and badge calculations (the cards they return are rendered by Layer 5) ── */
/* ============ ROUND 4: WEEKLY CHALLENGES + WEAKNESS DOCTOR + SHARE + SETTINGS ============ */
function mondayStr(off){
  var d=new Date();var day=(d.getDay()+6)%7;d.setDate(d.getDate()-day+(off||0)*7);
  return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
}
function challengeInfo(){
  var wk=mondayStr(0);
  var mondayVal=dateVal(wk);
  var weekNo=Math.floor(mondayVal/7)%CH_TYPES.length;
  var ch=CH_TYPES[weekNo];
  if(!ST.challenge||ST.challenge.wk!==wk)ST.challenge={wk:wk,base:Object.keys(ST.known).length,claimed:false};
  var prog=0;
  if(ch.key==='words')prog=Math.max(0,Object.keys(ST.known).length-ST.challenge.base);
  if(ch.key==='perfect')prog=ST.scores.filter(function(s){return dateVal(s.date)>=mondayVal&&s.score===s.total&&s.total>=5}).length;
  if(ch.key==='stories')prog=ST.scores.filter(function(s){return dateVal(s.date)>=mondayVal&&/^(Reading:|Listening:|Cinema:)/.test(s.name)}).length;
  if(ch.key==='streak'){prog=0;for(var i=0;i<7;i++){var d=new Date();var day=(d.getDay()+6)%7;d.setDate(d.getDate()-day+i);var ds=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();if(ST.dayLog[ds])prog++}}
  var done=prog>=ch.target;
  if(done&&!ST.challenge.claimed){ST.challenge.claimed=true;ST.challengeWinner=true;save();setTimeout(function(){fireConfetti();showNotice('🏆 Weekly Challenge complete! You earned the Challenge Winner badge. ¡Campeón!')},400)}
  return{ch:ch,prog:Math.min(prog,ch.target),done:done,wk:wk};
}
function challengeCardHtml(){
  var ci=challengeInfo();
  var h='<div class="card"><div class="kicker">🏆 Weekly Challenge · week of '+ci.wk+'</div><h3 style="font-size:1.08rem;margin:6px 0">'+ci.ch.t+'</h3>';
  h+='<div class="progressbar"><div style="width:'+(ci.prog/ci.ch.target*100)+'%;background:var(--orange)"></div></div>';
  h+='<p class="muted" style="margin:6px 0 0"><b>'+ci.prog+' / '+ci.ch.target+'</b> '+ci.ch.unit+(ci.done?' · ✅ <b>Complete — Challenge Winner badge earned!</b>':' · New challenge every Monday.')+'</p></div>';
  return h;
}
function weaknessHtml(){
  var rows=[];
  for(var c in CATS){
    var tot=0,kn=0,seen=0;
    FLASH.forEach(function(f,i){if(f.cat!==c)return;tot++;if(ST.seen[i])seen++;if(ST.known[i])kn++});
    if(seen>=3){var stillActive=0;FLASH.forEach(function(f,i){if(f.cat===c&&ST.still[i]>0&&!ST.known[i])stillActive++});
      var pct=Math.max(0,Math.min(100,Math.round(100*(kn-0.5*stillActive)/seen)));
      rows.push({name:CATS[c],pct:pct,act:'cat:'+c});}
  }
  var doneN=Object.keys(ST.done).length;
  rows.push({name:'📚 Lessons path',pct:Math.round(doneN/LESSONS.length*100),act:'lessons'});
  var va=0,vc=0;for(var k in ST.verbStats){va+=ST.verbStats[k].a;vc+=ST.verbStats[k].c}
  rows.push({name:'✍️ Verb conjugation',pct:va?Math.round(vc/va*100):Math.min(100,(ST.verbPasses||0)*10),act:'verbs'});
  if(ST.scores.length){var recent=ST.scores.slice(-10);var sp=0;recent.forEach(function(s){sp+=s.total?100*s.score/s.total:0});rows.push({name:'🧠 Recent quizzes',pct:Math.round(sp/recent.length),act:'quiz'})}
  rows.sort(function(a,b){return a.pct-b.pct});
  var top=rows.slice(0,3);
  var h='<div class="card"><div class="kicker">🩺 Weakness Doctor</div><h3 style="font-size:1.08rem;margin:6px 0">Your 3 weakest areas right now</h3><p class="muted">Computed honestly from your own known / still-learning cards and quiz scores on this device. Fix the weakest first — that is where points hide.</p>';
  if(!top.length)h+='<p class="muted">Not enough data yet — do a few flashcards and a quiz, and the Doctor will diagnose your weakest areas.</p>';
  top.forEach(function(r){h+='<div style="display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap"><span style="flex:1;min-width:150px"><b>'+esc(r.name)+'</b></span><div class="progressbar" style="flex:1;min-width:110px"><div style="width:'+r.pct+'%;background:var(--red)"></div></div><span class="muted" style="flex:0 0 46px;text-align:right"><b>'+r.pct+'%</b></span><button class="btn small" type="button" data-weak="'+esc(r.act)+'">Practice this now →</button></div>'});
  h+='</div>';
  return h;
}
function shareLevelHtml(){
  var doneN=Object.keys(ST.done).length;var knownN=Object.keys(ST.known).length;
  var lvl='A1 (in progress)';
  if(ST.examPassed)lvl='A1'; if(ST.exam2Passed)lvl='A2'; if(ST.exam3Passed)lvl='B1'; if(ST.exam4Passed)lvl='B2';
  if(!ST.examPassed){if(doneN>=40)lvl='B2 (in progress)';else if(doneN>=30)lvl='B1 (in progress)';else if(doneN>=20)lvl='A2 (in progress)'}
  var bCount=earnedBadgesCount();
  var txt='🇪🇸 My Spanish level: '+lvl+' · 📚 '+doneN+'/50 lessons done · 🗂️ '+knownN+' words known · 🔥 '+ST.streak+'-day streak · 🏅 '+bCount+' badges — Learn Spanish with Farrakh: '+LIVE_URL;
  var h='<div class="card" style="background:linear-gradient(140deg,#e3edfd,#ffffff 55%,#eef4ff)"><div class="kicker">📤 Share My Level</div><h3 style="font-size:1.15rem;margin:6px 0">Farrakh · Spanish Level '+esc(lvl)+'</h3>';
  h+='<p style="margin:4px 0">📚 <b>'+doneN+' / 50</b> lessons done · 🗂️ <b>'+knownN+'</b> words known<br>🔥 <b>'+ST.streak+'-day</b> streak · 🏅 <b>'+bCount+'</b> badges earned</p>';
  h+='<div class="sharebar"><a class="wa" href="https://wa.me/?text='+encodeURIComponent(txt)+'" target="_blank" rel="noopener">WhatsApp</a><a class="tg" href="https://t.me/share/url?url='+encodeURIComponent(LIVE_URL)+'&text='+encodeURIComponent(txt)+'" target="_blank" rel="noopener">Telegram</a><a class="xx" href="https://twitter.com/intent/tweet?text='+encodeURIComponent(txt)+'" target="_blank" rel="noopener">X</a></div>';
  h+='<p class="muted" style="margin:8px 0 0">Or copy this text by hand:<br><b>'+esc(txt)+'</b></p></div>';
  return h;
}
function earnedBadgesCount(){
  var n=0;var doneN=Object.keys(ST.done).length;var knownN=Object.keys(ST.known).length;
  if(doneN>=1)n++;if((ST.maxStreak||ST.streak)>=7)n++;if(knownN>=100)n++;if(ST.verbPasses>=10)n++;if(knownN>=500)n++;
  if(ST.scores.some(function(s){return /Final Exam|Mock Exam/.test(s.name)&&s.total>=20&&s.score===s.total}))n++;
  if((ST.maxStreak||0)>=30)n++;if(ST.earlyBird)n++;if(ST.nightOwl)n++;if((ST.wmWins||0)>=10)n++;
  if(ST.challengeWinner)n++;if(ST.verbExamPassed)n++;
  return n;
}
function settingsHtml(){
  var h='<div class="card"><h3>⚙️ Reading &amp; Sound Settings</h3>';
  h+='<p class="muted" style="margin:4px 0">Reading text size (lessons, stories, cinema):</p><div class="seg">';
  ['Small','Normal','Large'].forEach(function(lb,i){h+='<button type="button" data-fsize="'+i+'" class="'+((ST.fontSize==null?1:ST.fontSize)===i?'on':'')+'">'+lb+'</button>'});
  h+='</div>';
  h+='<label class="pill" style="margin-top:10px"><input type="checkbox" id="sfxToggle" '+(ST.sfx!==false?'checked':'')+'> 🔊 Sound effects (gentle tones on answers)</label>';
  h+='<label class="pill" style="margin-top:8px"><input type="checkbox" id="animToggle" '+(ST.anim!==false?'checked':'')+'> ✨ Animations (page transitions &amp; celebrations)</label>';
  h+='<p class="muted" style="margin-top:8px">Settings save on this device with your progress. Animations also respect your phone’s reduced-motion setting.</p></div>';
  return h;
}
function wireProgressExtras(){
  document.querySelectorAll('[data-weak]').forEach(function(b){b.addEventListener('click',function(){
    var a=b.getAttribute('data-weak');
    if(a.indexOf('cat:')===0){fcCat=a.slice(4);buildQueue();renderCards();goTab('cards')}
    else if(a==='lessons'){renderLessons();goTab('lessons')}
    else if(a==='verbs'){goTab('verbs')}
    else{renderQuizHome();goTab('quiz')}
  })});
  document.querySelectorAll('[data-fsize]').forEach(function(b){b.addEventListener('click',function(){ST.fontSize=parseInt(b.getAttribute('data-fsize'),10);save();applyFontSize();renderProgress()})});
  var sf=$('sfxToggle');if(sf)sf.addEventListener('change',function(){ST.sfx=this.checked;save();if(this.checked)sndOk()});
  var an=$('animToggle');if(an)an.addEventListener('change',function(){ST.anim=this.checked;save();applyAnim();renderProgress()});
}
var sbpState=null;
function renderBuilderPro(){
  goTab('quiz');syncRoute('#/tool/builder-pro');
  if(!sbpState||!sbpState.t)sbpState={t:0,sel:TEMPLATES_PRO[0].parts.map(function(){return 0})};
  var tp=TEMPLATES_PRO[sbpState.t];
  var sent=tp.parts.map(function(part,i){return Array.isArray(part)?part[sbpState.sel[i]||0]:part}).join(' ');
  sent=sent.replace(/ \./g,'.').replace(/ ,/g,',').replace(/\s+/g,' ').trim();
  var h='<button class="btn ghost small" onclick="renderQuizHome()" type="button">← Quiz Zone</button>';
  h+='<div class="card"><div class="kicker">🧩 Your own sentences</div><h2 style="font-size:1.25rem;margin:4px 0">Personal Sentence Builder Pro</h2><p class="muted">Pick a topic, tap choices in each slot, and your own true Spanish sentence builds itself live. Save the best ones to <b>My Phrases</b> — they also print on your word sheet.</p>';
  h+='<div class="chiprow">';TEMPLATES_PRO.forEach(function(x,i){h+='<button type="button" class="chip'+(i===sbpState.t?' on':'')+'" data-sbpt="'+i+'">'+esc(x.t)+'</button>'});h+='</div>';
  tp.parts.forEach(function(part,i){if(!Array.isArray(part))return;
    h+='<div style="margin:10px 0"><span class="muted" style="font-weight:600">Choose:</span><div class="chiprow">';
    part.forEach(function(opt,oi){h+='<button type="button" class="chip'+((sbpState.sel[i]||0)===oi?' on':'')+'" data-sbp="'+i+':'+oi+'">'+esc(opt)+'</button>'});
    h+='</div></div>'});
  h+='<div class="pronbox" style="font-size:1.1rem"><b>'+esc(sent)+'</b></div>';
  h+='<div class="grid2"><button class="btn orange" id="sbpSay" type="button">'+SPK_SVG_SM+' Listen to my sentence</button><button class="btn" id="sbpSave" type="button">⭐ Save to My Phrases</button></div><div id="sbpFb"></div></div>';
  if(ST.myPhrases.length){
    h+='<div class="card"><h3>⭐ My Phrases ('+ST.myPhrases.length+')</h3>';
    ST.myPhrases.slice().reverse().forEach(function(mp,ri){var realIdx=ST.myPhrases.length-1-ri;
      h+='<div class="wordrow"><div class="txt"><div class="es">'+esc(mp.text)+'</div><div class="muted">'+esc(mp.date)+'</div></div>'+speakBtn(mp.text,true)+'<button class="btn small ghost" type="button" data-delphrase="'+realIdx+'">🗑️</button></div>'});
    h+='</div>';
  }
  $('tab-quiz').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
  document.querySelectorAll('[data-sbpt]').forEach(function(b){b.addEventListener('click',function(){sbpState.t=parseInt(b.getAttribute('data-sbpt'),10);sbpState.sel=TEMPLATES_PRO[sbpState.t].parts.map(function(){return 0});renderBuilderPro()})});
  document.querySelectorAll('[data-sbp]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-sbp').split(':');sbpState.sel[+v[0]]=+v[1];renderBuilderPro()})});
  $('sbpSay').onclick=function(){speak(sent)};
  $('sbpSave').onclick=function(){
    if(ST.myPhrases.some(function(m){return m.text===sent})){$('sbpFb').innerHTML='<div class="feedback ok" style="margin-top:10px">⭐ Already saved in My Phrases.</div>';return}
    ST.myPhrases.push({text:sent,date:todayStr()});if(ST.myPhrases.length>100)ST.myPhrases=ST.myPhrases.slice(-100);save();
    $('sbpFb').innerHTML='<div class="feedback ok" style="margin-top:10px">⭐ Saved to My Phrases — it will also appear on your printable word sheet.</div>';sndOk();
  };
  document.querySelectorAll('[data-delphrase]').forEach(function(b){b.addEventListener('click',function(){var ix=parseInt(b.getAttribute('data-delphrase'),10);ST.myPhrases.splice(ix,1);save();renderBuilderPro()})});
}

export { simState, renderSimList, startSim, renderSimTurn, clinicState, renderClinic, openClinic, renderClinicTest, wrState, renderWriting, openWriting, cinState, cinemaLocked, renderCinema, openCinema, renderCinQ, ex4State, startExam4, renderExam4Q, mondayStr, challengeInfo, challengeCardHtml, weaknessHtml, shareLevelHtml, earnedBadgesCount, settingsHtml, wireProgressExtras, sbpState, renderBuilderPro };
