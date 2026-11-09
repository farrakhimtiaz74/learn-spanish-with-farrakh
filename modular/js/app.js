import { LESSONS } from './data/lessons.js';
import { BRIDGE, BUILD_SENTS, CINEMA, CLINIC, IRREG, MIC_SENTS, MOTIV, REPEAT, SCEN, SE_ITEMS, SURVIVAL, SYLLABLES, TEMPLATES_PRO, TRAPS, WRITING } from './data/practice.js';
import { LISTEN_LIB, ROLEPLAYS, STORIES } from './data/stories.js';
import { PAST, VERBS } from './data/verbs.js';
import { CATS, FLASH, POD } from './data/vocabulary.js';
import { applyAnim, applyFontSize, downloadCertImage, fireConfetti, sndBad, sndOk, tone } from './services.js';
import { $, LIVE_URL, LSFCloud, LSFStore, ST, addDaysStr, dateVal, esc, mistakeAnswer, normAns, regularPastForms, save, srsDueList, srsKnow, srsLearn, stopAllActivity, todayMinutes, todayStr, touchDay, updateTop, wordMatchPct } from './store.js';
import { pickEsVoice, setSlowMode, speak, splitSpeechChunks } from './tts.js';
import { buildQueue, curVerb, fcCat, renderCards, renderQuizHome, renderVerbs, startBuilder, startExam, startListenType, startQuiz, startReview, startSerEstar, startTimed } from './ui/cards.js';
import { conditionalForms, imperfectForms, renderGrammar, verbFormsFor } from './ui/grammar.js';
import { nextLessonIdx, openLesson, renderHome, renderLessons } from './ui/learn.js';
import { openPassage, openStory, renderAccount, renderBridge, renderLevelMap, renderLibrary, renderPhrasebook, renderProgress, renderReading, renderRoleplays, renderSearchResults, renderSpeak, renderSyllables, renderTraps, startExam2, startExam3, startHangman, startMarathon, startMic, startMock, startNumDrill, startRoleplay, startWordMatch, wireSettingsModal } from './ui/speak.js';
import { challengeInfo, cinemaLocked, openCinema, openClinic, renderBuilderPro, renderCinema, renderClinic, renderSimList, renderWriting, startExam4, startSim } from './ui/tools.js';

/* Bridge: the app's generated HTML strings call some functions from inline
   handlers (onclick=...). Modules create no globals, so the function exports
   are re-published on window here — same names the monolith had. */
import * as _mStore from './store.js';
import * as _mTts from './tts.js';
import * as _mServices from './services.js';
import * as _mLearn from './ui/learn.js';
import * as _mCards from './ui/cards.js';
import * as _mSpeak from './ui/speak.js';
import * as _mTools from './ui/tools.js';
import * as _mGrammar from './ui/grammar.js';
[_mStore,_mTts,_mServices,_mLearn,_mCards,_mSpeak,_mTools,_mGrammar].forEach(function(m){Object.keys(m).forEach(function(k){if(typeof m[k]==='function')window[k]=m[k]});});


