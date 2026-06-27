(function initLiveVisitors() {
  const liveRoot = document.getElementById("liveVisitors");
  if (!liveRoot) return;

  const liveServerPorts = ["5500", "5501", "5502", "4173"];
  const apiOrigin = window.location.protocol === "file:" || liveServerPorts.includes(window.location.port)
    ? "http://localhost:3000"
    : window.location.origin;
  const sessionKey = "micost_live_visitor_session";
  const heartbeatMs = 15000;

  const activeEl = document.getElementById("liveActiveVisitors");
  const todayEl = document.getElementById("liveTodayVisitors");
  const pagesEl = document.getElementById("liveVisitorPages");
  const feedEl = document.getElementById("liveVisitorFeed");
  const statusEl = document.getElementById("liveVisitorsStatus");
  let previousActive = activeEl.textContent;
  let previousToday = todayEl.textContent;

  function setAnimatedNumber(element, value, previousValue) {
    const nextValue = String(value ?? 0);
    element.textContent = nextValue;

    if (nextValue !== previousValue) {
      element.classList.remove("live-number-bump");
      element.offsetHeight;
      element.classList.add("live-number-bump");
    }

    return nextValue;
  }

  function createSessionId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getSessionId() {
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = createSessionId();
      sessionStorage.setItem(sessionKey, sessionId);
    }
    return sessionId;
  }

  const sessionId = getSessionId();

  function setStatus(state, label) {
    statusEl.classList.remove("online", "offline");
    if (state) statusEl.classList.add(state);
    statusEl.innerHTML = `<span class="live-status-dot"></span>${label}`;
  }

  function formatPath(path) {
    if (!path || path === "/") return "Home page";
    return path.replace(/^\//, "").replace(/\.html$/, "").replace(/-/g, " ");
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("ms-MY", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function renderPages(pages) {
    if (!pages?.length) {
      pagesEl.innerHTML = `<span class="live-empty">Tiada pelawat aktif sekarang.</span>`;
      return;
    }

    pagesEl.innerHTML = pages
      .map((page) => `
        <div class="live-page-row">
          <span>${formatPath(page.path)}</span>
          <span class="live-page-count">${page.count} aktif</span>
        </div>
      `)
      .join("");
  }

  function renderFeed(events) {
    if (!events?.length) {
      feedEl.innerHTML = `<span class="live-empty">Belum ada pergerakan baru.</span>`;
      return;
    }

    feedEl.innerHTML = events
      .slice(0, 1)
      .map((event) => `
        <div class="live-feed-row">
          <span class="live-feed-type ${event.type}">${event.type}</span>
          <span class="live-feed-text">${event.label} - ${formatPath(event.path)}</span>
          <span class="live-feed-time">${formatTime(event.at)}</span>
        </div>
      `)
      .join("");
  }

  function renderLiveVisitors(data) {
    previousActive = setAnimatedNumber(activeEl, data.active, previousActive);
    previousToday = setAnimatedNumber(todayEl, data.totalToday, previousToday);
    renderPages(data.pages);
    renderFeed(data.events);
    setStatus("online", "Live");
  }

  async function heartbeat() {
    const response = await fetch(`${apiOrigin}/api/live-visitors/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        path: window.location.pathname || "/",
      }),
    });

    if (!response.ok) throw new Error("Live visitor heartbeat failed.");
    renderLiveVisitors(await response.json());
  }

  function sendLeave() {
    const payload = JSON.stringify({ sessionId });
    const url = `${apiOrigin}/api/live-visitors/leave`;

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      return;
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }

  function startStream() {
    if (!window.EventSource || navigator.webdriver) return null;

    const stream = new EventSource(`${apiOrigin}/api/live-visitors/stream`);
    stream.onmessage = (event) => {
      renderLiveVisitors(JSON.parse(event.data));
    };
    stream.onerror = () => {
      setStatus("offline", "Reconnecting");
    };
    return stream;
  }

  heartbeat()
    .then(() => {
      startStream();
      setInterval(() => {
        heartbeat().catch(() => setStatus("offline", "Backend offline"));
      }, heartbeatMs);
    })
    .catch(() => {
      setStatus("offline", "Backend offline");
    });

  window.addEventListener("pagehide", sendLeave);
})();
