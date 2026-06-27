const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { getExamQuestions } = require("./elearning-question-bank");
const { createAppStorage } = require("./storage");

function loadLocalEnv() {
  const envPath = [
    path.join(__dirname, ".env"),
    path.join(__dirname, "hazaai.env"),
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
const STUDENT_REGISTRY_FILE = path.join(BACKEND_DIR, "data", "student-registry.json");
const LECTURER_REGISTRY_FILE = path.join(BACKEND_DIR, "data", "lecturer-registry.json");
const JWT_SECRET = process.env.JWT_SECRET || "MICOSTSKILLS_LOCAL_DEV_SECRET";
const MICOST_WIFI_SSID = "@MiCoSTHotSpotD_2n3";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ZAPIER_CHAT_WEBHOOK_URL = process.env.ZAPIER_CHAT_WEBHOOK_URL || "";
const ZAPIER_CHATBOT_URL = process.env.ZAPIER_CHATBOT_URL || "";
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

const VISITOR_TTL_MS = 35000;
const liveVisitors = new Map();
const liveVisitorClients = new Set();
const liveVisitorEvents = [];
let liveVisitorTotalToday = 0;
let liveVisitorDateKey = new Date().toISOString().slice(0, 10);

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

app.use((req, res, next) => {
  const host = String(req.headers.host || "").toLowerCase();
  const shouldUseProductionHost = (req.method === "GET" || req.method === "HEAD")
    && host.startsWith("micostskills-git-")
    && host.endsWith(".vercel.app");

  if (!shouldUseProductionHost) {
    next();
    return;
  }

  res.redirect(308, `https://micostskills.vercel.app${req.originalUrl || "/"}`);
});

app.use(async (_req, res, next) => {
  try {
    await storageReady;
    next();
  } catch (error) {
    res.status(503).json({ error: "Database belum bersedia.", detail: error.message });
  }
});

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function resetLiveVisitorDailyCountIfNeeded() {
  const todayKey = getTodayKey();
  if (todayKey !== liveVisitorDateKey) {
    liveVisitorDateKey = todayKey;
    liveVisitorTotalToday = liveVisitors.size;
    liveVisitorEvents.length = 0;
  }
}

function sanitizeVisitorPath(pathValue) {
  const text = String(pathValue || "/").trim();
  if (!text || text.length > 160) return "/";
  return text.startsWith("/") ? text : "/";
}

function visitorLabel(sessionId) {
  const id = String(sessionId || "");
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 9000;
  }
  return `Pelawat ${String(hash + 1000).slice(-4)}`;
}

function addLiveVisitorEvent(type, visitor) {
  liveVisitorEvents.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    label: visitor.label,
    path: visitor.path,
    at: now(),
  });

  liveVisitorEvents.splice(24);
}

