const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

function loadLocalEnv() {
  const envPath = [
    path.join(__dirname, ".env"),
    path.join(__dirname, "miraai.env"),
    path.join(__dirname, "..", ".env"),
  ]
    .find((filePath) => fs.existsSync(filePath));

  if (!envPath) return;

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;

      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
}

loadLocalEnv();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const BACKEND_DIR = __dirname;
const PROJECT_DIR = path.resolve(BACKEND_DIR, "..");
const FRONTEND_DIR = path.join(PROJECT_DIR, "frontend", "public");
const DATA_FILE = path.join(BACKEND_DIR, "data", "local-data.json");
const JWT_SECRET = process.env.JWT_SECRET || "MICOSTSKILLS_LOCAL_DEV_SECRET";
const MICOST_WIFI_SSID = "@MiCoSTHotspotD_2n3";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && JWT_SECRET === "MICOSTSKILLS_LOCAL_DEV_SECRET") {
  throw new Error("JWT_SECRET must be set in production.");
}

const PROGRAM_CATALOG = [
  {
    code: "F432-005-2:2019",
    name: "SKE Tahap 2",
    title: "Pemasangan dan Penyelenggaraan Elektrik Satu Fasa",
    units: [
      ["F432-005-2:2019-C01", "Single Phase Drawing"],
      ["F432-005-2:2019-C02", "Single Phase Wiring Installation"],
      ["F432-005-2:2019-C03", "Single Phase Wiring Testing and Commissioning"],
      ["F432-005-2:2019-C04", "Single Phase Electrical Apparatus Maintenance"],
    ],
  },
  {
    code: "F432-005-3:2019",
    name: "SKE Tahap 3",
    title: "Pemasangan dan Penyelenggaraan Elektrik Tiga Fasa",
    units: [
      ["F432-005-3:2019-C01", "Three Phase Drawing"],
      ["F432-005-3:2019-C02", "Three Phase Wiring Installation"],
      ["F432-005-3:2019-C03", "Three Phase Wiring Testing and Commissioning"],
      ["F432-005-3:2019-C04", "Three Phase Electrical Apparatus Maintenance"],
      ["F432-005-3:2019-C05", "Three Phase Electrical Supervisor"],
    ],
  },
  {
    code: "IT-020-3:2013",
    name: "SKM Tahap 3",
    title: "Operasi Sistem Komputer",
    units: [
      ["IT-020-3:2013-C01", "Computer System Setup"],
      ["IT-020-3:2013-C02", "Computer System Maintenance"],
      ["IT-020-3:2013-C03", "Computer System Repair"],
      ["IT-020-3:2013-C04", "Server Installation"],
      ["IT-020-3:2013-C05", "Computer Network Connectivity Setup"],
      ["IT-020-3:2013-C06", "Mobile Device Setup"],
      ["IT-020-3:2013-C07", "Computer System Security Setup"],
    ],
  },
  {
    code: "IT-020-4:2013",
    name: "DKM Tahap 4",
    title: "Pentadbiran Sistem Komputer",
    units: [
      ["IT-020-4:2013-C01", "Server Configuration"],
      ["IT-020-4:2013-C02", "Computer Network Installation Management"],
      ["IT-020-4:2013-C03", "Computer System Security Control"],
      ["IT-020-4:2013-C04", "Computer System Maintenance Management"],
      ["IT-020-4:2013-C05", "Computer System Network Procurement"],
    ],
  },
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS origin not allowed."));
  },
}));
app.use(express.json());

function emptyStore() {
  return {
    users: [],
    courses: [],
    attendance: [],
    exams: [],
    results: [],
    finance_accounts: [],
    cms_pages: [],
    notifications: [],
  };
}