/* SHELL (Layer 6) + DEVICE SERVICE (Layer 4): Android Chrome install prompt — capture it early, in this first script, so the Install button can trigger the real prompt later (consumed via LSFServices.installPrompt) */
var deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredInstallPrompt=e});
window.addEventListener('appinstalled',function(){deferredInstallPrompt=null});
/* ── LAYER 5 · UI — global click delegation (speaker + favourite buttons), tab navigation, meaning/speed settings, confirm modal. The popstate wiring is Layer 6 shell behaviour: it keeps the Android Back button inside the app's own history. ── */
document.addEventListener('click',function(e){var b=e.target.closest('[data-say]');if(b){speak(b.getAttribute('data-say'))}});
document.addEventListener('click',function(e){var b=e.target.closest('[data-fav]');if(!b)return;var idx=+b.getAttribute('data-fav');if(ST.favs[idx])delete ST.favs[idx];else ST.favs[idx]=true;save();b.textContent=ST.favs[idx]?'★':'☆';b.style.background=ST.favs[idx]?'var(--orange)':'#94a3b8'});
document.addEventListener('click',function(e){var b=e.target.closest('[data-favword]');if(!b)return;var k=b.getAttribute('data-favword');if(ST.favLessons[k])delete ST.favLessons[k];else ST.favLessons[k]=true;save();b.textContent=ST.favLessons[k]?'★':'☆';b.style.background=ST.favLessons[k]?'var(--orange)':'#94a3b8'});
function showNotice(msg){$('noticeBox').innerHTML='<div class="toast" role="status"><span style="flex:1">'+esc(msg)+'</span><button type="button" id="noticeX" aria-label="Close">✕</button></div>';$('noticeX').onclick=function(){$('noticeBox').innerHTML=''}}
/* tabs */
var currentTab='home';
var _fromPop=false;
try{history.replaceState({tab:'home'},'')}catch(e){}
function goTab(name){
  var prev=currentTab;
  if(prev!==name)stopAllActivity();
  currentTab=name;
  var _bs=$('bootSkel');if(_bs)_bs.remove();
  var tabs=document.querySelectorAll('#tabs .tab');
  for(var i=0;i<tabs.length;i++){tabs[i].classList.toggle('active',tabs[i].getAttribute('data-tab')===name)}
  var secs=['home','lessons','lesson-detail','cards','verbs','quiz','speak','progress','page'];
  /* Focus classes belong to single routes (study / verb pages): every tab
     switch starts unfocused — the route or in-app starter that wants the
     focus adds its class AFTER goTab returns. (Previously the classes were
     only cleared when switching to a different tab, so returning to the
     Flashcards deck home via the router left its controls card hidden.) */
  $('tab-cards').classList.remove('studyfocus');
  $('tab-verbs').classList.remove('verbfocus');
  for(var j=0;j<secs.length;j++){$('tab-'+secs[j]).hidden=(secs[j]!==name)}
  window.scrollTo({top:0,behavior:'smooth'});
  var _sec=$('tab-'+name);if(_sec&&ST.anim!==false){_sec.classList.remove('tabenter');void _sec.offsetWidth;_sec.classList.add('tabenter')}
  updateTop();
  if(name==='progress')renderProgress();
  if(name==='home')renderHome();
  if(name==='cards')renderCards();
  if(name==='verbs')renderVerbs();
  if(name==='quiz')renderQuizHome();
  if(name==='speak')renderSpeak();
  if(name==='lessons')renderLessons();
  /* History is owned by the Layer 6 hash router (bottom script): goTab only
     switches the visible section; routes/pages are hash-driven there. */
}
document.querySelectorAll('#tabs .tab').forEach(function(b){b.addEventListener('click',function(){goTab(b.getAttribute('data-tab'))})});
function applyUr(){var m=ST.meanMode||'roman';document.body.classList.toggle('hideUr',m!=='roman');document.body.classList.toggle('hideUU',m!=='urdu');ST.ur=(m!=='en');['mmEn','mmRoman','mmUrdu'].forEach(function(id,i){var b=$(id);if(b)b.classList.toggle('on',['en','roman','urdu'][i]===m)});['setEn','setRoman','setUrdu'].forEach(function(id,i){var b=$(id);if(b)b.classList.toggle('on',['en','roman','urdu'][i]===m)})}
function setMeanMode(m){ST.meanMode=m;save();applyUr();if(currentTab==='cards')renderCards();if(currentTab==='home')renderHome()}
/* Meanings / dark / speed controls live in ONE place now — the App settings
   card on the Progress page — wired by wireAppSettings() when it renders. */
function setSpeed(slow){setSlowMode(slow);ST.slow=slow;save();var a=$('spNormal'),b=$('spSlow');if(a)a.classList.toggle('on',!slow);if(b)b.classList.toggle('on',slow);var c=$('setSpNormal'),e=$('setSpSlow');if(c)c.classList.toggle('on',!slow);if(e)e.classList.toggle('on',slow)}
/* confirm modal */
var confirmCb=null;
function askConfirm(title,text,cb){$('confirmTitle').textContent=title;$('confirmText').textContent=text;confirmCb=cb;$('confirmModal').classList.add('show')}
$('confirmNo').onclick=function(){$('confirmModal').classList.remove('show');confirmCb=null};
$('confirmYes').onclick=function(){$('confirmModal').classList.remove('show');if(confirmCb)confirmCb();confirmCb=null};
$('confirmModal').addEventListener('click',function(e){if(e.target===this){this.classList.remove('show');confirmCb=null}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){$('confirmModal').classList.remove('show');confirmCb=null;$('noticeBox').innerHTML=''}});
function shuffle(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t}return b}


/* ================================================================
   LAYER 6 — SHELL / BOOTSTRAP (part 1: platform wiring)
   Service-worker registration (the GitHub copy provides sw.js +
   manifest.json), the dark-mode boot + its toggle, and the thumb-
   dock wiring. The final bootstrap — the layer registry and the
   first renders — is the last script of the page.
   ================================================================ */
