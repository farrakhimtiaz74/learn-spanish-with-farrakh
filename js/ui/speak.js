import { applyDark, applyUr, askConfirm, goRoute, goTab, setMeanMode, setSpeed, showNotice, shuffle, syncRoute, wireRouteLinks } from '../app.js';
import { LESSONS } from '../data/lessons.js';
import { BRIDGE, HG_WORDS, IRREG, IRREG_IDS, MIC_SENTS, REPEAT, SURVIVAL, SYLLABLES, TRAPS } from '../data/practice.js';
import { LISTEN_LIB, ROLEPLAYS, STORIES } from '../data/stories.js';
import { PRON, VERBS } from '../data/verbs.js';
import { CATS, FLASH } from '../data/vocabulary.js';
import { certDlBtn, fireConfetti, grandCert2Html } from '../services.js';
import { $, LIVE_URL, LSFCloud, LSFStore, ST, dateVal, dedupeFlash, defState, esc, normAns, pushScore, save, saveMistake, setST, srsDueList, todayMinutes, todayStr, touchDay, uniqMeanings, updateTop, uuLine, wordByWord, wordMatchPct } from '../store.js';
import { PLAY_SVG, SPK_SVG_SM, pickEsVoice, setSlowMode, slowMode, speak, speakBtn, splitSpeechChunks } from '../tts.js';
import { buildQueue, favStarBtn, fcCat, hardIndices, renderCards, renderQuizHome, renderVerbs, startListenType } from './cards.js';
import { nextLessonIdx, openLesson, renderHome, renderLessons, speakQueue } from './learn.js';
import { challengeCardHtml, settingsHtml, shareLevelHtml, weaknessHtml, wireProgressExtras } from './tools.js';


