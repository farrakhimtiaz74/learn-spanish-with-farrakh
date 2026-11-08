import { showNotice } from './app.js';
import { esc, touchDay } from './store.js';

var slowMode=false;
function setSlowMode(v){slowMode=!!v}
var SPK_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" style="width:20px;height:20px"><path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
var SPK_SVG_SM='<svg viewBox="0 0 24 24" aria-hidden="true" style="width:17px;height:17px;vertical-align:-3px"><path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
var PLAY_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" style="width:17px;height:17px;vertical-align:-3px"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
function speakBtn(text,sm){return '<button type="button" class="spk'+(sm?' sm':'')+'" data-say="'+esc(text).replace(/"/g,'&quot;')+'" aria-label="Listen">'+SPK_SVG+'</button>'}
/* ================================================================
   LAYER 4 — DEVICE SERVICES (part 1: text-to-speech)
   Spanish voice picking, long-sentence chunking and speak().
   Screens call speak() / the speaker buttons; services never
   render screens themselves.
   ================================================================ */
/* Android Chrome loads voices asynchronously — cache them and refresh whenever voiceschanged fires */
var _voices=[];
function refreshVoices(){try{_voices=speechSynthesis.getVoices()||[]}catch(e){_voices=[]}}
function pickEsVoice(){
  var vs=_voices;
  if(!vs.length){try{vs=speechSynthesis.getVoices()||[]}catch(e){vs=[]}}
  var google=null,exact=null,anyEs=null;
  for(var i=0;i<vs.length;i++){var v=vs[i];if(!v.lang)continue;var lg=String(v.lang).toLowerCase().replace('_','-');
    if(lg.indexOf('es')===0){if(!anyEs)anyEs=v;if(lg.indexOf('es-es')===0&&!exact)exact=v;if(/google/i.test(v.name||'')&&!google)google=v}}
  return google||exact||anyEs||null;
}
/* Android Chrome cuts off long speech — split into sentence chunks (and split very long sentences at commas) */
function splitSpeechChunks(text){
  var parts=String(text).match(/[^.!?…]+[.!?…]*["»)]*\s*/g)||[String(text)];
  var chunks=[];
  parts.forEach(function(p){p=p.trim();if(!p)return;
    while(p.length>110){var cut=p.lastIndexOf(',',95);if(cut<30)cut=p.lastIndexOf(' ',110);if(cut<30)cut=110;chunks.push(p.slice(0,cut).trim());p=p.slice(cut).trim()}
    if(p)chunks.push(p)});
  return chunks.length?chunks:[String(text)];
}
function speak(text){
  touchDay();
  if(!('speechSynthesis' in window)){showNotice('Your browser has no voice for listening. You can still read everything and practise by typing.');return}
  try{
    speechSynthesis.cancel();
    var voice=pickEsVoice();
    if(!voice&&!window._ttsWarned){window._ttsWarned=true;showNotice('No Spanish voice was found on this phone, so the default voice will read Spanish. It still helps — try Slow speed.')}
    var rate=slowMode?0.62:0.92;
    splitSpeechChunks(text).forEach(function(chunk){
      var u=new SpeechSynthesisUtterance(chunk);u.lang='es-ES';u.rate=rate;if(voice)u.voice=voice;
      speechSynthesis.speak(u);
    });
  }catch(e){showNotice('Listening did not start. Please try the orange speaker button again.')}
}
if('speechSynthesis' in window){refreshVoices();try{speechSynthesis.addEventListener('voiceschanged',refreshVoices)}catch(e){speechSynthesis.onvoiceschanged=refreshVoices}}

export { slowMode, setSlowMode, SPK_SVG, SPK_SVG_SM, PLAY_SVG, speakBtn, _voices, refreshVoices, pickEsVoice, splitSpeechChunks, speak };
