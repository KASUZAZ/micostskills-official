// =========================================================================
// MiCoSTSkills GLOBAL COMPONENTS & ADVANCED ANIMATION ENGINE
// =========================================================================

function loadSharedComponents() {
  const portalOrigin = window.location.protocol === "file:" ? "http://localhost:3000" : window.location.origin;
  const isStaticPreview = window.location.protocol === "file:" || window.location.hostname.endsWith("github.io");
  const studentPortalHref = isStaticPreview ? "./student.html" : `${portalOrigin}/student-portal`;
  const lecturerPortalHref = isStaticPreview ? "./student.html?portal=lecturer" : `${portalOrigin}/lecturer-portal`;
  const adminPortalHref = isStaticPreview ? "./student.html?portal=admin" : `${portalOrigin}/admin-portal`;
  // 1. LOAD HEADER & NAVBAR WITH PREMIUM MICRO-INTERACTIONS
  const siteHeader = `
    <header id="siteHeader" class="sticky top-0 z-50">
      <div class="top-bar bg-gradient-to-r from-red-600 via-slate-900 to-blue-600 text-slate-300 transition-transform duration-300 will-change-transform">
        <div class="top-bar-container">
          <div class="top-bar-contact">
            <span>📞 06 288 3126 | 27 | 28</span>
            <span>📱 06 288 3135</span>
            <span>✉️ info@micost.edu.my</span>
          </div>
          <div class="top-bar-social">
            <a class="social-link hover:text-white transition duration-200" href="#">YouTube</a>
            <a class="social-link hover:text-white transition duration-200" href="#">Facebook</a>
            <a class="social-link hover:text-white transition duration-200" href="#">Instagram</a>
            <a class="social-link hover:text-white transition duration-200" href="#">TikTok</a>
          </div>
        </div>
      </div>

      <nav class="navbar border-b bg-white/90 backdrop-blur-md w-full transition-all duration-300">
        <div class="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
          <a href="./index.html" class="flex items-center gap-3 flex-shrink-0 group">
            <div class="overflow-hidden rounded-xl bg-slate-50 p-1 border border-slate-100 transition-transform duration-500 group-hover:rotate-[360deg]">
              <img src="./resources/MiCoST-Logo-Vector.svg-.png" alt="MiCoST Logo" class="h-10 w-10 object-contain" />
            </div>
            <div class="logo-text">
              <span class="logo-title block text-slate-900 font-bold transition-colors group-hover:text-indigo-600">MiCoSTSkills</span>
              <span class="logo-subtitle block text-[11px] text-slate-500">Hub Latihan Kemahiran TVET</span>
            </div>
          </a>

          <div class="hidden min-w-0 flex-1 items-center justify-end gap-4 md:flex font-medium text-sm text-slate-600">
            <a href="./index.html" class="nav-link relative py-2 transition-colors hover:text-indigo-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-indigo-600 after:transition-all hover:after:w-full">Utama</a>
            <a href="./introduction.html" class="nav-link relative py-2 transition-colors hover:text-indigo-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-indigo-600 after:transition-all hover:after:w-full">Pengenalan</a>
            <a href="./org-chart.html" class="nav-link relative py-2 transition-colors hover:text-indigo-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-indigo-600 after:transition-all hover:after:w-full">Carta Organisasi</a>
            <a href="./convocation.html" class="nav-link relative py-2 transition-colors hover:text-indigo-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-indigo-600 after:transition-all hover:after:w-full">Konvokesyen</a>

            <div class="relative group">
              <button class="flex items-center gap-1 py-2 font-bold text-indigo-700 transition-colors hover:text-indigo-900">
                Admission <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              <div class="absolute right-0 mt-1 w-60 origin-top-right rounded-xl border border-slate-100 bg-white p-2 shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <a href="./program-catalogue.html" class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"><span aria-hidden="true">▣</span> Program Catalog</a>
                <a href="./scholarships.html" class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"><span aria-hidden="true">$</span> Insentif & Biasiswa</a>
                <a href="./register-here.html" class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition"><span aria-hidden="true">▤</span> Register Here</a>
                <a href="https://micost.edu.my/v2/index.php/admission/mqa" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"><span aria-hidden="true">☑</span> MQA</a>
                <a href="https://micost.edu.my/v2/index.php/admission/faculties" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"><span aria-hidden="true">▰</span> Faculties</a>
                <a href="./fees.html" class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition"><span aria-hidden="true">⌂</span> Fees</a>
                <a href="./accommodation.html" class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"><span aria-hidden="true">▥</span> Asrama & Prasarana</a>
              </div>
            </div>
            
            <div class="relative group">
              <button class="flex items-center gap-1 py-2 transition-colors hover:text-indigo-600">
                E-Learning <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              <div class="absolute right-0 mt-1 w-48 origin-top-right rounded-xl border border-slate-100 bg-white p-2 shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <a href="./elearning.html" class="block rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition">Portal E-Learning</a>
              </div>
            </div>

            <div class="relative group">
              <button class="flex items-center gap-1 py-2 font-bold text-indigo-700 transition-colors hover:text-indigo-900">
                Portal <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              <div class="absolute right-0 mt-1 w-64 origin-top-right rounded-xl border border-slate-100 bg-white p-2 shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <a href="${studentPortalHref}" class="block w-full rounded-lg px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">Student Portal SKY</a>
                <a href="${lecturerPortalHref}" class="mt-1 block w-full rounded-lg px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">Lecturer Portal</a>
                <a href="${adminPortalHref}" class="mt-1 block w-full rounded-lg px-4 py-3 text-center text-sm font-bold text-red-700 hover:bg-red-50 transition">Admin Portal</a>
              </div>
            </div>
          </div>

          <a id="studentLoginOpenBtnMobile" href="./student.html" class="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 md:hidden">
            Portal
          </a>
        </div>
      </nav>
    </header>
  `;

  // 2. LOAD FOOTER
  const siteFooter = `
    <footer class="border-t border-slate-900 bg-slate-950 text-slate-400 text-xs mt-20">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-white tracking-wider uppercase">MiCoSTSkills</h3>
          <p class="leading-relaxed">Melahirkan graduan berkemahiran tinggi, berdaya saing, dan bersedia mendepani industri teknologi masa hadapan.</p>
        </div>
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-white tracking-wider uppercase">Pautan Pintas</h3>
          <ul class="space-y-2">
            <li><a href="./index.html" class="hover:text-white transition">Halaman Utama</a></li>
            <li><a href="./introduction.html" class="hover:text-white transition">Mengenai MiCoST</a></li>
            <li><a href="./org-chart.html" class="hover:text-white transition">Pengurusan Hub</a></li>
          </ul>
        </div>
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-white tracking-wider uppercase">Program Utama</h3>
          <ul class="space-y-2">
            <li><a href="./elearning-komputer-full.html" class="hover:text-white transition">Sistem Komputer (DKM/SKM)</a></li>
            <li><a href="./elearning-elektrik-full.html" class="hover:text-white transition">Pemasangan Elektrik (SKM)</a></li>
          </ul>
        </div>
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-white tracking-wider uppercase">Hubungi Kami</h3>
          <p class="leading-relaxed">Lot 925, Blok C, Wisma Yayasan Melaka, Jalan Hang Tuah, 75300 Melaka.</p>
        </div>
      </div>
      <div class="border-t border-slate-900 py-6 text-center text-[11px]">
        <p>&copy; 2026 MiCoSTSkills KASUZAZ. Hak Cipta Terpelihara.</p>
      </div>
    </footer>
  `;

  // Masukkan elemen ke dalam DOM secara selamat
  const body = document.body;
  body.insertAdjacentHTML("afterbegin", siteHeader);
  body.insertAdjacentHTML("beforeend", siteFooter);

  // Inisiasi Enjin Animasi Global & Kesan Sembang AI
  initGlobalAnimations();
  loadAiChatAndWhatsAppBot();
}

