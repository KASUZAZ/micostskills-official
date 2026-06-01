const API_ORIGIN = window.location.protocol === "file:" ? "http://localhost:3000" : window.location.origin;
const courseType = document.body.dataset.course || "";
const finalExamState = {
  answers: {},
  correctAnswers: {},
};

function getToken() {
  return localStorage.getItem("token") || "";
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function setStoredSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function isStudentUser(user) {
  return user?.role === "student";
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(API_ORIGIN + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request gagal.");
  return data;
}

function initFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const resourceCards = document.querySelectorAll(".resource-card");
  const resourceSearch = document.querySelector("#resourceSearch");
  let selectedFilter = "all";
  let searchTerm = "";

  function applyResourceFilters() {
    resourceCards.forEach((card) => {
      const category = card.dataset.category || "";
      const cardText = card.textContent.toLowerCase();
      const matchesFilter = selectedFilter === "all" || category === selectedFilter;
      const matchesSearch = cardText.includes(searchTerm);
      card.hidden = !(matchesFilter && matchesSearch);
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selectedFilter = button.dataset.filter || "all";
      applyResourceFilters();
    });
  });

  resourceSearch?.addEventListener("input", () => {
    searchTerm = resourceSearch.value.trim().toLowerCase();
    applyResourceFilters();
  });

  applyResourceFilters();
}

function makeQuestionBank(type) {
  const komputer = [
    ["Apakah fungsi utama CPU?", ["Memproses arahan", "Menyimpan data kekal", "Mencetak dokumen", "Membekalkan kuasa"], "A"],
    ["Komponen manakah menyimpan data sementara?", ["RAM", "SSD", "Monitor", "Keyboard"], "A"],
    ["IP address digunakan untuk apa?", ["Mengenal pasti peranti dalam rangkaian", "Membersihkan virus", "Menambah RAM", "Membuka casing"], "A"],
    ["Perisian sistem yang mengurus hardware ialah", ["Operating system", "Spreadsheet", "Browser", "Antivirus sahaja"], "A"],
    ["Apakah tujuan backup data?", ["Mengurangkan risiko kehilangan data", "Meningkatkan saiz monitor", "Menukar voltan", "Mencetak fail"], "A"],
    ["Peranti input ialah", ["Keyboard", "Printer", "Speaker", "Projector"], "A"],
    ["Peranti output ialah", ["Monitor", "Mouse", "Scanner", "Microphone"], "A"],
    ["Kabel rangkaian biasa untuk LAN ialah", ["Ethernet", "HDMI", "VGA", "SATA"], "A"],
    ["BIOS/UEFI digunakan semasa", ["Boot dan konfigurasi asas", "Menaip dokumen", "Membuat poster", "Menghantar emel"], "A"],
    ["Antivirus membantu", ["Mengesan dan mengurangkan ancaman malware", "Menaikkan kelajuan internet sahaja", "Menukar CPU", "Mengecas bateri"], "A"],
    ["Subnet mask berkaitan dengan", ["Pembahagian rangkaian IP", "Saiz hard disk", "Resolusi skrin", "Jenis printer"], "A"],
    ["Device Manager digunakan untuk", ["Semak driver dan peranti", "Lukis litar", "Edit video", "Kira gaji"], "A"],
  ];
  const elektrik = [
    ["Apakah alat untuk mengukur voltan?", ["Multimeter", "Tukul", "Gergaji", "Spanar paip"], "A"],
    ["PPE digunakan untuk", ["Keselamatan kerja", "Meningkatkan voltan", "Menambah arus", "Menggantikan MCB"], "A"],
    ["MCB berfungsi sebagai", ["Perlindungan arus lebih", "Lampu hiasan", "Penyimpan tenaga", "Alat ukur suhu"], "A"],
    ["Wayar bumi biasanya berfungsi untuk", ["Laluan perlindungan keselamatan", "Menghasilkan cahaya", "Menyimpan data", "Menukar frekuensi"], "A"],
    ["Sebelum kerja wiring, bekalan perlu", ["Dimatikan dan disahkan selamat", "Dinaikkan voltan", "Dibiarkan terbuka", "Disambung terus"], "A"],
    ["RCCB membantu mengesan", ["Kebocoran arus", "Saiz skrin", "Kelajuan komputer", "Jenis printer"], "A"],
    ["Cable size dipilih berdasarkan", ["Beban dan arus litar", "Warna dinding", "Jenama laptop", "Jenis meja"], "A"],
    ["Test pen digunakan untuk", ["Mengesan kehadiran voltan", "Memotong kayu", "Membuka fail", "Mencetak lukisan"], "A"],
    ["Litar lampu satu hala dikawal oleh", ["Satu suis", "Tiga router", "Dua keyboard", "Satu printer"], "A"],
    ["Continuity test menyemak", ["Sambungan litar", "Warna kabel", "Tarikh sijil", "Saiz bilik"], "A"],
    ["Distribution board menempatkan", ["Peranti perlindungan dan agihan", "Fail komputer", "Aircond", "Server data"], "A"],
    ["Lockout/tagout bertujuan", ["Elak bekalan dihidupkan semasa kerja", "Mempercepat internet", "Menukar password", "Mencuci lantai"], "A"],
  ];
  const seed = type === "elektrik" ? elektrik : komputer;

  return Array.from({ length: 60 }, (_, index) => {
    const base = seed[index % seed.length];
    const cycle = Math.floor(index / seed.length) + 1;
    return {
      id: `q${index + 1}`,
      question: `${base[0]} (${cycle}.${(index % seed.length) + 1})`,
      options: base[1],
      answer: base[2],
    };
  });
}

