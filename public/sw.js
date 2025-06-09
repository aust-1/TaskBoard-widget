if (!self.define) {
    let e, i = {};
    const t = (t, r) =>
        (t = new URL(t + ".js", r).href,
        i[t] ||
        new Promise((i) => {
            if ("document" in self) {
            const e = document.createElement("script");
            e.src = t;
            e.onload = i;
            document.head.appendChild(e);
            } else {
            importScripts(t);
            i();
            }
        }).then(() => {
            let e = i[t];
            if (!e) throw new Error(`Module ${t} didn’t register its module`);
            return e;
        }));
    self.define = (r, s) => {
        const n = e ||
        ("document" in self
            ? document.currentScript.src
            : "") ||
        location.href;
        if (i[n]) return;
        let f = {};
        const o = (e) => t(e, n),
        d = { module: { uri: n }, exports: f, require: o };
        i[n] = Promise.all(r.map((e) => d[e] || o(e))).then((e) => (s(...e), f));
    };
}

define(["./workbox-915e8d08"], (function (workbox) {
    "use strict";

    self.addEventListener("message", (e => { e.data && "SKIP_WAITING" === e.data.type && self.skipWaiting() }));

    workbox.precacheAndRoute(
        [
            { url: "index.html", revision: "98b61df3f16693c28582ff59a036ff4a" },
            { url: "manifest.json", revision: "980187c41fe9f2687894ab9ed671a638" },
            { url: "widget.html", revision: "2dabfb9a8f5179c11f000898d6fb54c3" },
            { url: "widget.js", revision: "d48d7e124f19940f958d12af7b8519c0" },
        ],
        {
            ignoreURLParametersMatching: [/^utm_/, /^fbclid$/]
        }
    );

    workbox.routing.registerRoute(
    // Cible toutes les requêtes de navigation (pages HTML)
    ({ request }) => request.mode === 'navigate',
    // Strategy: essaie le réseau, sinon renvoie le cache 'offline.html'
    new workbox.strategies.NetworkFirst({
        cacheName: 'pages-cache',
        plugins: [
        {
            cacheWillUpdate: async ({ response }) => {
            // on ne met en cache que les 200 OK
            return response && response.status === 200 ? response : null;
            }
        }
        ]
    })
    );

    workbox.precacheAndRoute(
        [
            { url: "offline.html", revision: null }
        ],
    );


    // =========================
    // Widget Windows 11 events
    // =========================

    // Lorsqu’on installe le widget dans le Board
    self.addEventListener("widgetinstall", (e) => {
        // Crée une instance pour le widget tagué
        e.waitUntil(self.widgets.createInstance(e.widget.tag, {}));
    });

    // Lorsqu’on désinstalle le widget depuis le Board
    self.addEventListener("widgetuninstall", (e) => {
        e.waitUntil(self.widgets.removeByTag(e.widget.tag));
    });

    // Lorsqu’on demande une mise à jour du widget
    self.addEventListener("widgetupdate", (e) => {
        e.waitUntil(self.widgets.updateByTag(e.widget.tag, {}));
    });

    // =========================
    // Push & Sync (optionnel)
    // =========================

    // Notifications push reçues
    self.addEventListener("push", (event) => {
        const data = event.data ? event.data.json() : {};
        const title = data.title || "TaskBoard Notification";
        const options = {
        body: data.body || "",
        icon: "assets/icons/icon-192.png",
        };
        event.waitUntil(self.registration.showNotification(title, options));
    });

    // Sync en arrière-plan
    self.addEventListener("sync", (event) => {
        if (event.tag === "sync-tasks") {
        event.waitUntil(fetch("/api/widget-data").catch(() => {}));
        }
    });

    // Periodic Sync
    self.addEventListener("periodicsync", (event) => {
        if (event.tag === "update-tasks") {
        event.waitUntil(fetch("/api/widget-data").catch(() => {}));
        }
    });
}));
//# sourceMappingURL=sw.js.map
