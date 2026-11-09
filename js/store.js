import { showNotice } from './app.js';
import { LESSONS } from './data/lessons.js';
import { slowTimer, stopSlowDialogue } from './ui/learn.js';
import { cloudStatusText, stopShadowing } from './ui/speak.js';

var $=function(id){return document.getElementById(id)};
var SKEY='lsf_progress_v1';
var LIVE_URL='https://farrakhimtiaz74.github.io/learn-spanish-with-farrakh/';
function defState(){return{done:{},scores:[],known:{},seen:{},streak:0,lastDay:'',totalDays:0,lastLesson:0,ur:true,slow:false,mistakes:[],still:{},verbPasses:0,timedBest:0,examPassed:false,examBest:0,exam2Passed:false,exam2Best:0,rescueDay:'',weekGoal:5,dayLog:{},maxStreak:0,dark:false,dailyDoneDay:'',hgWins:0,hgLosses:0,exam3Passed:false,exam3Best:0,mockBest:0,srs:{},favs:{},favLessons:{},minutesLog:{},minutesGoal:15,wmWins:0,earlyBird:false,nightOwl:false,meanMode:'roman',whatsNewR3:false,calOffset:0,exam4Passed:false,exam4Best:0,exam5Passed:false,exam5Best:0,verbStats:{},verbExamPassed:false,verbExamBest:0,drafts:[],myPhrases:[],fontSize:1,sfx:true,anim:true,challenge:{},challengeWinner:false,cinemaDone:{},simDone:{},clinicDone:{},whatsNewR4:false,certCeleb:'',cloudAt:0}}

/* LSFStore — the ONLY code in the app that touches localStorage.
   load()      : read the save and merge it over the defaults (keys missing
                 from the save fall back to defaults; unknown keys in the save
                 are ignored — the exact pre-restructure behaviour).
   save(st)    : write the whole state (same storage-full warning as before).
   exportText(): the backup-file text used by Progress (Layer 5).
   importText(): validate + merge + write a backup; returns the clean state,
                 or null when the text is not a state object or saving failed.
   reset()     : remove the saved key. (The Reset button keeps its in-place
                 reset so the screen can re-render without a reload.) */
var LSFStore={
  KEY:SKEY,
  defaults:defState,
  load:function(){var st=defState();try{var raw=localStorage.getItem(SKEY);if(raw){var p=JSON.parse(raw);for(var k in defState()){if(p[k]!==undefined)st[k]=p[k]}if(p.meanMode===undefined&&p.ur===false)st.meanMode='en'}}catch(e){}return st},
  save:function(st){try{localStorage.setItem(SKEY,JSON.stringify(st));return true}catch(e){var now=Date.now();if(!window._saveWarnedAt||now-window._saveWarnedAt>60000){window._saveWarnedAt=now;showNotice('Progress could not be saved on this device (storage is full or blocked, e.g. private mode). Your learning still works, but progress may be lost when you close the page.')}return false}},
  exportText:function(st){return JSON.stringify(st,null,1)},
  importText:function(text){var data=null;try{data=JSON.parse(text)}catch(e){return null}var fresh=defState();if(!data||typeof data!=='object'||Array.isArray(data))return null;var clean={};for(var ck in fresh){clean[ck]=(ck in data)?data[ck]:fresh[ck]}try{localStorage.setItem(SKEY,JSON.stringify(clean))}catch(e){return null}return clean},
  getAuth:function(){try{var r=localStorage.getItem(SKEY+'_auth');return r?JSON.parse(r):null}catch(e){return null}},
  setAuth:function(a){try{if(a)localStorage.setItem(SKEY+'_auth',JSON.stringify(a));else localStorage.removeItem(SKEY+'_auth')}catch(e){}},
  reset:function(){try{localStorage.removeItem(SKEY)}catch(e){}}
};
/* ----------------------------------------------------------------
   LSFCloud — OPTIONAL cloud account & backup (Supabase), the network
   half of Layer 2. LOCAL-FIRST: the app works fully signed out and
   offline; this module only mirrors the progress blob to the signed-in
   account (email + password, Supabase Auth) in public.lsf_progress,
   where row-level security limits every account to its own row. The
   anon key below is a PUBLIC client key — safe in the page by design;
   the database rules, not the key, protect the data. The auth session
   is kept by LSFStore under a separate key and is NEVER synced.
   ---------------------------------------------------------------- */
