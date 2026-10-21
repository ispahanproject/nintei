/* 認定審査 SW（build_deploy.py が生成）
   index と data/manifest.json は network-first（?t= を外したURLで保存）。版付きデータ data/<v>/pNN.txt は中身が変わらないので cache-first
   （古い版はページ側 pruneOld が解錠時に削除）。?r= 付き（整合性エラー時の取り直し）はキャッシュを通さない。 */
const CACHE='nintei-v3';
const CORE=["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon.png", "fonts/noto-sans-jp-japanese-400-normal.woff2", "fonts/noto-sans-jp-japanese-500-normal.woff2", "fonts/noto-sans-jp-japanese-700-normal.woff2", "fonts/noto-sans-jp-latin-400-normal.woff2", "fonts/noto-sans-jp-latin-500-normal.woff2", "fonts/noto-sans-jp-latin-700-normal.woff2"];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(
    CORE.map(u=>fetch(new Request(u,{cache:'reload'})).then(res=>{if(res.ok)return c.put(u,res);}).catch(()=>{}))
  )).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||u.searchParams.has('r'))return;
  const p=u.pathname;
  if(e.request.mode==='navigate'||p.endsWith('/')||p.endsWith('/index.html')||p.endsWith('/data/manifest.json')){
    const key=u.origin+p;
    e.respondWith(fetch(e.request).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(key,cp));}return res;})
      .catch(()=>caches.match(key).then(h=>h||new Response('offline',{status:503}))));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(res=>{
    if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
    return res;
  }).catch(()=>new Response('',{status:503}))));
});