/* ── LAYER 5 · UI (continued) — Speak & Progress screens. Mic / recorder features call the Layer 4 device services marked inside this script. ── */
/* ============ SPEAK: Repeat After Me + Mic practice ============ */
var rapIdx=0, micIdx=0;
function renderSpeak(){
  var r=REPEAT[rapIdx%REPEAT.length];var m=MIC_SENTS[micIdx%MIC_SENTS.length];
  var h='<div class="card"><h2 style="font-size:1.2rem">🔁 Repeat After Me</h2><p class="muted">The app speaks → you say it out loud → tap "I said it". No scoring — your ears do the learning. Use Slow speed if it feels fast.</p>';
  h+='<div class="flashcard" style="min-height:150px"><div class="es big">'+esc(r)+'</div><div class="hint">Phrase '+(rapIdx%REPEAT.length+1)+' of '+REPEAT.length+'</div></div>';
  h+='<div class="grid2" style="margin-top:12px"><button class="btn orange" id="rapPlay" type="button">'+SPK_SVG_SM+' Listen</button><button class="btn" id="rapDone" type="button">✅ I said it — next</button></div></div>';
  h+='<div class="card"><h2 style="font-size:1.15rem">🎤 Speak &amp; Compare (microphone)</h2><p class="muted">Say the sentence in Spanish. The app shows what your phone heard, next to the correct sentence — compare them yourself.</p>';
  h+='<div style="display:flex;gap:10px;align-items:flex-start"><div style="flex:1"><div class="kicker">Say this</div><div class="es big">'+esc(m[0])+'</div><div class="en">'+esc(m[1])+'</div></div>'+speakBtn(m[0])+'</div>';
  h+='<div id="micMsg"></div>';
  h+='<div class="grid2" style="margin-top:10px"><button class="btn" id="micBtn" type="button">🎤 Tap &amp; speak</button><button class="btn ghost" id="micNext" type="button">Next sentence →</button></div>';
  h+='<div id="micOut" style="margin-top:10px"></div>';
  h+='<p class="muted">No microphone? No problem — type what you would say and compare:</p><input type="text" id="micType" placeholder="Type the Spanish sentence here..."><button class="btn small" id="micCheck" type="button" style="margin-top:8px">Compare my typing</button><div id="typeOut"></div></div>';
  h+='<div class="card" id="rcCard"><h2 style="font-size:1.15rem">⏺️ Record &amp; Compare</h2><p class="muted">Record your own voice saying the phrase, then play <b>Your voice</b> and the <b>Spanish voice</b> back-to-back. Recordings live only in this tab\'s memory — never uploaded, and gone when you close the page.</p>';
  var rcP=MIC_SENTS[rcState.idx%MIC_SENTS.length];
  h+='<div style="display:flex;gap:10px;align-items:flex-start"><div style="flex:1"><div class="kicker">Say this</div><div class="es big" id="rcPhrase">'+esc(rcP[0])+'</div><div class="en">'+esc(rcP[1])+'</div></div></div>';
  h+='<div id="rcMsg"></div>';
  h+='<div class="grid2" style="margin-top:10px"><button class="btn orange" id="rcRec" type="button">⏺️ Record my voice</button><button class="btn" id="rcStop" type="button" disabled>⏹ Stop</button><button class="btn" id="rcMine" type="button" disabled>▶️ Your voice</button><button class="btn ghost" id="rcTts" type="button">'+SPK_SVG_SM+' Spanish voice</button><button class="btn ghost" id="rcDel" type="button" disabled>🗑️ Delete recording</button><button class="btn ghost" id="rcNext" type="button">Next phrase →</button></div></div>';
  h+='<div class="card"><h2 style="font-size:1.15rem">🪞 Shadowing</h2><p class="muted">A phrase plays → beep → you repeat it aloud → it plays again. The loop runs through the phrases of a lesson automatically. Keep your voice right behind the speaker, like a shadow.</p>';
  h+='<label class="muted" style="font-weight:600">Shadow which lesson?</label><select id="shLesson" style="margin:6px 0 10px">';
  LESSONS.forEach(function(L,i){h+='<option value="'+i+'">Lesson '+L.n+': '+esc(L.t)+'</option>'});
  h+='</select><div id="shOut"></div><div class="grid2"><button class="btn orange" id="shStart" type="button">'+PLAY_SVG+' Start shadowing</button><button class="btn ghost" id="shStop" type="button">⏹ Stop</button></div></div>';
  h+='<div class="card"><h2 style="font-size:1.15rem">🎙️ Test My Mic</h2><p class="muted">Check whether Chrome is allowed to use your microphone for speaking practice.</p><div id="micTestOut"></div><button class="btn" id="micTestBtn" type="button" style="width:100%">🎙️ Test my mic</button></div>';
  h+='<div class="card"><h2 style="font-size:1.15rem">📖 Listening, Role-Play &amp; Real-Life Phrases</h2><p class="muted">Four more ways to practise — all built in, nothing to install.</p><div class="grid2"><button class="btn" id="spSim" type="button">🎬 Conversation Simulator (15)</button><button class="btn" id="spClinic" type="button">🗣️ Pronunciation Clinic (6 sounds)</button><button class="btn" id="spCinema" type="button">🎬 Listening Cinema (10)</button><button class="btn" id="spLibrary" type="button">🎧 Listening Library (20)</button><button class="btn" id="spRoleplay" type="button">🎭 Dialogue Role-Play (6)</button><button class="btn orange" id="spBridge" type="button">🇵🇰 Pakistan–Spain Bridge</button><button class="btn orange" id="spPhrasebook" type="button">🆘 Survival Phrasebook ('+SURVIVAL.length+')</button><button class="btn" id="spReading" type="button">📖 Reading Library (10 stories)</button></div></div>';
  $('tab-speak').innerHTML=h;
  $('spLibrary').onclick=function(){goRoute('#/listening')};
  $('spSim').onclick=function(){goRoute('#/simulator')};
  $('spClinic').onclick=function(){goRoute('#/clinic')};
  $('spCinema').onclick=function(){goRoute('#/cinema')};
  $('spRoleplay').onclick=function(){goRoute('#/roleplay')};
  $('spBridge').onclick=function(){goRoute('#/bridge')};
  $('spPhrasebook').onclick=function(){goRoute('#/phrasebook')};
  $('spReading').onclick=function(){goRoute('#/reading')};
  $('shStart').onclick=function(){startShadowing(parseInt($('shLesson').value,10))};
  $('shStop').onclick=function(){stopShadowing();$('shOut').innerHTML='<p class="muted">Shadowing stopped. ¡Buen trabajo!</p>'};
  $('micTestBtn').onclick=testMic;
  $('rapPlay').onclick=function(){speak(REPEAT[rapIdx%REPEAT.length])};
  $('rapDone').onclick=function(){rapIdx++;touchDay();renderSpeak();setTimeout(function(){speak(REPEAT[rapIdx%REPEAT.length])},250)};
  $('micNext').onclick=function(){micIdx++;renderSpeak()};
  $('micCheck').onclick=function(){
    var v=$('micType').value.trim();var target=MIC_SENTS[micIdx%MIC_SENTS.length][0];
    var pct=wordMatchPct(v,target);
    $('typeOut').innerHTML='<div class="feedback '+(pct>=80?'ok':'no')+'" style="margin-top:10px"><b>Word match: '+pct+'%</b> (simple word-by-word match, not an AI score)<br>You typed: <b>'+esc(v||'—')+'</b><br>Correct, word by word: '+wordByWord(v,target)+'<br><span class="muted">Compare letter by letter — accents and ñ matter.</span></div>';
  };
  $('micBtn').onclick=startMic;
  $('rcRec').onclick=rcStart;$('rcStop').onclick=rcStop;$('rcMine').onclick=rcPlayMine;$('rcDel').onclick=rcDelete;
  $('rcTts').onclick=function(){speak(MIC_SENTS[rcState.idx%MIC_SENTS.length][0])};
  $('rcNext').onclick=function(){rcState.idx++;renderSpeak();setTimeout(function(){var s=$('rcCard');if(s)s.scrollIntoView({behavior:'smooth',block:'center'})},60)};
  rcUpdateBtns();
}
/* ── LAYER 4 · DEVICE SERVICES — speech recognition: the browser hears the learner and Layer 3 scores the match ── */
function startMic(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  var out=$('micOut');
  if(!SR){out.innerHTML='<div class="toast"><span style="flex:1">Voice typing is not supported in this browser. No problem — use "Listen" + typing practice above; everything else works fully.</span><button type="button" onclick="this.parentElement.remove()">✕</button></div>';return}
  var target=MIC_SENTS[micIdx%MIC_SENTS.length][0];
  try{
    var rec=new SR();rec.lang='es-ES';rec.interimResults=false;rec.maxAlternatives=1;
    out.innerHTML='<p class="muted">🎙️ Listening... speak now in Spanish.</p>';
    rec.onresult=function(ev){
      var heard=ev.results[0][0].transcript;
      var pct=wordMatchPct(heard,target);
      out.innerHTML='<div class="feedback '+(pct>=80?'ok':'no')+'"><b>🎯 Speaking score (word match): '+pct+'%</b><br><span class="muted">This is a simple count of how many target words the phone heard — honest word-matching, not an AI grade.</span><br><b>Your phone heard:</b> "'+esc(heard)+'"<br><b>Correct, word by word:</b> '+wordByWord(heard,target)+'<br>'+(pct===100?'✅ Perfect — ¡muy bien!':'👀 Green words matched. Listen once more with 🔊, repeat the red ones, and try again.')+'</div>';
      if(pct<100)saveMistake('Speaking: '+target,'Heard: "'+heard+'" ('+pct+'% word match). Correct: '+target);
      touchDay();
    };
    rec.onerror=function(ev){
      if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){out.innerHTML=micHelpCard()}
      else{out.innerHTML='<p class="muted">The phone did not catch that ('+esc(ev.error)+'). Please try again in a quiet place.</p>'}
    };
    rec.start();
  }catch(e){out.innerHTML='<p class="muted">Microphone could not start here. Typing practice above works just as well.</p>'}
}
/* ===== Shadowing ===== */
var shTimers=[], shRunning=false;
function beep(){
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    var ctx=beep._ctx||(beep._ctx=new AC());if(ctx.state==='suspended')ctx.resume();
    var o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=880;g.gain.value=0.12;
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.18);
  }catch(e){}
}
function stopShadowing(){shRunning=false;shTimers.forEach(function(t){clearTimeout(t)});shTimers=[];if('speechSynthesis' in window)speechSynthesis.cancel()}
function startShadowing(li){
  stopShadowing();shRunning=true;
  var L=LESSONS[li];var phrases=[];
  L.sents.forEach(function(s){phrases.push(s[0])});
  L.dlg.forEach(function(d){phrases.push(d[1])});
  var out=$('shOut');
  var idx=0;
  function later(fn,ms){shTimers.push(setTimeout(function(){if(shRunning)fn()},ms))}
  function speakThen(ph,done){
    if(!('speechSynthesis' in window)){done();return}
    try{speechSynthesis.cancel()}catch(e){}
    var voice=pickEsVoice();var chunks=splitSpeechChunks(ph);var finished=false;
    function fin(){if(finished)return;finished=true;done()}
    chunks.forEach(function(chunk,ci){
      var u=new SpeechSynthesisUtterance(chunk);u.lang='es-ES';u.rate=slowMode?0.62:0.92;if(voice)u.voice=voice;
      if(ci===chunks.length-1){u.onend=fin;u.onerror=fin}
      speechSynthesis.speak(u);
    });
    /* Safety net only, in case a voice never fires "ended": generous allowance so long phrases are never cut off */
    later(fin,Math.max(6000,ph.length*280));
  }
  function step(){
    if(!shRunning)return;
    if(idx>=phrases.length){out.innerHTML='<div class="feedback ok">🎉 Shadowing complete for Lesson '+L.n+'! Your mouth is getting faster.</div>';shRunning=false;touchDay();return}
    var ph=phrases[idx];var n=idx+1;idx++;
    out.innerHTML='<p class="muted" style="margin:4px 0">Phrase '+n+' of '+phrases.length+' — listen…</p><div class="es big">'+esc(ph)+'</div>';
    speakThen(ph,function(){
      if(!shRunning)return;
      beep();
      out.innerHTML='<p class="muted" style="margin:4px 0">🔔 Your turn — repeat it now!</p><div class="es big">'+esc(ph)+'</div>';
      later(function(){
        if(!shRunning)return;
        out.innerHTML='<p class="muted" style="margin:4px 0">Listen once more and compare…</p><div class="es big">'+esc(ph)+'</div>';
        speakThen(ph,function(){later(step,500)});
      },Math.max(2800,ph.length*160));
    });
  }
  step();
}
/* ── LAYER 4 · DEVICE SERVICES — microphone permission check (getUserMedia probe) ── */
/* ===== Test my mic ===== */
function micHelpCard(){
  return '<div class="toast" style="background:#92400e"><span style="flex:1"><b>How to allow the mic in Chrome on Android — two ways:</b><br><b>1)</b> Tap the 🔒 lock / tune icon in the address bar → <b>Permissions / Site settings</b> → <b>Microphone</b> → <b>Allow for this site</b>.<br><b>2)</b> Or open Android <b>Settings → Apps → Chrome → Permissions → Microphone → Allow</b>.<br>Then tap Test again. <b>Typing practice always works — everything else in the app works without a mic.</b></span><button type="button" onclick="this.parentElement.remove()">✕</button></div>';
}
function testMic(){
  var out=$('micTestOut');if(!out)return;
  function show(state,extra){
    var col=state==='Allowed'?'var(--green)':(state==='Blocked'?'var(--red)':'var(--orange-d)');
    out.innerHTML='<p style="font-size:1.05rem">Microphone: <b style="color:'+col+'">'+state+'</b></p>'+(extra||'')+(state==='Blocked'?micHelpCard():'');
  }
  if(navigator.permissions&&navigator.permissions.query){
    navigator.permissions.query({name:'microphone'}).then(function(r){
      if(r.state==='granted')show('Allowed','<p class="muted">Your mic is ready — speaking practice will work.</p>');
      else if(r.state==='denied')show('Blocked');
      else{
        /* prompt state: actually ask once */
        if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
          navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){s.getTracks().forEach(function(t){t.stop()});show('Allowed','<p class="muted">You just allowed it — speaking practice will work.</p>')}).catch(function(){show('Blocked')});
        }else show('Not asked','<p class="muted">Tap "🎤 Tap &amp; speak" above and Chrome will ask for permission.</p>');
      }
    }).catch(function(){show('Not asked','<p class="muted">Could not check automatically. Tap "🎤 Tap &amp; speak" above and Chrome will ask.</p>')});
  }else{
    show('Not asked','<p class="muted">This browser does not report mic status. Tap "🎤 Tap &amp; speak" above and Chrome will ask.</p>');
  }
}
/* ── LAYER 5 · UI — Progress screen. Backup / restore / reset go through LSFStore (Layer 2); the 'Download app file' utility is Layer 6 shell behaviour wired here. ── */
/* ============ PROGRESS ============ */
function resetCardHtml(){
  var h='<div class="card" style="border:2px solid var(--orange)"><h3>🔑 Choose a new password</h3>';
  h+='<p class="muted">You opened a password-reset link from your email. Set a new password (at least 6 characters) — you are then signed in with it straight away, and your cloud backup keeps working.</p>';
  h+='<label class="muted" style="font-weight:600">New password</label><input type="password" id="resetPass" autocomplete="new-password" placeholder="At least 6 characters" style="width:100%;min-height:48px;margin:4px 0 10px;padding:0 10px">';
  h+='<button class="btn" id="resetSetBtn" type="button" style="width:100%">Set new password</button><div id="resetFb"></div></div>';
  return h;
}
function wireResetCard(){
  var b=$('resetSetBtn');if(!b)return;
  b.onclick=function(){
    var pw=$('resetPass').value||'';var fb=$('resetFb');
    if(pw.length<6){if(fb)fb.innerHTML='<div class="feedback no" style="margin-top:10px">❌ Please choose a password of at least 6 characters.</div>';return}
    b.disabled=true;
    LSFCloud.completeReset(pw).then(function(){renderAccount();showNotice('✅ New password set — you are signed in.')}).catch(function(e){b.disabled=false;if(fb)fb.innerHTML='<div class="feedback no" style="margin-top:10px">❌ '+esc(e.message||'This reset link could not be used — request a fresh one via Forgot password.')+'</div>'});
  };
}
function renderAccount(){
  goTab('progress');syncRoute('#/account');
  var h='<button class="btn ghost small" type="button" onclick="goRoute(\'#/progress\')">← My Progress</button>';
  if(LSFCloud._recovery)h+=resetCardHtml();
  h+='<div class="card"><div class="kicker">☁️ Your account</div><h2 style="font-size:1.25rem;margin:4px 0">Sign up / Sign in</h2><p class="muted">One free account — email + password — backs up your Spanish progress online (Supabase), so it follows you to any phone or browser. No account? The app still works fully on this device; the account is only a safe copy.</p></div>';
  h+=cloudCardHtml();
  h+='<div class="card"><h3>How it works</h3><ul style="margin:6px 0;padding-left:20px;line-height:1.7"><li>📚 Practise as usual — progress saves on this device first</li><li>☁️ Signed in? A copy backs up automatically a few seconds later</li><li>📱 New phone? Open this page, sign in, and the app asks before loading your progress</li><li>🔒 Only your account can open your backup — the database rule was tested</li></ul><button class="btn ghost" type="button" style="width:100%" onclick="goRoute(\'#/progress\')">📊 Go to My Progress</button></div>';
  $('tab-progress').innerHTML=h;
  wireCloudCard();
  wireResetCard();
}
function cloudStatusText(){if(!LSFCloud.session())return'';if(LSFCloud._lastErr)return '⚠️ Last cloud backup FAILED — check your internet and tap Sync now to try again.';return ST.cloudAt?('Last cloud backup: '+new Date(ST.cloudAt).toLocaleString()):'Not backed up yet — tap Sync now.'}
function cloudCardHtml(){
  var s=LSFCloud.session();
  var h='<div class="card" id="cloudCard"><h3>☁️ Cloud account &amp; backup</h3>';
  if(!s){
    h+='<p class="muted">Create a free account with your email and a password, and your progress is backed up online (Supabase). Sign in on any phone or browser and your lessons, streak and words come with you. The app works fully without an account too — progress then stays only on this device.</p>';
    h+='<label class="muted" style="font-weight:600">Email</label><input type="email" id="cloudEmail" autocomplete="email" placeholder="you@example.com" style="width:100%;min-height:48px;margin:4px 0 8px;padding:0 10px">';
    h+='<label class="muted" style="font-weight:600">Password</label><input type="password" id="cloudPass" autocomplete="current-password" placeholder="At least 6 characters" style="width:100%;min-height:48px;margin:4px 0 10px;padding:0 10px">';
    h+='<div class="grid2"><button class="btn" id="cloudInBtn" type="button">Sign in</button><button class="btn orange" id="cloudUpBtn" type="button">Create account</button></div><button class="btn ghost small" id="cloudForgotBtn" type="button" style="width:100%;margin-top:8px">Forgot password?</button><div id="cloudFb"></div>';
    h+='<p class="muted" style="margin-top:8px">One account works on every device. Forgot the password? Tap “Forgot password?” — a reset link goes to your email, and opening it brings you back here to choose a new one.</p>';
  }else{
    h+='<p class="muted">Signed in as <b>'+esc(s.email||'')+'</b>. Progress backs up automatically a few seconds after you practise, and whenever you tap Sync now.</p>';
    h+='<p class="muted" id="cloudStatus">'+cloudStatusText()+'</p>';
    h+='<div class="grid2"><button class="btn" id="cloudSyncBtn" type="button">☁️ Sync now</button><button class="btn ghost" id="cloudOutBtn" type="button">Sign out</button></div><div id="cloudFb"></div>';
    h+='<p class="muted" style="margin-top:8px">Signing out never deletes progress — not on this device, and not in your account.</p>';
  }
  return h+'</div>';
}
function wireCloudCard(){
  function fb(html){var e=$('cloudFb');if(e)e.innerHTML=html}
  function ok(m){fb('<div class="feedback ok" style="margin-top:10px">'+m+'</div>')}
  function no(m){fb('<div class="feedback no" style="margin-top:10px">'+m+'</div>')}
  function afterAuth(isNew){
    return LSFCloud.pull().then(function(remote){
      var localHas=Object.keys(ST.done).length>0||Object.keys(ST.known).length>0||ST.scores.length>0||ST.streak>0;
      var remoteAt=remote?new Date(remote.at).getTime():0;
      if(remote&&(!localHas||remoteAt>(ST.cloudAt||0))){
        LSFCloud._hold=true;
        askConfirm('Load your cloud progress?','Your account has progress saved online ('+new Date(remote.at).toLocaleString()+'). Loading it replaces the progress on this device, then the page reloads. If you cancel, nothing is loaded and nothing is uploaded.',function(){
          LSFCloud._hold=false;
          if(LSFCloud.applyRemote(remote.data)){location.reload()}else{no('❌ The cloud progress could not be saved on this device. Nothing was changed.')}
        });
        ok(isNew?'✅ Account created — choose in the box above whether to load your saved progress.':'✅ Signed in — choose in the box above whether to load your saved progress.');
        return;
      }
      return LSFCloud.push().then(function(){ok(isNew?"✅ Account created — this device's progress is now backed up to your account.":"✅ Signed in — this device's progress is now backed up to your account.");var st=$('cloudStatus');if(st)st.textContent=cloudStatusText()});
    });
  }
  var up=$('cloudUpBtn'),inn=$('cloudInBtn'),sync=$('cloudSyncBtn'),out=$('cloudOutBtn'),fg=$('cloudForgotBtn');
  if(fg)fg.onclick=function(){var em=($('cloudEmail').value||'').trim();if(!em||em.indexOf('@')<1){no('❌ First type your account email in the Email box above, then tap Forgot password.');return}fg.disabled=true;LSFCloud.recover(em).then(function(){ok('📧 Reset link sent to '+esc(em)+' — open the email on any device and tap the link; this app will then ask you for a new password.')}).catch(function(e){fg.disabled=false;no('❌ '+esc(e.message||'Could not send the reset email. Check your internet and try again.'))})};
  if(up)up.onclick=function(){var em=($('cloudEmail').value||'').trim(),pw=$('cloudPass').value||'';if(!em||em.indexOf('@')<1||pw.length<6){no('❌ Please enter a valid email and a password of at least 6 characters.');return}up.disabled=true;fb('');LSFCloud.signUp(em,pw).then(function(){return afterAuth(true)}).catch(function(e){up.disabled=false;no('❌ '+esc(e.message||'Could not create the account. Check your internet and try again.'))})};
  if(inn)inn.onclick=function(){var em=($('cloudEmail').value||'').trim(),pw=$('cloudPass').value||'';if(!em||!pw){no('❌ Please enter your email and password.');return}inn.disabled=true;fb('');LSFCloud.signIn(em,pw).then(function(){return afterAuth(false)}).catch(function(e){inn.disabled=false;no('❌ '+esc(e.message||'Could not sign in. Check the email and password.'))})};
  if(sync)sync.onclick=function(){LSFCloud._hold=false;sync.disabled=true;LSFCloud.push().then(function(){sync.disabled=false;ok('✅ Progress saved to your account.');var st=$('cloudStatus');if(st)st.textContent=cloudStatusText()}).catch(function(e){sync.disabled=false;no('❌ '+esc(e.message||'Sync failed — check your internet and try again.'))})};
  if(out)out.onclick=function(){LSFCloud.signOut();if((location.hash||'').indexOf('account')>=0){renderAccount()}else{renderProgress()}showNotice('Signed out. Progress on this device is untouched.')};
}
function placeSegInds(scope){
  if(!scope||!scope.querySelectorAll)return;
  var segs=scope.querySelectorAll('.seg');
  for(var i=0;i<segs.length;i++){
    (function(seg){
      if(!seg.querySelector)return;
      var on=seg.querySelector('button.on');if(!on)return;
      var ind=seg.querySelector('.segind');
      if(!ind){ind=document.createElement('span');ind.className='segind';seg.insertBefore(ind,seg.firstChild)}
      seg.classList.add('hasind');
      ind.style.left=on.offsetLeft+'px';ind.style.width=on.offsetWidth+'px';
      if(!seg._indWired){seg._indWired=true;seg.addEventListener('click',function(){setTimeout(function(){placeSegInds(scope)},30)})}
    })(segs[i]);
  }
}
function wireAppSettings(){
  var a=$('mmEn'),b=$('mmRoman'),c=$('mmUrdu');
  if(a)a.onclick=function(){setMeanMode('en')};
  if(b)b.onclick=function(){setMeanMode('roman')};
  if(c)c.onclick=function(){setMeanMode('urdu')};
  var d=$('darkToggle');
  if(d){d.checked=!!ST.dark;d.onchange=function(){ST.dark=this.checked;save();applyDark()}}
  var n=$('spNormal'),s=$('spSlow');
  if(n)n.onclick=function(){setSpeed(false)};
  if(s)s.onclick=function(){setSpeed(true)};
  applyUr();
  if(n&&s){n.classList.toggle('on',!slowMode);s.classList.toggle('on',slowMode)}
  placeSegInds($('appSettingsCard'));
}
function syncSetModal(){
  applyUr();
  var d=$('setDark');if(d)d.checked=!!ST.dark;
  var n=$('setSpNormal'),s=$('setSpSlow');
  if(n&&s){n.classList.toggle('on',!slowMode);s.classList.toggle('on',slowMode)}
  placeSegInds($('setModal'));
}
function wireSettingsModal(){
  var g=$('gearBtn'),m=$('setModal');if(!g||!m)return;
  g.onclick=function(){m.classList.add('show');setTimeout(syncSetModal,30)};
  var c=$('setClose');if(c)c.onclick=function(){m.classList.remove('show')};
  m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('show')});
  var a=$('setEn'),b=$('setRoman'),u=$('setUrdu');
  if(a)a.onclick=function(){setMeanMode('en')};
  if(b)b.onclick=function(){setMeanMode('roman')};
  if(u)u.onclick=function(){setMeanMode('urdu')};
  var d=$('setDark');
  if(d)d.onchange=function(){ST.dark=this.checked;save();applyDark()};
  var n=$('setSpNormal'),s=$('setSpSlow');
  if(n)n.onclick=function(){setSpeed(false)};
  if(s)s.onclick=function(){setSpeed(true)};
}
function renderProgress(){
  var doneN=Object.keys(ST.done).length;var knownN=Object.keys(ST.known).length;
  var h='<div class="card"><h2 style="font-size:1.2rem">📊 My Progress</h2>';
  h+='<div class="grid2" style="margin-top:10px"><div class="pronbox" style="margin:0;text-align:center"><div style="font-size:1.7rem;font-weight:800;font-family:Outfit">🔥 '+ST.streak+'</div><div class="muted">day streak</div></div><div class="pronbox" style="margin:0;text-align:center"><div style="font-size:1.7rem;font-weight:800;font-family:Outfit">'+doneN+' / '+LESSONS.length+'</div><div class="muted">lessons completed</div></div><div class="pronbox" style="margin:0;text-align:center"><div style="font-size:1.7rem;font-weight:800;font-family:Outfit">'+knownN+'</div><div class="muted">words marked "Know it"</div></div><div class="pronbox" style="margin:0;text-align:center"><div style="font-size:1.7rem;font-weight:800;font-family:Outfit">'+ST.totalDays+'</div><div class="muted">total practice days</div></div></div>';
  h+='<p class="muted" style="margin-top:12px">Lesson progress</p><div class="progressbar"><div style="width:'+(doneN/LESSONS.length*100)+'%"></div></div>';
  h+='<p class="muted">Flashcard progress</p><div class="progressbar"><div style="width:'+(FLASH.length?(knownN/FLASH.length*100):0)+'%;background:var(--orange)"></div></div>';
  h+='</div>';
  h+='<div class="card"><h3>📄 My pages</h3><div class="grid2"><button class="btn" type="button" data-route="#/badges">🏅 Badges &amp; Certificates page</button><button class="btn orange" type="button" data-route="#/settings">⚙️ Settings &amp; Backup page</button></div></div>';
  /* Weekly goal + 7-day graph */
  var days=['Su','Mo','Tu','We','Th','Fr','Sa'];var bars='';var weekCount=0;
  for(var di=6;di>=0;di--){var dd=new Date();dd.setDate(dd.getDate()-di);var ds=dd.getFullYear()+'-'+(dd.getMonth()+1)+'-'+dd.getDate();var on=!!ST.dayLog[ds];if(on)weekCount++;bars+='<div class="weekbar"><div class="col'+(on?' on':'')+'" style="height:'+(on?72:14)+'px"></div><span>'+days[dd.getDay()]+(di===0?' •':'')+'</span></div>'}
  h+='<div class="card"><h3>📅 Weekly goal</h3><p class="muted">Practised <b>'+weekCount+' of '+ST.weekGoal+' days</b> in the last 7 days.'+(weekCount>=ST.weekGoal?' 🎉 Goal reached — amazing!':'')+'</p><div class="weekbars">'+bars+'</div>';
  h+='<label class="muted" style="font-weight:600">My weekly goal</label><div class="seg" style="margin:6px 0 2px">';
  [3,5,7].forEach(function(g){h+='<button type="button" data-goal="'+g+'" class="'+(ST.weekGoal===g?'on':'')+'">'+g+' days / week</button>'});
  h+='</div></div>';
  /* Streak calendar */
  h+=streakCalendarHtml();
  /* Daily minutes goal */
  var tMin2=todayMinutes();
  h+='<div class="card"><h3>⏱️ Daily minutes goal</h3><p class="muted">Today: <b>'+tMin2+' of '+(ST.minutesGoal||15)+' minutes</b> practised.</p><div class="progressbar"><div style="width:'+Math.min(100,tMin2/(ST.minutesGoal||15)*100)+'%;background:var(--orange)"></div></div><label class="muted" style="font-weight:600">My daily goal</label><div class="seg" style="margin:6px 0 2px">';
  [10,15,20].forEach(function(g){h+='<button type="button" data-mgoal="'+g+'" class="'+((ST.minutesGoal||15)===g?'on':'')+'">'+g+' min</button>'});
  h+='</div><p class="muted" style="margin-top:8px">Honest note: this counts time while the app is open and being used — it pauses when you stop touching the app or switch away.</p></div>';
  /* Badges */
  var perfectExam=ST.scores.some(function(s){return /Final Exam|Mock Exam/.test(s.name)&&s.total>=20&&s.score===s.total});
  var badges=[
    ['🎓','First Lesson',doneN>=1,'Pass any lesson quiz'],
    ['🔥','7-Day Streak',(ST.maxStreak||ST.streak)>=7,'Practise 7 days in a row'],
    ['📚','100 Words Known',knownN>=100,'Mark 100 flashcards "Know it"'],
    ['✍️','Verb Master',ST.verbPasses>=10,'Pass 10 conjugation quizzes ('+ST.verbPasses+'/10)'],
    ['🏅','First 500 Words',knownN>=500,'Mark 500 flashcards "Know it" ('+knownN+'/500)'],
    ['💯','Perfect Exam',perfectExam,'Score 100% on any final or mock exam'],
    ['📅','30-Day Streak',(ST.maxStreak||0)>=30,'Practise 30 days in a row (your best: '+(ST.maxStreak||0)+')'],
    ['🌅','Early Bird',!!ST.earlyBird,'Pass a lesson quiz before 8 AM'],
    ['🦉','Night Owl',!!ST.nightOwl,'Pass a lesson quiz after 11 PM'],
    ['🎮','Game Champion',(ST.wmWins||0)>=10,'Win Word Match 10 times ('+(ST.wmWins||0)+'/10)'],
    ['🏆','Challenge Winner',!!ST.challengeWinner,'Complete a Weekly Challenge (new one every Monday)'],
    ['🎓','Verb Grand Master',!!ST.verbExamPassed,'Pass the Verb Grand Exam ('+(ST.verbExamBest||0)+'/20 best)']];
  h+='<div class="card"><h3>🏅 My Badges</h3><div class="badgerow">';
  badges.forEach(function(b){h+='<div class="badgebox'+(b[2]?'':' off')+'"><div class="ic">'+b[0]+'</div><b>'+b[1]+'</b><div class="muted" style="font-size:.8rem">'+(b[2]?'✓ Earned!':b[3])+'</div></div>'});
  h+='</div><p class="muted" style="margin-top:10px">⏱️ Timed quiz best: <b>'+ST.timedBest+'</b> correct in 60s · 🎓 A1 Exam: <b>'+(ST.examPassed?'Passed ✓ (best '+ST.examBest+'/20)':'best '+(ST.examBest||0)+'/20 — pass is 14')+'</b> · 🎓 A2 Exam: <b>'+(ST.exam2Passed?'Passed ✓ (best '+ST.exam2Best+'/20)':(ST.done[30]?'best '+(ST.exam2Best||0)+'/20 — pass is 14':'unlocks after Lesson 30'))+'</b> · 🎓 B1 Exam: <b>'+(ST.exam3Passed?'Passed ✓ (best '+ST.exam3Best+'/20)':(ST.done[40]?'best '+(ST.exam3Best||0)+'/20 — pass is 14':'unlocks after Lesson 40'))+'</b> · 🎓 B2 Exam: <b>'+(ST.exam4Passed?'Passed ✓ (best '+ST.exam4Best+'/20)':(ST.done[50]?'best '+(ST.exam4Best||0)+'/20 — pass is 14':'unlocks after Lesson 50'))+'</b> · 📝 Mock best: <b>'+(ST.mockBest||0)+'/25</b> · 🔁 Mistakes waiting: <b>'+ST.mistakes.length+'</b></p></div>';
  h+=weaknessHtml();
  h+=challengeCardHtml();
  h+=shareLevelHtml();
  h+=settingsHtml();
  if(ST.examPassed&&ST.exam2Passed&&ST.exam3Passed&&ST.exam4Passed){h+=grandCert2Html()}
  else if(ST.examPassed&&ST.exam2Passed&&ST.exam3Passed){h+=grandCertHtml()}
  h+='<div class="card"><h3>🏅 Quiz score history</h3>';
  if(!ST.scores.length){h+='<p class="muted">No quizzes yet. Finish Lesson 1\'s quiz and your scores will appear here.</p>'}
  else{var rev=ST.scores.slice().reverse();h+='<table><tr><th>Quiz</th><th>Score</th><th>Date</th></tr>';rev.slice(0,20).forEach(function(s){h+='<tr><td>'+esc(s.name)+'</td><td><b>'+s.score+' / '+s.total+'</b></td><td class="muted">'+esc(s.date)+'</td></tr>'});h+='</table>'}
  h+='</div>';
  h+='<div class="card"><h3>✔️ Lessons completed</h3>';
  if(!doneN){h+='<p class="muted">None yet — Lesson 1 is waiting for you. ¡Vamos!</p>'}
  else{h+='<div class="chiprow">';LESSONS.forEach(function(L){if(ST.done[L.n])h+='<span class="chip on">✓ '+L.n+'. '+esc(L.t)+'</span>'});h+='</div>'}
  h+='<p class="muted" style="margin-top:12px">Progress is saved on this device, in this browser (localStorage) — and in your cloud account below, if you are signed in. Clearing browser data clears the on-device copy.</p>';
  h+='<button class="btn" id="resetBtn" type="button" style="background:var(--red)">🗑️ Reset all progress</button></div>';
  h+='<div class="card" id="appSettingsCard"><h3>⚙️ App settings — Reading & Sound Settings</h3><p class="muted">Meanings language, dark mode and speaking speed used to sit on every page. They live here now — set once, remembered everywhere. The same controls also open from the ⚙️ gear at the top of every page.</p><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><span class="pill">Meanings: <span class="seg"><button id="mmEn" type="button">English</button><button id="mmRoman" type="button">Roman Urdu</button><button id="mmUrdu" type="button">اردو</button></span></span><label class="pill"><input type="checkbox" id="darkToggle" class="switch" aria-label="Dark mode"> 🌙 Dark mode</label><span class="pill">🔊 Speed: <span class="seg"><button id="spNormal" type="button">Normal</button><button id="spSlow" type="button">Slow</button></span></span></div></div>';
  h+=cloudCardHtml();
  h+='<div class="card"><h3>💾 Backup my progress (file)</h3><p class="muted">Moving to a new phone or browser? Download your progress as one small file, then restore it on the other device. <b>Honest note:</b> this is a manual file backup, separate from the cloud account above — downloading it uploads nothing; the file stays in your hands.</p><div class="grid2"><button class="btn" id="expBtn" type="button">⬇️ Download my progress</button><button class="btn ghost" id="impBtn" type="button">⬆️ Restore progress</button></div><button class="btn" id="appDlBtn" type="button" style="width:100%;margin-top:10px;min-height:48px">⬇ Download app file</button><p class="muted" style="margin:6px 0 0">Saves a copy of this app page itself (for backup or moving it to another host). Your progress is not inside this file — progress stays on this device.</p><div id="appDlFb"></div><input type="file" id="impFile" accept=".json,application/json" style="display:none"><div id="impFb"></div></div>';
  $('tab-progress').innerHTML=h;
  $('expBtn').onclick=function(){
    var blob=new Blob([LSFStore.exportText(ST)],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='learn-spanish-progress.json';document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},400);
    $('impFb').innerHTML='<div class="feedback ok" style="margin-top:10px">✅ Backup file downloaded: <b>learn-spanish-progress.json</b> — keep it safe (WhatsApp it to yourself or save it in your files).</div>';
  };
  var appDlBtn=$('appDlBtn');
  if(appDlBtn){appDlBtn.onclick=function(){
    function doDownload(text){
      try{
        var blob=new Blob([text],{type:'text/html'});
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a');a.href=url;a.download='learn-spanish-with-farrakh.html';document.body.appendChild(a);a.click();
        setTimeout(function(){URL.revokeObjectURL(url);a.remove()},600);
        showNotice('Download started: learn-spanish-with-farrakh.html — a copy of this app page. Check your downloads folder.');
        var fb=$('appDlFb');if(fb)fb.innerHTML='<div class="feedback ok" style="margin-top:10px">✅ Download started: <b>learn-spanish-with-farrakh.html</b> — check your downloads folder.<button type="button" aria-label="Close" style="float:right;background:transparent;border:none;font-size:1rem;cursor:pointer" onclick="this.parentElement.remove()">✕</button></div>';
      }catch(e){
        showNotice('The download could not start in this view. If you are inside a restricted in-app view, open this page in your browser and tap the button again.');
        var fb2=$('appDlFb');if(fb2)fb2.innerHTML='<div class="feedback no" style="margin-top:10px">❌ The download could not start in this view. If you are inside a restricted in-app view, open this page in your browser (Chrome) and tap the button again.</div>';
      }
    }
    function fallback(){doDownload('<!DOCTYPE html>\n'+document.documentElement.outerHTML)}
    try{
      fetch(window.location.href).then(function(r){if(!r.ok)throw new Error('fetch failed');return r.text()}).then(function(t){doDownload(t)}).catch(function(){fallback()});
    }catch(e){fallback()}
  }}
  $('impBtn').onclick=function(){$('impFile').click()};
  wireCloudCard();
  wireAppSettings();
  $('impFile').addEventListener('change',function(){
    var f=this.files&&this.files[0];if(!f)return;
    var rd=new FileReader();
    rd.onload=function(){
      try{
        var data=JSON.parse(rd.result);
        var fresh=defState();
        var shapeOk=data&&typeof data==='object'&&!Array.isArray(data);
        if(shapeOk){for(var dk in fresh){if(!(dk in data))continue;if(typeof data[dk]!==typeof fresh[dk]||(typeof fresh[dk]==='object'&&Array.isArray(fresh[dk])!==Array.isArray(data[dk]))){shapeOk=false;break}}}
        if(shapeOk){for(var nk in data.done){if(typeof data.done[nk]!=='boolean')shapeOk=false}for(var kk in data.known){if(typeof data.known[kk]!=='boolean')shapeOk=false}if(!Array.isArray(data.scores)||!Array.isArray(data.mistakes))shapeOk=false}
        if(!shapeOk){$('impFb').innerHTML='<div class="feedback no" style="margin-top:10px">❌ That file does not look like a complete Learn Spanish progress backup (missing or damaged fields). Nothing was changed.</div>';return}
        var clean={};for(var ck in fresh){clean[ck]=(ck in data)?data[ck]:fresh[ck]}
        if(clean.scores.length>100)clean.scores=clean.scores.slice(-100);
        if(clean.mistakes.length>200)clean.mistakes=clean.mistakes.slice(-200);
        askConfirm('Restore this progress?','Your current progress on this device will be replaced by the backup file. The page will then reload with the restored progress.',function(){
          if(!LSFStore.importText(JSON.stringify(clean))){$('impFb').innerHTML='<div class="feedback no" style="margin-top:10px">❌ Could not save the restored progress (storage full or blocked). Nothing was changed.</div>';return}
          location.reload();
        });
      }catch(e){$('impFb').innerHTML='<div class="feedback no" style="margin-top:10px">❌ Could not read that file. Nothing was changed.</div>'}
    };
    rd.readAsText(f);this.value='';
  });
  document.querySelectorAll('[data-goal]').forEach(function(b){b.addEventListener('click',function(){ST.weekGoal=parseInt(b.getAttribute('data-goal'),10);save();renderProgress()})});
  document.querySelectorAll('[data-mgoal]').forEach(function(b){b.addEventListener('click',function(){ST.minutesGoal=parseInt(b.getAttribute('data-mgoal'),10);save();renderProgress()})});
  wireProgressExtras();
  wireRouteLinks($('tab-progress'));
  $('resetBtn').onclick=function(){askConfirm('Reset all progress?','This will delete your lesson progress, streak, quiz scores and known words on this device. This cannot be undone.',function(){
    setST(defState());save();buildQueue();updateTop();applyDark();hgWins=0;hgLosses=0;renderProgress();renderHome();renderLessons();renderCards();renderVerbs();renderQuizHome();renderSpeak();showNotice('All progress has been reset. Fresh start — Lesson 1 is open!');
  })};
}
/* ============ IRREGULAR VERBS PACK ============ */
var irrDrill=null;
function verbById(id){for(var i=0;i<VERBS.length;i++){if(VERBS[i].id===id)return VERBS[i]}return null}
function renderIrregulars(){
  var b=$('irrBody');if(!b)return;
  var h='<div class="card" id="irrCard"><h3>⚡ Irregular Verbs Pack</h3><p class="muted">The 12 famous irregular verbs, grouped by pattern. The patterns are the secret: learn the group, and the forms follow. Tap the orange speaker button to hear every form.</p>';
  IRREG.forEach(function(g){
    h+='<h4 style="margin:14px 0 4px">'+esc(g[0])+'</h4><p class="muted" style="margin:2px 0 8px">'+esc(g[1])+'</p>';
    g[2].forEach(function(id){
      var v=verbById(id);if(!v)return;
      h+='<div style="border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin:7px 0"><div style="display:flex;gap:8px;align-items:center"><div style="flex:1"><span class="es">'+esc(v.inf)+'</span> <span class="en">'+esc(v.en)+'</span></div>'+speakBtn(v.inf,true)+'</div>';
      h+='<div class="chiprow" style="margin-top:6px">';
      v.forms.forEach(function(f,i){h+='<span class="chip" style="cursor:pointer" data-say="'+esc(PRON[i]+' '+f)+'" title="Tap to hear">'+PRON[i]+' <b>'+esc(f)+'</b> 🔊</span>'});
      h+='</div></div>';
    });
  });
  h+='<div id="irrDrillBody" style="margin-top:12px"><button class="btn orange" id="irrStart" type="button" style="width:100%">⚡ Drill me — 5 irregular questions</button></div></div>';
  b.innerHTML=h;
  $('irrStart').onclick=function(){irrDrill={q:0,score:0,cur:irrQ()};renderIrrDrill()};
}
function irrQ(){
  var id=IRREG_IDS[Math.floor(Math.random()*IRREG_IDS.length)];var v=verbById(id);var p=Math.floor(Math.random()*6);
  var correct=v.forms[p];var opts=[correct];
  while(opts.length<4){var rv=verbById(IRREG_IDS[Math.floor(Math.random()*IRREG_IDS.length)]);var f=rv.forms[Math.floor(Math.random()*6)];if(opts.indexOf(f)<0)opts.push(f)}
  return{q:'Verb: '+v.inf+' ('+v.en+') — "'+PRON[p]+' ___" ?',opts:shuffle(opts),ans:correct,exp:v.inf+' → '+PRON[p]+' '+correct};
}
function renderIrrDrill(){
  var b=$('irrDrillBody');if(!b||!irrDrill)return;
  if(irrDrill.q>=5){
    b.innerHTML='<div class="feedback '+(irrDrill.score>=4?'ok':'no')+'">⚡ Drill done: <b>'+irrDrill.score+' / 5</b>. '+(irrDrill.score>=4?'The irregulars are becoming yours!':'Check the tables above once more, then drill again.')+'</div><button class="btn orange" id="irrStart2" type="button" style="width:100%">↻ Drill again</button>';
    $('irrStart2').onclick=function(){irrDrill={q:0,score:0,cur:irrQ()};renderIrrDrill()};touchDay();return;
  }
  var q=irrDrill.cur;
  var h='<p class="muted" style="margin:4px 0">Drill '+(irrDrill.q+1)+' of 5 · Score: '+irrDrill.score+'</p><p style="font-weight:700">'+esc(q.q)+'</p>';
  q.opts.forEach(function(o){h+='<button type="button" class="opt" data-iopt="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="irrFb"></div>';b.innerHTML=h;
  document.querySelectorAll('[data-iopt]').forEach(function(btn){btn.addEventListener('click',function(){
    var ok=btn.getAttribute('data-iopt')===q.ans;
    document.querySelectorAll('[data-iopt]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-iopt')===q.ans)x.classList.add('correct')});
    if(!ok){btn.classList.add('wrong');saveMistake('Irregular drill: '+q.q,q.exp)}else irrDrill.score++;
    $('irrFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(q.ans)+'</b>. '+esc(q.exp))+'</div><button class="btn" id="irrNext" type="button" style="width:100%">Next →</button>';
    $('irrNext').onclick=function(){irrDrill.q++;irrDrill.cur=irrQ();renderIrrDrill()};
  })});
}
/* ============ A2 FINAL EXAM ============ */
var ex2State=null;
function startExam2(){
  if(!ST.done[30]){
    $('tab-quiz').innerHTML='<div class="card"><h3>🎓 Final Exam — Level A2 🔒</h3><p class="muted">This exam unlocks when you pass <b>Lesson 30 (Story Telling)</b> — the last lesson of the A2 path (Lessons 21–30). Keep going, lesson by lesson: each quiz you pass opens the next.</p><button class="btn" onclick="renderLessons();goTab(\'lessons\')" type="button">📚 Go to my lessons</button> <button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div>';
    return;
  }
  var pool=[];
  LESSONS.slice(20,30).forEach(function(L){L.quiz.forEach(function(q){pool.push({q:'[Lesson '+L.n+'] '+q[0],opts:q[1],ans:q[1][q[2]],exp:q[3]})})});
  ex2State={items:shuffle(pool).slice(0,20),q:0,score:0};
  renderExam2Q();
}
function renderExam2Q(){
  var wrap=$('tab-quiz');
  if(ex2State.q>=ex2State.items.length){
    var pass=ex2State.score>=14;
    if(ex2State.score>(ST.exam2Best||0))ST.exam2Best=ex2State.score;
    if(pass)ST.exam2Passed=true;
    pushScore('Final Exam A2',ex2State.score,20);save();if(pass)fireConfetti();
    var h='';
    if(pass){h+='<div class="cert"><div class="seal">🏆</div><div class="kicker">Certificate of Completion</div><h2 style="font-size:1.5rem;margin:6px 0">Level A2 Complete</h2><p style="font-size:1.05rem;margin:4px 0"><b>Farrakh</b> has passed the Spanish A2 Final Exam</p><p class="muted">Score: '+ex2State.score+' / 20 · '+todayStr()+' · Learn Spanish with Farrakh</p><p style="font-size:1.3rem" class="es">¡Enhorabuena, Farrakh! De A1 a A2 🎉</p><p class="muted">📸 Take a screenshot of this card to keep your certificate.</p></div>'}
    else{h+='<div class="card"><h3>🎓 A2 Final Exam — not passed yet</h3><p style="font-size:1.15rem"><b>Score: '+ex2State.score+' / 20</b> — you need 14 to pass.</p><div class="feedback no">So close! Review mistakes from Lessons 21–30, redo a lesson or two, and try again. Paso a paso.</div></div>'}
    h+='<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startExam2()" type="button">↻ Take exam again</button>'+(pass?certDlBtn('A2',ex2State.score):'')+'<button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';
    wrap.innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});return;
  }
  var it=ex2State.items[ex2State.q];
  var h='<div class="card"><p class="muted" style="margin-top:0">🎓 Final Exam A2 · Question '+(ex2State.q+1)+' of 20 · Score: '+ex2State.score+' · Pass = 14</p><div class="progressbar"><div style="width:'+(ex2State.q/20*100)+'%"></div></div>';
  h+='<p style="font-weight:700;font-size:1.03rem;margin-top:10px">'+esc(it.q)+'</p>';
  it.opts.forEach(function(o){h+='<button type="button" class="opt" data-ex2="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="ex2Fb"></div></div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-ex2]').forEach(function(b){b.addEventListener('click',function(){
    var ok=b.getAttribute('data-ex2')===it.ans;
    document.querySelectorAll('[data-ex2]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-ex2')===it.ans)x.classList.add('correct')});
    if(!ok)b.classList.add('wrong');else ex2State.score++;
    if(!ok)saveMistake('A2 Exam: '+it.q,'Correct: '+it.ans+'. '+it.exp);
    $('ex2Fb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(it.ans)+'</b>. '+esc(it.exp))+'</div><button class="btn" id="ex2Next" type="button" style="width:100%">'+(ex2State.q+1>=20?'See my result →':'Next question →')+'</button>';
    $('ex2Next').onclick=function(){ex2State.q++;renderExam2Q();window.scrollTo({top:0,behavior:'smooth'})};
  })});
}
/* ============ WORD MATCH GAME ============ */
var wmState=null, wmTimer=null;
function startWordMatch(){
  if(wmTimer)clearInterval(wmTimer);
  var pool=shuffle(uniqMeanings(dedupeFlash(FLASH.filter(function(f){return f.es.indexOf(' ')<0||f.es.length<=14})))).slice(0,6);
  if(pool.length<6)pool=shuffle(uniqMeanings(dedupeFlash(FLASH.slice()))).slice(0,6);
  wmState={words:pool,meanings:shuffle(pool.map(function(f){return f.en})),selW:null,selM:null,done:{},mistakes:0,sec:0};
  renderWordMatch();
  wmTimer=setInterval(function(){wmState.sec++;var t=$('wmTime');if(t)t.textContent=wmState.sec;if(Object.keys(wmState.done).length>=wmState.words.length){clearInterval(wmTimer);wmTimer=null}},1000);
}
function renderWordMatch(){
  var wrap=$('tab-quiz');var s=wmState;
  var matched=Object.keys(s.done).length;
  var h='<button class="btn ghost small" onclick="if(window.wmTimer){clearInterval(wmTimer);wmTimer=null}renderQuizHome()" type="button">← Quiz Zone</button><div class="card"><p class="muted" style="margin-top:0">🧩 Word Match · Matched: <b>'+matched+' / '+s.words.length+'</b> · Mistakes: <b>'+s.mistakes+'</b> · Time: <b><span id="wmTime">'+s.sec+'</span>s</b></p>';
  h+='<p class="muted">Tap a Spanish word, then tap its meaning.</p><div class="wmgrid"><div>';
  s.words.forEach(function(f,i){h+='<button type="button" class="wmbtn" data-wmw="'+i+'" '+(s.done[f.es]?'disabled':'')+' style="width:100%;margin:4px 0" >'+esc(f.es)+'</button>'});
  h+='</div><div>';
  s.meanings.forEach(function(m){var doneM=s.words.some(function(f){return f.en===m&&s.done[f.es]});h+='<button type="button" class="wmbtn" data-wmm="'+esc(m)+'" '+(doneM?'disabled':'')+' style="width:100%;margin:4px 0">'+esc(m)+'</button>'});
  h+='</div></div><div id="wmFb"></div>';
  if(matched>=s.words.length){h+='<div class="feedback ok">🎉 All 6 matched in <b>'+s.sec+' seconds</b> with '+s.mistakes+' mistake'+(s.mistakes===1?'':'s')+'! '+(s.mistakes===0?'Perfect round — ¡perfecto!':'Speed + accuracy both grow with flashcards.')+'</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startWordMatch()" type="button">↻ New round</button><button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div>'}
  h+='</div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-wmw]').forEach(function(b){b.addEventListener('click',function(){
    document.querySelectorAll('[data-wmw]').forEach(function(x){x.classList.remove('sel')});
    b.classList.add('sel');wmState.selW=wmState.words[parseInt(b.getAttribute('data-wmw'),10)];checkMatch();
  })});
  document.querySelectorAll('[data-wmm]').forEach(function(b){b.addEventListener('click',function(){
    document.querySelectorAll('[data-wmm]').forEach(function(x){x.classList.remove('sel')});
    b.classList.add('sel');wmState.selM=b.getAttribute('data-wmm');checkMatch();
  })});
  function checkMatch(){
    if(!wmState.selW||!wmState.selM)return;
    var w=wmState.selW,m=wmState.selM;wmState.selW=null;wmState.selM=null;
    if(w.en===m){wmState.done[w.es]=true;if(Object.keys(wmState.done).length>=wmState.words.length){if(wmTimer){clearInterval(wmTimer);wmTimer=null}if(!wmState.counted){wmState.counted=true;ST.wmWins=(ST.wmWins||0)+1;save()}touchDay()}}
    else{wmState.mistakes++;saveMistake('Word Match: "'+w.es+'" means?','"'+w.es+'" = '+w.en+' ('+w.ur+')')}
    renderWordMatch();
  }
}
/* ============ AHORCADO (HANGMAN) ============ */
var hgState=null, hgWins=0, hgLosses=0; /* totals hydrate from ST inside renderHangman: ST is not yet assigned when this module evaluates (import cycle) */
function hgNorm(ch){return ch.toLowerCase().replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u').replace('ü','u')}
function startHangman(){
  var f=HG_WORDS[Math.floor(Math.random()*HG_WORDS.length)];
  hgState={word:f.es,en:f.en,ur:f.ur,guessed:{},wrong:0,max:7};
  renderHangman();
}
function renderHangman(){hgWins=ST.hgWins||0;hgLosses=ST.hgLosses||0;
  var wrap=$('tab-quiz');var s=hgState;
  var display=s.word.split('').map(function(ch){return s.guessed[hgNorm(ch)]?ch:'_'}).join('');
  var won=display.indexOf('_')<0;var lost=s.wrong>=s.max;
  var parts=['base','post','beam','rope','head','body','arms','legs'];
  var svg='<svg viewBox="0 0 120 110" style="width:130px;max-width:40vw" aria-hidden="true"><g stroke="#94a3b8" stroke-width="4" stroke-linecap="round">';
  if(s.wrong>=1)svg+='<line x1="10" y1="104" x2="60" y2="104"/>';
  if(s.wrong>=2)svg+='<line x1="25" y1="104" x2="25" y2="8"/>';
  if(s.wrong>=3)svg+='<line x1="25" y1="8" x2="80" y2="8"/>';
  if(s.wrong>=4)svg+='<line x1="80" y1="8" x2="80" y2="24"/>';
  svg+='</g>';
  if(s.wrong>=5)svg+='<circle cx="80" cy="33" r="9" fill="none" stroke="#f97316" stroke-width="3.5"/>';
  if(s.wrong>=6)svg+='<line x1="80" y1="42" x2="80" y2="66" stroke="#f97316" stroke-width="3.5" stroke-linecap="round"/>';
  if(s.wrong>=7)svg+='<g stroke="#f97316" stroke-width="3.5" stroke-linecap="round"><line x1="80" y1="50" x2="66" y2="58"/><line x1="80" y1="50" x2="94" y2="58"/><line x1="80" y1="66" x2="68" y2="84"/><line x1="80" y1="66" x2="92" y2="84"/></g>';
  svg+='</svg>';
  var h='<button class="btn ghost small" onclick="renderQuizHome()" type="button">← Quiz Zone</button><div class="card"><p class="muted" style="margin-top:0">🔤 Ahorcado · Wins: <b>'+hgWins+'</b> · Losses: <b>'+hgLosses+'</b> · Wrong guesses left: <b>'+(s.max-s.wrong)+'</b></p>';
  h+='<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div>'+svg+'</div><div style="flex:1;min-width:180px"><p class="muted" style="margin:2px 0">Meaning hint: <b>'+esc(s.en)+'</b> <span class="ur">('+esc(s.ur)+')</span></p><div class="hangword">'+esc(display)+'</div><button class="btn small orange" id="hgListen" type="button">🔊 Listen to the word (hint)</button></div></div>';
  if(won||lost){
    if(won&&!s.counted){s.counted=true;hgWins++;ST.hgWins=hgWins;save();touchDay()}
    if(lost&&!s.counted){s.counted=true;hgLosses++;ST.hgLosses=hgLosses;save()}
    h+='<div class="feedback '+(won?'ok':'no')+'">'+(won?'🎉 ¡Ganaste! You guessed <b>'+esc(s.word)+'</b> = '+esc(s.en)+'.':'💪 Round over — the word was <b>'+esc(s.word)+'</b> = '+esc(s.en)+' ('+esc(s.ur)+'). Listen to it and try the next one!')+' '+speakBtn(s.word)+'</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startHangman()" type="button">↻ New word</button><button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div>';
  }else{
    var rows=['abcdefghij','klmnñopqrs','tuvwxyz'];
    rows.forEach(function(r){h+='<div class="kbrow">';r.split('').forEach(function(ch){
      var used=s.guessed[ch];var inWord=s.word.toLowerCase().split('').some(function(c){return hgNorm(c)===ch});
      h+='<button type="button" class="kbkey'+(used?(inWord?' used-ok':' used-no'):'')+'" data-hg="'+ch+'" '+(used?'disabled':'')+'>'+ch+'</button>';
    });h+='</div>'});
  }
  h+='</div>';wrap.innerHTML=h;
  var lb=$('hgListen');if(lb)lb.onclick=function(){speak(s.word)};
  document.querySelectorAll('[data-hg]').forEach(function(b){b.addEventListener('click',function(){
    var ch=b.getAttribute('data-hg');hgState.guessed[ch]=true;
    var inWord=hgState.word.toLowerCase().split('').some(function(c){return hgNorm(c)===ch});
    if(!inWord)hgState.wrong++;
    renderHangman();
  })});
}
/* ============ NUMBERS & MONEY DRILL ============ */
var NUM_ONES=['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte'];
var NUM_TENS=['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
function numWords(n){
  if(n<0)return 'menos '+numWords(-n);
  if(n<21)return NUM_ONES[n];
  if(n<30){var V29=['veinte','veintiún','veintidós','veintitrés','veinticuatro','veinticinco','veintiséis','veintisiete','veintiocho','veintinueve'];return V29[n-20]}
  if(n<100){var t=Math.floor(n/10),r=n%10;return NUM_TENS[t]+(r?' y '+NUM_ONES[r]:'')}
  if(n<1000){var c=Math.floor(n/100),r2=n%100;var cw=c===1?(r2?'ciento':'cien'):(c===5?'quinientos':(c===7?'setecientos':(c===9?'novecientos':NUM_ONES[c]+'cientos')));return cw+(r2?' '+numWords(r2):'')}
  if(n<2000)return 'mil'+(n%1000?' '+numWords(n%1000):'');
  return String(n);
}
var ndState=null;
function numDrillRound(){
  var kind=Math.floor(Math.random()*3);
  if(kind===0){var p=Math.floor(Math.random()*480)+5;return{kind:'price',say:'Cuesta '+numWords(p)+' euros.',ask:'💶 You hear a PRICE. Type the number of euros (digits, e.g. 120).',accept:[String(p)],show:'Cuesta '+p+' euros — "Cuesta '+numWords(p)+' euros."',val:p}}
  if(kind===1){var H=1+Math.floor(Math.random()*12);var mm=[0,15,30,45][Math.floor(Math.random()*4)];
    var named=mm===45?(H%12+1):H;var part=mm===0?'en punto':(mm===15?'y cuarto':(mm===30?'y media':'menos cuarto'));
    var verb=named===1?'Es':'Son';var art=named===1?'la una':('las '+numWords(named));
    var dig=H+':'+(mm===0?'00':mm);var sayStr=verb+' '+art+' '+part;
    return{kind:'time',say:sayStr+'.',ask:'🕐 You hear a TIME. Type it as digits (e.g. 3:30).',accept:[dig,H+'.'+(mm===0?'00':mm)],show:'It is '+dig+' — "'+sayStr+'."',val:dig}}
  var day=1+Math.floor(Math.random()*28);var months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];var mo=Math.floor(Math.random()*12);
  return{kind:'date',say:'Es el '+numWords(day)+' de '+months[mo]+'.',ask:'📅 You hear a DATE. Type the day number and month (e.g. "5 mayo" or 5/5).',accept:[String(day)+' '+months[mo],day+'/'+(mo+1),String(day)+' '+String(mo+1)],show:'It is '+day+' '+months[mo]+' — "Es el '+numWords(day)+' de '+months[mo]+'."',val:day+'/'+(mo+1)};
}
function startNumDrill(){
  if(!ndState)ndState={score:0,total:0};
  ndState.cur=numDrillRound();
  renderNumDrill();
  setTimeout(function(){if(ndState&&ndState.cur)speak(ndState.cur.say)},350);
}
function renderNumDrill(){
  var wrap=$('tab-quiz');var c=ndState.cur;
  var h='<div class="card"><h3>🔢 Numbers &amp; Money Drill</h3><p class="muted" style="margin-top:0">Session score: <b>'+ndState.score+' / '+ndState.total+'</b> — this score lives only in this session, like real listening practice.</p>';
  h+='<p style="font-weight:700">'+esc(c.ask)+'</p>';
  h+='<button class="btn orange" id="ndPlay" type="button" style="width:100%">'+SPK_SVG_SM+' Play it again</button>';
  h+='<input type="text" id="ndInput" placeholder="Type your answer here..." style="margin-top:12px">';
  h+='<div id="ndFb"></div><button class="btn" id="ndCheck" type="button" style="width:100%;margin-top:10px">Check</button>';
  h+='<button class="btn ghost" id="ndNext" type="button" style="width:100%;margin-top:8px">↻ New one (skip)</button>';
  h+='<button class="btn ghost" onclick="renderQuizHome()" type="button" style="width:100%;margin-top:8px">Quiz Zone</button></div>';
  wrap.innerHTML=h;
  $('ndPlay').onclick=function(){speak(ndState.cur.say)};
  $('ndNext').onclick=function(){startNumDrill()};
  $('ndCheck').onclick=function(){
    var v=$('ndInput').value.trim().toLowerCase();
    var norm=v.replace(/\s+/g,' ');
    var good=ndState.cur.accept.some(function(a){return norm===String(a).toLowerCase()})||norm===ndState.cur.say.toLowerCase().replace(/[¿?¡!.,]/g,'').replace(/^cuesta |^son |^es /,'').trim();
    ndState.total++;if(good)ndState.score++;else saveMistake('Numbers drill: '+ndState.cur.say,'Correct: '+ndState.cur.show);
    $('ndFb').innerHTML='<div class="feedback '+(good?'ok':'no')+'" style="margin-top:10px">'+(good?'✅ Correct! ':'❌ Not quite. ')+esc(ndState.cur.show)+' '+speakBtn(ndState.cur.say)+'</div>';
    touchDay();
    $('ndCheck').disabled=true;
    $('ndNext').textContent='→ Next one';
  };
}
/* ============ LISTENING LIBRARY ============ */
var libState=null;
function renderLibrary(){
  syncRoute('#/listening');
  var h='<button class="btn ghost small" onclick="renderSpeak()" type="button">← Back to Speak</button>';
  h+='<div class="card"><h2 style="font-size:1.2rem">🎧 Listening Library</h2><p class="muted">20 short built-in passages. Listen at Normal or Slow speed first — then answer 3 questions about what you heard. The written text stays hidden until you tap "Show the text" to check yourself.</p></div>';
  LISTEN_LIB.forEach(function(p,i){h+='<button type="button" class="lessonitem" onclick="openPassage('+i+')"><span class="lring" style="background:#e8eef7"><i>'+(i+1)+'</i></span><span class="lt"><b>'+esc(p.t)+'</b><span class="muted">3 questions · slow + normal</span></span><span class="arr" style="color:var(--orange);font-weight:800">›</span></button>'});
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
}
function openPassage(i){
  syncRoute('#/listening/'+i);
  libState={p:LISTEN_LIB[i],q:0,score:0};
  var h='<button class="btn ghost small" onclick="renderLibrary()" type="button">← All passages</button>';
  h+='<div class="card"><div class="kicker">Listening Library · '+(i+1)+' of 20</div><h2 style="font-size:1.25rem;margin:4px 0">'+esc(libState.p.t)+'</h2>';
  h+='<div class="grid2"><button class="btn" id="libNormal" type="button">'+SPK_SVG_SM+' Play — Normal</button><button class="btn orange" id="libSlow" type="button">🐢 Play — Slow</button></div>';
  h+='<div id="libTextWrap" hidden><div class="dlg" style="margin-top:12px"><div class="es" style="font-size:1.05rem">'+esc(libState.p.txt)+'</div></div></div>';
  h+='<button class="btn ghost small" id="libShowText" type="button" style="margin-top:10px">👀 Show the text (check yourself after listening)</button>';
  h+='<p class="muted">Tip: play it twice and answer the questions before peeking at the text.</p><div id="libQuiz"></div></div>';
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
  $('libNormal').onclick=function(){var prev=slowMode;setSlowMode(false);speak(libState.p.txt);setSlowMode(prev)};
  $('libSlow').onclick=function(){var prev=slowMode;setSlowMode(true);speak(libState.p.txt);setSlowMode(prev)};
  $('libShowText').onclick=function(){var w=$('libTextWrap');if(w)w.hidden=false;this.hidden=true};
  renderLibQ();
}
function renderLibQ(){
  var b=$('libQuiz');if(!b||!libState)return;
  if(libState.q>=3){
    b.innerHTML='<div class="feedback '+(libState.score>=2?'ok':'no')+'">🎧 Passage done: <b>'+libState.score+' / 3</b>. '+(libState.score===3?'Perfect listening!':'Listen once more at Slow speed — every hearing makes it easier.')+'</div><button class="btn" onclick="renderLibrary()" type="button">← Choose another passage</button>';
    pushScore('Listening: '+libState.p.t,libState.score,3);save();touchDay();return;
  }
  var q=libState.p.qs[libState.q];
  var h='<p class="muted" style="margin:10px 0 2px">Question '+(libState.q+1)+' of 3</p><p style="font-weight:700">'+esc(q[0])+'</p>';
  q[1].forEach(function(o,oi){h+='<button type="button" class="opt" data-lib="'+oi+'">'+esc(o)+'</button>'});
  h+='<div id="libFb"></div>';b.innerHTML=h;
  document.querySelectorAll('[data-lib]').forEach(function(btn){btn.addEventListener('click',function(){
    var ok=parseInt(btn.getAttribute('data-lib'),10)===q[2];
    document.querySelectorAll('[data-lib]').forEach(function(x){x.disabled=true;if(parseInt(x.getAttribute('data-lib'),10)===q[2])x.classList.add('correct')});
    if(!ok){btn.classList.add('wrong');saveMistake('Listening ('+libState.p.t+'): '+q[0],'Correct: '+q[1][q[2]]+'. '+q[3])}else libState.score++;
    $('libFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(q[1][q[2]])+'</b>. ')+esc(q[3])+'</div><button class="btn" id="libNext" type="button" style="width:100%">'+(libState.q+1>=3?'Finish →':'Next question →')+'</button>';
    $('libNext').onclick=function(){libState.q++;renderLibQ()};
  })});
}
/* ============ DIALOGUE ROLE-PLAY ============ */
var rpState=null;
function renderRoleplays(){
  syncRoute('#/roleplay');
  var h='<button class="btn ghost small" onclick="renderSpeak()" type="button">← Back to Speak</button>';
  h+='<div class="card"><h2 style="font-size:1.2rem">🎭 Dialogue Role-Play</h2><p class="muted">The app plays the other person — speaking their lines aloud. You pick your reply from 3 choices. At the end you see the whole conversation. Wrong picks are saved to Review Mistakes.</p></div>';
  ROLEPLAYS.forEach(function(r,i){h+='<button type="button" class="lessonitem" onclick="startRoleplay('+i+')"><span class="lring" style="background:#e8eef7"><i>'+(i+1)+'</i></span><span class="lt"><b>'+esc(r.t)+'</b><span class="muted">'+r.turns.length+' exchanges · you play yourself</span></span><span class="arr" style="color:var(--orange);font-weight:800">›</span></button>'});
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
}
function startRoleplay(i){
  syncRoute('#/roleplay/'+i);
  rpState={r:ROLEPLAYS[i],turn:0,log:[],score:0};
  renderRpTurn();
  setTimeout(function(){if(rpState)speak(rpState.r.turns[0][0])},350);
}
function renderRpTurn(){
  var wrap=$('tab-speak');var s=rpState;
  var h='<button class="btn ghost small" onclick="renderRoleplays()" type="button">← All role-plays</button>';
  h+='<div class="card"><div class="kicker">'+esc(s.r.t)+' · Exchange '+(Math.min(s.turn+1,s.r.turns.length))+' of '+s.r.turns.length+'</div>';
  s.log.forEach(function(l){h+='<div class="rpline '+(l.who==='them'?'them':'me')+'"><div class="who" style="font-size:.72rem;font-weight:700;color:var(--blue)">'+(l.who==='them'?'🗣️ Them':'🙋 You')+'</div><div class="es" style="font-size:1.02rem">'+esc(l.es)+'</div><div class="en">'+esc(l.en)+'</div></div>'});
  if(s.turn>=s.r.turns.length){
    h+='<div class="feedback ok">🎉 Conversation complete! You scored '+s.score+' / '+s.r.turns.length+' first-try replies. Read the whole conversation above once more — that was YOU speaking Spanish in a real situation.</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startRoleplay('+ROLEPLAYS.indexOf(s.r)+')" type="button">↻ Play it again</button><button class="btn ghost" onclick="renderRoleplays()" type="button">All role-plays</button></div>';
    h+='</div>';wrap.innerHTML=h;touchDay();return;
  }
  var t=s.r.turns[s.turn];
  h+='<div class="rpline them"><div class="who" style="font-size:.72rem;font-weight:700;color:var(--blue)">🗣️ Them — tap the speaker button to hear again</div><div style="display:flex;gap:8px;align-items:flex-start"><div style="flex:1"><div class="es" style="font-size:1.05rem">'+esc(t[0])+'</div><div class="en">'+esc(t[1])+'</div></div>'+speakBtn(t[0],true)+'</div></div>';
  h+='<p style="font-weight:700;margin:10px 0 2px">🙋 Your reply — pick the right one:</p>';
  shuffle(t[2].map(function(c,ci){return ci})).forEach(function(ci){h+='<button type="button" class="opt" data-rp="'+ci+'">'+esc(t[2][ci])+' <span class="spk sm" data-say="'+esc(t[2][ci]).replace(/"/g,'&quot;')+'" role="button" aria-label="Listen" style="float:right">🔊</span></button>'});
  h+='<div id="rpFb"></div></div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-rp]').forEach(function(b){b.addEventListener('click',function(ev){
    if(ev.target.closest('[data-say]'))return;
    var pick=parseInt(b.getAttribute('data-rp'),10);var ok=pick===t[3];
    document.querySelectorAll('[data-rp]').forEach(function(x){x.disabled=true;if(parseInt(x.getAttribute('data-rp'),10)===t[3])x.classList.add('correct')});
    if(!ok){b.classList.add('wrong');saveMistake('Role-play ('+s.r.t+'): reply to "'+t[0]+'"','Correct reply: '+t[2][t[3]])}else s.score++;
    $('rpFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ ¡Perfecto! That is the natural reply.':'❌ The natural reply is: <b>'+esc(t[2][t[3]])+'</b> — listen to it and say it aloud.')+' '+speakBtn(t[2][t[3]],true)+'</div><button class="btn" id="rpNext" type="button" style="width:100%">'+(s.turn+1>=s.r.turns.length?'See the full conversation →':'Continue →')+'</button>';
    $('rpNext').onclick=function(){
      s.log.push({who:'them',es:t[0],en:t[1]});s.log.push({who:'me',es:t[2][t[3]],en:''});
      s.turn++;renderRpTurn();
      if(s.turn<s.r.turns.length)setTimeout(function(){speak(s.r.turns[s.turn][0])},300);
    };
  })});
}
/* ============ BRIDGE + PHRASEBOOK ============ */
function renderBridge(){
  syncRoute('#/bridge');
  var h='<button class="btn ghost small" onclick="renderSpeak()" type="button">← Back to Speak</button>';
  h+='<div class="card"><div class="kicker">🇵🇰 → 🇪🇸 Your real life, in Spanish</div><h2 style="font-size:1.25rem;margin:4px 0">Pakistan–Spain Bridge Phrases</h2><p class="muted">The sentences YOU will actually say when a Spanish speaker asks about your life — Pakistan, Urdu, cricket, food, family and your village. Learn these by heart; they start real friendships.</p></div>';
  h+='<div class="card">';
  BRIDGE.forEach(function(p){h+='<div class="wordrow"><div class="txt"><div class="es">'+esc(p[0])+'</div><div class="en">'+esc(p[1])+'</div><div class="ur">'+esc(p[2])+'</div></div>'+speakBtn(p[0])+'</div>'});
  h+='</div>';
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});touchDay();
}
function renderPhrasebook(filter){
  syncRoute('#/phrasebook');
  var h='<button class="btn ghost small" onclick="renderSpeak()" type="button">← Back to Speak</button>';
  h+='<div class="card"><div class="kicker">🆘 Travel safety net</div><h2 style="font-size:1.25rem;margin:4px 0">Survival Phrasebook — '+SURVIVAL.length+' phrases</h2><p class="muted">Emergency and travel phrases. Type to filter, tap any row (or 🔊) to hear it spoken — your pocket phrasebook in Spain.</p>';
  h+='<input type="text" id="pbSearch" placeholder="Type to filter… e.g. taxi, doctor, water" value="'+esc(filter||'')+'"></div>';
  h+='<div class="card" id="pbList"></div>';
  $('tab-speak').innerHTML=h;
  renderPhrasebookList(filter||'');
  if(!filter)window.scrollTo({top:0,behavior:'smooth'});
  var inp=$('pbSearch');var pbTimer=null;
  inp.addEventListener('input',function(){var v=this.value;if(pbTimer)clearTimeout(pbTimer);pbTimer=setTimeout(function(){renderPhrasebookList(v)},160)});
  touchDay();
}
function renderPhrasebookList(filter){
  var list=$('pbList');if(!list)return;
  var f=(filter||'').toLowerCase();var shown=0;var h='';
  SURVIVAL.forEach(function(p){
    if(f&&(p[0]+' '+p[1]+' '+p[2]).toLowerCase().indexOf(f)<0)return;
    shown++;
    h+='<div class="wordrow" data-say="'+esc(p[0])+'" style="cursor:pointer"><div class="txt"><div class="es">'+esc(p[0])+'</div><div class="en">'+esc(p[1])+'</div><div class="ur">'+esc(p[2])+'</div></div>'+speakBtn(p[0],true)+'</div>';
  });
  if(!shown)h+='<p class="muted">No phrases match "'+esc(filter||'')+'". Try a shorter word — taxi, agua, ayuda, médico.</p>';
  h+='<p class="muted" style="margin-top:8px">Showing '+shown+' of '+SURVIVAL.length+' phrases.</p>';
  list.innerHTML=h;
}
/* ============ ROUND 3: LEVEL MAP ============ */
function renderLevelMap(){
  syncRoute('#/levelmap');
  var cur=nextLessonIdx();var allDone=Object.keys(ST.done).length>=LESSONS.length;
  var h='<button class="btn ghost small" onclick="renderLessons();goTab(\'lessons\')" type="button">← Lesson list</button>';
  h+='<div class="card"><div class="kicker">Your path · A1 → B2</div><h2 style="font-size:1.25rem;margin:4px 0">🧭 Level Map — '+LESSONS.length+' stepping stones</h2><p class="muted">Green = done ✓ · Orange = where you are now · Grey = locked. Tap any open stone to jump straight into that lesson.</p></div>';
  var secs=[[0,20,'Level A1 — Lessons 1–20 · The basics'],[20,30,'Level A2 — Lessons 21–30 · Real life'],[30,40,'Level B1 — Lessons 31–40 · Independence'],[40,50,'Level B2 — Lessons 41–50 · Confidence']];
  secs.forEach(function(sc){
    h+='<div class="card"><h3 style="margin-bottom:10px">'+sc[2]+'</h3><div style="display:flex;flex-wrap:wrap;gap:10px">';
    for(var i=sc[0];i<sc[1];i++){var L=LESSONS[i];var done=!!ST.done[L.n];var unlocked=(i===0)||!!ST.done[LESSONS[i-1].n];
      var cls=done?'done':((!allDone&&i===cur)?'cur':(unlocked?'':'lock'));
      h+='<button type="button" class="mapnode '+cls+'" '+(unlocked?'data-maplesson="'+i+'"':'disabled')+' title="'+esc(L.t)+'" aria-label="Lesson '+L.n+': '+esc(L.t)+'">'+(done?'✓':(unlocked?L.n:'🔒'))+'</button>';
    }
    h+='</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">';
    for(var j=sc[0];j<sc[1];j++){h+='<span class="chip'+(ST.done[LESSONS[j].n]?' on':'')+'" style="font-size:.78rem">'+LESSONS[j].n+'. '+esc(LESSONS[j].t)+'</span>'}
    h+='</div></div>';
  });
  $('tab-lessons').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
  document.querySelectorAll('[data-maplesson]').forEach(function(b){b.addEventListener('click',function(){openLesson(parseInt(b.getAttribute('data-maplesson'),10))})});
}
/* ============ ROUND 3: GLOBAL SEARCH ============ */
function renderSearchResults(q){
  var box=$('gResults');var _pg=$('tab-page');if(_pg&&!_pg.hidden){var _alt=_pg.querySelector('#gResults');if(_alt)box=_alt}
  if(!box)return;
  q=(q||'').trim().toLowerCase();
  if(q.length<2){box.innerHTML='';return}
  var h='';var n=0;
  var words=[];for(var i=0;i<FLASH.length&&words.length<8;i++){var f=FLASH[i];if((f.es+' '+f.en+' '+f.ur).toLowerCase().indexOf(q)>=0)words.push(i)}
  if(words.length){h+='<h4 style="margin:12px 0 4px">🗂️ Words</h4>';words.forEach(function(i){var f=FLASH[i];n++;h+='<div class="wordrow"><div class="txt"><div class="es">'+esc(f.es)+'</div><div class="en">'+esc(f.en)+'</div><div class="ur">'+esc(f.ur)+'</div>'+uuLine(f.uu)+'<div class="muted">'+CATS[f.cat]+'</div></div>'+favStarBtn(i)+'<button class="btn small" type="button" data-srch="w:'+i+'">Open card</button></div>'})}
  var lw=[];LESSONS.forEach(function(L,li){L.words.forEach(function(w){if(lw.length<5&&(w[0]+' '+w[1]).toLowerCase().indexOf(q)>=0)lw.push(li)})});
  lw=[...new Set(lw)];
  var les=[];LESSONS.forEach(function(L,li){if((L.t+' '+L.sub).toLowerCase().indexOf(q)>=0)les.push(li)});
  var allLes=[...new Set(lw.concat(les))].slice(0,5);
  if(allLes.length){h+='<h4 style="margin:12px 0 4px">📚 Lessons</h4>';allLes.forEach(function(li){var L=LESSONS[li];n++;h+='<button type="button" class="lessonitem" data-srch="l:'+li+'"><span class="lt"><b>Lesson '+L.n+': '+esc(L.t)+'</b><span class="muted">'+esc(L.sub)+'</span></span><span class="arr">›</span></button>'})}
  var ph=[];SURVIVAL.concat(BRIDGE).forEach(function(p){if(ph.length<5&&(p[0]+' '+p[1]).toLowerCase().indexOf(q)>=0)ph.push(p)});
  if(ph.length){h+='<h4 style="margin:12px 0 4px">🆘 Phrases</h4>';ph.forEach(function(p){n++;h+='<div class="wordrow"><div class="txt"><div class="es">'+esc(p[0])+'</div><div class="en">'+esc(p[1])+'</div><div class="ur">'+esc(p[2])+'</div></div>'+speakBtn(p[0],true)+'<button class="btn small" type="button" data-srch="p:'+esc(p[0])+'">Open</button></div>'})}
  if(!n)h='<p class="muted" style="margin-top:10px">No matches for "'+esc(q)+'". Try a shorter word — taxi, agua, hola, doctor…</p>';
  box.innerHTML=h;
  box.querySelectorAll('[data-srch]').forEach(function(b){b.addEventListener('click',function(){
    var v=b.getAttribute('data-srch');var kind=v.charAt(0);var rest=v.slice(2);
    if(kind==='w'){var i=+rest;fcCat=FLASH[i].cat;buildQueue();var p=fcQueue.indexOf(i);if(p>=0)fcPos=p;fcFlipped=false;renderCards();goTab('cards')}
    else if(kind==='l'){openLesson(+rest)}
    else if(kind==='p'){goTab('speak');renderPhrasebook(rest)}
  })});
}
/* ============ ROUND 3: TRAP TRAINER ============ */
var trapState=null;
function renderTraps(){
  syncRoute('#/tool/traps');
  var h='<button class="btn ghost small" onclick="renderQuizHome()" type="button">← Quiz Zone</button>';
  h+='<div class="card"><div class="kicker">⚠️ Made for Urdu speakers</div><h2 style="font-size:1.25rem;margin:4px 0">Urdu-Speaker Trap Trainer</h2><p class="muted">'+TRAPS.length+' traps that catch almost every Urdu speaker: false friends, b/v and j/g sounds, gender surprises and ser/estar mix-ups. Learn the trap once — never fall in again.</p><button class="btn orange" id="trapQuizBtn" type="button" style="width:100%">🎯 Mini-quiz — 10 traps, can you spot the truth?</button></div>';
  TRAPS.forEach(function(t,i){
    h+='<div class="card"><p class="muted" style="margin-top:0">Trap '+(i+1)+' of '+TRAPS.length+'</p><p style="margin:4px 0"><span class="wm-no" style="text-decoration:none">✗ Wrong way:</span> <b>'+esc(t[0])+'</b></p><p style="margin:4px 0"><span class="wm-ok">✓ Right way:</span> '+esc(t[1])+'</p><p class="ur" style="margin:4px 0">🇵🇰 '+esc(t[2])+'</p></div>';
  });
  $('tab-quiz').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
  $('trapQuizBtn').onclick=function(){trapState={items:shuffle(TRAPS.slice()).slice(0,10),q:0,score:0};renderTrapQ()};
}
function renderTrapQ(){
  var wrap=$('tab-quiz');
  if(trapState.q>=trapState.items.length){
    pushScore('Trap Trainer quiz',trapState.score,trapState.items.length);save();
    wrap.innerHTML='<div class="card"><h3>⚠️ Trap quiz — finished!</h3><p style="font-size:1.15rem"><b>Score: '+trapState.score+' / '+trapState.items.length+'</b></p><div class="feedback '+(trapState.score>=7?'ok':'no')+'">'+(trapState.score>=7?'🎉 Sharp eyes! These traps will not catch you now.':'Good hunting! Read the trap list once more — each one you learn is a mistake you will never make in Spain.')+'</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="renderTraps()" type="button">📖 Trap list</button><button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';window.scrollTo({top:0,behavior:'smooth'});return;
  }
  var t=trapState.items[trapState.q];
  var others=shuffle(TRAPS.filter(function(x){return x!==t}));
  var opts=shuffle([t[1],'Nothing — the wrong way above is actually correct Spanish.',others[0][1]]);
  var h='<div class="card"><p class="muted" style="margin-top:0">⚠️ Trap quiz · '+(trapState.q+1)+' of '+trapState.items.length+' · Score: '+trapState.score+'</p>';
  h+='<p style="margin:6px 0"><span class="wm-no" style="text-decoration:none">✗ The trap:</span> <b>'+esc(t[0])+'</b></p><p style="font-weight:700">What is the truth?</p>';
  var correctIdx=opts.indexOf(t[1]);
  opts.forEach(function(o,oi){h+='<button type="button" class="opt" data-trap="'+oi+'">'+esc(o)+'</button>'});
  h+='<div id="trapFb"></div></div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-trap]').forEach(function(b){b.addEventListener('click',function(){
    var ok=parseInt(b.getAttribute('data-trap'),10)===correctIdx;
    document.querySelectorAll('[data-trap]').forEach(function(x){x.disabled=true;if(parseInt(x.getAttribute('data-trap'),10)===correctIdx)x.classList.add('correct')});
    if(!ok){b.classList.add('wrong');saveMistake('Trap: '+t[0],t[1]+' — '+t[2])}else trapState.score++;
    $('trapFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Exactly right!':'❌ The truth: '+esc(t[1]))+'<br><span class="ur">🇵🇰 '+esc(t[2])+'</span></div><button class="btn" id="trapNext" type="button" style="width:100%">'+(trapState.q+1>=trapState.items.length?'See result →':'Next trap →')+'</button>';
    $('trapNext').onclick=function(){trapState.q++;renderTrapQ();window.scrollTo({top:0,behavior:'smooth'})};
  })});
}
/* ============ ROUND 3: SYLLABLE TRAINER ============ */
var sylIdx=0;
function renderSyllables(){
  syncRoute('#/tool/syllables');
  var s=SYLLABLES[sylIdx%SYLLABLES.length];
  var h='<button class="btn ghost small" onclick="renderQuizHome()" type="button">← Quiz Zone</button>';
  h+='<div class="card"><div class="kicker">🔤 Big words, small pieces</div><h2 style="font-size:1.25rem;margin:4px 0">Syllable Trainer</h2><p class="muted">Long Spanish words are just small sounds in a line. Tap any syllable to hear it, then hear the whole word grow.</p>';
  h+='<div style="text-align:center;margin:16px 0 6px"><div style="display:flex;gap:7px;flex-wrap:wrap;justify-content:center">';
  s.parts.forEach(function(p){h+='<button type="button" class="sylchip" data-say="'+esc(p)+'">'+esc(p)+'</button>'});
  h+='</div><div class="es big" style="margin-top:12px">'+esc(s.w)+'</div><div class="en">'+esc(s.en)+'</div><div class="ur">'+esc(s.ur)+'</div></div>';
  h+='<div class="grid2"><button class="btn orange" id="sylSeq" type="button">🐢 Syllable by syllable, then whole</button><button class="btn" id="sylWhole" type="button">'+SPK_SVG_SM+' Whole word</button></div>';
  h+='<div class="grid2" style="margin-top:8px"><button class="btn ghost" id="sylPrev" type="button">← Previous</button><button class="btn ghost" id="sylNext" type="button">Next word →</button></div>';
  h+='<p class="muted" style="margin:12px 0 4px">Word '+(sylIdx%SYLLABLES.length+1)+' of '+SYLLABLES.length+' · Jump to any word:</p><div class="chiprow">';
  SYLLABLES.forEach(function(x,i){h+='<button type="button" class="chip'+(i===sylIdx%SYLLABLES.length?' on':'')+'" data-syljump="'+i+'">'+esc(x.w)+'</button>'});
  h+='</div></div>';
  $('tab-quiz').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
  $('sylWhole').onclick=function(){speak(s.w)};
  $('sylSeq').onclick=function(){var prevSlow=slowMode;setSlowMode(true);speakQueue(s.parts.concat([s.w]),function(){setSlowMode(prevSlow)})};
  $('sylPrev').onclick=function(){sylIdx=(sylIdx+SYLLABLES.length-1)%SYLLABLES.length;renderSyllables()};
  $('sylNext').onclick=function(){sylIdx=(sylIdx+1)%SYLLABLES.length;renderSyllables()};
  document.querySelectorAll('[data-syljump]').forEach(function(b){b.addEventListener('click',function(){sylIdx=parseInt(b.getAttribute('data-syljump'),10);renderSyllables()})});
}
/* ============ ROUND 3: B1 FINAL EXAM + GRAND CERTIFICATE ============ */
function grandCertHtml(){
  return '<div class="cert"><div class="seal">🌟</div><div class="kicker">Grand Certificate</div><h2 style="font-size:1.5rem;margin:6px 0">A1 → B1 Complete</h2><p style="font-size:1.05rem;margin:4px 0"><b>Farrakh</b> has passed all three final exams — A1, A2 and B1</p><p class="muted">Learn Spanish with Farrakh · '+todayStr()+'</p><p style="font-size:1.3rem" class="es">¡De A1 a B1 — qué viaje, Farrakh! 🎉</p><p class="muted">📸 Take a screenshot of this card to keep your grand certificate.</p>'+certDlBtn('A1 → B1',0)+'</div>';
}
var ex3State=null;
function startExam3(){
  if(!ST.done[40]){
    $('tab-quiz').innerHTML='<div class="card"><h3>🎓 Final Exam — Level B1 🔒</h3><p class="muted">This exam unlocks when you pass <b>Lesson 40 (My Life Story)</b> — the last lesson of the B1 path (Lessons 31–40). Each lesson quiz you pass opens the next one, the same rule as the A1 and A2 exams.</p><button class="btn" onclick="renderLessons();goTab(\'lessons\')" type="button">📚 Go to my lessons</button> <button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div>';
    return;
  }
  var pool=[];
  LESSONS.slice(30,40).forEach(function(L){L.quiz.forEach(function(q){pool.push({q:'[Lesson '+L.n+'] '+q[0],opts:q[1],ans:q[1][q[2]],exp:q[3]})})});
  var seenQ={},uniq=[];
  pool.forEach(function(p){var k=normAns(p.q);if(seenQ[k])return;seenQ[k]=1;uniq.push(p)});
  ex3State={items:shuffle(uniq).slice(0,20),q:0,score:0};
  renderExam3Q();
}
function renderExam3Q(){
  var wrap=$('tab-quiz');
  if(ex3State.q>=ex3State.items.length){
    var pass=ex3State.score>=14;
    if(ex3State.score>(ST.exam3Best||0))ST.exam3Best=ex3State.score;
    if(pass)ST.exam3Passed=true;
    pushScore('Final Exam B1',ex3State.score,20);save();if(pass)fireConfetti();
    var h='';
    if(pass){
      h+='<div class="cert"><div class="seal">🏆</div><div class="kicker">Certificate of Completion</div><h2 style="font-size:1.5rem;margin:6px 0">Level B1 Complete</h2><p style="font-size:1.05rem;margin:4px 0"><b>Farrakh</b> has passed the Spanish B1 Final Exam</p><p class="muted">Score: '+ex3State.score+' / 20 · '+todayStr()+' · Learn Spanish with Farrakh</p><p style="font-size:1.3rem" class="es">¡Enhorabuena, Farrakh! Nivel B1 🎉</p><p class="muted">📸 Take a screenshot of this card to keep your certificate.</p></div>';
      if(ST.examPassed&&ST.exam2Passed)h+=grandCertHtml();
    }else{
      h+='<div class="card"><h3>🎓 B1 Final Exam — not passed yet</h3><p style="font-size:1.15rem"><b>Score: '+ex3State.score+' / 20</b> — you need 14 to pass.</p><div class="feedback no">Very close! Review mistakes from Lessons 31–40, redo a lesson or two, and try again. Ya casi — almost there!</div></div>';
    }
    h+='<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startExam3()" type="button">↻ Take exam again</button>'+(pass?certDlBtn('B1',ex3State.score):'')+'<button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';
    wrap.innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});return;
  }
  var it=ex3State.items[ex3State.q];
  var h='<div class="card"><p class="muted" style="margin-top:0">🎓 Final Exam B1 · Question '+(ex3State.q+1)+' of 20 · Score: '+ex3State.score+' · Pass = 14</p><div class="progressbar"><div style="width:'+(ex3State.q/20*100)+'%"></div></div>';
  h+='<p style="font-weight:700;font-size:1.03rem;margin-top:10px">'+esc(it.q)+'</p>';
  it.opts.forEach(function(o){h+='<button type="button" class="opt" data-ex3="'+esc(o)+'">'+esc(o)+'</button>'});
  h+='<div id="ex3Fb"></div></div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-ex3]').forEach(function(b){b.addEventListener('click',function(){
    var ok=b.getAttribute('data-ex3')===it.ans;
    document.querySelectorAll('[data-ex3]').forEach(function(x){x.disabled=true;if(x.getAttribute('data-ex3')===it.ans)x.classList.add('correct')});
    if(!ok)b.classList.add('wrong');else ex3State.score++;
    if(!ok)saveMistake('B1 Exam: '+it.q,'Correct: '+it.ans+'. '+it.exp);
    $('ex3Fb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(it.ans)+'</b>. '+esc(it.exp))+'</div><button class="btn" id="ex3Next" type="button" style="width:100%">'+(ex3State.q+1>=20?'See my result →':'Next question →')+'</button>';
    $('ex3Next').onclick=function(){ex3State.q++;renderExam3Q();window.scrollTo({top:0,behavior:'smooth'})};
  })});
}
/* ============ ROUND 3: DELE-STYLE MOCK EXAM ============ */
var mockState=null;window.mockTimer=null;
function startMock(){
  if(window.mockTimer){clearInterval(window.mockTimer);window.mockTimer=null}
  var gSeen={},grammar=[];
  LESSONS.forEach(function(L){L.quiz.forEach(function(q){var k=normAns(q[0]);if(gSeen[k])return;gSeen[k]=1;grammar.push({q:'[Lesson '+L.n+'] '+q[0],opts:q[1],ans:q[1][q[2]],exp:q[3],cat:'Grammar & Usage'})})});
  grammar=shuffle(grammar).slice(0,10);
  var vocab=shuffle(dedupeFlash(FLASH.slice())).slice(0,10).map(function(f){
    var opts=[f.en];var seen={};seen[normAns(f.en)]=1;var g=0;
    while(opts.length<4&&g++<300){var c=FLASH[Math.floor(Math.random()*FLASH.length)];if(normAns(c.es)===normAns(f.es)||normAns(c.en)===normAns(f.en)||seen[normAns(c.en)])continue;seen[normAns(c.en)]=1;opts.push(c.en)}
    return{q:'What does "'+f.es+'" mean?',audio:f.es,opts:shuffle(opts),ans:f.en,exp:'"'+f.es+'" = '+f.en+' ('+f.ur+')',cat:'Vocabulary'};
  });
  var reading=shuffle(LISTEN_LIB.slice()).slice(0,5).map(function(p){
    var qq=p.qs[Math.floor(Math.random()*p.qs.length)];
    return{q:'📖 Reading — "'+p.t+'": '+p.txt+' — '+qq[0],opts:qq[1],ans:qq[1][qq[2]],exp:qq[3],cat:'Reading'};
  });
  var items=shuffle(grammar.concat(vocab,reading));
  mockState={items:items,q:0,score:0,left:20*60,cats:{}};
  renderMockQ();
  window.mockTimer=setInterval(function(){
    if(!mockState){clearInterval(window.mockTimer);window.mockTimer=null;return}
    mockState.left--;
    var el=$('mockTime');if(el){var m=Math.floor(mockState.left/60),s=mockState.left%60;el.textContent=m+':'+(s<10?'0':'')+s}
    if(mockState.left<=0){clearInterval(window.mockTimer);window.mockTimer=null;finishMock()}
  },1000);
}
function renderMockQ(){
  var wrap=$('tab-quiz');var it=mockState.items[mockState.q];
  var m=Math.floor(mockState.left/60),s=mockState.left%60;
  var h='<div class="card"><p class="muted" style="margin-top:0">📝 DELE-Style Mock Exam · Question '+(mockState.q+1)+' of 25 · ⏱️ <b><span id="mockTime">'+m+':'+(s<10?'0':'')+s+'</span></b> · Section: '+it.cat+'</p><div class="progressbar"><div style="width:'+(mockState.q/25*100)+'%"></div></div>';
  h+='<p style="font-weight:700;font-size:1.03rem;margin-top:10px">'+esc(it.q)+'</p>';
  if(it.audio)h+='<div style="margin:4px 0 8px">'+speakBtn(it.audio)+'</div>';
  var correctIdx=it.opts.indexOf(it.ans);
  it.opts.forEach(function(o,oi){h+='<button type="button" class="opt" data-mock="'+oi+'">'+esc(o)+'</button>'});
  h+='<div id="mockFb"></div></div>';wrap.innerHTML=h;
  document.querySelectorAll('[data-mock]').forEach(function(b){b.addEventListener('click',function(){
    var ok=parseInt(b.getAttribute('data-mock'),10)===correctIdx;
    if(!mockState.cats[it.cat])mockState.cats[it.cat]={c:0,t:0};
    mockState.cats[it.cat].t++;if(ok){mockState.score++;mockState.cats[it.cat].c++}
    document.querySelectorAll('[data-mock]').forEach(function(x){x.disabled=true;if(parseInt(x.getAttribute('data-mock'),10)===correctIdx)x.classList.add('correct')});
    if(!ok)b.classList.add('wrong');
    if(!ok)saveMistake('Mock exam: '+it.q,'Correct: '+it.ans+'. '+it.exp);
    $('mockFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(it.ans)+'</b>. '+esc(it.exp))+'</div><button class="btn" id="mockNext" type="button" style="width:100%">'+(mockState.q+1>=25?'Finish the mock →':'Next question →')+'</button>';
    $('mockNext').onclick=function(){mockState.q++;if(mockState.q>=25){if(window.mockTimer){clearInterval(window.mockTimer);window.mockTimer=null}finishMock()}else{renderMockQ();window.scrollTo({top:0,behavior:'smooth'})}};
  })});
}
function finishMock(){
  if(!mockState)return;
  var total=mockState.items.length;var pass=mockState.score>=Math.ceil(total*0.6);
  if(mockState.score>(ST.mockBest||0))ST.mockBest=mockState.score;
  pushScore('DELE-Style Mock Exam',mockState.score,total);save();if(pass)fireConfetti();
  var h='<div class="card"><h3>📝 Mock Exam — score report</h3><p style="font-size:1.25rem"><b>'+mockState.score+' / '+total+' ('+Math.round(mockState.score/total*100)+'%)</b> — '+(pass?'✅ <b>PASS</b> (pass mark 60%)':'❌ Not yet — pass mark is 60% ('+Math.ceil(total*0.6)+' correct)')+'</p>';
  h+='<h4>Your breakdown:</h4>';
  for(var c in mockState.cats){var cc=mockState.cats[c];h+='<p style="margin:5px 0">'+c+': <b>'+cc.c+' / '+cc.t+'</b></p><div class="progressbar"><div style="width:'+(cc.t?cc.c/cc.t*100:0)+'%"></div></div>'}
  h+='<div class="feedback ok" style="margin-top:12px">ℹ️ This is a <b>practice mock in DELE style</b>, built from your A1–B1 course content — it is <b>not</b> an official DELE exam and gives no official certificate. It tells you honestly where you stand.</div>';
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startMock()" type="button">↻ New mock paper</button><button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';
  mockState=null;
  $('tab-quiz').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
}
/* ============ ROUND 3: READING LIBRARY ============ */
var storyState=null;
function renderReading(){
  syncRoute('#/reading');
  var h='<button class="btn ghost small" onclick="renderSpeak()" type="button">← Back to Speak</button>';
  h+='<div class="card"><div class="kicker">📖 Real reading</div><h2 style="font-size:1.25rem;margin:4px 0">Reading Library</h2><p class="muted">10 short stories at your level. <b>Tap any word</b> in a story to hear it spoken. A2 stories unlock after Lesson 20, B1 stories after Lesson 30.</p></div>';
  STORIES.forEach(function(s,i){
    var locked=(s.lv==='A2'&&!ST.done[20])||(s.lv==='B1'&&!ST.done[30]);
    h+='<button type="button" class="lessonitem'+(locked?' locked':'')+'" '+(locked?'disabled':'onclick="openStory('+i+')"')+'><span class="lring" style="background:#e8eef7"><i>'+(locked?'🔒':(i+1))+'</i></span><span class="lt"><b>'+esc(s.t)+'</b><span class="muted">Level '+s.lv+' · '+s.qs.length+' questions'+(locked?' · unlocks after Lesson '+(s.lv==='A2'?'20':'30'):'')+'</span></span><span class="arr" style="color:var(--orange);font-weight:800">›</span></button>';
  });
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
}
function openStory(i){
  syncRoute('#/reading/'+i);
  var s=STORIES[i];storyState={s:s,q:0,score:0};
  var words=s.txt.split(/\s+/).map(function(w){
    var clean=w.replace(/[.,;:¡!¿?"«»()]/g,'');
    return clean?'<span class="storyword" data-say="'+esc(clean)+'">'+esc(w)+'</span>':esc(w);
  }).join(' ');
  var h='<button class="btn ghost small" onclick="renderReading()" type="button">← All stories</button>';
  h+='<div class="card"><div class="kicker">Reading Library · Level '+s.lv+'</div><h2 style="font-size:1.3rem;margin:4px 0">'+esc(s.t)+'</h2>';
  h+='<button class="btn orange" id="storyPlay" type="button" style="width:100%;margin-bottom:12px">'+SPK_SVG_SM+' Listen to the whole story</button>';
  h+='<p style="font-size:1.12rem;line-height:1.9">'+words+'</p>';
  h+='<div class="pronbox"><b>📝 Hard words in this story:</b><br>'+s.vocab.map(function(v){return '<b>'+esc(v[0])+'</b> — '+esc(v[1])}).join('<br>')+'</div>';
  h+='<div id="storyQuiz"></div></div>';
  $('tab-speak').innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
  $('storyPlay').onclick=function(){speak(s.txt)};
  renderStoryQ();
}
function renderStoryQ(){
  var b=$('storyQuiz');if(!b||!storyState)return;
  if(storyState.q>=storyState.s.qs.length){
    b.innerHTML='<div class="feedback '+(storyState.score>=2?'ok':'no')+'">📖 Story done: <b>'+storyState.score+' / 3</b>. '+(storyState.score===3?'You read and understood everything — a real reader now!':'Read it once more, tap the hard words, and the answers will come.')+'</div><button class="btn" onclick="renderReading()" type="button">← Choose another story</button>';
    pushScore('Reading: '+storyState.s.t,storyState.score,3);save();touchDay();return;
  }
  var q=storyState.s.qs[storyState.q];
  var h='<p class="muted" style="margin:10px 0 2px">Question '+(storyState.q+1)+' of 3</p><p style="font-weight:700">'+esc(q[0])+'</p>';
  q[1].forEach(function(o,oi){h+='<button type="button" class="opt" data-story="'+oi+'">'+esc(o)+'</button>'});
  h+='<div id="storyFb"></div>';b.innerHTML=h;
  document.querySelectorAll('[data-story]').forEach(function(btn){btn.addEventListener('click',function(){
    var ok=parseInt(btn.getAttribute('data-story'),10)===q[2];
    document.querySelectorAll('[data-story]').forEach(function(x){x.disabled=true;if(parseInt(x.getAttribute('data-story'),10)===q[2])x.classList.add('correct')});
    if(!ok)btn.classList.add('wrong');else storyState.score++;
    $('storyFb').innerHTML='<div class="feedback '+(ok?'ok':'no')+'">'+(ok?'✅ Correct!':'❌ Correct: <b>'+esc(q[1][q[2]])+'</b>. '+esc(q[3]))+'</div><button class="btn" id="storyNext" type="button" style="width:100%">'+(storyState.q+1>=3?'Finish →':'Next question →')+'</button>';
    $('storyNext').onclick=function(){storyState.q++;renderStoryQ()};
  })});
}
/* ============ ROUND 3: DICTATION MARATHON ============ */
var mthState=null;
function startMarathon(){
  var lines=[];
  LISTEN_LIB.forEach(function(p){p.txt.split(/(?<=[.!?])\s+/).forEach(function(sn){if(sn.trim().length>8)lines.push({es:sn.trim(),en:p.t})})});
  MIC_SENTS.forEach(function(m){lines.push({es:m[0],en:m[1]})});
  mthState={lines:shuffle(lines).slice(0,10),i:0,sum:0,done:0};
  renderMarathon();
  setTimeout(function(){if(mthState)speak(mthState.lines[0].es)},300);
}
function renderMarathon(){
  var wrap=$('tab-quiz');var s=mthState;
  if(s.i>=s.lines.length){
    var avg=s.done?Math.round(s.sum/s.done):0;
    wrap.innerHTML='<div class="card"><h3>🏃 Dictation Marathon — finished!</h3><p style="font-size:1.2rem"><b>Average line score: '+avg+'%</b> over '+s.done+' lines</p><div class="feedback '+(avg>=80?'ok':'no')+'">'+(avg>=80?'🎉 Marathon runner! Your ear is getting seriously sharp.':'Strong effort! Marathons are hard on purpose — one more run will lift the score.')+'</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="startMarathon()" type="button">↻ Run it again</button><button class="btn ghost" onclick="startListenType()" type="button">Listen &amp; Type</button><button class="btn ghost" onclick="renderQuizHome()" type="button">Quiz Zone</button></div></div>';
    pushScore('Dictation Marathon',avg,100);save();touchDay();return;
  }
  var L=s.lines[s.i];
  var h='<div class="card"><p class="muted" style="margin-top:0">🏃 Dictation Marathon · Line '+(s.i+1)+' of '+s.lines.length+' · Running average: <b>'+(s.done?Math.round(s.sum/s.done):0)+'%</b></p><div class="progressbar"><div style="width:'+(s.i/s.lines.length*100)+'%"></div></div>';
  h+='<p class="muted">Listen, then type the line exactly. Lines never block you: check, or reveal and move on.</p>';
  h+='<button class="btn orange" id="mthPlay" type="button" style="width:100%">'+SPK_SVG_SM+' Play the line</button>';
  h+='<input type="text" id="mthInput" placeholder="Type the line you heard..." style="margin-top:12px">';
  h+='<div id="mthFb"></div><div class="grid2" style="margin-top:10px"><button class="btn" id="mthCheck" type="button">Check line</button><button class="btn ghost" id="mthReveal" type="button">👀 Reveal &amp; next</button></div></div>';
  wrap.innerHTML=h;
  $('mthPlay').onclick=function(){speak(L.es)};
  function advance(pct,shown){
    s.sum+=pct;s.done++;
    $('mthFb').innerHTML='<div class="feedback '+(pct>=80?'ok':'no')+'" style="margin-top:10px"><b>Line score: '+pct+'%</b><br>Correct line: <span style="font-size:1.05rem">'+esc(L.es)+'</span>'+(shown?'':'<br>Your words: '+wordByWord($('mthInput').value.trim(),L.es))+'</div><button class="btn" id="mthNext" type="button" style="width:100%;margin-top:8px">'+(s.i+1>=s.lines.length?'Finish marathon →':'Next line →')+'</button>';
    $('mthCheck').disabled=true;$('mthReveal').disabled=true;
    $('mthNext').onclick=function(){s.i++;renderMarathon();if(s.i<s.lines.length)setTimeout(function(){speak(s.lines[s.i].es)},300)};
  }
  $('mthCheck').onclick=function(){var v=$('mthInput').value.trim();advance(wordMatchPct(v,L.es),false)};
  $('mthReveal').onclick=function(){var v=$('mthInput').value.trim();advance(v?wordMatchPct(v,L.es):0,true)};
}
/* ── LAYER 4 · DEVICE SERVICES — MediaRecorder record & compare ── */
/* ============ ROUND 3: RECORD & COMPARE ============ */
var rcState={idx:0,url:null};
function rcUpdateBtns(){
  var rec=window.rcRec;var recording=rec&&rec.state==='recording';
  var r1=$('rcRec'),r2=$('rcStop'),r3=$('rcMine'),r4=$('rcDel');
  if(r1)r1.disabled=!!recording;if(r2)r2.disabled=!recording;
  if(r3)r3.disabled=!rcState.url;if(r4)r4.disabled=!rcState.url;
}
function rcStart(){
  var msg=$('rcMsg');if(!msg)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){
    msg.innerHTML='<div class="feedback no">🎙️ Recording is not available in this browser, so Record &amp; Compare cannot run here. Nothing is wrong with your phone — use Repeat After Me and the typing compare instead; they train the same skill.</div>';return;
  }
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    var chunks=[];
    var rec=new MediaRecorder(stream);window.rcRec=rec;
    rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
    rec.onstop=function(){
      stream.getTracks().forEach(function(t){t.stop()});
      var blob=new Blob(chunks,{type:rec.mimeType||'audio/webm'});
      if(rcState.url)URL.revokeObjectURL(rcState.url);
      rcState.url=URL.createObjectURL(blob);window.rcRec=null;rcUpdateBtns();
      msg.innerHTML='<div class="feedback ok">🎙️ Recorded — only in this tab, never uploaded. Now tap "Your voice", then "Spanish voice", and compare.</div>';
    };
    rec.start();rcUpdateBtns();
    msg.innerHTML='<p class="muted">🔴 Recording… say the phrase out loud, then tap Stop.</p>';
  }).catch(function(){msg.innerHTML=micHelpCard()});
}
function rcStop(){if(window.rcRec&&window.rcRec.state==='recording')window.rcRec.stop()}
function rcPlayMine(){if(rcState.url){try{var a=new Audio(rcState.url);a.play()}catch(e){}}}
function rcDelete(){
  if(rcState.url){URL.revokeObjectURL(rcState.url);rcState.url=null}
  rcUpdateBtns();var msg=$('rcMsg');if(msg)msg.innerHTML='<p class="muted">Recording deleted. It only ever lived in this tab.</p>';
}
/* ============ ROUND 3: STREAK CALENDAR ============ */
function streakCalendarHtml(){
  var off=ST.calOffset||0;
  var base=new Date();base.setDate(1);base.setMonth(base.getMonth()+off);
  var y=base.getFullYear(),mo=base.getMonth();
  var MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var first=new Date(y,mo,1).getDay();var dim=new Date(y,mo+1,0).getDate();
  var h='<div class="card"><h3>🗓️ Streak calendar — '+MN[mo]+' '+y+'</h3>';
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small ghost" type="button" onclick="calNav(-1)" '+(off<=-1?'disabled':'')+'>← Previous month</button><button class="btn small ghost" type="button" onclick="calNav(1)" '+(off>=0?'disabled':'')+'>Next month →</button></div>';
  h+='<div class="calgrid">';
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(function(d){h+='<div style="text-align:center;font-size:.75rem;font-weight:700;color:var(--muted)">'+d+'</div>'});
  for(var b=0;b<first;b++)h+='<div></div>';
  for(var d=1;d<=dim;d++){
    var ds=y+'-'+(mo+1)+'-'+d;var on=!!ST.dayLog[ds];var isToday=ds===todayStr();
    var past=dateVal(ds)<=dateVal(todayStr());
    h+='<div class="calcell'+(on?' on':'')+(isToday?' today':'')+(!past?' dim':'')+'">'+(on?'✓ ':'' )+d+'</div>';
  }
  h+='</div><p class="muted" style="margin-top:10px">🔥 Best streak ever: <b>'+(ST.maxStreak||0)+' days</b> · Total practice days: <b>'+ST.totalDays+'</b> · Lessons done: <b>'+Object.keys(ST.done).length+' / '+LESSONS.length+'</b> · Quizzes &amp; exams finished: <b>'+ST.scores.length+'</b></p></div>';
  return h;
}
function calNav(d){ST.calOffset=Math.max(-1,Math.min(0,(ST.calOffset||0)+d));save();renderProgress()}
/* ============ PRINTABLE WORD SHEETS ============ */
function openPrintSheet(cat){
  var rows=[],title='';
  if(cat==='hard'){hardIndices().forEach(function(i){rows.push(FLASH[i])});title='🆘 Hard Words — rescue deck'}
  else if(cat==='all'||!cat){rows=FLASH.slice();title='All flashcards — '+FLASH.length+' words'}
  else if(cat==='fav'){FLASH.forEach(function(f,i){if(ST.favs[i])rows.push(f)});title='⭐ Favourites — '+rows.length+' words'}
  else if(cat==='due'){srsDueList().forEach(function(i){rows.push(FLASH[i])});title='🔁 Due for review — '+rows.length+' words'}
  else{rows=FLASH.filter(function(f){return f.cat===cat});title=CATS[cat]+' — '+rows.length+' words'}
  var h='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px" class="noprint"><button class="btn ghost" id="psClose" type="button">✕ Close sheet</button></div>';
  h+='<p class="muted" style="margin-top:0">This is the clean printable sheet. To print it or save it as a PDF, use your browser menu → Print — only this sheet prints, nothing else on the page.</p>';
  h+='<h2 style="font-family:Outfit">Learn Spanish with Farrakh — Word Sheet</h2><h3 style="font-family:Outfit;margin:4px 0 10px">'+esc(title)+'</h3>';
  h+='<table><tr><th>Spanish</th><th>English</th><th>Roman Urdu</th></tr>';
  rows.forEach(function(f){h+='<tr><td><b>'+esc(f.es)+'</b></td><td>'+esc(f.en)+'</td><td>'+esc(f.ur)+'</td></tr>'});
  h+='</table>';
  var favRows=FLASH.filter(function(f,i){return ST.favs[i]});
  if(favRows.length){h+='<h3 style="font-family:Outfit;margin:16px 0 6px">⭐ My Favourite Words — marked section ('+favRows.length+')</h3><table><tr><th>Spanish</th><th>English</th><th>Roman Urdu</th></tr>';favRows.forEach(function(f){h+='<tr><td><b>'+esc(f.es)+'</b></td><td>'+esc(f.en)+'</td><td>'+esc(f.ur)+'</td></tr>'});h+='</table>'}
  if(ST.myPhrases&&ST.myPhrases.length){h+='<h3 style="font-family:Outfit;margin:16px 0 6px">⭐ My Phrases — built by me ('+ST.myPhrases.length+')</h3>';ST.myPhrases.forEach(function(mp){h+='<p style="margin:4px 0"><b>'+esc(mp.text)+'</b> <span style="color:#555">('+esc(mp.date)+')</span></p>'})}
  var lfKeys=Object.keys(ST.favLessons||{});
  if(lfKeys.length){h+='<h3 style="font-family:Outfit;margin:16px 0 6px">⭐ Favourite Lesson Words ('+lfKeys.length+')</h3><p>'+lfKeys.map(function(k){return esc(k.split(':').slice(1).join(':'))}).join(' · ')+'</p>'}
  h+='<p style="font-size:.8rem;color:#555;margin-top:10px">Learn Spanish with Farrakh · '+LIVE_URL+'</p>';
  var ps=$('printSheet');ps.innerHTML=h;ps.hidden=false;
  ps.scrollIntoView({behavior:'smooth'});
  $('psClose').onclick=function(){ps.hidden=true;ps.innerHTML=''};
}