var LSFCloud={
  URL:'https://amwgxgixgyuoyzvesyxj.supabase.co',
  KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtd2d4Z2l4Z3l1b3l6dmVzeXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxMzgwOTIsImV4cCI6MjEwOTcxNDA5Mn0.2A1iC_hcgFaOEzdu4OgUH66wOprf4KFYMz-mpkuX7zU',
  _timer:null,_busy:false,_hold:false,_lastErr:'',_recovery:null,
  session:function(){return LSFStore.getAuth()},
  headers:function(tok){var h={'apikey':LSFCloud.KEY,'Content-Type':'application/json'};if(tok)h['Authorization']='Bearer '+tok;return h},
  _saveSession:function(j){LSFStore.setAuth({at:j.access_token,rt:j.refresh_token,exp:Date.now()+((j.expires_in||3600)*1000),email:(j.user&&j.user.email)||'',uid:(j.user&&j.user.id)||''})},
  authCall:function(path,body){return fetch(LSFCloud.URL+'/auth/v1/'+path,{method:'POST',headers:LSFCloud.headers(),body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&(j.msg||j.message||j.error_description))||('Error '+r.status));return j})})},
  signUp:function(email,pass){return LSFCloud.authCall('signup',{email:email,password:pass}).then(function(j){if(j&&j.access_token){LSFCloud._saveSession(j);return j}throw new Error('Account created, but no session came back — please sign in.')})},
  signIn:function(email,pass){return LSFCloud.authCall('token?grant_type=password',{email:email,password:pass}).then(function(j){LSFCloud._saveSession(j);return j})},
  signOut:function(){var s=LSFCloud.session();LSFStore.setAuth(null);LSFCloud._hold=false;if(s&&s.at){try{fetch(LSFCloud.URL+'/auth/v1/logout',{method:'POST',headers:LSFCloud.headers(s.at)})}catch(e){}}},
  recover:function(email){return fetch(LSFCloud.URL+'/auth/v1/recover',{method:'POST',headers:LSFCloud.headers(),body:JSON.stringify({email:email})}).then(function(r){if(!r.ok)return r.json().then(function(j){throw new Error((j&&(j.msg||j.message))||('Error '+r.status))});return true})},
  completeReset:function(pw){var rc=LSFCloud._recovery;if(!rc||!rc.at)return Promise.reject(new Error('This reset link is no longer active — request a fresh one.'));return fetch(LSFCloud.URL+'/auth/v1/user',{method:'PUT',headers:LSFCloud.headers(rc.at),body:JSON.stringify({password:pw})}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&(j.msg||j.message))||('Error '+r.status));return j})}).then(function(user){LSFStore.setAuth({at:rc.at,rt:rc.rt,exp:Date.now()+((rc.exp||3600)*1000),email:(user&&user.email)||'',uid:(user&&user.id)||''});LSFCloud._recovery=null;return user})},
  refresh:function(){var s=LSFCloud.session();if(!s||!s.rt)return Promise.reject(new Error('no session'));return LSFCloud.authCall('token?grant_type=refresh_token',{refresh_token:s.rt}).then(function(j){LSFCloud._saveSession(j);return j})},
  token:function(){var s=LSFCloud.session();if(!s)return Promise.resolve(null);if(s.exp&&Date.now()<s.exp-60000)return Promise.resolve(s.at);return LSFCloud.refresh().then(function(){var s2=LSFCloud.session();return s2?s2.at:null}).catch(function(){return s.at})},
  _rest:function(method,path,body,prefer,retried){return LSFCloud.token().then(function(tok){if(!tok)throw new Error('not signed in');var h=LSFCloud.headers(tok);if(prefer)h['Prefer']=prefer;var opt={method:method,headers:h};if(body)opt.body=JSON.stringify(body);return fetch(LSFCloud.URL+'/rest/v1/'+path,opt).then(function(r){if(r.status===401&&!retried){return LSFCloud.refresh().then(function(){return LSFCloud._rest(method,path,body,prefer,true)})}return r})})},
  push:function(){var s=LSFCloud.session();if(!s||!s.uid)return Promise.reject(new Error('not signed in'));return LSFCloud._rest('POST','lsf_progress',{user_id:s.uid,data:ST,updated_at:new Date().toISOString()},'resolution=merge-duplicates').then(function(r){if(!r.ok)throw new Error('Cloud save failed ('+r.status+')');ST.cloudAt=Date.now();LSFCloud._lastErr='';LSFStore.save(ST);return true}).catch(function(e){LSFCloud._lastErr=String((e&&e.message)||e||'Cloud save failed');throw e})},
  pull:function(){var s=LSFCloud.session();if(!s||!s.uid)return Promise.reject(new Error('not signed in'));return LSFCloud._rest('GET','lsf_progress?select=data,updated_at&user_id=eq.'+encodeURIComponent(s.uid)).then(function(r){if(!r.ok)throw new Error('Cloud load failed ('+r.status+')');return r.json()}).then(function(rows){if(!rows||!rows.length||!rows[0].data)return null;return{data:rows[0].data,at:rows[0].updated_at}})},
  schedule:function(){if(LSFCloud._hold||!LSFCloud.session())return;if(LSFCloud._timer)clearTimeout(LSFCloud._timer);LSFCloud._timer=setTimeout(function(){if(LSFCloud._busy)return;LSFCloud._busy=true;LSFCloud.push().catch(function(){}).then(function(){LSFCloud._busy=false;var el=document.getElementById('cloudStatus');if(el)el.textContent=cloudStatusText()})},5000)},
  applyRemote:function(remote){var fresh=defState();var clean={};for(var ck in fresh){clean[ck]=(ck in remote)?remote[ck]:fresh[ck]}clean.cloudAt=Date.now();return LSFStore.importText(JSON.stringify(clean))?clean:null}
};
/* ================================================================
   LAYER 3 — LEARNING LOGIC (part 1: state rules)
   Pure rules that work from content (Layer 1) + state (Layer 2) and
   return results: mistake bookkeeping, speech-match scoring, score
   history, answer normalising, distractor pools, verb-form maths,
   streak/day tracking and the SRS schedule (1→3→7→21→45 days).
   These functions never write to the DOM. (wordByWord is the one
   presenter: it only formats the match result as HTML spans.)
   ================================================================ */