/* ============ PWA: guarded service worker (GitHub copy provides sw.js + manifest.json) ============ */
if('serviceWorker' in navigator){try{navigator.serviceWorker.register('sw.js').catch(function(){})}catch(e){}}
/* ============ THEME BOOT + THUMB-DOCK WIRING ============ */
function applyDark(){var on=!!ST.dark;document.body.classList.toggle('dark',on);document.documentElement.setAttribute('data-theme',on?'dark':'light');var t=$('darkToggle');if(t)t.checked=on;var t2=$('setDark');if(t2)t2.checked=on;var m=$('themeColorMeta');if(m)m.setAttribute('content',on?'#0f172a':'#4f46e5')}
/* darkToggle itself is wired in wireAppSettings() (Progress → App settings). */
wireSettingsModal();
/* Thumb dock — wired to the Layer 6 hash router (defined in the final script) */
$('dockHome').onclick=function(){goRoute('#/home')};
$('dockLessons').onclick=function(){goRoute('#/lessons')};
$('dockCards').onclick=function(){goRoute('#/flashcards')};
$('dockPractice').onclick=function(){goRoute('#/practice')};
$('dockProgress').onclick=function(){goRoute('#/progress')};
/* INIT renders moved to the final script (Round 4 features must be defined first) */


/* ================================================================
   LAYER 6 — SHELL / BOOTSTRAP (part 2: registry + start-up)
   The registry below is the wiring diagram of the six layers: small
   namespace facades over the globals each layer already exposes, so
   future work can depend on LSF.Content / LSF.Store / LSF.Logic /
   LSF.Services / LSF.UI / LSF.Shell instead of hunting globals.
   Start-up order is unchanged: settings first, then the first renders.
   ================================================================ */
var LSFContent={POD:POD,VERBS:VERBS,PAST:PAST,CATS:CATS,FLASH:FLASH,LESSONS:LESSONS,REPEAT:REPEAT,MIC_SENTS:MIC_SENTS,IRREG:IRREG,LISTEN_LIB:LISTEN_LIB,ROLEPLAYS:ROLEPLAYS,BRIDGE:BRIDGE,SURVIVAL:SURVIVAL,TRAPS:TRAPS,STORIES:STORIES,SYLLABLES:SYLLABLES,MOTIV:MOTIV,SCEN:SCEN,CLINIC:CLINIC,WRITING:WRITING,CINEMA:CINEMA,TEMPLATES_PRO:TEMPLATES_PRO,BUILD_SENTS:BUILD_SENTS,SE_ITEMS:SE_ITEMS};
var LSFLogic={normAns:normAns,shuffle:shuffle,todayStr:todayStr,dateVal:dateVal,addDaysStr:addDaysStr,srsKnow:srsKnow,srsLearn:srsLearn,srsDueList:srsDueList,wordMatchPct:wordMatchPct,mistakeAnswer:mistakeAnswer,regularPastForms:regularPastForms,imperfectForms:imperfectForms,conditionalForms:conditionalForms,verbFormsFor:verbFormsFor,challengeInfo:challengeInfo,nextLessonIdx:nextLessonIdx,todayMinutes:todayMinutes,cinemaLocked:cinemaLocked};
var LSFServices={speak:speak,pickEsVoice:pickEsVoice,splitSpeechChunks:splitSpeechChunks,sndOk:sndOk,sndBad:sndBad,tone:tone,fireConfetti:fireConfetti,downloadCertImage:downloadCertImage,startMic:startMic,installPrompt:function(){return deferredInstallPrompt}};
var LSFShell={applyDark:applyDark,applyAnim:applyAnim,applyFontSize:applyFontSize,goTab:goTab,LIVE_URL:LIVE_URL};
window.LSF={Content:LSFContent,Store:LSFStore,Logic:LSFLogic,Services:LSFServices,UI:{renderHome:renderHome,renderLessons:renderLessons,renderCards:renderCards,renderVerbs:renderVerbs,renderQuizHome:renderQuizHome,renderSpeak:renderSpeak,renderProgress:renderProgress},Shell:LSFShell};
/* ================================================================
   LAYER 5 — UI (continued): Exams Hub, Library Hub & Search pages.
   These are thin hub pages rendered into the generic page section;
   every item on them routes to an existing screen — no new content.
   ================================================================ */
