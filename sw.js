const CACHE='nintei-v1';
const CORE=['./','index.html','manifest.webmanifest','data/qa.enc','icon-192.png','icon-512.png','icon.png',
  'fonts/noto-sans-jp-japanese-400-normal.woff2','fonts/noto-sans-jp-japanese-500-normal.woff2','fonts/noto-sans-jp-japanese-700-normal.woff2',
  'fonts/noto-sans-jp-latin-400-normal.woff2','fonts/noto-sans-jp-latin-500-normal.woff2','fonts/noto-sans-jp-latin-700-normal.woff2'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(
    CORE.map(u=>fetch(new Request(u,{cache:'reload'})).then(res=>{if(res.ok)return c.put(u,res);}).catch(()=>{}))
  )).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  // アプリ本体(index)とデータ(qa.enc)は network-first: 更新が必ず届き、オフライン時のみキャッシュで動く
  const isCore=e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('qa.enc');
  if(isCore){
    e.respondWith(
      fetch(e.request).then(res=>{
        if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
        return res;
      }).catch(()=>caches.match(e.request).then(h=>h||new Response('offline',{status:503})))
    );
    return;
  }
  // フォント・アイコン・画像は cache-first（初回表示時にキャッシュ）
  e.respondWith(
    caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
      if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
      return res;
    }).catch(()=>new Response('',{status:503})))
  );
});