// =========================================================================
// STUDENT LOGIN PORTAL - CONNECTED TO MICOST BACKEND API
// =========================================================================
function loadStudentLoginPortal() {
  const apiOrigin = window.location.protocol === "file:" ? "http://localhost:3000" : window.location.origin;
  const portal = document.createElement("div");

  portal.innerHTML = `
    <style>
      .student-login-field {
        width: 100%;
        border-radius: 0.9rem;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        padding: 0.75rem 0.9rem;
        font-size: 0.9rem;
        outline: none;
        transition: 0.2s ease;
      }
      .student-login-field:focus {
        border-color: #4f46e5;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.14);
      }
      .student-login-label {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.78rem;
        font-weight: 800;
        color: #334155;
      }
    </style>

    <div id="studentLoginModal" class="fixed inset-0 z-[10000] hidden items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-start justify-between bg-slate-950 px-5 py-4 text-white">
          <div>
            <h2 id="studentLoginTitle" class="text-lg font-black">Student Portal</h2>
            <p id="studentLoginSubtitle" class="mt-1 text-xs text-slate-300">Log masuk menggunakan akaun micost-backend.</p>
          </div>
          <button id="studentLoginCloseBtn" class="rounded-lg px-2 py-1 text-xl leading-none text-slate-300 hover:bg-white/10 hover:text-white" type="button">&times;</button>
        </div>

        <form id="studentLoginForm" class="space-y-4 p-5">
          <div id="studentNameWrap" class="hidden">
            <label class="student-login-label" for="studentName">Nama Pelajar</label>
            <input id="studentName" class="student-login-field" type="text" autocomplete="name" placeholder="Nama penuh" />
          </div>

          <div>
            <label class="student-login-label" for="studentEmail">Email</label>
            <input id="studentEmail" class="student-login-field" type="email" autocomplete="email" placeholder="student@email.com" required />
          </div>

          <div>
            <label class="student-login-label" for="studentPassword">Password</label>
            <input id="studentPassword" class="student-login-field" type="password" autocomplete="current-password" placeholder="Masukkan password" required />
          </div>

          <div id="studentProgramWrap" class="hidden">
            <label class="student-login-label" for="studentProgram">Program</label>
            <select id="studentProgram" class="student-login-field">
              <option value="">Pilih program</option>
              <option value="F432-005-2:2019 Pemasangan dan Penyelenggaraan Elektrik">F432-005-2:2019 Pemasangan dan Penyelenggaraan Elektrik</option>
              <option value="F432-005-3:2019 Pemasangan dan Penyelenggaraan Elektrik">F432-005-3:2019 Pemasangan dan Penyelenggaraan Elektrik</option>
              <option value="IT-020-3:2013 Operasi Sistem Komputer">IT-020-3:2013 Operasi Sistem Komputer</option>
              <option value="IT-020-4:2013 Pentadbiran Sistem Komputer">IT-020-4:2013 Pentadbiran Sistem Komputer</option>
            </select>
          </div>

          <div id="studentLoginStatus" class="hidden rounded-xl px-3 py-2 text-xs font-semibold"></div>

          <button id="studentLoginSubmitBtn" class="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-700 active:scale-[0.99]" type="submit">
            Login
          </button>

          <button id="studentLoginModeBtn" class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50" type="button">
            Belum ada akaun? Daftar pelajar
          </button>
        </form>

        <div id="studentPortalPanel" class="hidden space-y-4 p-5">
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">Login berjaya</p>
            <h3 id="studentPortalName" class="mt-1 text-lg font-black text-slate-900"></h3>
            <p id="studentPortalProgram" class="mt-1 text-sm text-slate-600"></p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <a class="rounded-xl bg-slate-950 px-3 py-3 text-center font-bold text-white hover:bg-slate-800" href="./elearning-komputer-full.html">E-Learning Komputer</a>
            <a class="rounded-xl bg-slate-950 px-3 py-3 text-center font-bold text-white hover:bg-slate-800" href="./elearning-elektrik-full.html">E-Learning Elektrik</a>
          </div>
          <button id="studentLogoutBtn" class="w-full rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50" type="button">Logout</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(portal);

  const modal = document.getElementById("studentLoginModal");
  const openButtons = document.querySelectorAll(".student-login-trigger");
  const closeBtn = document.getElementById("studentLoginCloseBtn");
  const form = document.getElementById("studentLoginForm");
  const portalPanel = document.getElementById("studentPortalPanel");
  const modeBtn = document.getElementById("studentLoginModeBtn");
  const submitBtn = document.getElementById("studentLoginSubmitBtn");
  const statusBox = document.getElementById("studentLoginStatus");
  const nameWrap = document.getElementById("studentNameWrap");
  const programWrap = document.getElementById("studentProgramWrap");
  const subtitle = document.getElementById("studentLoginSubtitle");
  const modalTitle = document.getElementById("studentLoginTitle");
  const logoutBtn = document.getElementById("studentLogoutBtn");

  let isRegisterMode = false;

  function setStatus(message, type = "info") {
    statusBox.textContent = message;
    statusBox.className = "rounded-xl px-3 py-2 text-xs font-semibold";
    statusBox.classList.remove("hidden");
    statusBox.classList.add(
      type === "error" ? "bg-red-50" : "bg-emerald-50",
      type === "error" ? "text-red-700" : "text-emerald-700",
    );
  }

  function clearStatus() {
    statusBox.textContent = "";
    statusBox.classList.add("hidden");
  }

  function openModal(event) {
    const portalLabel = event?.currentTarget?.dataset?.portalLabel || "Student Portal";
    modalTitle.textContent = portalLabel;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    renderStoredStudent();
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  function setMode(nextMode) {
    isRegisterMode = nextMode;
    nameWrap.classList.toggle("hidden", !isRegisterMode);
    programWrap.classList.toggle("hidden", !isRegisterMode);
    submitBtn.textContent = isRegisterMode ? "Daftar Akaun Pelajar" : "Login";
    modeBtn.textContent = isRegisterMode ? "Sudah ada akaun? Login pelajar" : "Belum ada akaun? Daftar pelajar";
    subtitle.textContent = isRegisterMode
      ? "Daftar akaun pelajar baru melalui micost-backend."
      : "Log masuk menggunakan akaun micost-backend.";
    clearStatus();
  }

  function renderStoredStudent() {
    const storedUser = JSON.parse(localStorage.getItem("micostStudentUser") || "null");
    const token = localStorage.getItem("micostStudentToken");

    if (!storedUser || !token) {
      form.classList.remove("hidden");
      portalPanel.classList.add("hidden");
      openButtons.forEach((button) => {
        if (button.id === "studentLoginOpenBtnMobile") {
          button.textContent = "Student Portal";
        }
      });
      return;
    }

    form.classList.add("hidden");
    portalPanel.classList.remove("hidden");
    openButtons.forEach((button) => {
      if (button.id === "studentLoginOpenBtnMobile") {
        button.textContent = `Hi, ${storedUser.name || "Student"}`;
      }
    });
    document.getElementById("studentPortalName").textContent = storedUser.name || "Student";
    document.getElementById("studentPortalProgram").textContent = storedUser.program || "Program belum diset";
  }

  async function submitStudentForm(event) {
    event.preventDefault();
    clearStatus();
    submitBtn.disabled = true;
    submitBtn.textContent = isRegisterMode ? "Mendaftar..." : "Logging in...";

    const email = document.getElementById("studentEmail").value.trim();
    const password = document.getElementById("studentPassword").value;
    const payload = isRegisterMode
      ? {
          name: document.getElementById("studentName").value.trim(),
          email,
          password,
          program: document.getElementById("studentProgram").value,
        }
      : { email, password };

    try {
      const endpoint = isRegisterMode ? "/api/register" : "/api/login";
      let response;
      try {
        response = await fetch(apiOrigin + endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        throw new Error(`Backend tidak aktif. Jalankan server dahulu, kemudian buka ${apiOrigin}/student-portal.`);
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Permintaan gagal.");
      }

      if (isRegisterMode) {
        setStatus("Akaun berjaya didaftarkan. Sila login menggunakan email dan password tadi.");
        setMode(false);
        return;
      }

      localStorage.setItem("micostStudentToken", data.token);
      localStorage.setItem("micostStudentUser", JSON.stringify(data.user));
      renderStoredStudent();
      setStatus("Login berjaya.");
    } catch (error) {
      setStatus(error.message || "Tidak dapat berhubung dengan backend.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isRegisterMode ? "Daftar Akaun Pelajar" : "Login";
    }
  }

  openButtons.forEach((button) => button.addEventListener("click", openModal));
  closeBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  modeBtn?.addEventListener("click", () => setMode(!isRegisterMode));
  form?.addEventListener("submit", submitStudentForm);
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("micostStudentToken");
    localStorage.removeItem("micostStudentUser");
    form.reset();
    setMode(false);
    renderStoredStudent();
  });

  setMode(false);
  renderStoredStudent();
}

// =========================================================================
// ENJIN ANIMASI GLOBAL (SCROLL REVEAL & INTERACTION ENGINE)
// =========================================================================
function initGlobalAnimations() {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    /* CSS Animasi Asas & Utiliti */
    .scroll-reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.7s cubic-bezier(0.215, 0.61, 0.355, 1), transform 0.7s cubic-bezier(0.215, 0.61, 0.355, 1);
      will-change: transform, opacity;
    }
    .scroll-reveal.revealed {
      opacity: 1;
      transform: translateY(0);
    }
    
    /* Hover Effects untuk Kad Program/Galeri */
    .program-card, .gallery-item, .member-card, .card-elearning {
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
    }
    .program-card:hover, .gallery-item:hover, .member-card:hover, .card-elearning:hover {
      transform: translateY(-8px) scale(1.02) !important;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12) !important;
      border-color: rgba(99, 102, 241, 0.3) !important;
    }
  `;
  document.head.appendChild(styleTag);

  // Sasarkan elemen-elemen utama di halaman untuk diberikan kesan Scroll Reveal
  const selectors = [
    ".intro-section",
    ".program-section",
    ".gallery-section",
    "main section",
    ".quiz-panel",
    ".module-item",
    ".department",
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el, index) => {
      el.classList.add("scroll-reveal");
      // Memberikan staggered delay automatik berdasarkan urutan susunan elemen
      el.style.transitionDelay = `${(index % 3) * 0.1}s`;
    });
  });

  // Guna IntersectionObserver untuk kesan kemunculan masa skrol
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          // Boleh kekalkan atau unobserve untuk efek sekali lalu yang kemas
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
  );

  document
    .querySelectorAll(".scroll-reveal")
    .forEach((el) => revealObserver.observe(el));
}