function wireRouteLinks(root){
  if(!root)return;
  root.querySelectorAll('[data-route]').forEach(function(b){b.addEventListener('click',function(){goRoute(b.getAttribute('data-route'))})});
}
function hubLink(route,ic,t,s){return '<button type="button" class="toolcard pagelink" data-route="'+route+'"><span class="tic">'+ic+'</span><span class="tt"><b>'+t+'</b><span>'+s+'</span></span><span class="arr">›</span></button>'}
function renderExamsHub(){
  goTab('page');
  var h='<div class="card"><div class="kicker">🎓 Exams Hub</div><h2 style="font-size:1.25rem;margin:4px 0">Final exams &amp; certificates</h2><p class="muted">One final exam per level, unlocked by passing that level\u2019s last lesson. Pass mark is 14 of 20 (60% on the DELE-style mock). Passing earns the level certificate — grand certificates live on the Badges &amp; Certificates page.</p></div><div class="toolgrid">';
  h+=hubLink('#/exam/a1','🎓','Final Exam — Level A1',ST.examPassed?'\u2713 Passed — certificate earned':(ST.done[20]?'Open — 20 questions · pass 14':'\uD83D\uDD12 Unlocks after Lesson 20'));
  h+=hubLink('#/exam/a2','🎓','Final Exam — Level A2',ST.exam2Passed?'\u2713 Passed — certificate earned':(ST.done[30]?'Open — 20 questions · pass 14':'\uD83D\uDD12 Unlocks after Lesson 30'));
  h+=hubLink('#/exam/b1','🎓','Final Exam — Level B1',ST.exam3Passed?'\u2713 Passed — certificate earned':(ST.done[40]?'Open — 20 questions · pass 14':'\uD83D\uDD12 Unlocks after Lesson 40'));
  h+=hubLink('#/exam/b2','🎓','Final Exam — Level B2',ST.exam4Passed?'\u2713 Passed — certificate earned':(ST.done[50]?'Open — 20 questions · pass 14':'\uD83D\uDD12 Unlocks after Lesson 50'));
  h+=hubLink('#/exam/dele','📝','DELE-Style Mock Exam','25 mixed questions · timed · best so far: '+(ST.mockBest||0)+'/25');
  h+=hubLink('#/exam/verbs','🎓','Verb Grand Exam',ST.verbExamPassed?'\u2713 Passed — best '+(ST.verbExamBest||0)+'/20':'20 questions across all tenses · pass 14+');
  h+='</div>';
  h+='<div class="card"><h3>🏅 Badges &amp; Certificates</h3><p class="muted">Level certificates appear at the end of each passed exam. Grand certificates (A1 → B1 and A1 → B2) and all your badges live on one page:</p><button class="btn" type="button" data-route="#/badges" style="width:100%">🏅 Open Badges &amp; Certificates</button></div>';
  $('tab-page').innerHTML=h;
  wireRouteLinks($('tab-page'));
}
function renderLibraryHub(){
  goTab('page');
  var h='<div class="card"><div class="kicker">📚 Library Hub</div><h2 style="font-size:1.25rem;margin:4px 0">Read, listen &amp; look things up</h2><p class="muted">Stories, reference rules and real-life phrases — everything in the library, one tap away.</p></div><div class="toolgrid">';
  h+=hubLink('#/reading','📖','Reading Library','10 graded stories · tap any word to hear it · 3 questions each');
  h+=hubLink('#/grammar','📚','Grammar Reference Library','All 50 lesson rules · searchable · examples + mistake warnings');
  h+=hubLink('#/phrasebook','🆘','Survival Phrasebook',SURVIVAL.length+' tap-to-speak phrases for travel, health, food &amp; emergencies');
  h+=hubLink('#/bridge','🇵🇰','Pakistan–Spain Bridge','Phrases about YOUR life, family &amp; village');
  h+=hubLink('#/listening','🎧','Listening Library',LISTEN_LIB.length+' short passages · slow + normal · 3 questions each');
  h+=hubLink('#/cinema','🎬','Listening Cinema','10 long stories A2–B2 · transcript after the questions');
  h+=hubLink('#/tool/search','🔎','Search Everything','Words, lessons and phrases in one search');
  h+='</div>';
  $('tab-page').innerHTML=h;
  wireRouteLinks($('tab-page'));
}
function renderSearchPage(){
  goTab('page');
  $('tab-page').innerHTML='<div class="card"><div class="kicker">🔎 Search everything</div><h2 style="font-size:1.25rem;margin:4px 0">One search for the whole app</h2><p class="muted">Words, lessons and phrases — type at least 2 letters.</p><input type="text" id="pgSearch" placeholder="Type a word, lesson or phrase… e.g. taxi, salud, embassy"><div id="gResults"></div></div>';
  var inp=$('pgSearch');
  if(inp){inp.addEventListener('input',function(){renderSearchResults(this.value)});setTimeout(function(){try{inp.focus()}catch(e){}},80)}
}
/* Progress page, focused: Badges and Settings are their own pages that show
   the matching real cards of the Progress dashboard (same wiring, same data). */