function liveVisitorSummary() {
  resetLiveVisitorDailyCountIfNeeded();
  pruneInactiveVisitors();

  const pageCounts = Array.from(liveVisitors.values()).reduce((counts, visitor) => {
    counts[visitor.path] = (counts[visitor.path] || 0) + 1;
    return counts;
  }, {});

  return {
    active: liveVisitors.size,
    totalToday: liveVisitorTotalToday,
    updatedAt: now(),
    pages: Object.entries(pageCounts)
      .map(([pathName, count]) => ({ path: pathName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    events: liveVisitorEvents.slice(0, 12),
  };
}

function sendLiveVisitorUpdate() {
  const payload = `data: ${JSON.stringify(liveVisitorSummary())}\n\n`;
  liveVisitorClients.forEach((client) => {
    client.write(payload);
  });
}

function pruneInactiveVisitors() {
  const cutoff = Date.now() - VISITOR_TTL_MS;
  let changed = false;

  liveVisitors.forEach((visitor, sessionId) => {
    if (visitor.lastSeen < cutoff) {
      liveVisitors.delete(sessionId);
      addLiveVisitorEvent("keluar", visitor);
      changed = true;
    }
  });

  if (changed) {
    setTimeout(sendLiveVisitorUpdate, 0);
  }
}

setInterval(pruneInactiveVisitors, 10000).unref();

function emptyStore() {
  return {
    users: [],
    courses: [],
    attendance: [],
    exams: [],
    results: [],
    elearning_materials: [],
    elearning_question_overrides: {},
    finance_accounts: [],
    cms_pages: [],
    notifications: [],
  };
}

const appStorage = createAppStorage({ dataFile: DATA_FILE, emptyStore });
const storageReady = appStorage.init();

function readStore() {
  return appStorage.read();
}

function readStudentRegistry() {
  try {
    const registry = JSON.parse(fs.readFileSync(STUDENT_REGISTRY_FILE, "utf8"));
    return Array.isArray(registry) ? registry : [];
  } catch {
    return [];
  }
}

function readLecturerRegistry() {
  try {
    const registry = JSON.parse(fs.readFileSync(LECTURER_REGISTRY_FILE, "utf8"));
    return Array.isArray(registry) ? registry : [];
  } catch {
    return [];
  }
}

function normalizeName(value = "") {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9/ @'-]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeIc(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 11 ? `0${digits}` : digits;
}

function formatIc(value = "") {
  const digits = normalizeIc(value);
  if (digits.length !== 12) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

function verifyStudentRegistry(name, ic) {
  const requestedName = normalizeName(name);
  const requestedIc = normalizeIc(ic);

  if (!requestedName || !requestedIc) {
    return { ok: false, error: "Nama penuh dan No Kad Pengenalan diperlukan untuk pengesahan pelajar." };
  }

  if (requestedIc.length !== 12) {
    return { ok: false, error: "No Kad Pengenalan mesti mengandungi 12 digit." };
  }

  const registry = readStudentRegistry();
  const match = registry.find((student) => normalizeIc(student.ic) === requestedIc);

  if (!match) {
    return {
      ok: false,
      error: "No Kad Pengenalan ini tiada dalam senarai pelajar rasmi MiCoSTSkills. Sila hubungi admin untuk semakan.",
    };
  }

  const officialName = normalizeName(match.name);
  const nameMatches = officialName === requestedName
    || officialName.includes(requestedName)
    || requestedName.includes(officialName);

  if (!nameMatches) {
    return {
      ok: false,
      error: "Nama penuh tidak sepadan dengan No Kad Pengenalan dalam rekod rasmi MiCoSTSkills.",
    };
  }

  return {
    ok: true,
    student: {
      ...match,
      name: officialName,
      ic: formatIc(match.ic),
      program: match.program || "",
      batch: match.batch || "",
    },
  };
}

function verifyLecturerRegistry(name) {
  const requestedName = normalizeName(name);
  const registry = readLecturerRegistry();
  const match = registry.find((lecturer) => normalizeName(lecturer.name) === requestedName);

  if (!match) {
    return {
      ok: false,
      error: "Akaun pensyarah ini tiada dalam senarai pensyarah rasmi yang dibenarkan akses Lecturer Portal.",
    };
  }

  return {
    ok: true,
    lecturer: {
      ...match,
      name: normalizeName(match.name),
    },
  };
}

function writeStore(store) {
  return appStorage.write(store);
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

function sameSsid(current, required) {
  return String(current || "").trim().toLowerCase() === String(required || "").trim().toLowerCase();
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
      const allowed = sameSsid(ssid, MICOST_WIFI_SSID);

      resolve({
        allowed,
        ssid,
        required: MICOST_WIFI_SSID,
        message: allowed
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
    program: store.users.find((user) => user.id === row.user_id)?.program || "",
  }));
}

function allProgramCodes() {
  return PROGRAM_CATALOG.map((program) => program.code);
}

function normalizeProgramCodes(values = []) {
  const codes = Array.isArray(values) ? values : [values];
  return [...new Set(codes
    .map((value) => String(value || "").trim())
    .map((value) => PROGRAM_CATALOG.find((program) => value.includes(program.code))?.code || value)
    .filter((value) => PROGRAM_CATALOG.some((program) => program.code === value)))];
}

function lecturerProgramCodes(user = {}) {
  const selected = normalizeProgramCodes(user.teaching_programs || []);
  return selected.length ? selected : allProgramCodes();
}

function canLecturerAccessProgram(user, programCode) {
  if (user.role === "admin") return true;
  return lecturerProgramCodes(user).includes(programCode);
}

function courseForProgramCode(programCode = "") {
  return String(programCode).startsWith("F432") ? "elektrik" : "komputer";
}

function lecturerCourses(user = {}) {
  return [...new Set(lecturerProgramCodes(user).map(courseForProgramCode))];
}

function applyQuestionOverrides(course, store) {
  const overrides = store.elearning_question_overrides?.[course] || {};
  return getExamQuestions(course).map((question) => {
    const patch = overrides[question.id] || {};
    return {
      ...question,
      ...patch,
      id: question.id,
      options: Array.isArray(patch.options) && patch.options.length === 4 ? patch.options : question.options,
      answer: String(patch.answer || question.answer || "").toUpperCase(),
    };
  });
}

function publicQuestionsFromItems(questions = []) {
  return questions.map(({ answer, ...question }) => question);
}

function gradeExamItems(questions = [], answers = {}) {
  const total = questions.length;
  const correct = questions.reduce((count, question) => {
    return count + (String(answers[question.id] || "").toUpperCase() === String(question.answer || "").toUpperCase() ? 1 : 0);
  }, 0);

  return {
    total,
    correct,
    score: total ? Math.round((correct / total) * 100) : 0,
  };
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
  const ic = req.body?.ic || profile?.ic || "";

  if (!name || !email || !password || !ic) {
    return res.status(400).json({ error: "Sila lengkapkan nama, No Kad Pengenalan, email dan password." });
  }

  const store = readStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  const registryCheck = verifyStudentRegistry(name, ic);

  if (!registryCheck.ok) {
    return res.status(403).json({ error: registryCheck.error });
  }

  if (store.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: "Email sudah didaftarkan." });
  }

  const requestedIc = normalizeIc(ic);
  if (store.users.some((user) => user.role === "student" && normalizeIc(user.profile?.ic) === requestedIc)) {
    return res.status(400).json({ error: "No Kad Pengenalan ini sudah mempunyai akaun pelajar." });
  }

  const user = {
    id: nextId(store.users),
    name: registryCheck.student.name,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    role: "student",
    program: registryCheck.student.program || program || "Program belum ditetapkan",
    profile: {
      ...(profile || {}),
      ic: registryCheck.student.ic,
      batch: registryCheck.student.batch,
      verified_registry: true,
      verified_at: now(),
    },
    created_at: now(),
  };

  store.users.push(user);
  writeStore(store);
  res.json({ success: true, message: "Akaun pelajar berjaya didaftarkan." });
});

app.post("/api/lecturer/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  const teachingPrograms = normalizeProgramCodes(req.body?.teaching_programs || req.body?.programs || []);

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Sila lengkapkan nama, email dan password pensyarah." });
  }

  if (!teachingPrograms.length) {
    return res.status(400).json({ error: "Pilih sekurang-kurangnya satu program yang diajar." });
  }

  const registryCheck = verifyLecturerRegistry(name);
  if (!registryCheck.ok) {
    return res.status(403).json({ error: registryCheck.error });
  }

  const store = readStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (store.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: "Email sudah didaftarkan." });
  }

  const user = {
    id: nextId(store.users),
    name: registryCheck.lecturer.name,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    role: "lecturer",
    program: "Lecturer Portal",
    teaching_programs: teachingPrograms,
    department: registryCheck.lecturer.department || "MiCoSTSkills",
    created_at: now(),
  };

  store.users.push(user);
  writeStore(store);
  res.json({ success: true, message: "Akaun lecturer berjaya didaftarkan. Sila log masuk." });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  const store = readStore();
  const user = store.users.find((item) => item.email.toLowerCase() === String(email || "").trim().toLowerCase());

  if (!user || !(await bcrypt.compare(String(password || ""), user.password))) {
    return res.status(401).json({ error: "Email atau password tidak sah." });
  }

  if (user.role === "lecturer") {
    const registryCheck = verifyLecturerRegistry(user.name);
    if (!registryCheck.ok) {
      return res.status(403).json({ error: registryCheck.error });
    }
    user.name = registryCheck.lecturer.name;
    user.department = user.department || registryCheck.lecturer.department || "MiCoSTSkills";
    user.teaching_programs = normalizeProgramCodes(user.teaching_programs || registryCheck.lecturer.teaching_programs || []);
    if (!user.teaching_programs.length) user.teaching_programs = allProgramCodes();
  }

  res.json({ token: signUser(user), user: publicUser(user) });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "MiCoSTSkills Enterprise",
    storage: appStorage.status(),
    time: now(),
  });
});