export { rapIdx, renderSpeak, startMic, shTimers, beep, stopShadowing, startShadowing, micHelpCard, testMic, resetCardHtml, wireResetCard, renderAccount, cloudStatusText, cloudCardHtml, wireCloudCard, placeSegInds, wireAppSettings, syncSetModal, wireSettingsModal, renderProgress, irrDrill, verbById, renderIrregulars, irrQ, renderIrrDrill, ex2State, startExam2, renderExam2Q, wmState, startWordMatch, renderWordMatch, hgState, hgNorm, startHangman, renderHangman, NUM_ONES, NUM_TENS, numWords, ndState, numDrillRound, startNumDrill, renderNumDrill, libState, renderLibrary, openPassage, renderLibQ, rpState, renderRoleplays, startRoleplay, renderRpTurn, renderBridge, renderPhrasebook, renderPhrasebookList, renderLevelMap, renderSearchResults, trapState, renderTraps, renderTrapQ, sylIdx, renderSyllables, grandCertHtml, ex3State, startExam3, renderExam3Q, mockState, startMock, renderMockQ, finishMock, storyState, renderReading, openStory, renderStoryQ, mthState, startMarathon, renderMarathon, rcState, rcUpdateBtns, rcStart, rcStop, rcPlayMine, rcDelete, streakCalendarHtml, calNav, openPrintSheet };