function renderExam() {
  const mount = document.getElementById("finalExamQuestions");
  if (!mount || !courseType) return;

  const questions = makeQuestionBank(courseType);
  finalExamState.correctAnswers = Object.fromEntries(questions.map((question) => [question.id, question.answer]));
  mount.innerHTML = questions.map((question, index) => `
    <div class="question-box">
      <strong>${index + 1}. ${escapeHTML(question.question)}</strong>
      <div class="option-grid">
        ${question.options.map((option, optionIndex) => {
          const value = String.fromCharCode(65 + optionIndex);
          return `
            <label>
              <input type="radio" name="${question.id}" value="${value}" />
              <span>${value}. ${escapeHTML(option)}</span>
            </label>
          `;
        }).join("")}
      </div>
    </div>
  `).join("");

  mount.addEventListener("change", (event) => {
    if (event.target.matches("input[type='radio']")) {
      finalExamState.answers[event.target.name] = event.target.value;
      updateAnsweredCount();
    }
  });

  updateAnsweredCount();
}

function updateAnsweredCount() {
  const answered = Object.keys(finalExamState.answers).length;
  const el = document.getElementById("answeredCount");
  if (el) el.textContent = `${answered}/60`;
}

async function refreshCourseSession() {
  const user = getStoredUser();
  const loginForm = document.getElementById("courseLoginForm");
  const userChip = document.getElementById("courseUserChip");
  const status = document.getElementById("courseLoginStatus");

  if (user && getToken() && !isStudentUser(user)) {
    if (loginForm) loginForm.style.display = "none";
    if (userChip) {
      userChip.style.display = "flex";
      userChip.innerHTML = `
        <div>
          <strong>${escapeHTML(user.name || "Pengguna")}</strong>
          <span>Akaun ${escapeHTML(user.role || "staf")} tidak boleh menjawab final exam pelajar.</span>
        </div>
        <button class="secondary-btn" type="button" id="courseLogoutBtn">Tukar Akaun</button>
      `;
      document.getElementById("courseLogoutBtn")?.addEventListener("click", () => {
        clearStoredSession();
        window.location.reload();
      });
    }
    if (status) status.textContent = "Sila tukar kepada akaun pelajar untuk final exam dan e-certificate.";
    return;
  }

  if (user && getToken()) {
    if (loginForm) loginForm.style.display = "none";
    if (userChip) {
      userChip.style.display = "flex";
      userChip.innerHTML = `
        <div>
          <strong>${escapeHTML(user.name || "Pelajar")}</strong>
          <span>${escapeHTML(user.program || "Program belum ditetapkan")}</span>
        </div>
        <button class="secondary-btn" type="button" id="courseLogoutBtn">Logout</button>
      `;
      document.getElementById("courseLogoutBtn")?.addEventListener("click", () => {
        clearStoredSession();
        window.location.reload();
      });
    }
    if (status) status.textContent = "Login aktif. Final exam dan sijil akan menggunakan akaun Student Portal ini.";
    await loadLeaderboard();
    await loadBestCertificate();
    return;
  }

  if (status) status.textContent = "Sila login menggunakan akaun Student Portal untuk jawab final exam.";
}

