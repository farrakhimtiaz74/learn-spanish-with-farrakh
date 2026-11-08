import { currentTab, showNotice } from './app.js';
import { $, ST, todayStr } from './store.js';


/* ================================================================
   LAYER 4 — DEVICE SERVICES (part 2: sound, celebration, files)
   WebAudio sound effects (tone / sndOk / sndBad), the confetti
   canvas and the certificate-image download. Services produce
   effects and files only — they never render screens.
   ================================================================ */
/* ============ ROUND 4: SOUND EFFECTS, CONFETTI, CERT DOWNLOAD, KEYBOARD ============ */
function fireConfetti(){
  if(ST.anim===false)return;
  try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){}
  try{
    var cv=document.createElement('canvas');cv.id='confettiCv';document.body.appendChild(cv);
    var ctx=cv.getContext('2d');cv.width=window.innerWidth;cv.height=window.innerHeight;
    var cols=['#2563eb','#f97316','#16a34a','#eab308','#dc2626','#0891b2'];
    var ps=[];for(var i=0;i<90;i++)ps.push({x:Math.random()*cv.width,y:-20-Math.random()*cv.height*0.35,w:6+Math.random()*6,h:8+Math.random()*8,c:cols[i%cols.length],vy:2+Math.random()*3,vx:-1+Math.random()*2,r:Math.random()*3.14,vr:-0.1+Math.random()*0.2});
    var t0=Date.now();
    (function frame(){var el=Date.now()-t0;ctx.clearRect(0,0,cv.width,cv.height);ps.forEach(function(pp){pp.y+=pp.vy;pp.x+=pp.vx;pp.r+=pp.vr;ctx.save();ctx.translate(pp.x,pp.y);ctx.rotate(pp.r);ctx.fillStyle=pp.c;ctx.fillRect(-pp.w/2,-pp.h/2,pp.w,pp.h);ctx.restore()});if(el<2600)requestAnimationFrame(frame);else if(cv.parentNode)cv.parentNode.removeChild(cv)})();
  }catch(e){}
}
var _ac=null;
function tone(f,d,ty){if(ST.sfx===false)return;try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;_ac=_ac||new AC();if(_ac.state==='suspended')_ac.resume();var o=_ac.createOscillator(),g=_ac.createGain();o.type=ty||'sine';o.frequency.value=f;var now=_ac.currentTime;g.gain.setValueAtTime(0.10,now);g.gain.exponentialRampToValueAtTime(0.001,now+(d||0.16));o.connect(g);g.connect(_ac.destination);o.start();o.stop(now+(d||0.16))}catch(e){}}
function sndOk(){tone(660,0.14);setTimeout(function(){tone(880,0.18)},110)}
function sndBad(){tone(220,0.22,'triangle')}
document.addEventListener('click',function(e){var b=e.target.closest?e.target.closest('.opt,.kbkey'):null;if(!b||b.disabled)return;setTimeout(function(){if(b.classList.contains('correct')||b.classList.contains('used-ok'))sndOk();else if(b.classList.contains('wrong')||b.classList.contains('used-no'))sndBad()},40)});
function certDlBtn(level,score){return '<button class="btn orange" type="button" onclick="downloadCertImage(\''+level+'\','+(score||0)+')">⬇️ Download certificate image</button>'}
function downloadCertImage(level,score){
  try{
    var cv=document.createElement('canvas');cv.width=1000;cv.height=640;var x=cv.getContext('2d');
    x.fillStyle='#fffdf6';x.fillRect(0,0,1000,640);x.strokeStyle='#f97316';x.lineWidth=10;x.strokeRect(20,20,960,600);x.strokeStyle='#2563eb';x.lineWidth=2;x.strokeRect(38,38,924,564);
    x.fillStyle='#17233b';x.textAlign='center';
    x.font='700 32px Georgia,serif';x.fillText('Certificate of Completion',500,120);
    x.font='800 56px Georgia,serif';x.fillText('Level '+level+' Complete',500,215);
    x.font='400 29px Georgia,serif';x.fillText('Farrakh has passed the Spanish '+level+' Final Exam',500,305);
    if(score)x.fillText('Score: '+score+' / 20',500,362);
    x.font='400 23px Georgia,serif';x.fillText(todayStr()+' · Learn Spanish with Farrakh',500,435);
    x.font='italic 700 32px Georgia,serif';x.fillStyle='#c2410c';x.fillText('¡Enhorabuena, Farrakh!',500,515);
    var a=document.createElement('a');a.href=cv.toDataURL('image/png');a.download='spanish-certificate-'+level+'.png';document.body.appendChild(a);a.click();a.remove();
    showNotice('Certificate image downloaded: spanish-certificate-'+level+'.png — check your downloads folder.');
  }catch(e){showNotice('Certificate image download is not supported in this browser view. Your certificate card above is real — a screenshot keeps it forever.')}
}
function grandCert2Html(){
  return '<div class="cert"><div class="seal">🌟</div><div class="kicker">Grand Certificate</div><h2 style="font-size:1.5rem;margin:6px 0">A1 → B2 Complete</h2><p style="font-size:1.05rem;margin:4px 0"><b>Farrakh</b> has passed all four final exams — A1, A2, B1 and B2</p><p class="muted">Learn Spanish with Farrakh · '+todayStr()+'</p><p style="font-size:1.3rem" class="es">¡De A1 a B2 — un viaje increíble, Farrakh! 🎉</p><p class="muted">📸 Take a screenshot of this card to keep your grand certificate.</p>'+certDlBtn('A1 → B2',0)+'</div>';
}
/* keyboard shortcuts (desktop / fine-pointer only) */
try{if(window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches)document.body.classList.add('haskb')}catch(e){}
document.addEventListener('keydown',function(e){
  if(!document.body.classList.contains('haskb'))return;
  var tag=(e.target&&e.target.tagName)||'';if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
  if(currentTab==='cards'){
    if(e.code==='Space'){e.preventDefault();var c=$('fcCard');if(c)c.click()}
    else if(e.key==='1'){var k=$('fcKnow');if(k)k.click()}
    else if(e.key==='2'){var l=$('fcLearn');if(l)l.click()}
  }else if(['1','2','3','4'].indexOf(e.key)>=0){
    var secs=document.querySelectorAll('section:not([hidden]) .opt:not([disabled])');
    var o=secs[parseInt(e.key,10)-1];if(o)o.click();
  }
});
/* settings: animations + reading font size */
function applyAnim(){document.body.classList.toggle('noanim',ST.anim===false)}
function applyFontSize(){document.body.classList.remove('fs0','fs1','fs2');document.body.classList.add('fs'+(ST.fontSize==null?1:ST.fontSize))}
/* applyAnim()/applyFontSize() are boot steps — called from app.js INIT (they read ST, which is cyclic at module-eval time) */
/* ── LAYER 5 · UI (continued) — Grammar Reference Library screen (its data lives in Layer 1) ── */
/* ============ ROUND 4: GRAMMAR REFERENCE LIBRARY ============ */

export { fireConfetti, _ac, tone, sndOk, sndBad, certDlBtn, downloadCertImage, grandCert2Html, applyAnim, applyFontSize };
