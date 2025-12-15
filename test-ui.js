const puppeteer = require("puppeteer");

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function testMetaPortalUI() {
  console.log(" Starting MetaPortal UI Test...\n");

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Enable request logging
  page.on("request", (request) => {
    if (request.url().includes("api")) {
      console.log(`📡 API Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on("response", (response) => {
    if (response.url().includes("api")) {
      console.log(`📨 API Response: ${response.status()} ${response.url()}`);
    }
  });

  // Capture console logs
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      console.log(`🔴 Browser ${type}: ${msg.text()}`);
    }
  });

  // Capture errors
  page.on("pageerror", (error) => {
    console.log(`❌ Page Error: ${error.message}`);
  });

  try {
    console.log("1️⃣ Testing Homepage...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });

    // Wait for homepage to load
    await page.waitForSelector("h1", { timeout: 10000 });
    const title = await page.$eval("h1", (el) => el.textContent);
    console.log(`✅ Homepage loaded with title: "${title}"`);

    // Check for stats cards
    const statsCards = await page.$$(".grid .bg-white");
    console.log(`✅ Found ${statsCards.length} stat cards on homepage`);

    // Test navigation to catalog
    await page.click('a[href="/catalog"]');
    await page.waitForSelector("h1", { timeout: 10000 });

    const catalogTitle = await page.$eval("h1", (el) => el.textContent);
    console.log(`✅ Catalog page loaded with title: "${catalogTitle}"`);

    await page.waitForTimeout(3000); // Give time for API calls

    const tableRows = await page.$$(".divide-y > div");

    if (tableRows.length > 0) {
      const firstTableLink = await page.$('a[href*="/catalog/"]');
      if (firstTableLink) {
        await firstTableLink.click();
        await page.waitForTimeout(3000);

        const detailTitle = await page.$eval("h1", (el) => el.textContent);

        const schemaTabs = await page.$$(
          'button[data-tab="schema"], nav button'
        );
      }
    }

    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        return { status: response.status, totalItems: data.total || 0 };
      } catch (error) {
        return { error: error.message };
      }
    });

    await page.waitForTimeout(300000);
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(error.stack);
  } finally {
    await browser.close();
  }
}

async function checkAndInstall() {
  try {
    require("puppeteer");
    await testMetaPortalUI();
  } catch (error) {
    console.log("❌ Puppeteer not found. Installing...");
    console.log("Run: npm install puppeteer");
    console.log("Then run: node test-ui.js");
  }
}

checkAndInstall();