function saveMistake(q,exp){if(!q)return;for(var i=0;i<ST.mistakes.length;i++){if(ST.mistakes[i].q===q)return}ST.mistakes.push({q:q,exp:exp||''});if(ST.mistakes.length>200)ST.mistakes=ST.mistakes.slice(-200);save()}
function wordMatchPct(heard,target){
  var norm=function(s){return String(s||'').toLowerCase().replace(/[¿?¡!.,;:]/g,'').replace(/\s+/g,' ').trim()};
  var h=norm(heard).split(' ').filter(Boolean),t=norm(target).split(' ').filter(Boolean);
  if(!t.length)return 0;var used={},hit=0;
  h.forEach(function(w){var ix=t.indexOf(w);if(ix>=0&&!used[ix]){used[ix]=1;hit++}});
  return Math.round(hit/t.length*100);
}
function wordByWord(heard,target){
  var norm=function(s){return String(s||'').toLowerCase().replace(/[¿?¡!.,;:]/g,'').trim()};
  var hset=norm(heard).split(' ').filter(Boolean);
  return String(target).split(' ').map(function(w){var k=norm(w);return '<span class="'+(hset.indexOf(k)>=0?'wm-ok':'wm-no')+'">'+esc(w)+'</span>'}).join(' ');
}
/* The live progress object — owned by Layer 2. Every other layer reads and
   writes it through save(); nothing outside LSFStore touches localStorage. */
