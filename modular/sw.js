/* Learn Spanish — MODULAR build service worker.
   Same policy as the main app: network-first for everything same-origin so
   updates land on the next launch; cache is the offline fallback. */
var CACHE='learn-spanish-mod-v2';
var CORE=['./','./index.html','./manifest.json',
'./styles/main.css','./styles/components.css','./styles/themes.css',
'./js/app.js','./js/store.js','./js/tts.js','./js/services.js',
'./js/data/lessons.js','./js/data/vocabulary.js','./js/data/verbs.js','./js/data/stories.js','./js/data/practice.js',
'./js/ui/learn.js','./js/ui/cards.js','./js/ui/speak.js','./js/ui/tools.js','./js/ui/grammar.js',
'../icon-192.png','../icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){if(k.indexOf('learn-spanish-mod-')===0&&k!==CACHE)return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  e.respondWith(
    fetch(req).then(function(res){
      var copy=res.clone();
      caches.open(CACHE).then(function(c){c.put(req,copy)});
      return res;
    }).catch(function(){
      return caches.match(req,{ignoreSearch:true}).then(function(hit){
        if(hit)return hit;
        if(req.mode==='navigate')return caches.match('./index.html');
        return new Response('',{status:504});
      });
    })
  );
});