app.get("/api/chat-config", (_req, res) => {
  res.json({
    provider: ZAPIER_CHATBOT_URL ? "zapier-chatbot" : ZAPIER_CHAT_WEBHOOK_URL ? "zapier-webhook" : "backend-ai",
    zapierChatbotUrl: ZAPIER_CHATBOT_URL,
  });
});

app.get("/api/live-visitors", (_req, res) => {
  res.json(liveVisitorSummary());
});

app.post("/api/live-visitors/heartbeat", (req, res) => {
  resetLiveVisitorDailyCountIfNeeded();

  const sessionId = String(req.body?.sessionId || "").trim().slice(0, 80);
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId diperlukan." });
  }

  const pathName = sanitizeVisitorPath(req.body?.path);
  const existingVisitor = liveVisitors.get(sessionId);

  if (!existingVisitor) {
    const visitor = {
      label: visitorLabel(sessionId),
      path: pathName,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    };
    liveVisitors.set(sessionId, visitor);
    liveVisitorTotalToday += 1;
    addLiveVisitorEvent("masuk", visitor);
    sendLiveVisitorUpdate();
    return res.json(liveVisitorSummary());
  }

  existingVisitor.path = pathName;
  existingVisitor.lastSeen = Date.now();
  res.json(liveVisitorSummary());
});

