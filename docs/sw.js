if (!self.define) { let e, i = {}; const t = (t, r) => (t = new URL(t + ".js", r).href, i[t] || new Promise((i => { if ("document" in self) { const e = document.createElement("script"); e.src = t, e.onload = i, document.head.appendChild(e) } else e = t, importScripts(t), i() })).then((() => { let e = i[t]; if (!e) throw new Error(`Module ${t} didn’t register its module`); return e }))); self.define = (r, s) => { const n = e || ("document" in self ? document.currentScript.src : "") || location.href; if (i[n]) return; let f = {}; const o = e => t(e, n), d = { module: { uri: n }, exports: f, require: o }; i[n] = Promise.all(r.map((e => d[e] || o(e)))).then((e => (s(...e), f))) } } define(["./workbox-915e8d08"], (function (e) { "use strict"; self.addEventListener("message", (e => { e.data && "SKIP_WAITING" === e.data.type && self.skipWaiting() })), e.precacheAndRoute([{ url: "index.html", revision: "98b61df3f16693c28582ff59a036ff4a" }, { url: "manifest.json", revision: "980187c41fe9f2687894ab9ed671a638" }, { url: "widget.html", revision: "2dabfb9a8f5179c11f000898d6fb54c3" }, { url: "widget.js", revision: "d48d7e124f19940f958d12af7b8519c0" }], { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] }) }));
//# sourceMappingURL=sw.js.map

self.addEventListener('widgetinstall', ev => {
  ev.waitUntil(self.widgets.createInstance(ev.widget.tag, {}));
});
self.addEventListener('widgetuninstall', ev => {
  ev.waitUntil(self.widgets.removeByTag(ev.widget.tag));
});
self.addEventListener('widgetupdate', ev => {
  ev.waitUntil(self.widgets.updateByTag(ev.widget.tag, {}));
});

self.addEventListener("push",event=>{const data=event.data?event.data.json():{};const title=data.title||"TaskBoard Notification";const options={body:data.body||"",icon:"assets/icons/icon-192.png"};event.waitUntil(self.registration.showNotification(title,options))});
self.addEventListener("sync",event=>{"sync-tasks"===event.tag&&event.waitUntil(fetch("/api/widget-data").catch(()=>{}))});
self.addEventListener("periodicsync",event=>{"update-tasks"===event.tag&&event.waitUntil(fetch("/api/widget-data").catch(()=>{}))});
