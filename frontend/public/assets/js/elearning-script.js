const API_ORIGIN = window.location.protocol === "file:" || window.location.hostname.endsWith("github.io")
  ? "http://localhost:3000"
  : window.location.origin;
const courseType = document.body.dataset.course || "";
const finalExamState = {
  answers: {},
  total: 0,
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
      const categories = category.split(/\s+/).filter(Boolean);
      const matchesFilter = selectedFilter === "all" || categories.includes(selectedFilter);
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

async function loadLecturerMaterials() {
  const mount = document.getElementById("lecturerMaterials");
  if (!mount || !courseType) return;

  try {
    const data = await api(`/api/elearning/materials?course=${courseType}`);
    const materials = data.materials || [];
    if (!materials.length) {
      mount.innerHTML = "";
      return;
    }

    mount.innerHTML = `
      <div class="lecturer-materials-header">
        <p class="eyebrow">Bahan Tambahan Lecturer</p>
        <h3>Nota, video dan maklumat terkini</h3>
      </div>
      <div class="lecturer-material-grid">
        ${materials.map((item, index) => `
          <article class="resource-card lecturer-material-card" data-category="${escapeHTML(String(item.type || "note").toLowerCase())}">
            <div class="resource-icon">${String(index + 1).padStart(2, "0")}</div>
            <h3>${escapeHTML(item.title)}</h3>
            <p>${escapeHTML(item.content || "Bahan tambahan daripada lecturer untuk program ini.")}</p>
            <div class="tag-row">
              <span class="tag">${escapeHTML(item.type || "Nota")}</span>
              <span class="tag">${escapeHTML(item.program_code || "")}</span>
            </div>
            ${item.link ? `<a class="open-btn" href="${escapeHTML(item.link)}" target="_blank" rel="noopener noreferrer">Buka Link</a>` : ""}
          </article>
        `).join("")}
      </div>
    `;
  } catch {
    mount.innerHTML = "";
  }
}

async function renderExam() {
  const mount = document.getElementById("finalExamQuestions");
  if (!mount || !courseType) return;

  mount.innerHTML = "<p class='status-note'>Memuatkan soalan final exam...</p>";

  let questions = [];
  try {
    const data = await api(`/api/elearning/final-exam/${courseType}/questions`);
    questions = data.questions || [];
  } catch (error) {
    mount.innerHTML = `<p class="status-note">${escapeHTML(error.message)}</p>`;
    return;
  }

  finalExamState.total = questions.length;
  mount.innerHTML = questions.map((question, index) => `
    <div class="question-box">
      <strong>${index + 1}. ${escapeHTML(question.question)}</strong>
      ${question.module ? `<p class="status-note">${escapeHTML(question.module)}</p>` : ""}
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
  if (el) el.textContent = `${answered}/${finalExamState.total || 60}`;
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

  if (Object.keys(finalExamState.answers).length < (finalExamState.total || 60)) {
    if (status) status.textContent = `Sila jawab semua ${finalExamState.total || 60} soalan sebelum hantar.`;
    return;
  }

  try {
    const data = await api(`/api/elearning/final-exam/${courseType}/submit`, {
      method: "POST",
      body: JSON.stringify({
        answers: finalExamState.answers,
      }),
    });
    showCertificate(data.result);
    await loadLeaderboard();
    if (status) {
      status.textContent = data.result.status === "Lulus"
        ? "Final exam berjaya dihantar. E-certificate telah dijana."
        : "Final exam berjaya dihantar. Markah belum lulus, sila ulang kaji dan cuba lagi.";
    }
  } catch (error) {
    if (status) status.textContent = error.message;
  }
}

function showCertificate(result) {
  const cert = document.getElementById("certificateCard");
  if (!cert) return;
  cert.style.display = "block";
  cert.classList.remove("certificate-card-visible");
  cert.dataset.name = result.name || "";
  cert.dataset.program = result.program || "";
  cert.dataset.title = result.title || "";
  cert.dataset.status = result.status || "";
  cert.dataset.score = result.score || "";
  cert.dataset.certificateId = result.certificate_id || "";

  if (result.status !== "Lulus") {
    cert.innerHTML = `
      <div class="certificate-pending">
        <p class="el-kicker" style="color:#9f1239;border-color:#fecdd3;background:#fff1f2">Belum Layak Sijil</p>
        <h3>Markah ${escapeHTML(result.score)}% - ${escapeHTML(result.status)}</h3>
        <p>Anda perlu mencapai sekurang-kurangnya 60% untuk menjana e-certificate.</p>
        <a class="primary-btn cert-download-btn" href="./elearning-komputer-exam.html">Ulang Final Exam</a>
      </div>
    `;
    cert.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  cert.innerHTML = `
    <div class="achievement-certificate">
      <div class="cert-corner cert-corner-tl"></div>
      <div class="cert-corner cert-corner-tr"></div>
      <div class="cert-ribbon">
        <div class="cert-medal">
          <span>MS</span>
          <small>MiCoSTSkills<br />E-Learning</small>
        </div>
      </div>
      <div class="cert-top">
        <img src="./resources/logo-micostskills.png" alt="MiCoSTSkills" />
        <div>
          <strong>MiCoSTSkills</strong>
          <span>Melaka International College of Science and Technology</span>
        </div>
      </div>
      <div class="cert-watermark">MS</div>
      <div class="cert-main">
        <h3>Sijil Pencapaian</h3>
        <p class="cert-subtitle">Certificate of Achievement</p>
        <p class="cert-presented">Dengan ini diperakui bahawa</p>
        <div class="cert-name">${escapeHTML(result.name)}</div>
        <p class="cert-body-text">
          telah berjaya menamatkan kursus e-learning dan penilaian yang ditetapkan
          melalui platform MiCoSTSkills.
        </p>
      </div>
      <div class="cert-info-grid">
        <div class="cert-course">
          <span>Kursus</span>
          <strong>Basic Computer System Administration</strong>
          <p>Pengenalan kepada sistem komputer, sistem operasi, pengurusan pengguna, penyelenggaraan sistem dan asas keselamatan.</p>
        </div>
        <div class="cert-meta-list">
          <div><span>Tempoh Pembelajaran</span><strong>10 Jam</strong></div>
          <div><span>Markah Penilaian</span><strong>${escapeHTML(result.score)}% (${Number(result.score) >= 85 ? "Cemerlang" : "Lulus"})</strong></div>
          <div><span>Tarikh Tamat</span><strong>${new Date().toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" })}</strong></div>
          <div><span>Certificate ID</span><strong>${escapeHTML(result.certificate_id)}</strong></div>
        </div>
        <div class="cert-verify">
          <strong>Pengesahan Sijil</strong>
          <span>www.micost.edu.my</span>
          <div class="cert-qr-placeholder">QR</div>
          <p>Sijil ini boleh disahkan secara dalam talian.</p>
        </div>
      </div>
      <div class="cert-sign-row">
        <div><span></span><p>Pengarah / Wakil Pengurusan MiCoST</p></div>
        <div><span></span><p>Penyelaras Program E-Learning / Ketua Program</p></div>
      </div>
      <div class="cert-bottom">
        <span>micost.official</span>
        <strong>www.micost.edu.my</strong>
        <span>Sijil digital dijana oleh sistem MiCoSTSkills.</span>
      </div>
    </div>
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
  const gradeLabel = Number(payload.score) >= 85 ? "Cemerlang" : "Lulus";
  const logoUrl = `${API_ORIGIN}/resources/logo-micostskills.png`;

  const certificateHtml = `<!doctype html>
<html lang="ms">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHTML(payload.certificateId)} - MiCoSTSkills E-Certificate</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef3f7; font-family: Arial, Helvetica, sans-serif; color: #0b2447; }
    .certificate { position: relative; width: min(1280px, 96vw); min-height: 820px; overflow: hidden; border: 10px solid #092346; background: #fff; padding: 42px 58px 74px 178px; box-shadow: 0 28px 80px rgba(15,23,42,0.18); }
    .certificate::before { content: ""; position: absolute; inset: 16px; border: 2px solid #c48a2c; pointer-events: none; }
    .certificate::after { content: "MS"; position: absolute; inset: 0; display: grid; place-items: center; color: rgba(9,35,70,0.04); font-family: Georgia, serif; font-size: 360px; font-weight: 900; pointer-events: none; }
    .ribbon { position: absolute; left: 58px; top: 0; width: 104px; height: 360px; background: linear-gradient(180deg,#061b39,#102f5c); border-left: 5px solid #c48a2c; border-right: 5px solid #c48a2c; }
    .ribbon::after { content: ""; position: absolute; left: 13px; right: 13px; bottom: -44px; border-left: 34px solid transparent; border-right: 34px solid transparent; border-top: 44px solid #102f5c; }
    .medal { position: absolute; left: 22px; top: 170px; width: 176px; height: 176px; display: grid; place-items: center; border-radius: 50%; background: radial-gradient(circle at 38% 32%,#fff7c4,#e8b341 56%,#a86c16); border: 8px solid #d7a23a; color: #113763; text-align: center; box-shadow: 0 14px 30px rgba(15,23,42,.2); z-index: 2; }
    .medal span { display: block; font-size: 46px; font-weight: 900; color: #d8232a; }
    .medal small { display: block; color: #0b2447; font-size: 15px; font-weight: 900; line-height: 1.1; }
    .top { position: relative; z-index: 1; display: flex; align-items: center; gap: 18px; margin: 8px 0 42px; }
    .top img { width: 80px; height: 80px; object-fit: contain; }
    .top strong { display: block; color: #e11d2e; font-size: 44px; line-height: .9; }
    .top span { color: #0b2447; font-size: 20px; font-weight: 800; text-transform: uppercase; }
    .main { position: relative; z-index: 1; text-align: center; }
    h1 { margin: 0; color: #0b2447; font-family: Georgia, serif; font-size: 70px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; }
    .subtitle { margin: 10px 0 34px; color: #b9832b; font-family: Georgia, serif; font-size: 28px; letter-spacing: .22em; text-transform: uppercase; }
    .presented { font-size: 20px; }
    .name { margin: 18px auto 18px; max-width: 880px; border-bottom: 2px solid #c48a2c; padding-bottom: 12px; color: #0b2447; font-family: Georgia, serif; font-size: 52px; font-style: italic; }
    .body-text { margin: 0 auto 30px; max-width: 760px; font-size: 19px; line-height: 1.55; color: #23344d; }
    .info { position: relative; z-index: 1; display: grid; grid-template-columns: 1.1fr 1fr .55fr; gap: 28px; margin-top: 24px; text-align: left; }
    .course strong { display: block; margin: 12px 0; color: #0b2447; font-family: Georgia, serif; font-size: 24px; }
    .badge { display: inline-block; border-radius: 999px; background: #092346; color: #fff; padding: 10px 22px; font-weight: 900; }
    .course p, .verify p { color: #334155; line-height: 1.55; }
    .meta { border-left: 2px solid #c48a2c; padding-left: 22px; }
    .meta div { display: grid; grid-template-columns: 170px 1fr; gap: 16px; border-bottom: 1px solid #d8b46a; padding: 10px 0; font-size: 16px; }
    .meta span { font-weight: 900; }
    .verify { border-left: 2px solid #c48a2c; padding-left: 22px; text-align: center; }
    .verify strong { display: block; font-size: 20px; }
    .verify span { display: inline-block; margin: 10px 0; border-radius: 999px; background: #092346; color: white; padding: 8px 18px; font-weight: 900; }
    .qr { width: 116px; height: 116px; margin: 8px auto; display: grid; place-items: center; border: 8px solid #111827; background: repeating-linear-gradient(45deg,#111827 0 8px,#fff 8px 16px); color: #e11d2e; font-size: 24px; font-weight: 900; }
    .sign { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin: 50px auto 0; max-width: 820px; text-align: center; }
    .sign span { display: block; height: 42px; border-bottom: 2px solid #c48a2c; }
    .sign p { margin: 10px 0 0; font-size: 14px; font-weight: 900; }
    .bottom { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; display: flex; justify-content: center; gap: 80px; background: #061b39; color: white; padding: 20px; font-weight: 800; }
    @media print { body { background: white; } .certificate { width: 100%; min-height: 100vh; box-shadow: none; } }
  </style>
</head>
<body>
  <main class="certificate">
    <div class="ribbon"></div>
    <div class="medal"><div><span>MS</span><small>MiCoSTSkills<br />E-Learning</small></div></div>
    <div class="top">
      <img src="${escapeHTML(logoUrl)}" alt="MiCoSTSkills" />
      <div><strong>MiCoST</strong><span>Institusi Pengajian Tinggi Milik Kerajaan Negeri Melaka</span></div>
    </div>
    <div class="main">
      <h1>Sijil Pencapaian</h1>
      <div class="subtitle">Certificate of Achievement</div>
      <p class="presented">Dengan ini diperakui bahawa</p>
      <div class="name">${escapeHTML(payload.name)}</div>
      <p class="body-text">telah berjaya menamatkan kursus e-learning dan penilaian yang ditetapkan melalui platform MiCoSTSkills.</p>
    </div>
    <div class="info">
      <div class="course">
        <span class="badge">Kursus</span>
        <strong>Basic Computer System Administration</strong>
        <p>Pengenalan kepada sistem komputer, sistem operasi, pengurusan pengguna, penyelenggaraan sistem dan asas keselamatan.</p>
      </div>
      <div class="meta">
        <div><span>Tempoh Pembelajaran</span><strong>10 Jam</strong></div>
        <div><span>Markah Penilaian</span><strong>${escapeHTML(payload.score)}% (${escapeHTML(gradeLabel)})</strong></div>
        <div><span>Tarikh Tamat</span><strong>${escapeHTML(payload.issuedAt)}</strong></div>
        <div><span>Certificate ID</span><strong>${escapeHTML(payload.certificateId)}</strong></div>
      </div>
      <div class="verify">
        <strong>Pengesahan Sijil</strong>
        <span>www.micost.edu.my</span>
        <div class="qr">MS</div>
        <p>Sijil ini boleh disahkan secara dalam talian.</p>
      </div>
    </div>
    <div class="sign">
      <div><span></span><p>Pengarah / Wakil Pengurusan MiCoST</p></div>
      <div><span></span><p>Penyelaras Program E-Learning / Ketua Program</p></div>
    </div>
    <div class="bottom">
      <span>micost.official</span>
      <strong>www.micost.edu.my</strong>
      <span>Sijil digital dijana oleh sistem MiCoSTSkills.</span>
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
    const rows = data.rows || [];
    mount.innerHTML = data.top
      ? `
        <div class="tag">Top 1</div>
        <h3>${escapeHTML(data.top.name)}</h3>
        <p class="cert-score">${escapeHTML(data.top.score)}%</p>
        <p>${escapeHTML(data.top.correct)}/${escapeHTML(data.top.total_questions)} soalan betul</p>
        <p class="status-note">${escapeHTML(data.top.certificate_id || "")}</p>
        ${document.getElementById("leaderboardRows") ? "" : ""}
      `
      : "<p class='status-note'>Belum ada ranking. Pelajar pertama yang hantar final exam akan muncul di sini.</p>";

    const tableMount = document.getElementById("leaderboardRows");
    if (tableMount) {
      tableMount.innerHTML = rows.length
        ? rows.map((row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(row.name)}</td>
            <td>${escapeHTML(row.program || "-")}</td>
            <td>${escapeHTML(row.score)}%</td>
            <td>${escapeHTML(row.correct)}/${escapeHTML(row.total_questions)}</td>
            <td>${escapeHTML(row.certificate_id || "-")}</td>
          </tr>
        `).join("")
        : "<tr><td colspan='6'>Belum ada rekod ranking.</td></tr>";
    }
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
loadLecturerMaterials();
renderExam();
refreshCourseSession();
