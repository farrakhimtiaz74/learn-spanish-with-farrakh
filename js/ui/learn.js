import { goRoute, goTab, showNotice, shuffle, syncRoute } from '../app.js';
import { LESSONS } from '../data/lessons.js';
import { SURVIVAL, SYLLABLES, TRAPS } from '../data/practice.js';
import { VERBS } from '../data/verbs.js';
import { CATS, FLASH, POD } from '../data/vocabulary.js';
import { $, LSFCloud, ST, esc, pushScore, save, saveMistake, srsDueList, todayMinutes, todayStr, touchDay, updateTop, uuLine } from '../store.js';
import { PLAY_SVG, SPK_SVG_SM, pickEsVoice, slowMode, speak, speakBtn, splitSpeechChunks } from '../tts.js';
import { hardIndices } from './cards.js';
import { renderGrammar } from './grammar.js';
import { beep, renderLevelMap, testMic } from './speak.js';


/* ================================================================
   LAYER 5 — UI
   All rendering, navigation/tabs, the thumb dock, animations and
   event handlers live in this layer (this script and the UI scripts
   that follow it). It reads content (Layer 1), asks the rules
   (Layer 3), reads/writes state only through save() / LSFStore
   (Layer 2), and calls device features through Layer 4 services.
   It defines no learning data and never touches localStorage.
   ================================================================ */