app.post("/api/live-visitors/leave", (req, res) => {
  const sessionId = String(req.body?.sessionId || "").trim().slice(0, 80);
  const visitor = liveVisitors.get(sessionId);

  if (visitor) {
    liveVisitors.delete(sessionId);
    addLiveVisitorEvent("keluar", visitor);
    sendLiveVisitorUpdate();
  }

  res.json(liveVisitorSummary());
});

app.get("/api/live-visitors/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  liveVisitorClients.add(res);
  res.write(`data: ${JSON.stringify(liveVisitorSummary())}\n\n`);

  req.on("close", () => {
    liveVisitorClients.delete(res);
  });
});

app.get("/api/me", auth, (req, res) => {
  res.json(req.user);
});

app.put("/api/me/profile", auth, async (req, res) => {
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

  const saveResult = await writeStore(store);
  if (saveResult && saveResult.ok === false) {
    return res.status(500).json({ error: "Gagal simpan maklumat ke database. Sila cuba semula." });
  }

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

app.get("/api/student-registry/summary", auth, adminOnly, (_req, res) => {
  const registry = readStudentRegistry();
  const byBatch = registry.reduce((summary, student) => {
    const batch = student.batch || "Tanpa Batch";
    summary[batch] = (summary[batch] || 0) + 1;
    return summary;
  }, {});
  const byProgram = registry.reduce((summary, student) => {
    const program = student.program || "Program belum diset";
    summary[program] = (summary[program] || 0) + 1;
    return summary;
  }, {});

  res.json({
    total: registry.length,
    byBatch,
    byProgram,
  });
});

app.get("/api/lecturer-registry/summary", auth, adminOnly, (_req, res) => {
  const registry = readLecturerRegistry();
  res.json({
    total: registry.length,
    lecturers: registry.map((lecturer) => ({
      name: normalizeName(lecturer.name),
      email: lecturer.email || "",
      department: lecturer.department || "MiCoSTSkills",
    })),
  });
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

app.get("/api/elearning/materials", (_req, res) => {
  const store = readStore();
  const course = String(_req.query.course || "").toLowerCase();
  const programCode = String(_req.query.program_code || "").trim();
  const rows = store.elearning_materials
    .filter((item) => {
      if (programCode) return item.program_code === programCode;
      if (course) return item.course === course;
      return true;
    })
    .map(({ lecturer_id, ...item }) => item)
    .sort((a, b) => b.id - a.id);

  res.json({ materials: rows });
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

app.get("/api/elearning/final-exam/:course/questions", (req, res) => {
  const course = String(req.params.course || "").toLowerCase();
  if (!["komputer", "elektrik"].includes(course)) {
    return res.status(400).json({ error: "Kursus e-learning tidak sah." });
  }
  const store = readStore();
  const questions = applyQuestionOverrides(course, store);

  res.json({
    course,
    title: finalExamTitle(course),
    total: questions.length,
    questions: publicQuestionsFromItems(questions),
  });
});

app.post("/api/elearning/final-exam/:course/submit", auth, studentOnly, (req, res) => {
  const course = String(req.params.course || "").toLowerCase();
  if (!["komputer", "elektrik"].includes(course)) {
    return res.status(400).json({ error: "Kursus e-learning tidak sah." });
  }

  const answers = req.body?.answers || {};
  const store = readStore();
  const { total, correct, score } = gradeExamItems(applyQuestionOverrides(course, store), answers);
  const passed = score >= 60;
  const certId = passed ? certificateId(req.user.id, course) : "";
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
    status: passed ? "Lulus" : "Perlu Ulang",
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

app.get("/api/lecturer/students", auth, lecturerOnly, (req, res) => {
  const store = readStore();
  res.json(store.users
    .filter((user) => user.role === "student")
    .filter((user) => {
      if (req.user.role === "admin") return true;
      const program = programFor(user.program);
      return program ? canLecturerAccessProgram(req.user, program.code) : true;
    })
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

app.get("/api/lecturer/attendance-sheet", auth, lecturerOnly, (req, res) => {
  const store = readStore();
  const requestedProgram = String(req.query.program_code || "").trim();
  const programCode = PROGRAM_CATALOG.some((program) => program.code === requestedProgram)
    ? requestedProgram
    : lecturerProgramCodes(req.user)[0];

  if (!programCode || !canLecturerAccessProgram(req.user, programCode)) {
    return res.status(403).json({ error: "Program ini bukan dalam senarai program yang diajar." });
  }

  const weekStart = String(req.query.week_start || today()).slice(0, 10);
  const startDate = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) {
    return res.status(400).json({ error: "Tarikh minggu tidak sah." });
  }

  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    return {
      date: iso,
      day: date.toLocaleDateString("ms-MY", { weekday: "long" }),
      label: date.toLocaleDateString("ms-MY", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    };
  });

  const students = store.users
    .filter((user) => user.role === "student" && programFor(user.program)?.code === programCode)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student, index) => {
      const cells = {};
      days.forEach((day) => {
        ["PG", "PTG"].forEach((session) => {
          const row = store.attendance.find((item) => item.user_id === student.id && item.date === day.date && (item.session || "PG") === session);
          cells[`${day.date}-${session}`] = {
            status: row?.status || "",
            note: row?.note || "",
          };
        });
      });

      return {
        bil: index + 1,
        id: student.id,
        name: student.name,
        ic: student.profile?.ic || "",
        program: student.program,
        cells,
      };
    });

  res.json({
    program: PROGRAM_CATALOG.find((program) => program.code === programCode),
    programs: PROGRAM_CATALOG.filter((program) => canLecturerAccessProgram(req.user, program.code)),
    week_start: weekStart,
    lecturer: req.user.name,
    batch: req.query.batch || "",
    days,
    students,
  });
});

app.post("/api/lecturer/attendance", auth, lecturerOnly, (req, res) => {
  const { user_id, date, session, status, note } = req.body || {};
  const store = readStore();
  const student = store.users.find((user) => user.id === Number(user_id) && user.role === "student");
  const program = programFor(student?.program || "");
  const sessionValue = String(session || "PG").toUpperCase() === "PTG" ? "PTG" : "PG";
  const dateValue = String(date || "").slice(0, 10);

  if (!student || !program || !dateValue) {
    return res.status(400).json({ error: "Pelajar dan tarikh diperlukan." });
  }

  if (!canLecturerAccessProgram(req.user, program.code)) {
    return res.status(403).json({ error: "Pelajar ini bukan dalam program yang diajar oleh lecturer ini." });
  }

  const existing = store.attendance.find((row) => row.user_id === student.id && row.date === dateValue && (row.session || "PG") === sessionValue);
  const payload = {
    user_id: student.id,
    date: dateValue,
    session: sessionValue,
    status: status || "Hadir",
    note: note || "",
    entered_by: req.user.id,
    updated_at: now(),
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    store.attendance.push({
      id: nextId(store.attendance),
      ...payload,
      created_at: now(),
    });
  }

  writeStore(store);
  res.json({ success: true, message: "Kehadiran berjaya dikemas kini." });
});

app.get("/api/lecturer/elearning", auth, lecturerOnly, (req, res) => {
  const store = readStore();
  const programs = PROGRAM_CATALOG
    .filter((program) => canLecturerAccessProgram(req.user, program.code))
    .map((program) => ({
      ...program,
      course: courseForProgramCode(program.code),
    }));
  const courses = lecturerCourses(req.user);

  res.json({
    programs,
    materials: store.elearning_materials
      .filter((item) => !item.program_code || canLecturerAccessProgram(req.user, item.program_code))
      .sort((a, b) => b.id - a.id),
    question_banks: Object.fromEntries(courses.map((course) => [course, applyQuestionOverrides(course, store)])),
  });
});

app.post("/api/lecturer/elearning/materials", auth, lecturerOnly, (req, res) => {
  const { id, program_code, title, type, content, link } = req.body || {};
  const programCode = String(program_code || "").trim();

  if (!title || !programCode) {
    return res.status(400).json({ error: "Program dan tajuk bahan diperlukan." });
  }

  if (!canLecturerAccessProgram(req.user, programCode)) {
    return res.status(403).json({ error: "Program ini bukan dalam senarai program yang diajar." });
  }

  const store = readStore();
  const payload = {
    program_code: programCode,
    course: courseForProgramCode(programCode),
    title: String(title).trim(),
    type: type || "Nota",
    content: content || "",
    link: link || "",
    lecturer_id: req.user.id,
    updated_at: now(),
  };
  const existing = store.elearning_materials.find((item) => item.id === Number(id));

  if (existing) {
    Object.assign(existing, payload);
  } else {
    store.elearning_materials.push({
      id: nextId(store.elearning_materials),
      ...payload,
      created_at: now(),
    });
  }

  writeStore(store);
  res.json({ success: true, message: "Bahan e-learning berjaya disimpan." });
});

app.post("/api/lecturer/elearning/questions", auth, lecturerOnly, (req, res) => {
  const { course, question_id, module, question, options, answer } = req.body || {};
  const courseKey = String(course || "").toLowerCase();
  const questionId = String(question_id || "").trim();

  if (!["komputer", "elektrik"].includes(courseKey) || !questionId) {
    return res.status(400).json({ error: "Kursus dan ID soalan diperlukan." });
  }

  if (!lecturerCourses(req.user).includes(courseKey)) {
    return res.status(403).json({ error: "Kursus ini bukan dalam program yang diajar oleh lecturer ini." });
  }

  const cleanOptions = Array.isArray(options) ? options.map((item) => String(item || "").trim()) : [];
  if (!question || cleanOptions.length !== 4 || cleanOptions.some((item) => !item) || !["A", "B", "C", "D"].includes(String(answer || "").toUpperCase())) {
    return res.status(400).json({ error: "Soalan, 4 pilihan jawapan dan jawapan A-D diperlukan." });
  }

  const store = readStore();
  store.elearning_question_overrides[courseKey] = store.elearning_question_overrides[courseKey] || {};
  store.elearning_question_overrides[courseKey][questionId] = {
    module: module || "",
    question: String(question).trim(),
    options: cleanOptions,
    answer: String(answer).toUpperCase(),
    updated_by: req.user.id,
    updated_at: now(),
  };
  writeStore(store);
  res.json({ success: true, message: "Soalan final exam berjaya dikemas kini." });
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

function getHazaFallbackReply(message) {
  const text = String(message || "").toLowerCase();

  if (text.includes("program") || text.includes("kursus")) {
    return "MiCoSTSkills menawarkan laluan TVET seperti Sistem Komputer dan Pemasangan Elektrik. Untuk semakan intake dan maklumat rasmi, hubungi urusetia melalui WhatsApp.";
  }

  if (text.includes("daftar") || text.includes("pendaftaran") || text.includes("apply")) {
    return "Untuk pendaftaran, sediakan nama penuh, nombor telefon, program pilihan dan dokumen asas. Cara paling cepat ialah klik ikon WhatsApp hijau supaya urusetia boleh bantu langkah seterusnya.";
  }

  if (text.includes("lokasi") || text.includes("alamat") || text.includes("map")) {
    return "Lokasi MiCoSTSkills ialah Lot 925, Blok C, Wisma Yayasan Melaka, Jalan Hang Tuah, 75300 Melaka.";
  }

  if (text.includes("syarat") || text.includes("kelayakan") || text.includes("spm")) {
    return "Syarat kemasukan bergantung pada program dan tahap pengajian. Beritahu program yang diminati supaya urusetia boleh semak kelayakan rasmi anda.";
  }

  if (text.includes("elearning") || text.includes("e-learning") || text.includes("nota") || text.includes("quiz")) {
    return "Untuk E-Learning, buka menu E-Learning di bahagian atas laman dan pilih portal atau bahan mengikut program Sistem Komputer atau Pemasangan Elektrik.";
  }

  return "Saya Haza AI, pembantu MiCoSTSkills. Saya boleh bantu tentang program, pendaftaran, lokasi, syarat kemasukan dan E-Learning. Untuk maklumat rasmi seperti yuran atau tarikh intake, hubungi urusetia melalui WhatsApp.";
}

function hazaSystemPrompt(user) {
  const userContext = user
    ? `\nPengguna portal: ${user.name || "Pengguna"} (${user.role || "user"}), program: ${user.program || "Umum"}.`
    : "";

  return [
    "Nama anda Haza AI, pembantu rasmi MiCoSTSkills.",
    "Jawab seperti pembantu AI umum yang pintar dan berguna: boleh bantu soalan pembelajaran, teknologi, kerjaya, penulisan, idea, dan penerangan konsep.",
    "Gunakan Bahasa Melayu santai-profesional sebagai default, dan campur English bila pengguna guna English atau istilah teknikal.",
    "Untuk hal MiCoSTSkills, bantu tentang program TVET, Sistem Komputer, Pemasangan Elektrik, pendaftaran, e-learning, lokasi, syarat kemasukan, exam, kehadiran, dan portal pelajar.",
    "Jangan reka maklumat rasmi seperti yuran, tarikh intake, polisi, atau keputusan pelajar jika tiada konteks; minta pengguna hubungi urusetia WhatsApp untuk pengesahan rasmi.",
    "Jika soalan memerlukan maklumat terkini yang anda tidak ada, jelaskan had tersebut dan cadangkan semakan rasmi.",
    "Jawapan hendaklah jelas, mesra, dan terus kepada soalan.",
    userContext,
  ].join("\n");
}

function sanitizeConversation(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .slice(-10)
    .map((item) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: String(item?.content || "").trim().slice(0, 1200),
    }))
    .filter((item) => item.content);
}

function buildAiUserContent(message, pageContext) {
  return pageContext
    ? `Konteks halaman MiCoSTSkills:\n${pageContext}\n\nSoalan pengguna:\n${message}`
    : message;
}

async function askOpenAi({ message, pageContext = "", history = [], user = null }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      max_tokens: 700,
      messages: [
        { role: "system", content: hazaSystemPrompt(user) },
        ...sanitizeConversation(history),
        { role: "user", content: buildAiUserContent(message, pageContext) },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI API gagal memberi respon.");
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("OpenAI API tidak memulangkan jawapan.");

  return { reply, model: OPENAI_MODEL, provider: "openai" };
}

async function askGemini({ message, pageContext = "", history = [], user = null }) {
  const contents = sanitizeConversation(history).map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));

  contents.push({
    role: "user",
    parts: [{ text: buildAiUserContent(message, pageContext) }],
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: hazaSystemPrompt(user) }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 700,
        },
      }),
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini API gagal memberi respon.");
  }

  const reply = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!reply) throw new Error("Gemini API tidak memulangkan jawapan.");

  return { reply, model: GEMINI_MODEL, provider: "gemini" };
}

function extractZapierReply(data) {
  if (typeof data === "string") return data.trim();
  if (!data || typeof data !== "object") return "";

  const candidates = [
    data.reply,
    data.answer,
    data.message,
    data.text,
    data.output,
    data.response,
    data.result,
    data.data?.reply,
    data.data?.answer,
    data.data?.message,
    data.data?.text,
    data.data?.output,
  ];

  return candidates
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean) || "";
}

async function askZapier({ message, pageContext = "", history = [], user = null }) {
  if (!ZAPIER_CHAT_WEBHOOK_URL) {
    throw new Error("ZAPIER_CHAT_WEBHOOK_URL belum ditetapkan.");
  }

  const response = await fetch(ZAPIER_CHAT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      pageContext,
      history: sanitizeConversation(history),
      assistant: "Haza AI",
      source: "micostskills-chatbox",
      user: user ? publicUser(user) : null,
      systemPrompt: hazaSystemPrompt(user),
      requestedAt: now(),
    }),
  });

  const rawText = await response.text();
  let data = rawText;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = rawText;
  }

  if (!response.ok) {
    throw new Error(extractZapierReply(data) || "Zapier webhook gagal memberi respon.");
  }

  const reply = extractZapierReply(data);
  if (!reply) {
    throw new Error("Zapier webhook mesti pulangkan JSON dengan field reply, answer, message, text, output, response atau result.");
  }

  return { reply, model: "zapier-chatbot", provider: "zapier" };
}