function readStore() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...emptyStore(), ...data };
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`);
}

function nextId(items) {
  return Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function signUser(user) {
  return jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "Sila login terlebih dahulu." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Sesi tamat atau token tidak sah." });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin sahaja." });
  }

  next();
}

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function programFor(value = "") {
  return PROGRAM_CATALOG.find((program) => String(value).includes(program.code)) || null;
}

function finalExamTitle(course) {
  return course === "elektrik"
    ? "Final Exam TVET Elektrik"
    : "Final Exam TVET Sistem Komputer";
}

function certificateId(userId, course) {
  return `MICOST-${String(course).toUpperCase()}-${userId}-${Date.now().toString(36).toUpperCase()}`;
}

function lecturerOnly(req, res, next) {
  if (!["admin", "lecturer"].includes(req.user.role)) {
    return res.status(403).json({ error: "Akses pensyarah sahaja." });
  }

  next();
}

function studentOnly(req, res, next) {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Akses pelajar sahaja." });
  }

  next();
}

function getWifiStatus() {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve({
        allowed: false,
        ssid: "",
        required: MICOST_WIFI_SSID,
        message: "Semakan WiFi hanya disokong pada Windows untuk server tempatan ini.",
      });
      return;
    }

    execFile("netsh", ["wlan", "show", "interfaces"], { windowsHide: true }, (error, stdout) => {
      if (error) {
        resolve({
          allowed: false,
          ssid: "",
          required: MICOST_WIFI_SSID,
          message: "Tidak dapat membaca WiFi semasa. Pastikan peranti bersambung WiFi.",
        });
        return;
      }

      const ssidLine = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => /^SSID\s+:/i.test(line));
      const ssid = ssidLine ? ssidLine.split(":").slice(1).join(":").trim() : "";

      resolve({
        allowed: ssid === MICOST_WIFI_SSID,
        ssid,
        required: MICOST_WIFI_SSID,
        message: ssid === MICOST_WIFI_SSID
          ? "WiFi MiCoST disahkan."
          : `Sila sambung ke WiFi ${MICOST_WIFI_SSID} untuk tanda kehadiran.`,
      });
    });
  });
}

function withUser(rows, store) {
  return rows.map((row) => ({
    ...row,
    name: store.users.find((user) => user.id === row.user_id)?.name || "Pelajar",
  }));
}

function calculateFinanceAccount(account = {}) {
  const items = Array.isArray(account.items) ? account.items : [];
  const payments = Array.isArray(account.payments) ? account.payments : [];
  const totalCharges = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const outstanding = Math.max(0, totalCharges - totalPaid);
  const overdueItems = items.filter((item) => {
    if (String(item.status || "").toLowerCase() === "paid") return false;
    if (!item.due_date) return false;
    return new Date(item.due_date) < new Date(today());
  });

  return {
    ...account,
    items,
    payments,
    totals: {
      charges: totalCharges,
      paid: totalPaid,
      outstanding,
    },
    status: outstanding <= 0 ? "Paid" : overdueItems.length ? "Overdue" : "Pending",
    overdue_count: overdueItems.length,
    last_synced_at: account.last_synced_at || now(),
  };
}

function financeAccountForUser(store, userId) {
  const user = store.users.find((item) => item.id === Number(userId));
  const account = store.finance_accounts.find((item) => item.user_id === Number(userId));

  if (!user || !account) return null;

  return calculateFinanceAccount({
    student: publicUser(user),
    ...account,
  });
}

app.post("/api/register", async (req, res) => {
  const { name, email, password, program, profile } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Sila lengkapkan nama, email dan password." });
  }

  const store = readStore();
  const normalizedEmail = String(email).trim().toLowerCase();

  if (store.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: "Email sudah didaftarkan." });
  }

  const user = {
    id: nextId(store.users),
    name: String(name).trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    role: "student",
    program: program || "Program belum ditetapkan",
    profile: profile || {},
    created_at: now(),
  };

  store.users.push(user);
  writeStore(store);
  res.json({ success: true, message: "Akaun pelajar berjaya didaftarkan." });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  const store = readStore();
  const user = store.users.find((item) => item.email.toLowerCase() === String(email || "").trim().toLowerCase());

  if (!user || !(await bcrypt.compare(String(password || ""), user.password))) {
    return res.status(401).json({ error: "Email atau password tidak sah." });
  }

  res.json({ token: signUser(user), user: publicUser(user) });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "MiCoSTSkills Enterprise",
    time: now(),
  });
});

app.get("/api/me", auth, (req, res) => {
  res.json(req.user);
});

app.put("/api/me/profile", auth, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Pelajar sahaja boleh mengemaskini maklumat pelajar." });
  }

  const store = readStore();
  const user = store.users.find((item) => item.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Akaun pelajar tidak dijumpai." });
  }

  user.profile = {
    ...(user.profile || {}),
    ...(req.body?.profile || {}),
  };

  if (req.body?.program) {
    user.program = req.body.program;
  }

  writeStore(store);
  res.json({ success: true, user: publicUser(user), token: signUser(user) });
});

app.get("/api/dashboard", auth, (_req, res) => {
  const store = readStore();
  res.json({
    users: store.users.filter((user) => user.role === "student").length,
    lecturers: store.users.filter((user) => user.role === "lecturer").length,
    courses: store.courses.length,
    exams: store.exams.length,
    attendance: store.attendance.length,
  });
});

app.get("/api/finance/me", auth, studentOnly, (req, res) => {
  const store = readStore();
  const account = financeAccountForUser(store, req.user.id);

  if (!account) {
    return res.json({
      student: req.user,
      source: "Simulasi Finance Portal",
      items: [],
      payments: [],
      totals: {
        charges: 0,
        paid: 0,
        outstanding: 0,
      },
      status: "No Record",
      overdue_count: 0,
      last_synced_at: now(),
    });
  }

  res.json(account);
});

app.get("/api/finance/summary", auth, lecturerOnly, (_req, res) => {
  const store = readStore();
  const rows = store.users
    .filter((user) => user.role === "student")
    .map((user) => financeAccountForUser(store, user.id))
    .filter(Boolean)
    .map((account) => ({
      user_id: account.user_id,
      name: account.student.name,
      email: account.student.email,
      program: account.student.program,
      source: account.source,
      status: account.status,
      overdue_count: account.overdue_count,
      totals: account.totals,
      last_synced_at: account.last_synced_at,
    }))
    .sort((a, b) => b.totals.outstanding - a.totals.outstanding);

  res.json(rows);
});

app.get("/api/users", auth, adminOnly, (_req, res) => {
  const store = readStore();
  res.json(store.users.map(publicUser).sort((a, b) => b.id - a.id));
});

app.get("/api/courses", auth, (_req, res) => {
  const store = readStore();
  res.json([...store.courses].sort((a, b) => b.id - a.id));
});

app.post("/api/courses", auth, adminOnly, (req, res) => {
  const { title, description, lecturer } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: "Nama kursus diperlukan." });
  }

  const store = readStore();
  store.courses.push({
    id: nextId(store.courses),
    title,
    description: description || "",
    lecturer: lecturer || "",
    status: "active",
    created_at: now(),
  });
  writeStore(store);
  res.json({ success: true });
});

app.get("/api/network-status", auth, async (_req, res) => {
  res.json(await getWifiStatus());
});

app.get("/api/attendance", auth, (req, res) => {
  const store = readStore();
  const rows = ["admin", "lecturer"].includes(req.user.role)
    ? withUser(store.attendance, store)
    : store.attendance.filter((row) => row.user_id === req.user.id);

  res.json([...rows].sort((a, b) => b.id - a.id));
});

app.post("/api/attendance", auth, async (req, res) => {
  const wifi = await getWifiStatus();
  if (!wifi.allowed) {
    return res.status(403).json({ error: wifi.message, wifi });
  }

  const store = readStore();
  const existing = store.attendance.find((row) => row.user_id === req.user.id && row.date === today());

  if (existing) {
    return res.status(400).json({ error: "Kehadiran hari ini sudah ditanda." });
  }

  store.attendance.push({
    id: nextId(store.attendance),
    user_id: req.user.id,
    date: today(),
    status: req.body?.status || "Hadir",
    wifi_ssid: wifi.ssid,
    created_at: now(),
  });
  writeStore(store);
  res.json({ success: true, message: "Kehadiran berjaya direkodkan." });
});

app.get("/api/exams", auth, (req, res) => {
  const store = readStore();
  const userProgram = programFor(req.user.program);
  const catalogExams = userProgram
    ? userProgram.units.map(([code, title], index) => ({
        id: `cu-${userProgram.code}-${index + 1}`,
        program_code: userProgram.code,
        cu_code: code,
        title: `${code} - ${title}`,
        question: "Keputusan CU ini akan dimasukkan oleh pensyarah.",
        lecturer_managed: true,
      }))
    : [];
  const customExams = store.exams
    .filter((exam) => {
      if (["admin", "lecturer"].includes(req.user.role)) return true;
      if (!userProgram) return false;
      return exam.program_code === userProgram.code;
    })
    .map(({ answer, ...exam }) => exam);

  res.json([...catalogExams, ...customExams].sort((a, b) => String(a.title).localeCompare(String(b.title))));
});

app.post("/api/exams", auth, adminOnly, (req, res) => {
  const { title, question, answer, program_code } = req.body || {};

  if (!title || !question || !answer) {
    return res.status(400).json({ error: "Tajuk, soalan dan jawapan diperlukan." });
  }

  const store = readStore();
  store.exams.push({
    id: nextId(store.exams),
    title,
    question,
    answer: String(answer).toLowerCase(),
    program_code: program_code || "",
    created_at: now(),
  });
  writeStore(store);
  res.json({ success: true });
});

app.post("/api/exams/:id/submit", auth, (req, res) => {
  if (String(req.params.id).startsWith("cu-")) {
    return res.status(400).json({ error: "Exam CU ini diuruskan oleh pensyarah." });
  }

  const store = readStore();
  const exam = store.exams.find((item) => item.id === Number(req.params.id));

  if (!exam) {
    return res.status(404).json({ error: "Exam tidak dijumpai." });
  }

  const userAnswer = String(req.body?.answer || "").toLowerCase();
  const score = exam.answer && userAnswer.includes(String(exam.answer).toLowerCase()) ? 100 : 0;

  store.results.push({
    id: nextId(store.results),
    user_id: req.user.id,
    exam_id: exam.id,
    answer: req.body?.answer || "",
    score,
    created_at: now(),
  });
  writeStore(store);
  res.json({ success: true, score });
});

app.get("/api/results", auth, (req, res) => {
  const store = readStore();
  const rows = ["admin", "lecturer"].includes(req.user.role)
    ? store.results
    : store.results.filter((row) => row.user_id === req.user.id);

  res.json(rows.map((row) => ({
    ...row,
    title: row.title || store.exams.find((exam) => exam.id === row.exam_id)?.title || row.cu_code || "Exam",
    name: store.users.find((user) => user.id === row.user_id)?.name || "Pelajar",
  })).sort((a, b) => b.id - a.id));
});

app.get("/api/elearning/me", auth, studentOnly, (req, res) => {
  const store = readStore();
  const course = String(req.query.course || "").toLowerCase();
  const finalResults = store.results
    .filter((row) => row.user_id === req.user.id && row.exam_id === `final-${course}`)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  res.json({
    user: req.user,
    best: finalResults.sort((a, b) => Number(b.score) - Number(a.score))[0] || null,
    latest: finalResults[0] || null,
  });
});

app.get("/api/elearning/leaderboard", auth, (req, res) => {
  const store = readStore();
  const course = String(req.query.course || "").toLowerCase();
  const rows = store.results
    .filter((row) => row.exam_id === `final-${course}`)
    .map((row) => ({
      id: row.id,
      name: store.users.find((user) => user.id === row.user_id)?.name || "Pelajar",
      program: store.users.find((user) => user.id === row.user_id)?.program || "",
      score: row.score,
      correct: row.correct,
      total_questions: row.total_questions,
      certificate_id: row.certificate_id,
      created_at: row.created_at,
    }))
    .sort((a, b) => Number(b.score) - Number(a.score) || new Date(a.created_at || 0) - new Date(b.created_at || 0));

  res.json({ top: rows[0] || null, rows: rows.slice(0, 10) });
});

app.post("/api/elearning/final-exam/:course/submit", auth, studentOnly, (req, res) => {
  const course = String(req.params.course || "").toLowerCase();
  if (!["komputer", "elektrik"].includes(course)) {
    return res.status(400).json({ error: "Kursus e-learning tidak sah." });
  }

  const answers = req.body?.answers || {};
  const correctAnswers = req.body?.correctAnswers || {};
  const total = Math.min(60, Object.keys(correctAnswers).length || 60);
  let correct = 0;

  Object.keys(correctAnswers).slice(0, 60).forEach((key) => {
    if (String(answers[key] || "") === String(correctAnswers[key] || "")) {
      correct += 1;
    }
  });

  const score = Math.round((correct / total) * 100);
  const certId = certificateId(req.user.id, course);
  const store = readStore();
  const result = {
    id: nextId(store.results),
    user_id: req.user.id,
    exam_id: `final-${course}`,
    title: finalExamTitle(course),
    course,
    score,
    correct,
    total_questions: total,
    certificate_id: certId,
    status: score >= 60 ? "Lulus" : "Perlu Ulang",
    created_at: now(),
  };

  store.results.push(result);
  writeStore(store);

  res.json({
    success: true,
    result: {
      ...result,
      name: req.user.name,
      program: req.user.program,
    },
  });
});

app.get("/api/programs", auth, (_req, res) => {
  res.json(PROGRAM_CATALOG);
});

app.get("/api/lecturer/students", auth, lecturerOnly, (_req, res) => {
  const store = readStore();
  res.json(store.users
    .filter((user) => user.role === "student")
    .map((user) => {
      const program = programFor(user.program);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        program: user.program,
        program_code: program?.code || "",
        phone: user.profile?.phone || "",
        ic: user.profile?.ic || "",
        gender: user.profile?.gender || "",
        status: "Aktif",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name)));
});

app.post("/api/lecturer/results", auth, lecturerOnly, (req, res) => {
  const { user_id, cu_code, title, score, status, note } = req.body || {};
  const store = readStore();
  const student = store.users.find((user) => user.id === Number(user_id) && user.role === "student");

  if (!student || !cu_code) {
    return res.status(400).json({ error: "Pelajar dan kod CU diperlukan." });
  }

  const existing = store.results.find((row) => row.user_id === student.id && row.cu_code === cu_code);
  const payload = {
    user_id: student.id,
    cu_code,
    title: title || cu_code,
    score: Number(score) || 0,
    status: status || "Belum Lengkap",
    note: note || "",
    entered_by: req.user.id,
    updated_at: now(),
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    store.results.push({
      id: nextId(store.results),
      ...payload,
      created_at: now(),
    });
  }

  writeStore(store);
  res.json({ success: true, message: "Keputusan CU berjaya disimpan." });
});

app.get("/api/notifications", auth, (_req, res) => {
  const store = readStore();
  res.json([...store.notifications].sort((a, b) => b.id - a.id));
});

app.post("/api/notifications", auth, adminOnly, (req, res) => {
  const { title, message } = req.body || {};
  const store = readStore();
  store.notifications.push({
    id: nextId(store.notifications),
    title: title || "Makluman",
    message: message || "",
    created_at: now(),
  });
  writeStore(store);
  res.json({ success: true });
});

app.get("/api/cms", auth, (_req, res) => {
  const store = readStore();
  res.json([...store.cms_pages].sort((a, b) => b.id - a.id));
});

app.post("/api/cms", auth, adminOnly, (req, res) => {
  const { title, content } = req.body || {};
  const store = readStore();
  store.cms_pages.push({
    id: nextId(store.cms_pages),
    title: title || "Page",
    content: content || "",
    created_at: now(),
  });
  writeStore(store);
  res.json({ success: true });
});

app.post("/api/chatbot", auth, (req, res) => {
  const message = String(req.body?.message || "").toLowerCase();
  let reply = "Saya boleh bantu tentang program, kehadiran, exam dan dashboard MiCoSTSkills.";

  if (message.includes("program")) reply = "Program utama ialah Sistem Komputer dan Pemasangan Elektrik berasaskan TVET/SKM.";
  if (message.includes("attendance") || message.includes("kehadiran")) reply = "Untuk tanda kehadiran, buka menu Kehadiran dalam Student Portal.";
  if (message.includes("exam") || message.includes("peperiksaan")) reply = "Online exam boleh dijawab melalui menu Online Exam.";

  res.json({ reply });
});

app.post("/api/mira-ai", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const message = String(req.body?.message || "").trim();
  const pageContext = String(req.body?.pageContext || "").trim().slice(0, 2500);

  if (!message) {
    return res.status(400).json({ error: "Mesej diperlukan." });
  }

  if (!apiKey) {
    return res.status(503).json({
      error: "GEMINI_API_KEY belum diset pada server.",
      fallback: true,
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "Nama anda Mira AI, pembantu rasmi MiCoSTSkills. Jawab dalam Bahasa Melayu santai-profesional, boleh campur English bila sesuai. Fokus pada program TVET, Sistem Komputer, Pemasangan Elektrik, pendaftaran, e-learning, lokasi, syarat kemasukan, dan bantuan pelajar. Jangan reka maklumat rasmi seperti yuran, tarikh intake, atau polisi jika tidak diberi konteks; minta pengguna hubungi WhatsApp urusetia untuk pengesahan. Jawapan ringkas, jelas, dan mesra.",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: pageContext
                    ? `Konteks halaman MiCoSTSkills:\n${pageContext}\n\nSoalan pengguna:\n${message}`
                    : message,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 450,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API gagal memberi respon.",
        fallback: true,
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    res.json({
      reply: reply || "Maaf, Mira AI belum dapat jawab sekarang. Cuba tanya semula dengan lebih ringkas.",
      model: GEMINI_MODEL,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Ralat server semasa menghubungi Gemini API.",
      fallback: true,
    });
  }
});

app.get("/student-portal", (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "student.html"));
});

app.get("/lecturer-portal", (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "student.html"));
});

app.get("/admin-portal", (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "student.html"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.use(express.static(FRONTEND_DIR, {
  extensions: ["html"],
  index: "index.html",
}));

app.use((_req, res) => {
  res.status(404).type("text/plain").send("Page not found");
});

app.listen(PORT, () => {
  console.log(`MiCoSTSkills website ready at http://localhost:${PORT}`);
});
