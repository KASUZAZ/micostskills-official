const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.join(process.cwd(), "frontend", "public", "test-screenshots");

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "qa-home.png"), fullPage: false });
  if (!(await page.locator("text=MiCoSTSkills").count())) {
    throw new Error("Home page did not render MiCoSTSkills text.");
  }

  await page.goto(`${BASE_URL}/student-portal`, { waitUntil: "networkidle" });
  await page.locator("#email").fill("student@micostskills.local");
  await page.locator("#password").fill("student123");
  await page.getByRole("button", { name: "Log Masuk" }).click();
  await page.waitForSelector("text=Selamat Datang", { timeout: 10000 });
  await page.waitForSelector("text=Student Portal", { timeout: 10000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "qa-student-dashboard.png"), fullPage: false });

  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/lecturer-portal`, { waitUntil: "networkidle" });
  await page.locator("#email").fill("lecturer@micostskills.local");
  await page.locator("#password").fill("lecturer123");
  await page.getByRole("button", { name: "Log Masuk" }).click();
  await page.waitForSelector("text=Selamat Datang", { timeout: 10000 });
  await page.waitForSelector("text=Keputusan CU", { timeout: 10000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "qa-lecturer-dashboard.png"), fullPage: false });

  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/student-portal`, { waitUntil: "networkidle" });
  await page.locator("#email").fill("admin@micostskills.local");
  await page.locator("#password").fill("admin123");
  await page.getByRole("button", { name: "Log Masuk" }).click();
  await page.waitForSelector("text=Student Portal hanya untuk akaun pelajar", { timeout: 10000 });

  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/admin-portal`, { waitUntil: "networkidle" });
  await page.locator("#email").fill("admin@micostskills.local");
  await page.locator("#password").fill("admin123");
  await page.getByRole("button", { name: "Log Masuk" }).click();
  await page.waitForSelector("text=Dashboard Utama", { timeout: 10000 });
  await page.waitForSelector("text=Admin Panel", { timeout: 10000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "qa-admin-dashboard.png"), fullPage: false });

  await browser.close();

  if (consoleErrors.length) {
    throw new Error(`Browser console errors found:\n${consoleErrors.join("\n")}`);
  }

  console.log("Smoke test passed for home, student portal, lecturer portal, and admin portal.");
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