var ST=LSFStore.load();
function save(){LSFStore.save(ST);try{LSFCloud.schedule()}catch(e){}} /* the global write path every layer already calls — kept so no call site changed; the schedule() call only debounces an optional cloud backup when signed in */
function pushScore(name,score,total){ST.scores.push({name:name,score:score,total:total,date:todayStr()});if(ST.scores.length>100)ST.scores=ST.scores.slice(-100)}
function normAns(s){var m={'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','ñ':'n'};var t=String(s||'').toLowerCase().split('').map(function(c){return m[c]||c}).join('');return t.replace(/[¿?¡!.,;:()"«»]/g,' ').replace(/\s+/g,' ').trim()}
function dedupeFlash(pool){var seen={},out=[];pool.forEach(function(f){var k=normAns(f.es);if(seen[k])return;seen[k]=1;out.push(f)});return out}
function uniqMeanings(pool){var seen={},out=[];pool.forEach(function(f){var k=normAns(f.en);if(seen[k])return;seen[k]=1;out.push(f)});return out}
function regularPastForms(v){var inf=v.inf;var stem=inf.slice(0,-2);var end=inf.slice(-2);var A=['é','aste','ó','amos','asteis','aron'],E=['í','iste','ió','imos','isteis','ieron'];var e2=(end==='er'||end==='ir')?E:A;if(end==='ir'&&'aeiou'.indexOf(stem.charAt(stem.length-1))>=0)e2=['í','iste','yó','imos','isteis','yeron'];return e2.map(function(x){return stem+x})}
function mistakeAnswer(m){var exp=String(m.exp||'');var mm=exp.match(/Correct(?: form| answer| reply)?:\s*([^.;]+)/i)||exp.match(/→\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+?)\s*(?:\.|$)/)||exp.match(/"([^"]+)"\s*=/);if(mm&&mm[1])return mm[1].trim();return ''}
function stopAllActivity(){try{stopSlowDialogue()}catch(e){}try{if(tdTimer){clearInterval(tdTimer);tdTimer=null}}catch(e){}try{if(wmTimer){clearInterval(wmTimer);wmTimer=null}}catch(e){}try{if(slowTimer){clearTimeout(slowTimer);slowTimer=null}}catch(e){}try{stopShadowing()}catch(e){}try{if(window.mockTimer){clearInterval(window.mockTimer);window.mockTimer=null}}catch(e){}try{if(window.rcRec&&window.rcRec.state==='recording')window.rcRec.stop()}catch(e){}try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}}
function todayStr(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function touchDay(){var t=todayStr();ST.dayLog[t]=true;if(ST.streak>(ST.maxStreak||0))ST.maxStreak=ST.streak;if(ST.lastDay===t){save();return}var y=new Date();y.setDate(y.getDate()-1);var ys=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();if(ST.lastDay===ys){ST.streak+=1}else if(ST.lastDay===''){ST.streak=1}else{ST.streak=1}if(ST.streak>(ST.maxStreak||0))ST.maxStreak=ST.streak;ST.lastDay=t;ST.totalDays+=1;save();updateTop()}
function updateTop(){$('streakTop').textContent=ST.streak;var sw=$('streakWord');if(sw)sw.textContent=(ST.streak===1?'day':'days');$('wordsTop').textContent=Object.keys(ST.known).length;$('lessonsTop').textContent=Object.keys(ST.done).length;var lt=$('lessonsTotal');if(lt&&typeof LESSONS!=='undefined')lt.textContent=LESSONS.length}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
function uuLine(uu){return uu?'<div class="uu" dir="rtl" lang="ur">'+esc(uu)+'</div>':''}
function dateVal(s){var p=String(s).split('-');return (+p[0])*10000+(+p[1])*100+(+p[2])}
function addDaysStr(n){var d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
var SRS_STEPS=[1,3,7,21,45];
function srsKnow(idx){var e=ST.srs[idx]||{n:0};e.n=Math.min((e.n||0)+1,5);e.due=addDaysStr(SRS_STEPS[Math.min(e.n-1,4)]);ST.srs[idx]=e}
function srsLearn(idx){ST.srs[idx]={n:0,due:addDaysStr(1)}}
function srsDueList(){var t=dateVal(todayStr());var out=[];for(var k in ST.srs){if(ST.srs[k].due&&dateVal(ST.srs[k].due)<=t)out.push(+k)}out.sort(function(a,b){return dateVal(ST.srs[a].due)-dateVal(ST.srs[b].due)});return out}
/* Session activity + minutes tracking: Layer 3 time rules, fed by Layer 5 events */
var _lastAct=Date.now();
['click','keydown','touchstart'].forEach(function(ev){document.addEventListener(ev,function(){_lastAct=Date.now()},{passive:true})});
var _minTick=Date.now();
setInterval(function(){var now=Date.now();var el=Math.round((now-_minTick)/1000);_minTick=now;if(document.hidden)return;if(now-_lastAct>120000)return;if(el<=0||el>30)return;var t=todayStr();ST.minutesLog[t]=(ST.minutesLog[t]||0)+el;save()},10000);
function todayMinutes(){return Math.floor((ST.minutesLog[todayStr()]||0)/60)}
/* slowMode lives in tts.js (exported, mutated via setSlowMode) */
function setST(v){ST=v}

export { $, SKEY, LIVE_URL, defState, LSFStore, LSFCloud, saveMistake, wordMatchPct, wordByWord, ST, save, pushScore, normAns, dedupeFlash, uniqMeanings, regularPastForms, mistakeAnswer, stopAllActivity, todayStr, touchDay, updateTop, esc, uuLine, dateVal, addDaysStr, SRS_STEPS, srsKnow, srsLearn, srsDueList, _lastAct, _minTick, todayMinutes, setST };