// =========================================================================
// PREMIUM AI CHAT BOX + WHATSAPP BOT (ADVANCED ANIMATIONS)
// =========================================================================
function loadAiChatAndWhatsAppBot() {
  const liveServerPorts = ["5500", "5501", "5502"];
  const apiOrigin = window.location.protocol === "file:" || liveServerPorts.includes(window.location.port)
    ? "http://localhost:3000"
    : window.location.origin;
  const botWidget = document.createElement("div");

  botWidget.innerHTML = `
    <style>
      @keyframes float-gentle {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-10px) scale(1.02); }
      }
      @keyframes dynamic-pulse {
        0% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
        50% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
        100% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
      @keyframes wa-pulse {
        0% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
        50% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
        100% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
      }
      @keyframes pop-fluid {
        0% { opacity: 0; transform: translateY(25px) scale(0.85); }
        70% { transform: translateY(-4px) scale(1.02); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes dot-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes slide-in-pill {
        0% { opacity: 0; transform: translateX(15px); }
        100% { opacity: 1; transform: translateX(0); }
      }

      .animate-float-premium { animation: float-gentle 4s ease-in-out infinite; }
      .animate-ai-pulse { animation: dynamic-pulse 2s infinite; }
      .animate-wa-pulse { animation: wa-pulse 2s infinite 0.3s; }
      .msg-fluid { animation: pop-fluid 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      
      .dot-1 { animation: dot-bounce 1s infinite 0.1s; }
      .dot-2 { animation: dot-bounce 1s infinite 0.2s; }
      .dot-3 { animation: dot-bounce 1s infinite 0.3s; }

      .quick-pill { opacity: 0; animation: slide-in-pill 0.3s ease-out forwards; }
      .quick-pill:nth-child(1) { animation-delay: 0.1s; }
      .quick-pill:nth-child(2) { animation-delay: 0.2s; }
      .quick-pill:nth-child(3) { animation-delay: 0.3s; }

      #chatMessages::-webkit-scrollbar { width: 5px; }
      #chatMessages::-webkit-scrollbar-track { background: transparent; }
      #chatMessages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

      .chat-bot-message,
      .chat-user-message {
        background: #ffffff !important;
        color: #000000 !important;
        font-weight: 700 !important;
      }
    </style>

    <div id="aiChatWidget" class="fixed bottom-6 right-6 z-[9999] font-sans">
      <div id="chatPanel" class="hidden opacity-0 translate-y-12 scale-95 transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) mb-5 w-[360px] overflow-hidden rounded-2xl border border-white/40 bg-white/95 backdrop-blur-md shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)]">
        
        <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-5 py-4 text-white relative border-b border-white/10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div>
                <h3 class="font-bold tracking-wide text-sm text-slate-100 flex items-center gap-1.5">Mira AI Assistant</h3>
                <p class="text-[11px] text-slate-400">Gemini-powered MiCoSTSkills chat</p>
              </div>
            </div>
            <span class="text-[10px] bg-white/10 text-indigo-300 px-2 py-0.5 rounded-full font-medium border border-white/5">AI Beta</span>
          </div>
        </div>

        <div id="chatMessages" class="h-80 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-slate-100/50 p-4 text-xs leading-relaxed">
          <div class="chat-bot-message max-w-[85%] rounded-2xl rounded-tl-none bg-white p-3 font-semibold text-black shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 msg-fluid">
            Selamat datang! Saya pembantu AI MiCoSTSkills. Ada sebarang perkara mengenai program kemahiran atau pendaftaran yang ingin anda tahu? ✨
          </div>
        </div>

        <div class="border-t border-slate-100 bg-white p-4">
          <div class="mb-3 flex flex-wrap gap-1.5">
            <button class="quickAsk quick-pill rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-[11px] text-slate-600 font-semibold transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 hover:-translate-y-0.5 hover:shadow-sm" data-msg="Senarai program apa yang ditawarkan?">📚 Program</button>
            <button class="quickAsk quick-pill rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-[11px] text-slate-600 font-semibold transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 hover:-translate-y-0.5 hover:shadow-sm" data-msg="Di mana lokasi MiCoST?">📍 Lokasi</button>
            <button class="quickAsk quick-pill rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-[11px] text-slate-600 font-semibold transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 hover:-translate-y-0.5 hover:shadow-sm" data-msg="Bagaimana cara daftar masuk?">📝 Daftar</button>
            <button class="quickAsk quick-pill rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-[11px] text-slate-600 font-semibold transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 hover:-translate-y-0.5 hover:shadow-sm" data-msg="Macam mana nak buka e-learning?">💻 E-Learning</button>
            <button class="quickAsk quick-pill rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-[11px] text-slate-600 font-semibold transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 hover:-translate-y-0.5 hover:shadow-sm" data-msg="Apa syarat kelayakan masuk?">✅ Syarat</button>
          </div>

          <div class="flex gap-2">
            <input id="chatInput" type="text" placeholder="Tanya sesuatu..." class="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"/>
            <button id="sendChatBtn" class="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-300 hover:bg-slate-800 active:scale-95">Hantar</button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3.5 animate-float-premium">
        <a id="whatsappBotBtn" href="https://wa.me/601173950492?text=Assalamualaikum%20admin%20MiCoSTSkills%2C%20saya%20nak%20tanya%20tentang%20program%20dan%20pendaftaran." target="_blank" class="animate-wa-pulse flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-300 hover:bg-green-600 hover:scale-115 hover:rotate-12 active:scale-90">
          <svg class="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397 0 11.93 0c3.165.001 6.14 1.233 8.377 3.469 2.237 2.235 3.469 5.211 3.469 8.379-.004 6.582-5.342 11.93-11.877 11.93h-.006c-2.014-.001-3.996-.51-5.772-1.482L0 24zm6.59-4.846c1.6.95 3.182 1.449 4.725 1.451 5.405.001 9.803-4.377 9.806-9.762.001-2.61-1.013-5.064-2.855-6.909C16.431 2.088 13.98 1.07 11.398 1.07 6.002 1.07 1.606 5.447 1.603 10.832c-.001 1.62.427 3.203 1.24 4.616l-.993 3.627 3.71-.973zm11.214-6.963c-.309-.155-1.826-.901-2.104-1.002-.278-.102-.481-.153-.682.153-.202.305-.779 1.002-.955 1.204-.177.202-.355.228-.664.073-.309-.155-1.305-.481-2.485-1.535-.918-.82-1.538-1.832-1.718-2.137-.18-.306-.019-.471.135-.624.14-.137.31-.361.464-.541.154-.18.206-.305.309-.509.104-.204.052-.382-.026-.536-.078-.155-.682-1.646-.935-2.254-.246-.594-.497-.513-.682-.522-.176-.008-.377-.01-.578-.011-.2-.001-.527.075-.802.377-.276.301-1.053 1.029-1.053 2.507 0 1.478 1.075 2.906 1.225 3.109.15.204 2.11 3.221 5.111 4.517.714.309 1.272.493 1.707.631.717.228 1.369.196 1.884.119.574-.085 1.826-.747 2.083-1.434.256-.687.256-1.275.179-1.399-.077-.124-.278-.203-.587-.358z"/></svg>
        </a>
        <button id="chatToggleBtn" class="animate-ai-pulse flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg transition-all duration-500 hover:bg-slate-800 hover:scale-115 active:scale-90">
          <span id="toggleIcon" class="inline-block transition-all duration-500 text-lg">🤖</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(botWidget);

  const chatPanel = document.getElementById("chatPanel");
  const chatToggleBtn = document.getElementById("chatToggleBtn");
  const toggleIcon = document.getElementById("toggleIcon");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const chatInput = document.getElementById("chatInput");
  const chatMessages = document.getElementById("chatMessages");
  const quickAskButtons = document.querySelectorAll(".quickAsk");

  chatToggleBtn.addEventListener("click", () => {
    if (chatPanel.classList.contains("hidden")) {
      chatPanel.classList.remove("hidden");
      quickAskButtons.forEach((btn) => {
        btn.style.animation = "none";
        btn.offsetHeight;
        btn.style.animation = null;
      });
      setTimeout(() => {
        chatPanel.classList.remove("opacity-0", "translate-y-12", "scale-95");
        toggleIcon.style.transform = "rotate(180deg) scale(0.9)";
        toggleIcon.innerHTML = `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
      }, 20);
    } else {
      chatPanel.classList.add("opacity-0", "translate-y-12", "scale-95");
      toggleIcon.style.transform = "rotate(0deg) scale(1)";
      setTimeout(() => {
        toggleIcon.textContent = "🤖";
      }, 150);
      setTimeout(() => {
        chatPanel.classList.add("hidden");
      }, 400);
    }
  });

  function addMessage(text, sender = "bot") {
    const message = document.createElement("div");
    if (sender === "user") {
      message.className =
        "chat-user-message ml-auto max-w-[85%] rounded-2xl rounded-tr-none border border-slate-200 bg-white p-3 font-semibold text-black shadow-md msg-fluid";
    } else {
      message.className =
        "chat-bot-message max-w-[85%] rounded-2xl rounded-tl-none bg-white p-3 font-semibold text-black shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 msg-fluid";
    }
    message.textContent = text;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return message;
  }

  function showTypingIndicator() {
    const indicator = document.createElement("div");
    indicator.id = "typingIndicator";
    indicator.className =
      "max-w-[60px] rounded-2xl rounded-tl-none bg-slate-200/60 p-3 flex items-center justify-center gap-1 shadow-sm border border-slate-100 msg-fluid";
    indicator.innerHTML = `
      <span class="h-1.5 w-1.5 rounded-full bg-slate-500 block dot-1"></span>
      <span class="h-1.5 w-1.5 rounded-full bg-slate-500 block dot-2"></span>
      <span class="h-1.5 w-1.5 rounded-full bg-slate-500 block dot-3"></span>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return indicator;
  }

  const botKnowledge = [
    {
      keywords: ["program", "kursus", "bidang", "belajar", "ditawarkan", "course"],
      answer:
        "MiCoSTSkills menawarkan laluan TVET seperti Sistem Komputer dan Pemasangan Elektrik. Untuk bahan pembelajaran, buka menu E-Learning dan pilih Sistem Komputer atau Pemasangan Elektrik.",
    },
    {
      keywords: ["komputer", "sistem komputer", "it", "ict", "network", "hardware", "software"],
      answer:
        "Program Sistem Komputer merangkumi asas komputer, hardware, software, operating system, networking, troubleshooting, keselamatan ICT, latihan amali dan mini quiz.",
    },
    {
      keywords: ["elektrik", "wiring", "litar", "mcb", "rccb", "multimeter", "pemasangan"],
      answer:
        "Program Pemasangan Elektrik merangkumi keselamatan elektrik, wiring asas, komponen litar, alat tangan, lukisan skematik, latihan amali dan quiz keselamatan.",
    },
    {
      keywords: ["elearning", "e-learning", "online learning", "modul", "nota", "quiz", "kuiz", "video", "bahan"],
      answer:
        "Untuk buka eLearning, pergi ke menu E-Learning di bahagian atas website. Pilih Sistem Komputer atau Pemasangan Elektrik. Dalam page itu anda boleh cari nota, video, tools, tugasan dan quiz menggunakan search atau filter.",
    },
    {
      keywords: ["daftar", "pendaftaran", "apply", "mohon", "kemasukan", "intake", "masuk"],
      answer:
        "Untuk pendaftaran, sediakan nama penuh, nombor telefon, program pilihan dan dokumen asas pelajar. Cara paling cepat ialah klik ikon WhatsApp hijau supaya pegawai boleh bantu semak intake dan langkah seterusnya.",
    },
    {
      keywords: ["syarat", "kelayakan", "layak", "spm", "umur", "requirement"],
      answer:
        "Syarat boleh bergantung pada program dan tahap pengajian. Secara umum, calon perlu berminat dalam latihan kemahiran TVET dan memenuhi syarat asas program. Untuk semakan tepat, hubungi urusetia melalui WhatsApp dengan nama program yang diminati.",
    },
    {
      keywords: ["lokasi", "alamat", "mana", "kampus", "map", "maps", "wisma"],
      answer:
        "Lokasi MiCoSTSkills: Lot 925, Blok C, Wisma Yayasan Melaka, Jalan Hang Tuah, 75300 Melaka. Anda juga boleh buka halaman Location untuk peta dan maklumat perhubungan.",
    },
    {
      keywords: ["telefon", "phone", "contact", "hubungi", "email", "emel", "nombor", "whatsapp"],
      answer:
        "Anda boleh hubungi MiCoSTSkills melalui telefon 06 288 3126 / 3127 / 3128, faks 06 288 3135, email info@micost.edu.my, atau terus klik ikon WhatsApp hijau di bawah kanan website.",
    },
    {
      keywords: ["masa", "waktu", "jadual", "kelas", "bila", "duration", "tempoh"],
      answer:
        "Jadual, tempoh kelas dan tarikh intake bergantung pada program semasa. Beritahu program yang anda minat, contohnya Sistem Komputer atau Pemasangan Elektrik, kemudian hubungi urusetia untuk jadual rasmi.",
    },
    {
      keywords: ["sijil", "skm", "dkm", "diploma", "tvet", "jpk"],
      answer:
        "MiCoSTSkills memfokuskan latihan kemahiran TVET seperti SKM/DKM mengikut program yang ditawarkan. Untuk pengesahan tahap sijil bagi intake semasa, semak dengan urusetia melalui WhatsApp.",
    },
    {
      keywords: ["kerja", "career", "karier", "peluang", "industri", "praktikal", "intern"],
      answer:
        "Laluan TVET biasanya menekankan kemahiran praktikal untuk industri. Bidang komputer boleh menuju sokongan IT, technician dan networking, manakala elektrik boleh menuju kerja wiring, maintenance dan technical support.",
    },
    {
      keywords: ["konvokesyen", "graduasi", "graduate"],
      answer:
        "Maklumat dan galeri konvokesyen boleh dibuka melalui menu Konvokesyen. Halaman itu memaparkan gambar acara graduasi MiCoSTSkills.",
    },
    {
      keywords: ["carta", "organisasi", "staff", "pengurusan", "pensyarah"],
      answer:
        "Carta organisasi dan maklumat pengurusan boleh dibuka melalui menu Carta Organisasi di navigation bar.",
    },
    {
      keywords: ["hai", "hi", "hello", "salam", "assalamualaikum", "helo"],
      answer:
        "Hai, selamat datang ke MiCoSTSkills. Saya boleh bantu jawab soalan tentang program, pendaftaran, lokasi, syarat kelayakan dan eLearning.",
    },
    {
      keywords: ["terima kasih", "thanks", "thank you", "tq"],
      answer:
        "Sama-sama. Kalau perlukan bantuan lanjut, tanya sahaja di sini atau klik ikon WhatsApp hijau untuk berhubung dengan urusetia.",
    },
  ];

  function normaliseText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findPageAnswer(query) {
    const pageText = Array.from(document.querySelectorAll("h1, h2, h3, p, li, a"))
      .map((element) => element.textContent.trim())
      .filter(Boolean);
    const queryWords = normaliseText(query)
      .split(" ")
      .filter((word) => word.length > 3);

    if (!queryWords.length) return "";

    const scoredLines = pageText
      .map((text) => {
        const normalisedLine = normaliseText(text);
        const score = queryWords.reduce(
          (total, word) => total + (normalisedLine.includes(word) ? 1 : 0),
          0,
        );
        return { text, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!scoredLines.length) return "";

    const bestLines = scoredLines
      .slice(0, 2)
      .map((item) => item.text)
      .join(" ");

    return `Berdasarkan halaman ini: ${bestLines}`;
  }

  function getBotReply(question) {
    const q = normaliseText(question);
    const scoredAnswers = botKnowledge
      .map((item) => ({
        answer: item.answer,
        score: item.keywords.reduce(
          (total, keyword) => total + (q.includes(normaliseText(keyword)) ? 1 : 0),
          0,
        ),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredAnswers.length) {
      return scoredAnswers[0].answer;
    }

    const pageAnswer = findPageAnswer(question);
    if (pageAnswer) {
      return `${pageAnswer} Jika anda mahu maklumat rasmi yang lebih tepat, klik ikon WhatsApp hijau untuk bercakap dengan urusetia.`;
    }

    return "Saya boleh bantu semak soalan itu dari sudut MiCoSTSkills. Untuk jawapan paling tepat, nyatakan topik seperti program, pendaftaran, lokasi, syarat, eLearning, jadual kelas atau peluang kerjaya. Jika soalan itu perlukan pengesahan rasmi, klik ikon WhatsApp hijau untuk terus hubungi urusetia.";
  }

  window.micostChatbot = {
    getReply: getBotReply,
  };

  function getPageContextForAi() {
    return Array.from(document.querySelectorAll("h1, h2, h3, p, li"))
      .map((element) => element.textContent.trim())
      .filter(Boolean)
      .slice(0, 35)
      .join("\n")
      .slice(0, 2500);
  }

  async function getMiraAiReply(question) {
    const response = await fetch(`${apiOrigin}/api/mira-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: question,
        pageContext: getPageContextForAi(),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.reply) {
      throw new Error(data.error || "Mira AI belum tersedia.");
    }

    return data.reply;
  }

  async function sendChat() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    addMessage(userText, "user");
    chatInput.value = "";
    sendChatBtn.disabled = true;
    sendChatBtn.textContent = "Mira...";

    const typingBubble = showTypingIndicator();
    try {
      const reply = await getMiraAiReply(userText);
      typingBubble.remove();
      addMessage(reply, "bot");
    } catch {
      setTimeout(() => {
        typingBubble.remove();
        const reply = getBotReply(userText);
        addMessage(`${reply}\n\nNota: Mira AI Gemini belum aktif pada server, jadi jawapan ini guna mode fallback MiCoSTSkills.`, "bot");
      }, 500);
    } finally {
      sendChatBtn.disabled = false;
      sendChatBtn.textContent = "Hantar";
      chatInput.focus();
    }
  }

  sendChatBtn.addEventListener("click", sendChat);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChat();
  });
  quickAskButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      chatInput.value = btn.dataset.msg;
      sendChat();
    });
  });
}

document.addEventListener("DOMContentLoaded", loadSharedComponents);