function focusProgress(mode){
  var wrap=$('tab-progress');if(!wrap)return;
  var keepS=['Reading & Sound Settings','Daily minutes goal','Weekly goal','Backup my progress','Cloud account & backup','Lessons completed','Share My Level'];
  var keepB=['My Badges','Share My Level'];
  for(var i=0;i<wrap.children.length;i++){
    var el=wrap.children[i];var txt=el.textContent||'';var keep=true;
    if(mode==='settings')keep=keepS.some(function(k){return txt.indexOf(k)>=0});
    else if(mode==='badges')keep=el.classList.contains('cert')||keepB.some(function(k){return txt.indexOf(k)>=0});
    el.style.display=keep?'':'none';
  }
}
/* ================================================================
   LAYER 6 — SHELL (part 3): HASH ROUTER — every area is its own page.
   Pages are views over the same Layer 1–5 code: the router switches
   the visible section (via goTab) and calls the screen's existing
   renderer/starter. It owns browser history: each route is one hash
   entry, so the Android Back button and the header Back arrow both
   walk back through pages, falling back to the parent hub, then Home.
   Unknown or invalid routes land on Home — never a dead end.
   ================================================================ */
var _curRoute='', _inRoute=false, _booting=true;
var TOOL_TITLES={quiz:'❓ Quiz Zone',timed:'⏱️ Timed Quiz','listen-type':'🎧✍️ Listen & Type','sentence-builder':'🧩 Sentence Builder','ser-estar':'🔀 Ser vs Estar Trainer','word-match':'🎯 Word Match Game',hangman:'🔤 Ahorcado (Hangman)',traps:'⚠️ Urdu-Speaker Trap Trainer',syllables:'🔤 Syllable Trainer',dictation:'📝 Dictation Marathon',marathon:'📝 Dictation Marathon',numbers:'🔢 Numbers & Money Drill','review-mistakes':'📝 Review Mistakes',search:'🔎 Search Everything','builder-pro':'🧩 Sentence Builder Pro'};
var EXAM_TITLES={a1:'🎓 Final Exam — Level A1',a2:'🎓 Final Exam — Level A2',b1:'🎓 Final Exam — Level B1',b2:'🎓 Final Exam — Level B2',dele:'📝 DELE-Style Mock Exam',verbs:'🎓 Verb Grand Exam'};
function routeParts(){
  var h=(location.hash||'').replace(/^#\/?/,'');
  if(!h)return['home'];
  return h.split('/').filter(function(x){return x!==''}).map(function(x){try{return decodeURIComponent(x)}catch(e){return x}});
}
function routeStr(parts){return '#/'+parts.join('/')}
function studyName(cat){
  if(cat==='due')return '🔁 Due Today';
  if(cat==='hard')return '🆘 Hard Words';
  if(cat==='fav')return '⭐ Favourites';
  if(cat==='all')return 'All Words';
  return CATS[cat]||cat;
}
function verbIndexForRoute(b){
  if(b===undefined)return -1;
  var n=parseInt(b,10);
  if(String(n)===String(b)&&n>=1&&n<=VERBS.length)return n-1;
  var low=String(b).toLowerCase();
  for(var i=0;i<VERBS.length;i++){if(VERBS[i].inf.toLowerCase()===low)return i}
  return -1;
}
function titleFor(parts){
  var a=parts[0],b=parts[1];
  if(a==='home')return '';
  if(a==='lessons')return '📚 Lesson Path — '+LESSONS.length+' Lessons';
  if(a==='levelmap')return '🧭 Level Map — '+LESSONS.length+' Stepping Stones';
  if(a==='lesson'){var n=parseInt(b,10);var L=LESSONS[n-1];if(L&&n>1&&!ST.done[LESSONS[n-2].n])return '📚 Lesson Path — '+LESSONS.length+' Lessons';return L?('Lesson '+L.n+' · '+L.t):'Lesson'}
  if(a==='flashcards')return '🗂️ Flashcards — Deck Home';
  if(a==='study')return '🗂️ Study — '+studyName(b);
  if(a==='verbs')return '✍️ Verb Trainer — 20 Verbs';
  if(a==='verb'){var vi=verbIndexForRoute(b);return vi>=0?('✍️ '+VERBS[vi].inf+' — '+VERBS[vi].en):'✍️ Verb Trainer'}
  if(a==='practice')return '🧠 Practice Hub';
  if(a==='tool')return TOOL_TITLES[b]||'🧠 Practice';
  if(a==='speak')return '🎤 Speak & Listen Hub';
  if(a==='simulator')return b!==undefined?('🎬 Simulator · Scenario '+(parseInt(b,10)+1)+' of '+SCEN.length):'🎬 Conversation Simulator';
  if(a==='clinic')return b!==undefined?'🗣️ Pronunciation Clinic — Sound Trainer':'🗣️ Pronunciation Clinic';
  if(a==='roleplay')return '🎭 Dialogue Role-Play';
  if(a==='cinema'){if(b!==undefined){var c=CINEMA[parseInt(b,10)];return c?('🎬 '+c.t):'🎬 Listening Cinema'}return '🎬 Listening Cinema'}
  if(a==='listening')return b!==undefined?'🎧 Listening Library — Passage':'🎧 Listening Library';
  if(a==='writing')return '✍️ Writing Workshop';
  if(a==='exams')return '🎓 Exams Hub';
  if(a==='exam')return EXAM_TITLES[b]||'🎓 Exam';
  if(a==='library')return '📚 Library Hub';
  if(a==='reading'){if(b!==undefined){var st=STORIES[parseInt(b,10)];return st?('📖 '+st.t):'📖 Reading'}return '📖 Reading Library'}
  if(a==='grammar')return '📚 Grammar Reference Library';
  if(a==='phrasebook')return '🆘 Survival Phrasebook';
  if(a==='bridge')return '🇵🇰 Pakistan–Spain Bridge';
  if(a==='progress')return '📊 My Progress';
  if(a==='badges')return '🏅 Badges & Certificates';
  if(a==='settings')return '⚙️ Settings & Backup';
  if(a==='account')return '☁️ Cloud Account';
  return '';
}
function parentFor(parts){
  var a=parts[0];
  if(parts.length>1){
    if(a==='lesson')return '#/lessons';
    if(a==='study')return '#/flashcards';
    if(a==='verb')return '#/verbs';
    if(a==='tool')return '#/practice';
    if(a==='exam')return '#/exams';
    if(a==='simulator')return '#/simulator';
    if(a==='cinema')return '#/cinema';
    if(a==='reading')return '#/reading';
    if(a==='listening')return '#/speak';
    if(a==='clinic')return '#/clinic';
    if(a==='roleplay')return '#/speak';
  }
  if(a==='simulator'||a==='clinic'||a==='roleplay'||a==='listening'||a==='cinema')return '#/speak';
  if(a==='reading'||a==='grammar'||a==='phrasebook'||a==='bridge')return '#/library';
  if(a==='writing')return '#/practice';
  return '#/home';
}
function isDeep(parts){
  var a=parts[0];
  if(a==='lesson'||a==='study'||a==='exam')return true;
  if(parts.length>1&&(a==='simulator'||a==='cinema'||a==='reading'||a==='listening'||a==='roleplay'||a==='clinic'))return true;
  return false;
}
function updateChrome(parts){
  var isHome=parts[0]==='home';
  $('headHome').hidden=!isHome;
  $('headPage').hidden=isHome;
  if(!isHome)$('pageTitle').textContent=titleFor(parts);
  document.body.classList.toggle('deep',isDeep(parts));
  var dockMap={home:'dockHome',lessons:'dockLessons',levelmap:'dockLessons',lesson:'dockLessons',flashcards:'dockCards',study:'dockCards',practice:'dockPractice',tool:'dockPractice',exam:'dockPractice',exams:'dockPractice',writing:'dockPractice',progress:'dockProgress',badges:'dockProgress',settings:'dockProgress',account:'dockProgress'};
  ['dockHome','dockLessons','dockCards','dockPractice','dockProgress'].forEach(function(id){var b=$(id);if(b)b.classList.toggle('dockon',dockMap[parts[0]]===id)});
}
function runTool(name){
  if(name==='quiz'){goTab('quiz');startQuiz('es-en');return true}
  if(name==='timed'){goTab('quiz');startTimed();return true}
  if(name==='listen-type'){goTab('quiz');startListenType();return true}
  if(name==='sentence-builder'){goTab('quiz');startBuilder();return true}
  if(name==='ser-estar'){goTab('quiz');startSerEstar();return true}
  if(name==='word-match'){goTab('quiz');startWordMatch();return true}
  if(name==='hangman'){goTab('quiz');startHangman();return true}
  if(name==='traps'){goTab('quiz');renderTraps();return true}
  if(name==='syllables'){goTab('quiz');renderSyllables();return true}
  if(name==='dictation'||name==='marathon'){goTab('quiz');startMarathon();return true}
  if(name==='numbers'){goTab('quiz');startNumDrill();return true}
  if(name==='review-mistakes'){goTab('quiz');startReview();return true}
  if(name==='search'){renderSearchPage();return true}
  if(name==='builder-pro'){renderBuilderPro();return true}
  return false;
}
function runExam(which){
  if(which==='a1'){goTab('quiz');startExam();return true}
  if(which==='a2'){goTab('quiz');startExam2();return true}
  if(which==='b1'){goTab('quiz');startExam3();return true}
  if(which==='b2'){startExam4();return true}
  if(which==='dele'){goTab('quiz');startMock();return true}
  if(which==='verbs'){goTab('verbs');setTimeout(function(){var s=$('vmBody');if(s)s.scrollIntoView({behavior:'smooth',block:'start'});var vb=$('vgeStart');if(vb)vb.click()},160);return true}
  return false;
}
function runRoute(parts){
  var a=parts[0],b=parts[1];
  if(a==='home'){goTab('home');return true}
  if(a==='lessons'){goTab('lessons');return true}
  if(a==='levelmap'){goTab('lessons');renderLevelMap();return true}
  if(a==='lesson'){
    var n=parseInt(b,10);
    if(!(n>=1&&n<=LESSONS.length))return false;
    var idx=n-1;
    if(idx>0&&!ST.done[LESSONS[idx-1].n]){goTab('lessons');showNotice('🔒 Lesson '+n+' is locked — pass Lesson '+(n-1)+'’s quiz first and it will open.');return true}
    openLesson(idx);return true;
  }
  if(a==='flashcards'){fcCat='all';fcDir='fwd';buildQueue();goTab('cards');return true}
  if(a==='study'){
    var cat=b||'all';
    if(!(cat==='all'||cat==='due'||cat==='hard'||cat==='fav'||CATS[cat]))return false;
    fcCat=cat;fcDir=(parts[2]==='rev')?'rev':'fwd';buildQueue();goTab('cards');$('tab-cards').classList.add('studyfocus');return true;
  }
  if(a==='verbs'){goTab('verbs');return true}
  if(a==='verb'){
    var vi=verbIndexForRoute(b);
    if(vi<0)return false;
    curVerb=vi;goTab('verbs');$('tab-verbs').classList.add('verbfocus');return true;
  }
  if(a==='practice'){goTab('quiz');return true}
  if(a==='tool')return runTool(b);
  if(a==='speak'){goTab('speak');return true}
  if(a==='simulator'){
    if(b===undefined){renderSimList();return true}
    var si=parseInt(b,10);
    if(!(si>=0&&si<SCEN.length))return false;
    goTab('speak');startSim(si);return true;
  }
  if(a==='clinic'){
    if(b===undefined){renderClinic();return true}
    var ci=parseInt(b,10);
    if(!(ci>=0&&ci<CLINIC.length))return false;
    goTab('speak');openClinic(ci);return true;
  }
  if(a==='roleplay'){
    if(b===undefined){goTab('speak');renderRoleplays();return true}
    var ri=parseInt(b,10);
    if(!(ri>=0&&ri<ROLEPLAYS.length))return false;
    goTab('speak');startRoleplay(ri);return true;
  }
  if(a==='cinema'){
    if(b===undefined){renderCinema();return true}
    var ki=parseInt(b,10);
    if(!(ki>=0&&ki<CINEMA.length))return false;
    if(cinemaLocked(CINEMA[ki])){renderCinema();showNotice('🔒 This cinema story unlocks later in your lesson path — keep going, you are getting closer!');return true}
    goTab('speak');openCinema(ki);return true;
  }
  if(a==='listening'){
    if(b===undefined){goTab('speak');renderLibrary();return true}
    var pi=parseInt(b,10);
    if(!(pi>=0&&pi<LISTEN_LIB.length))return false;
    goTab('speak');openPassage(pi);return true;
  }
  if(a==='writing'){renderWriting();return true}
  if(a==='exams'){renderExamsHub();return true}
  if(a==='exam')return runExam(b);
  if(a==='library'){renderLibraryHub();return true}
  if(a==='reading'){
    if(b===undefined){goTab('speak');renderReading();return true}
    var ti=parseInt(b,10);
    if(!(ti>=0&&ti<STORIES.length))return false;
    goTab('speak');openStory(ti);return true;
  }
  if(a==='grammar'){renderGrammar();return true}
  if(a==='phrasebook'){goTab('speak');renderPhrasebook();return true}
  if(a==='bridge'){goTab('speak');renderBridge();return true}
  if(a==='account'){renderAccount();return true}
  if(a==='progress'){goTab('progress');focusProgress('');return true}
  if(a==='badges'){goTab('progress');focusProgress('badges');return true}
  if(a==='settings'){goTab('progress');focusProgress('settings');return true}
  return false;
}
/* syncRoute: a screen opened from inside the app (not via the router)
   records its page in history, so Back lands correctly afterwards. */
function syncRoute(r){
  if(_inRoute||_booting)return;
  _curRoute=r;
  if(location.hash!==r){try{history.pushState(null,'',r)}catch(e){location.hash=r}}
  updateChrome(routeParts());
}
function goRoute(r){
  if(location.hash===r)applyRoute();
  else location.hash=r;
}
function applyRoute(){
  var parts=routeParts();
  var r=routeStr(parts);
  if(r===_curRoute){updateChrome(parts);return}
  var had=_curRoute;
  _curRoute=r;_inRoute=true;
  if(had)stopAllActivity();
  var ok=false;
  try{ok=runRoute(parts)}catch(e){ok=false}
  _inRoute=false;
  if(!ok){
    _curRoute='#/home';
    try{history.replaceState(null,'','#/home')}catch(e){}
    _inRoute=true;
    try{runRoute(['home'])}catch(e){}
    _inRoute=false;
    parts=['home'];
  }
  updateChrome(parts);
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',applyRoute);
function initRouter(){
  _booting=false;
  /* Password-reset links return here as #access_token=...&type=recovery —
     intercept BEFORE the router can read that fragment as a page route:
     stash the recovery session and land on the Account page instead. */
  try{
    var rawH=(location.hash||'');
    if(rawH.indexOf('type=recovery')>=0&&rawH.indexOf('access_token=')>=0){
      var prm={};rawH.replace(/^#\/?/,'').split('&').forEach(function(kv){var p=kv.split('=');if(p.length>1)prm[decodeURIComponent(p[0])]=decodeURIComponent(p.slice(1).join('='))});
      if(prm.access_token&&window.LSFCloud)LSFCloud._recovery={at:prm.access_token,rt:prm.refresh_token||'',exp:parseInt(prm.expires_in||'3600',10)};
      try{history.replaceState(null,'','#/account')}catch(e){}
    }
  }catch(e){}
  var back=$('pageBack');
  if(back)back.onclick=function(){
    var before=_curRoute;
    var fb=parentFor(routeParts());
    try{history.back()}catch(e){}
    setTimeout(function(){if(_curRoute===before)goRoute(fb)},320);
  };
  if(!location.hash){try{history.replaceState(null,'','#/home')}catch(e){}}
  applyRoute();
}
/* ===== Inbound share / protocol handler (Round 5) =====
   Other apps can share text into this app (manifest share_target), and
   web+spanish: links open here (protocol_handlers). Both land on the
   Search page with the shared text already searched. */
function handleInboundShare(){
  try{
    var p=new URLSearchParams(location.search);
    var q=(p.get('text')||p.get('q')||'').replace(/\s+/g,' ').trim();
    if(q.indexOf('web+spanish:')===0){q=q.slice(12).replace(/^\/+/,'').trim()}
    if(q.length>80)q=q.slice(0,80);
    if(q.length<2)return;
    try{history.replaceState(null,'',location.pathname)}catch(e){}
    goRoute('#/tool/search');
    setTimeout(function(){
      var inp=$('pgSearch');
      if(inp){inp.value=q;renderSearchResults(q)}
    },200);
  }catch(e){}
}
/* ============ INIT (final — after all Round 4 features) ============ */
setSlowMode(!!ST.slow);
applyAnim();applyFontSize();
applyUr();
applyDark();
touchDay();
updateTop();
renderHome();
renderLessons();
renderCards();
renderVerbs();
renderQuizHome();
renderSpeak();
renderProgress();
initRouter();
handleInboundShare();

export { deferredInstallPrompt, showNotice, currentTab, _fromPop, goTab, applyUr, setMeanMode, setSpeed, confirmCb, askConfirm, shuffle, applyDark, LSFContent, LSFLogic, LSFServices, LSFShell, wireRouteLinks, hubLink, renderExamsHub, renderLibraryHub, renderSearchPage, focusProgress, _curRoute, TOOL_TITLES, EXAM_TITLES, routeParts, routeStr, studyName, verbIndexForRoute, titleFor, parentFor, isDeep, updateChrome, runTool, runExam, runRoute, syncRoute, goRoute, applyRoute, initRouter, handleInboundShare };

/* self-bridge (app.js functions) */
window.showNotice=showNotice;
window.goTab=goTab;
window.applyUr=applyUr;
window.setMeanMode=setMeanMode;
window.setSpeed=setSpeed;
window.askConfirm=askConfirm;
window.shuffle=shuffle;
window.applyDark=applyDark;
window.wireRouteLinks=wireRouteLinks;
window.hubLink=hubLink;
window.renderExamsHub=renderExamsHub;
window.renderLibraryHub=renderLibraryHub;
window.renderSearchPage=renderSearchPage;
window.focusProgress=focusProgress;
window.routeParts=routeParts;
window.routeStr=routeStr;
window.studyName=studyName;
window.verbIndexForRoute=verbIndexForRoute;
window.titleFor=titleFor;
window.parentFor=parentFor;
window.isDeep=isDeep;
window.updateChrome=updateChrome;
window.runTool=runTool;
window.runExam=runExam;
window.runRoute=runRoute;
window.syncRoute=syncRoute;
window.goRoute=goRoute;
window.applyRoute=applyRoute;
window.initRouter=initRouter;
window.handleInboundShare=handleInboundShare;