function initCourseLogin() {
  const form = document.getElementById("courseLoginForm");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("courseLoginStatus");
    const email = document.getElementById("courseEmail").value.trim();
    const password = document.getElementById("coursePassword").value;
    try {
      const data = await fetch(`${API_ORIGIN}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || "Login gagal.");
        return payload;
      });
      if (!isStudentUser(data.user)) {
        clearStoredSession();
        throw new Error("Final exam e-learning hanya untuk akaun pelajar. Sila login Student Portal.");
      }
      setStoredSession(data);
      if (status) status.textContent = "Login berjaya.";
      await refreshCourseSession();
    } catch (error) {
      if (status) status.textContent = error.message;
    }
  });
}

async function submitFinalExam() {
  const status = document.getElementById("examStatus");
  if (!getToken()) {
    if (status) status.textContent = "Sila login dahulu sebelum hantar final exam.";
    document.getElementById("courseEmail")?.focus();
    return;
  }

  if (!isStudentUser(getStoredUser())) {
    if (status) status.textContent = "Akaun ini bukan akaun pelajar. Sila tukar akaun sebelum hantar final exam.";
    return;
  }

  if (Object.keys(finalExamState.answers).length < 60) {
    if (status) status.textContent = "Sila jawab semua 60 soalan sebelum hantar.";
    return;
  }

  try {
    const data = await api(`/api/elearning/final-exam/${courseType}/submit`, {
      method: "POST",
      body: JSON.stringify({
        answers: finalExamState.answers,
        correctAnswers: finalExamState.correctAnswers,
      }),
    });
    showCertificate(data.result);
    await loadLeaderboard();
    if (status) status.textContent = "Final exam berjaya dihantar. E-certificate telah dijana.";
  } catch (error) {
    if (status) status.textContent = error.message;
  }
}

function showCertificate(result) {
  const cert = document.getElementById("certificateCard");
  if (!cert) return;
  cert.style.display = "block";
  cert.dataset.name = result.name || "";
  cert.dataset.program = result.program || "";
  cert.dataset.title = result.title || "";
  cert.dataset.status = result.status || "";
  cert.dataset.score = result.score || "";
  cert.dataset.certificateId = result.certificate_id || "";
  cert.innerHTML = `
    <p class="el-kicker" style="color:#006657;border-color:#8edbd7;background:#f1fffd">E-Certificate</p>
    <h3>Sijil Tamat E-Learning TVET</h3>
    <p>Dianugerahkan kepada</p>
    <div class="cert-name">${escapeHTML(result.name)}</div>
    <p>${escapeHTML(result.program || "")}</p>
    <div class="cert-score">${escapeHTML(result.score)}%</div>
    <p>${escapeHTML(result.title)} - ${escapeHTML(result.status)}</p>
    <p class="status-note">ID Sijil: ${escapeHTML(result.certificate_id)}</p>
    <button class="primary-btn cert-download-btn" type="button" id="downloadCertificateBtn">Download Certificate</button>
  `;
  document.getElementById("downloadCertificateBtn")?.addEventListener("click", downloadCertificate);
  cert.scrollIntoView({ behavior: "smooth", block: "center" });
}

function downloadCertificate() {
  const cert = document.getElementById("certificateCard");
  if (!cert) return;

  const payload = {
    name: cert.dataset.name || "Pelajar",
    program: cert.dataset.program || "MiCoSTSkills TVET",
    title: cert.dataset.title || "Final Exam",
    status: cert.dataset.status || "Selesai",
    score: cert.dataset.score || "0",
    certificateId: cert.dataset.certificateId || "MICOST-CERT",
    issuedAt: new Date().toLocaleDateString("ms-MY", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };

  const certificateHtml = `<!doctype html>
<html lang="ms">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHTML(payload.certificateId)} - MiCoSTSkills E-Certificate</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef5f7; font-family: Arial, Helvetica, sans-serif; color: #26323a; }
    .certificate { width: min(1100px, 94vw); min-height: 720px; border: 12px solid #00b8b0; background: linear-gradient(135deg, rgba(0,184,176,0.11), transparent 36%), #fff; padding: 62px; text-align: center; box-shadow: 0 28px 80px rgba(15,23,42,0.18); }
    .brand { color: #1358a8; font-size: 24px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; }
    h1 { margin: 34px 0 10px; color: #cf202f; font-size: 54px; line-height: 1; }
    .small { color: #65737f; font-size: 18px; }
    .name { margin: 34px auto 12px; border-bottom: 3px solid #d9e2e8; padding-bottom: 14px; max-width: 820px; color: #1358a8; font-size: 42px; font-weight: 900; }
    .score { margin: 26px 0; color: #cf202f; font-size: 70px; font-weight: 900; }
    .meta { margin-top: 28px; display: grid; gap: 10px; color: #26323a; font-size: 18px; font-weight: 700; }
    .footer { margin-top: 56px; display: flex; justify-content: space-between; gap: 20px; color: #65737f; font-size: 14px; text-align: left; }
    @media print { body { background: white; } .certificate { box-shadow: none; width: 100%; min-height: 100vh; } }
  </style>
</head>
<body>
  <main class="certificate">
    <div class="brand">MiCoSTSkills E-Learning TVET</div>
    <h1>Sijil Tamat E-Learning</h1>
    <p class="small">Dianugerahkan kepada</p>
    <div class="name">${escapeHTML(payload.name)}</div>
    <p class="small">${escapeHTML(payload.program)}</p>
    <div class="score">${escapeHTML(payload.score)}%</div>
    <div class="meta">
      <div>${escapeHTML(payload.title)} - ${escapeHTML(payload.status)}</div>
      <div>ID Sijil: ${escapeHTML(payload.certificateId)}</div>
      <div>Tarikh Dikeluarkan: ${escapeHTML(payload.issuedAt)}</div>
    </div>
    <div class="footer">
      <div>Disahkan oleh Sistem E-Learning MiCoSTSkills</div>
      <div>Dokumen digital ini boleh dicetak melalui browser.</div>
    </div>
  </main>
</body>
</html>`;

  const blob = new Blob([certificateHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${payload.certificateId}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function loadBestCertificate() {
  if (!courseType || !getToken()) return;
  try {
    const data = await api(`/api/elearning/me?course=${courseType}`);
    if (data.best) showCertificate({ ...data.best, name: data.user.name, program: data.user.program, title: data.best.title || "Final Exam" });
  } catch {
    // Certificate panel is optional until a student completes the exam.
  }
}

async function loadLeaderboard() {
  const mount = document.getElementById("leaderboardTop");
  if (!mount || !courseType || !getToken()) return;

  try {
    const data = await api(`/api/elearning/leaderboard?course=${courseType}`);
    mount.innerHTML = data.top
      ? `
        <div class="tag">Top 1</div>
        <h3>${escapeHTML(data.top.name)}</h3>
        <p class="cert-score">${escapeHTML(data.top.score)}%</p>
        <p>${escapeHTML(data.top.correct)}/${escapeHTML(data.top.total_questions)} soalan betul</p>
        <p class="status-note">${escapeHTML(data.top.certificate_id || "")}</p>
      `
      : "<p class='status-note'>Belum ada ranking. Pelajar pertama yang hantar final exam akan muncul di sini.</p>";
  } catch (error) {
    mount.innerHTML = `<p class="status-note">${escapeHTML(error.message)}</p>`;
  }
}

function initExamActions() {
  document.getElementById("submitFinalExam")?.addEventListener("click", submitFinalExam);
}

function initAnchorNav() {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

initFilters();
initCourseLogin();
initExamActions();
initAnchorNav();
renderExam();
refreshCourseSession();