async function getAiReply(payload) {
  if (ZAPIER_CHAT_WEBHOOK_URL) {
    return askZapier(payload);
  }

  if (process.env.OPENAI_API_KEY) {
    return askOpenAi(payload);
  }

  if (process.env.GEMINI_API_KEY) {
    return askGemini(payload);
  }

  return {
    reply: getHazaFallbackReply(payload.message),
    fallback: true,
    model: "haza-local-fallback",
    provider: "local",
  };
}

app.post("/api/chatbot", auth, async (req, res) => {
  const message = String(req.body?.message || "").trim();

  if (!message) {
    return res.status(400).json({ error: "Mesej diperlukan." });
  }

  try {
    res.json(await getAiReply({
      message,
      pageContext: String(req.body?.pageContext || "").trim().slice(0, 2500),
      history: req.body?.history,
      user: req.user,
    }));
  } catch (error) {
    res.json({
      reply: getHazaFallbackReply(message),
      error: error.message || "Ralat server semasa menghubungi AI.",
      fallback: true,
      model: "haza-local-fallback",
      provider: "local",
    });
  }
});

app.post("/api/haza-ai", async (req, res) => {
  const message = String(req.body?.message || "").trim();

  if (!message) {
    return res.status(400).json({ error: "Mesej diperlukan." });
  }

  try {
    res.json(await getAiReply({
      message,
      pageContext: String(req.body?.pageContext || "").trim().slice(0, 2500),
      history: req.body?.history,
    }));
  } catch (error) {
    res.json({
      reply: getHazaFallbackReply(message),
      error: error.message || "Ralat server semasa menghubungi AI.",
      fallback: true,
      model: "haza-local-fallback",
      provider: "local",
    });
  }
});

app.post("/api/mira-ai", async (req, res) => {
  const message = String(req.body?.message || "").trim();

  if (!message) {
    return res.status(400).json({ error: "Mesej diperlukan." });
  }

  try {
    res.json(await getAiReply({
      message,
      pageContext: String(req.body?.pageContext || "").trim().slice(0, 2500),
      history: req.body?.history,
    }));
  } catch (error) {
    res.json({
      reply: getHazaFallbackReply(message),
      error: error.message || "Ralat server semasa menghubungi AI.",
      fallback: true,
      model: "haza-local-fallback",
      provider: "local",
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

async function start() {
  const storage = await storageReady;
  app.listen(PORT, () => {
    console.log(`MiCoSTSkills website ready at http://localhost:${PORT}`);
    console.log(`Storage primary: ${storage.primary}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
module.exports = app;