/* ============ HOME ============ */
function nextLessonIdx(){for(var i=0;i<LESSONS.length;i++){if(!ST.done[LESSONS[i].n])return i}return LESSONS.length-1}
function renderHome(){
  var d=new Date();var pod=POD[d.getDate()%POD.length];
  var wod=FLASH[(d.getDate()*7+d.getMonth())%FLASH.length];
  var idx=nextLessonIdx();var L=LESSONS[idx];var allDone=Object.keys(ST.done).length>=LESSONS.length;
  var hw='';
  function tc(nav,ic,t,s){return '<button type="button" class="toolcard" data-nav="'+nav+'"><span class="tic">'+ic+'</span><span class="tt"><b>'+t+'</b><span>'+s+'</span></span><span class="arr">›</span></button>'}
  function cat(ic,o,t,s){return '<div class="catsec"><div class="cathead"><span class="caticon'+(o?' o':'')+'">'+ic+'</span><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'}
  /* HERO — Continue stays on top */
  hw+='<div class="card herocard"><div class="kicker">Your Spanish path · A1 + A2 + B1 + B2</div><h2 style="font-size:1.3rem;margin:6px 0 2px">👋 ¡Hola, Farrakh!</h2>';
  hw+='<p class="muted" style="margin:2px 0 10px">'+LESSONS.length+' lessons in order — 20 for A1, then 10 each for A2, B1 and B2. Pass each quiz with 4 of 5 to open the next. 10–20 minutes a day is enough.</p>';
  hw+='<div class="progressbar"><div style="width:'+(Object.keys(ST.done).length/LESSONS.length*100)+'%"></div></div>';
  hw+='<p class="muted" style="margin:6px 0 12px">'+Object.keys(ST.done).length+' of '+LESSONS.length+' lessons complete · '+Object.keys(ST.known).length+' words known · 🔥 '+ST.streak+' day streak</p>';
  if(allDone){hw+='<button class="btn orange" id="contBtn" type="button" style="width:100%;min-height:56px;font-size:1.02rem">🏆 Review Lesson '+LESSONS.length+' again</button>'}
  else{hw+='<button class="btn" id="contBtn" type="button" style="width:100%;min-height:56px;font-size:1.02rem">'+PLAY_SVG+' Continue: Lesson '+L.n+' — '+esc(L.t)+'</button>'}
  hw+='</div>';
  /* Cloud account strip — the sign up / sign in page lives at #/account */
  var _sess=LSFCloud.session();
  hw+='<button type="button" class="toolcard" data-nav="account" style="width:100%;text-align:left"><span class="tic">☁️</span><span class="tt"><b>'+(_sess?'Cloud account — signed in':'Sign up / Sign in — cloud account')+'</b><span>'+(_sess?('Backing up as '+esc(_sess.email||'')):'Free backup of your progress — email + password')+'</span></span><span class="arr">›</span></button>';
  /* Today: SRS due + minutes goal */
  var dueToday=srsDueList().length;var tMin=todayMinutes();var mGoal=ST.minutesGoal||15;
  hw+='<div class="card"><div class="kicker">Today · Review &amp; time</div><p style="margin:8px 0 4px">🔁 <b>Due today: '+dueToday+' card'+(dueToday===1?'':'s')+'</b> — spaced repetition brings back words just before you forget them.</p>'+(dueToday?'<button class="btn" id="homeDueBtn" type="button" style="width:100%">🔁 Review due cards now</button>':'<p class="muted" style="margin:2px 0">Nothing due — mark more cards "Know it" and they will return here on schedule (1 → 3 → 7 → 21 → 45 days).</p>');
  hw+='<p style="margin:12px 0 4px">⏱️ <b>Today\'s practice: '+tMin+' / '+mGoal+' min</b></p><div class="progressbar"><div style="width:'+Math.min(100,tMin/mGoal*100)+'%;background:var(--orange)"></div></div><p class="muted" style="margin:4px 0 0">Counts time the app is open and being used. Set your goal (10/15/20 min) on the Progress tab.</p></div>';
  /* Global search */
  hw+='<button type="button" class="toolcard" onclick="goRoute(\'#/tool/search\')" style="width:100%;text-align:left"><span class="tic">🔎</span><span class="tt"><b>Search everything</b><span>Words, lessons and phrases in one search</span></span><span class="arr">›</span></button>';
  /* Word + Phrase of the Day */
  hw+='<div class="card daycard"><div class="grid2" style="gap:18px"><div><div class="kicker">🌟 Word of the Day</div>';
  hw+='<div style="display:flex;gap:10px;align-items:flex-start;margin-top:8px"><div style="flex:1"><div class="es big">'+esc(wod.es)+'</div><div class="en">'+esc(wod.en)+'</div><div class="ur">'+esc(wod.ur)+'</div>'+uuLine(wod.uu)+'</div>'+speakBtn(wod.es)+'</div></div>';
  hw+='<div><div class="kicker">☀️ Phrase of the Day</div>';
  hw+='<div style="display:flex;gap:10px;align-items:flex-start;margin-top:8px"><div style="flex:1"><div class="es big">'+esc(pod[0])+'</div><div class="en">'+esc(pod[1])+'</div><div class="ur">'+esc(pod[2])+'</div></div>'+speakBtn(pod[0])+'</div></div></div>';
  hw+='<p class="muted" style="margin:12px 0 0">Say both out loud 3 times. Speaking from day one is the secret.</p></div>';
  /* Daily lesson */
  hw+='<div class="card" id="dailyCard"><div class="kicker">Today · Learn</div><h3 style="font-size:1.08rem;margin-top:6px">⏱️ Daily 5-Minute Lesson '+(ST.dailyDoneDay===todayStr()?'· ✓ Done today':'')+'</h3><p class="muted">One tiny mix, fresh every day: 5 new words + 1 dialogue + 3 quick questions.</p><button class="btn orange" id="dailyBtn" type="button" style="width:100%">'+PLAY_SVG+' Start today\'s 5-minute lesson</button><div id="dailyBody"></div></div>';
  /* Streak rescue — evening, today not practised yet */
  var practisedToday=(ST.dailyDoneDay===todayStr())||ST.scores.some(function(s){return s.date===todayStr()});
  if(!practisedToday&&new Date().getHours()>=17&&ST.rescueDay!==todayStr()){
    hw+='<div class="rescue" id="rescueCard"><div style="display:flex;gap:10px;align-items:flex-start"><div style="flex:1"><b style="font-family:Outfit">🔥 Keep your streak — do 5 minutes now</b><p class="muted" style="margin:4px 0 10px">It is evening and today\'s practice is not logged yet. Five small minutes keep your '+ST.streak+'-day streak alive.</p><button class="btn orange" id="rescueBtn" type="button">⏱️ Start the Daily 5-Minute Lesson</button></div><button type="button" id="rescueX" aria-label="Dismiss" style="background:transparent;border:none;font-size:1.15rem;color:var(--muted)">✕</button></div></div>';
  }
  /* CATEGORY 1 — LEARN */
  hw+=cat('📚','','1 · LEARN','Lessons and building blocks, step by step.');
  hw+='<div class="toolgrid">';
  hw+=tc('lessons','🗺️','Lesson Path',LESSONS.length+' lessons · '+Object.keys(ST.done).length+' done');
  hw+=tc('levelmap','🧭','Level Map','50 stepping stones · A1 · A2 · B1 · B2 — tap a stone to jump in');
  hw+=tc('daily','⏱️','Daily 5-Minute Lesson','5 words + dialogue + 3 questions');
  hw+=tc('grammar','📚','Grammar Reference Library','All 50 lesson rules · searchable · examples + mistake warnings');
  hw+=tc('cinema','🎬','Listening Cinema','10 long stories A2–B2 · transcript after the questions');
  hw+='</div></div>';
  /* CATEGORY 2 — VERBS */
  hw+=cat('✍️','','2 · VERBS','The engine of every sentence.');
  hw+='<div class="toolgrid">';
  hw+=tc('verbs','📖','Verb Trainer','20 verbs · Present, Past & voy a future');
  hw+=tc('verbs','🧠','Conjugation Quiz','Verb Master badge: '+ST.verbPasses+'/10 passed');
  hw+=tc('irregular','⚡','Irregular Verbs Pack','12 famous irregulars by pattern + drills');
  hw+=tc('verbmastery','🏆','Verb Mastery System','All tenses · weak verbs served more · per-verb mastery %');
  hw+=tc('verbexam','🎓','Verb Grand Exam','20 questions · pass 14+'+(ST.verbExamPassed?' · ✓ Passed':''));
  hw+='</div></div>';
  /* CATEGORY 3 — PRACTICE */
  hw+=cat('🧠','','3 · PRACTICE','Cards, quizzes and games that make words stick.');
  hw+='<div class="toolgrid">';
  hw+=tc('cards','🗂️','Flashcards',''+FLASH.length+' words · '+Object.keys(CATS).length+' categories');
  hw+=tc('hard','🛟','Hard Words Deck',hardIndices().length+' rescued words (3+ "still learning")');
  hw+=tc('quiz','❓','Quiz Zone','4 quiz types · 10 questions each');
  hw+=tc('builder','🧩','Sentence Builder','Tap words in order, hear it spoken');
  hw+=tc('serestar','🔀','Ser vs Estar Trainer','20 sentences · Roman Urdu reasons');
  hw+=tc('timed','⏰','Timed Quiz','60 seconds · best: '+ST.timedBest+' correct');
  hw+=tc('review','📝','Review Mistakes',ST.mistakes.length+' saved — clear them all');
  hw+=tc('exam','🎓','Final Exam A1',ST.examPassed?'✓ Passed — certificate earned':(ST.done[20]?'20 questions · pass = 14':'Unlocks after Lesson 20'));
  hw+=tc('exam2','📜','Final Exam A2',ST.exam2Passed?'✓ Passed — A2 certificate earned':(ST.done[30]?'20 questions from Lessons 21–30':'Unlocks after Lesson 30'));
  hw+=tc('exam3','🎓','Final Exam B1',ST.exam3Passed?'✓ Passed — B1 certificate earned':(ST.done[40]?'20 questions from Lessons 31–40':'Unlocks after Lesson 40'));
  hw+=tc('mock','📝','DELE-Style Mock Exam','25 mixed questions · timed · pass mark 60%');
  hw+=tc('exam4','🎓','Final Exam B2',ST.exam4Passed?'✓ Passed — B2 certificate earned':(ST.done[50]?'20 questions from Lessons 41–50':'Unlocks after Lesson 50'));
  hw+=tc('writing','✍️','Writing Workshop','12 guided tasks · model answers · save your drafts');
  hw+=tc('builderpro','🧩','Sentence Builder Pro','Your family, village, job & plans — save My Phrases');
  hw+=tc('traps','⚠️','Urdu-Speaker Trap Trainer',TRAPS.length+' classic traps + mini-quiz');
  hw+=tc('syllables','🔤','Syllable Trainer',SYLLABLES.length+' long words, split syllable by syllable');
  hw+=tc('match','🎯','Word Match Game','6 words · match the pairs · timer');
  hw+=tc('hangman','🔤','Ahorcado (Hangman)','Guess the Spanish word letter by letter');
  hw+=tc('numdrill','🔢','Numbers & Money Drill','Hear prices, times & dates — type them');
  hw+='</div></div>';
  /* CATEGORY 4 — SPEAK */
  hw+=cat('🎤','','4 · SPEAK','Speaking and listening — your voice is the fastest teacher.');
  hw+='<div class="toolgrid">';
  hw+=tc('speak','🔁','Repeat After Me','Listen, repeat, move on');
  hw+=tc('shadow','🪞','Shadowing','Play · beep · repeat · play again');
  hw+=tc('listentype','🎧','Listen & Type','Hear it, type it, check word by word');
  hw+=tc('mic','🗣️','Speaking Practice','Word-match % score — honest, no AI');
  hw+=tc('testmic','🎙️','Test My Mic','Allowed / Blocked / Not asked');
  hw+=tc('library','📻','Listening Library','20 short passages · Slow + Normal · 3 questions each');
  hw+=tc('roleplay','🎭','Dialogue Role-Play','6 real conversations — you play your part');
  hw+=tc('bridge','🇵🇰','Pakistan–Spain Bridge','Phrases about YOUR life, family & village');
  hw+=tc('phrasebook','🆘','Survival Phrasebook',SURVIVAL.length+' tap-to-speak travel phrases');
  hw+=tc('reading','📖','Reading Library','10 graded stories · tap any word to hear it · 3 questions each');
  hw+=tc('record','⏺️','Record & Compare','Record your voice, hear it next to the Spanish voice');
  hw+=tc('sim','🎬','Conversation Simulator','15 branching scenarios — interview, embassy, police, doctor…');
  hw+=tc('clinic','🗣️','Pronunciation Clinic','rr · j/g · ll/y · b/v · silent h · diphthongs + mini-tests');
  hw+='</div></div>';
  /* CATEGORY 5 — PROGRESS */
  hw+=cat('📊','','5 · PROGRESS','Streak, weekly goal, badges and scores.');
  hw+='<div class="toolgrid">';
  hw+=tc('progress','📅','Weekly Goal + Graph','Goal: '+ST.weekGoal+' days this week');
  hw+=tc('progress','🏅','My Badges','First Lesson · 7-Day Streak · 100 Words · Verb Master');
  hw+=tc('account','☁️','Cloud Account',LSFCloud.session()?('Signed in · backing up as '+(LSFCloud.session().email||'')):'Sign up / Sign in · progress backup');
  hw+='</div></div>';
  $('tab-home').innerHTML=hw;
  $('dailyBtn').onclick=function(){renderDaily()};
  var hdb=$('homeDueBtn');if(hdb)hdb.onclick=function(){goRoute('#/study/due')};
  $('contBtn').onclick=function(){openLesson(idx)};
  var rb=$('rescueBtn');if(rb)rb.onclick=function(){var dc=$('dailyCard');if(dc)dc.scrollIntoView({behavior:'smooth'});renderDaily()};
  var rx=$('rescueX');if(rx)rx.onclick=function(){ST.rescueDay=todayStr();save();var rc=$('rescueCard');if(rc)rc.remove()};
  document.querySelectorAll('[data-nav]').forEach(function(b){b.addEventListener('click',function(){
    var nav=b.getAttribute('data-nav');
    if(nav==='daily'){var dc=$('dailyCard');if(dc)dc.scrollIntoView({behavior:'smooth'});renderDaily()}
    else if(nav==='shadow'){goRoute('#/speak');setTimeout(function(){var shx=$('shLesson');if(shx)shx.scrollIntoView({behavior:'smooth',block:'center'})},140)}
    else if(nav==='testmic'){goRoute('#/speak');setTimeout(function(){testMic();var o=$('micTestOut');if(o)o.scrollIntoView({behavior:'smooth',block:'center'})},140)}
    else if(nav==='record'){goRoute('#/speak');setTimeout(function(){var rcx=$('rcCard');if(rcx)rcx.scrollIntoView({behavior:'smooth',block:'center'})},140)}
    else if(nav==='irregular'){goRoute('#/verbs');setTimeout(function(){var irx=$('irrCard');if(irx)irx.scrollIntoView({behavior:'smooth',block:'start'})},140)}
    else if(nav==='verbmastery'){goRoute('#/verbs');setTimeout(function(){var vmx=$('vmBody');if(vmx)vmx.scrollIntoView({behavior:'smooth',block:'start'})},140)}
    else if(nav==='mic'){goRoute('#/speak')}
    else{
      var routes={lessons:'#/lessons',levelmap:'#/levelmap',grammar:'#/grammar',cinema:'#/cinema',verbs:'#/verbs',cards:'#/flashcards',hard:'#/study/hard',quiz:'#/practice',builder:'#/tool/sentence-builder',serestar:'#/tool/ser-estar',timed:'#/tool/timed',review:'#/tool/review-mistakes',exam:'#/exam/a1',exam2:'#/exam/a2',exam3:'#/exam/b1',exam4:'#/exam/b2',mock:'#/exam/dele',verbexam:'#/exam/verbs',writing:'#/writing',builderpro:'#/tool/builder-pro',traps:'#/tool/traps',syllables:'#/tool/syllables',match:'#/tool/word-match',hangman:'#/tool/hangman',numdrill:'#/tool/numbers',listentype:'#/tool/listen-type',library:'#/listening',roleplay:'#/roleplay',bridge:'#/bridge',phrasebook:'#/phrasebook',reading:'#/reading',sim:'#/simulator',clinic:'#/clinic',speak:'#/speak',progress:'#/progress',account:'#/account'};
      if(routes[nav])goRoute(routes[nav]);
    }
  })});
}
/* ============ DAILY 5-MINUTE LESSON ============ */
var dailyState=null;
function renderDaily(){
  var body=$('dailyBody');if(!body)return;
  var d=new Date();var seed=d.getDate()+d.getMonth()*31+d.getFullYear();
  var words=[];var used={};
  for(var i=0;words.length<5;i++){var ix=(seed*13+i*47)%FLASH.length;if(used[ix])continue;used[ix]=1;words.push(FLASH[ix])}
  var L=LESSONS[seed%LESSONS.length];
  dailyState={words:words,lesson:L,q:0,score:0};
  var h='<h4 style="margin:14px 0 4px">📚 Today\'s 5 words</h4>';
  words.forEach(function(w){h+='<div class="wordrow"><div class="txt"><div class="es">'+esc(w.es)+'</div><div class="en">'+esc(w.en)+'</div><div class="ur">'+esc(w.ur)+'</div>'+uuLine(w.uu)+'</div>'+speakBtn(w.es)+'</div>'});
  h+='<h4 style="margin:14px 0 4px">🎭 Today\'s dialogue — from Lesson '+L.n+': '+esc(L.t)+'</h4>';
  L.dlg.forEach(function(dl){h+='<div class="dlg"><div style="display:flex;gap:8px;align-items:flex-start"><div style="flex:1"><div class="who">Person '+esc(dl[0])+'</div><div class="es" style="font-size:1.02rem">'+esc(dl[1])+'</div><div class="en">'+esc(dl[2])+'</div></div>'+speakBtn(dl[1],true)+'</div></div>'});
  h+='<h4 style="margin:14px 0 4px">🧠 3 quick questions</h4><div id="dailyQuiz"></div>';
  body.innerHTML=h;
  renderDailyQ();
  body.scrollIntoView({behavior:'smooth'});
}
function renderDailyQ(){
  var b=$('dailyQuiz');if(!b||!dailyState)return;
  if(dailyState.q>=3){
    var ok=dailyState.score>=2;
    if(ok&&ST.dailyDoneDay!==todayStr()){ST.dailyDoneDay=todayStr();save()}
    b.innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'🎉 Daily lesson complete — '+dailyState.score+'/3. Come back tomorrow for a fresh mix!':'You got '+dailyState.score+'/3. Listen to the words once more above — learning bit by bit is fine. 💪')+'</div>'+(ok?'<button class="btn small" type="button" onclick="renderHome()">↻ Refresh home</button>':'<button class="btn small" id="dailyRetry" type="button">↻ Try the 3 questions again</button>');
    var r=$('dailyRetry');if(r)r.onclick=function(){dailyState.q=0;dailyState.score=0;renderDailyQ()};
    touchDay();return;
  }
  var w=dailyState.words[dailyState.q];
  var opts=[w.en];while(opts.length<4){var r2=FLASH[Math.floor(Math.random()*FLASH.length)].en;if(opts.indexOf(r2)<0)opts.push(r2)}
  opts=shuffle(opts);
  var h='<p class="muted" style="margin:4px 0">Question '+(dailyState.q+1)+' of 3 · What does <b>'+esc(w.es)+'</b> mean? '+speakBtn(w.es,true)+'</p>';
  opts.forEach(function(o){h+='<button type="button" class="opt" data-dopt="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="dailyFb"></div>';b.innerHTML=h;
  document.querySelectorAll('[data-dopt]').forEach(function(btn){btn.addEventListener('click',function(){
    var pick=btn.getAttribute('data-dopt');var good=pick===w.en;
    document.querySelectorAll('[data-dopt]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-dopt')===w.en)x.classList.add('correct')});
    if(!good){btn.classList.add('wrong');saveMistake('Daily: "'+w.es+'" means?','"'+w.es+'" = '+w.en+' ('+w.ur+')')}else dailyState.score++;
    $('dailyFb').innerHTML='<div class="feedback '+(good?'ok':'no')+'">'+(good?'✅ Correct!':'❌ It means <b>'+esc(w.en)+'</b> ('+esc(w.ur)+')')+'</div><button class="btn small" id="dailyNext" type="button">'+(dailyState.q+1>=3?'Finish →':'Next →')+'</button>';
    $('dailyNext').onclick=function(){dailyState.q++;renderDailyQ()};
  })});
}
/* ============ LESSONS LIST ============ */
function renderLessons(){
  var h='<div class="card"><h2 style="font-size:1.2rem">📖 Your Lesson Path</h2><p class="muted">Lessons open in order. Pass a quiz with 4 of 5 or more to unlock the next one.</p><button class="btn orange" onclick="renderLevelMap()" type="button" style="width:100%">🧭 Open the Level Map — '+LESSONS.length+' stepping stones</button><button class="btn ghost" onclick="renderGrammar()" type="button" style="width:100%;margin-top:8px">📚 Grammar Reference Library — all 50 rules</button></div>';
  for(var i=0;i<LESSONS.length;i++){var L=LESSONS[i];
    if(i===0)h+='<h3 style="margin:16px 0 2px">Level A1 — Lessons 1–20</h3>';
    if(i===20)h+='<h3 style="margin:16px 0 2px">Level A2 — Lessons 21–30</h3>';
    if(i===30)h+='<h3 style="margin:16px 0 2px">Level B1 — Lessons 31–40</h3>';
    if(i===40)h+='<h3 style="margin:16px 0 2px">Level B2 — Lessons 41–50</h3>';
    var unlocked=(i===0)||!!ST.done[LESSONS[i-1].n];var done=!!ST.done[L.n];
    h+='<button type="button" class="lessonitem'+(done?' done':'')+(unlocked?'':' locked')+'" data-lesson="'+i+'" '+(unlocked?'':'disabled')+'>';
    var pct=done?100:(unlocked?12:0);var ringCol=done?'#16a34a':(unlocked?'#f97316':'#cbd5e1');
    h+='<span class="lring" style="background:conic-gradient('+ringCol+' '+pct+'%,#e8eef7 '+pct+'%)"><i>'+(done?'✓':(unlocked?L.n:'🔒'))+'</i></span><span class="lt"><b>Lesson '+L.n+': '+esc(L.t)+'</b><span class="muted">'+esc(L.sub)+'</span></span>';
    h+='<span class="badge'+(done?' done':'')+'">'+(done?'Done ✓':(unlocked?'Open':'Locked'))+'</span></button>';
  }
  $('tab-lessons').innerHTML=h;
  document.querySelectorAll('[data-lesson]').forEach(function(b){b.addEventListener('click',function(){openLesson(parseInt(b.getAttribute('data-lesson'),10))})});
}
/* ============ LESSON DETAIL ============ */
var curLesson=0, lqState=null;
function soundBox(){
 return '<div class="pronbox"><b>🗣️ How Spanish sounds work (read once, use forever):</b><br>'
 +'• Vowels are pure and short: <b>a</b> = "a" in "azan", <b>e</b> = "e" in "ek", <b>i</b> = "ee", <b>o</b> = "o" in "or", <b>u</b> = "oo". Every letter is spoken — no silent letters except h.<br>'
 +'• <b>h</b> is always silent: hola = "ola".<br>• <b>ñ</b> = "ny": mañana = "man-yana" (like "canyon").<br>'
 +'• <b>ll</b> and <b>y</b> sound like "y": llamo = "yamo", pollo = "poyo".<br>'
 +'• <b>j</b> = strong "kh" from the throat (like خ): ojo, trabajar.<br>'
 +'• <b>rr</b> is rolled with the tongue: perro, arroz. Single <b>r</b> is a light tap.<br>'
 +'• <b>c</b> before e/i sounds like "s" (in Latin America): cena = "sena". <b>g</b> before e/i = strong "kh": gente = "khente".<br>'
 +'• Stress: words ending in a vowel, n or s are stressed on the second-last sound — Spanish is very regular, you can read almost anything aloud!</div>';
}
function openLesson(i){
  curLesson=i;ST.lastLesson=i;save();touchDay();
  var L=LESSONS[i];
  var h='<button class="btn ghost small" id="backLessons" type="button">← All lessons</button>';
  h+='<div class="card"><div class="kicker">Lesson '+L.n+' of '+LESSONS.length+(L.n>40?' · Level B2':(L.n>30?' · Level B1':(L.n>20?' · Level A2':' · Level A1')))+'</div><h2 style="font-size:1.35rem;margin:4px 0">'+esc(L.t)+'</h2><p class="muted" style="margin:2px 0 10px">'+esc(L.sub)+'</p>';
  if(i===0)h+=soundBox();
  h+='<p>'+esc(L.ex)+'</p></div>';
  h+='<div class="card"><h3>📚 New words &amp; phrases</h3>';
  for(var w=0;w<L.words.length;w++){var wd=L.words[w];
    var fk=L.n+':'+wd[0];var fon=!!ST.favLessons[fk];
    h+='<div class="wordrow"><div class="txt"><div class="es">'+esc(wd[0])+'</div><div class="en">'+esc(wd[1])+'</div><div class="ur">'+esc(wd[2])+'</div>'+(wd[4]?uuLine(wd[4]):'')+'<div class="muted">Say: '+esc(wd[3])+'</div></div><button type="button" class="spk sm" data-favword="'+esc(fk).replace(/"/g,'&quot;')+'" aria-label="Favourite word" style="background:'+(fon?'var(--orange)':'#94a3b8')+'">'+(fon?'★':'☆')+'</button>'+speakBtn(wd[0])+'</div>';
  }
  h+='</div>';
  h+='<div class="card"><h3>💬 Example sentences</h3>';
  for(var s=0;s<L.sents.length;s++){var sn=L.sents[s];
    h+='<div class="wordrow"><div class="txt"><div class="es">'+esc(sn[0])+'</div><div class="en">'+esc(sn[1])+'</div><div class="ur">'+esc(sn[2])+'</div></div>'+speakBtn(sn[0])+'</div>';
  }
  h+='</div>';
  h+='<div class="card"><h3>🎭 Dialogue — listen, then read aloud</h3>';
  for(var d2=0;d2<L.dlg.length;d2++){var dl=L.dlg[d2];
    h+='<div class="dlg"><div style="display:flex;gap:8px;align-items:flex-start"><div style="flex:1"><div class="who">Person '+esc(dl[0])+'</div><div class="es" style="font-size:1.05rem">'+esc(dl[1])+'</div><div class="en">'+esc(dl[2])+'</div></div>'+speakBtn(dl[1],true)+'</div></div>';
  }
  h+='<div class="grid2" style="margin-top:6px"><button class="btn orange" id="playDlg" type="button">'+PLAY_SVG+' Play whole dialogue</button><button class="btn" id="playAll" type="button">'+SPK_SVG_SM+' Play whole lesson (hands-free)</button></div>';
  h+='<button class="btn ghost" id="slowDlg" type="button" style="width:100%;margin-top:8px">🐢 Slow dialogue mode — line by line, tap any line to hear it again</button><div id="slowDlgBody"></div></div>';
  h+='<div class="card" id="lessonQuizCard"><h3>🧠 Lesson '+L.n+' Quiz — pass with 4/5</h3><div id="lessonQuizBody"></div></div>';
  $('tab-lesson-detail').innerHTML=h;
  goTab('lesson-detail');
  syncRoute('#/lesson/'+(i+1));
  $('backLessons').onclick=function(){goRoute('#/lessons')};
  $('playDlg').onclick=function(){playDialogue(L)};
  $('playAll').onclick=function(){playAllLesson(L)};
  $('slowDlg').onclick=function(){renderSlowDialogue(L)};
  lqState={q:0,score:0,mistakes:[]};
  renderLessonQ();
}
function playDialogue(L){
  if(!('speechSynthesis' in window)){showNotice('No voice on this browser for the dialogue — please read it aloud yourself.');return}
  speechSynthesis.cancel();
  L.dlg.forEach(function(dl,i){var u=new SpeechSynthesisUtterance(dl[1]);u.lang='es-ES';u.rate=slowMode?0.62:0.92;u.pitch=i%2?1.08:0.94;var vs=speechSynthesis.getVoices();for(var j=0;j<vs.length;j++){if(vs[j].lang&&vs[j].lang.toLowerCase().indexOf('es')===0){u.voice=vs[j];break}}speechSynthesis.speak(u)});
}
function speakQueue(texts,done){
  if(!('speechSynthesis' in window)){showNotice('No voice on this browser — please read the lesson aloud yourself.');if(done)done();return}
  speechSynthesis.cancel();
  var vs=speechSynthesis.getVoices();var esv=null;
  for(var j=0;j<vs.length;j++){if(vs[j].lang&&vs[j].lang.toLowerCase().indexOf('es')===0){esv=vs[j];break}}
  var i=0;
  function next(){
    if(i>=texts.length){if(done)done();return}
    var u=new SpeechSynthesisUtterance(texts[i]);u.lang='es-ES';u.rate=slowMode?0.62:0.92;if(esv)u.voice=esv;
    u.onend=function(){i++;next()};u.onerror=function(){i++;next()};
    speechSynthesis.speak(u);
  }
  touchDay();next();
}
function playAllLesson(L){
  var texts=[];
  L.words.forEach(function(w){texts.push(w[0])});
  L.sents.forEach(function(s){texts.push(s[0])});
  L.dlg.forEach(function(d){texts.push(d[1])});
  showNotice('Playing the whole lesson: '+texts.length+' items. Just listen — stop any time by pressing a speaker button.');
  speakQueue(texts);
}
var slowTimer=null, slowState=null;
function stopSlowDialogue(){if(slowTimer){clearTimeout(slowTimer);slowTimer=null}slowState=null;if('speechSynthesis' in window)speechSynthesis.cancel();document.querySelectorAll('.dlgline').forEach(function(x){x.classList.remove('playing')})}
function renderSlowDialogue(L){
  var b=$('slowDlgBody');if(!b)return;
  stopSlowDialogue();
  var h='<p class="muted" style="margin:10px 0 4px">🐢 Slow mode: lines play one by one with a pause. <b>Tap any line</b> to hear it again.</p>';
  L.dlg.forEach(function(dl,i){h+='<div class="dlg dlgline" id="slowLine'+i+'" data-slowline="'+i+'" style="cursor:pointer"><div class="who">Person '+esc(dl[0])+' · tap to hear</div><div class="es" style="font-size:1.08rem">'+esc(dl[1])+'</div><div class="en">'+esc(dl[2])+'</div></div>'});
  h+='<button class="btn small orange" id="slowPlay" type="button">'+PLAY_SVG+' Play slowly, line by line</button> <button class="btn small ghost" id="slowStop" type="button">⏹ Stop</button>';
  b.innerHTML=h;
  L.dlg.forEach(function(dl,i){$('slowLine'+i).onclick=function(){speak(dl[1])}});
  $('slowPlay').onclick=function(){playSlowLines(L,0)};
  $('slowStop').onclick=function(){stopSlowDialogue()};
}
function playSlowLines(L,startI){
  stopSlowDialogue();
  var state={L:L,i:startI||0};slowState=state;
  function step(){
    if(slowState!==state)return;
    if(state.i>=state.L.dlg.length){slowState=null;document.querySelectorAll('.dlgline').forEach(function(x){x.classList.remove('playing')});return}
    var idx=state.i;
    document.querySelectorAll('.dlgline').forEach(function(x){x.classList.remove('playing')});
    var el=$('slowLine'+idx);if(!el){slowState=null;return}
    el.classList.add('playing');el.scrollIntoView({behavior:'smooth',block:'center'});
    if(!('speechSynthesis' in window)){slowState=null;showNotice('No voice on this browser — please read the dialogue aloud yourself.');return}
    try{speechSynthesis.cancel()}catch(e){}
    var voice=pickEsVoice();
    var text=state.L.dlg[idx][1];
    var chunks=splitSpeechChunks(text);var advanced=false;
    function advance(){if(advanced||slowState!==state)return;advanced=true;state.i++;slowTimer=setTimeout(step,650)}
    chunks.forEach(function(chunk,ci){
      var u=new SpeechSynthesisUtterance(chunk);u.lang='es-ES';u.rate=0.62;if(voice)u.voice=voice;
      if(ci===chunks.length-1){u.onend=advance;u.onerror=advance}
      speechSynthesis.speak(u);
    });
    /* Safety net only: if the voice never reports "ended" (some Android builds), move on after a generous allowance instead of stalling forever */
    slowTimer=setTimeout(advance,Math.max(5000,text.length*240));
  }
  step();
}
function renderLessonQ(){
  var L=LESSONS[curLesson];var body=$('lessonQuizBody');if(!body)return;
  if(lqState.q>=L.quiz.length){
    var pct=Math.round(lqState.score/L.quiz.length*100);var pass=lqState.score>=4;
    pushScore('Lesson '+L.n+' quiz',lqState.score,L.quiz.length);
    if(pass){ST.done[L.n]=true;var _hr=new Date().getHours();if(_hr<8)ST.earlyBird=true;if(_hr>=23)ST.nightOwl=true}
    save();updateTop();
    var h='<p style="font-size:1.1rem"><b>You scored '+lqState.score+' / '+L.quiz.length+' ('+pct+'%)</b></p>';
    h+=pass?'<div class="feedback ok">🎉 <b>Passed!</b> '+(L.n<LESSONS.length?'Lesson '+(L.n+1)+' is now unlocked. Well done!':'You finished the whole path — ¡Enhorabuena! 🏆 Take the Final Exam for this level from Home.')+'</div>':'<div class="feedback no">Almost! You need 4/5 to unlock the next lesson. Read the words once more and try again — you can do it. 💪</div>';
    if(lqState.mistakes.length){h+='<h4>Review your mistakes:</h4>';lqState.mistakes.forEach(function(m){h+='<p class="muted" style="margin:6px 0">• '+esc(m)+'</p>'})}
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn" id="lqRetry" type="button">↻ Try quiz again</button>';
    if(pass&&curLesson<LESSONS.length-1)h+='<button class="btn orange" id="lqNext" type="button">Next lesson →</button>';
    h+='<button class="btn ghost" id="lqList" type="button">All lessons</button></div>';
    body.innerHTML=h;
    $('lqRetry').onclick=function(){lqState={q:0,score:0,mistakes:[]};renderLessonQ()};
    var nx=$('lqNext');if(nx)nx.onclick=function(){openLesson(curLesson+1)};
    $('lqList').onclick=function(){goRoute('#/lessons')};
    return;
  }
  var qz=L.quiz[lqState.q];
  var h='<p class="muted">Question '+(lqState.q+1)+' of '+L.quiz.length+' · Score so far: '+lqState.score+'</p>';
  h+='<p style="font-weight:700;font-size:1.02rem">'+esc(qz[0])+'</p><div id="lqOpts">';
  qz[1].forEach(function(o,oi){h+='<button type="button" class="opt" data-lopt="'+oi+'">'+esc(o)+'</button>'});
  h+='</div><div id="lqFb"></div>';
  body.innerHTML=h;
  document.querySelectorAll('[data-lopt]').forEach(function(b){b.addEventListener('click',function(){
    var pick=parseInt(b.getAttribute('data-lopt'),10);var ok=pick===qz[2];
    document.querySelectorAll('[data-lopt]').forEach(function(x){x.disabled=true;if(parseInt(x.getAttribute('data-lopt'),10)===qz[2])x.classList.add('correct')});
    if(!ok)b.classList.add('wrong');else lqState.score++;
    if(!ok){lqState.mistakes.push(qz[0]+' → Correct: '+qz[1][qz[2]]);saveMistake(qz[0],'Correct: '+qz[1][qz[2]]+'. '+qz[3])}
    $('lqFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct! ':'❌ Not quite. Correct answer: <b>'+esc(qz[1][qz[2]])+'</b>. ')+esc(qz[3])+'</div><button class="btn" id="lqNextQ" type="button" style="width:100%">'+(lqState.q+1>=L.quiz.length?'See my result →':'Next question →')+'</button>';
    $('lqNextQ').onclick=function(){lqState.q++;renderLessonQ();document.getElementById('lessonQuizCard').scrollIntoView({behavior:'smooth'})};
  })});
}

export { nextLessonIdx, renderHome, dailyState, renderDaily, renderDailyQ, renderLessons, curLesson, soundBox, openLesson, playDialogue, speakQueue, playAllLesson, slowTimer, stopSlowDialogue, renderSlowDialogue, playSlowLines, renderLessonQ };
